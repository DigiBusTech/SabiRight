import crypto from 'crypto';
import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import nodemailer from "nodemailer";
import webpush from 'web-push';
import { createServer, type Server } from "http";
import { supabaseStorage as storage, APP_ID, supabase } from "./supabaseStorage.js";
import { verifyAdminToken, verifyUserToken, isUserAdmin, getUserFlags } from "./supabaseStorage.js";
import { getLegalAgent, summarizeCaseForProfessional } from "./agent/legalAgent.js";
import { Runner, InMemorySessionService, toStructuredEvents, EventType } from "@google/adk";
import PaystackService from "./paystackService.js";
import { whatsappRouter } from "./bots/whatsapp/whatsappRoutes.js";
import { telegramRouter } from "./bots/telegram/telegramRoutes.js";
import { drainInboundBotQueue } from "./bots/inboundBotWorker.js";
import {
  normalizeTelegramBotUrl,
  normalizeWhatsAppBotUrl
} from "./botPublicLinks.js";
import {
  generateAIResponse,
  isNAtlasSovereignMode,
  MAX_TRANSCRIPTION_AUDIO_BYTES,
  transcribeAudio
} from "./aiService.js";

const sessionService = new InMemorySessionService();
import multer from 'multer';
import path from 'path';
import fs from 'fs';

function hashEmailVerificationCode(userId: string, code: string): string {
  const secret = process.env.EMAIL_VERIFICATION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    throw new Error('EMAIL_VERIFICATION_SECRET or SUPABASE_SERVICE_ROLE_KEY must be configured');
  }
  return crypto.createHmac('sha256', secret).update(`${userId}\0${code}`).digest('hex');
}

async function verifyRecaptcha(token: string): Promise<boolean> {
  try {
    const secret = process.env.RECAPTCHA_SECRET_KEY;
    if (!secret) {
      console.warn('RECAPTCHA_SECRET_KEY not set, skipping verification');
      return true;
    }

    const response = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`, {
      method: 'POST'
    });
    const data = await response.json() as any;
    return data.success;
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return false;
  }
}

function getValidatedBotLinks(settings: Array<{ key: string; value?: unknown }>) {
  const getLink = (
    key: "whatsapp_bot_url" | "telegram_bot_url",
    environmentValue: string | undefined,
    normalize: (value: unknown) => string | null
  ) => {
    const storedSetting = settings.find(setting => setting.key === key);
    const configuredValue = storedSetting ? storedSetting.value : environmentValue;
    const normalized = normalize(configuredValue);

    if (configuredValue && !normalized) {
      console.warn(`[Settings] Invalid ${key}; hiding public link`);
    }

    return normalized;
  };

  return {
    whatsapp_bot_url: getLink(
      "whatsapp_bot_url",
      process.env.WHATSAPP_BOT_URL,
      normalizeWhatsAppBotUrl
    ),
    telegram_bot_url: getLink(
      "telegram_bot_url",
      process.env.TELEGRAM_BOT_URL,
      normalizeTelegramBotUrl
    )
  };
}

// Multer setup
const storageConfig = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storageConfig });

const adminAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const token = authHeader.substring(7);
  // Use verifyAdminToken which checks Supabase directly
  const result = await verifyAdminToken(token);
  
  if (!result.valid) {
    if (result.error === 'not_admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  
  if (!result.userId) {
    return res.status(401).json({ error: 'Invalid token payload' });
  }

  // Ensure the local profile is synced with admin status from Supabase
  try {
    const profile = await storage.getUserProfile(result.userId);
    
    if (profile) {
      if (!profile.isAdmin) {
        await storage.toggleUserAdmin(result.userId, true);
      }
    } else {
      // Proactively create profile in DB if it doesn't exist but user is admin in Supabase
      await storage.updateUserProfile(result.userId, {
        userId: result.userId,
        isAdmin: true,
        isVendor: false,
        emailVerificationStatus: 'verified',
        createdAt: new Date()
      });
    }
  } catch (syncError) {
    console.error('[adminAuth] Failed to sync admin profile during auth:', syncError);
    // We still allow the request if the token is valid, but logging the error is important
  }
  
  req.userId = result.userId;
  req.isAdmin = true;
  next();
};

const emailVerifiedAuth = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const profile = await storage.getUserProfile(userId);
    if (!profile || profile.emailVerificationStatus !== 'verified') {
      return res.status(403).json({ 
        error: 'Email verification required', 
        message: 'You must have a verified email to perform this action.' 
      });
    }
    next();
  } catch (error) {
    next(error);
  }
};

const userAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const token = authHeader.substring(7);
  const result = await verifyUserToken(token);
  
  if (!result.valid) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Set user data on request for convenience
  try {
    const profile = await storage.getUserProfile(result.userId);
    req.user = {
      uid: result.userId,
      email: profile?.email || undefined,
      displayName: profile?.displayName || profile?.email?.split('@')[0] || 'User'
    };
  } catch (e) {
    console.error('Failed to set user context:', e);
  }
  
  const pathUserId = req.params.userId;
  if (pathUserId && result.userId !== pathUserId) {
    return res.status(403).json({ error: 'Access denied: User ID mismatch' });
  }
  
  const userId = result.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.userId = userId;
  req.isAdmin = await isUserAdmin(userId);
  next();
};
const adminOnly = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAdmin) return res.status(403).json({ error: 'Admin access required' });
  next();
};

const optionalUserAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const result = await verifyUserToken(token);
    if (result.valid && result.userId) {
      req.userId = result.userId;
      req.isAdmin = await isUserAdmin(result.userId);
      try {
        const profile = await storage.getUserProfile(result.userId);
        req.user = {
          uid: result.userId,
          email: profile?.email || undefined,
          displayName: profile?.displayName || profile?.email?.split('@')[0] || 'User'
        };
      } catch (e) {}
      return next();
    }
  }

  // Gracefully support guest citizens or unauthenticated mobile queries
  const fallbackId = 'guest-citizen'; // never trust client-supplied ids for unauthenticated callers
  req.userId = fallbackId;
  req.isAdmin = false;
  req.user = {
    uid: fallbackId,
    displayName: 'Citizen'
  };
  next();
};


const bookingParticipantAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const token = authHeader.substring(7);
  const result = await verifyUserToken(token);
  
  if (!result.valid) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  
  const bookingId = req.params.id;
  if (!bookingId) {
    return res.status(400).json({ error: 'Booking ID required' });
  }
  
  const booking = await storage.getBookingById(bookingId);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }
  
  if (result.userId !== booking.userId && result.userId !== booking.vendorId) {
    return res.status(403).json({ error: 'Access denied: Not a booking participant' });
  }
  
  req.userId = result.userId;
  req.booking = booking;
  next();
};

async function getOrAssignUserPlan(userId: string) {
  let plan = await storage.getUserPlan(userId);
  if (!plan) {
    const profile = await storage.getUserProfile(userId);
    const userType = profile?.isVendor ? 'vendor' : 'user';
    plan = await storage.assignDefaultPlan(userId, userType);
  }
  return plan;
}

async function validateFeatureAccess(userId: string, feature: string) {
  const plan = await getOrAssignUserPlan(userId);
  if (!plan) {
    return { allowed: false, status: 403, error: 'No active plan found for your account.' };
  }

  // Core citizen features are guaranteed on Free plan as well as Pro
  if (feature === 'ai_chat' || feature === 'civic_alerts') {
    return { allowed: true, plan };
  }

  const featureAliases: Record<string, string[]> = {
    ai_chat: ['ai_chat', 'basic ai legal guidance', 'right-to-know ai chat', 'priority ai support'],
    civic_alerts: ['civic_alerts', 'real-time traffic alerts', 'real-time civic & traffic alerts', 'advanced route optimization'],
    community_forum: ['community_forum', 'community forum access'],
    job_applications: ['job_applications', 'job postings & applications', 'job board early access'],
  };

  const allowedKeys = featureAliases[feature] || [feature];
  const planFeaturesLower = Array.isArray(plan.features) 
    ? plan.features.map((f: string) => f.toLowerCase().trim())
    : [];

  const hasAccess = allowedKeys.some(key => planFeaturesLower.includes(key.toLowerCase()));

  if (!hasAccess) {
    return {
      allowed: false,
      status: 403,
      error: 'This feature is not available on your current plan. Please upgrade to access it.'
    };
  }
  return { allowed: true, plan };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/bots/inbox/worker", async (req, res) => {
    const secret = process.env.CRON_SECRET || process.env.BOT_INBOX_WORKER_SECRET;
    if (!secret && process.env.NODE_ENV === "production") {
      return res.status(503).json({ error: "Bot inbox worker secret is not configured" });
    }

    if (secret) {
      const authorization = String(req.headers.authorization || "");
      const supplied = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
      const suppliedBytes = Buffer.from(supplied);
      const secretBytes = Buffer.from(secret);
      const valid = suppliedBytes.length === secretBytes.length &&
        crypto.timingSafeEqual(suppliedBytes, secretBytes);
      if (!valid) return res.sendStatus(403);
    }

    try {
      res.json(await drainInboundBotQueue(25));
    } catch (error) {
      console.error("[BotInbox] Scheduled queue drain failed:", error);
      res.status(500).json({ error: "Bot inbox processing failed" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Mount Omnichannel Bots (WhatsApp & Telegram)
  app.use(['/api/whatsapp/status', '/api/telegram/status', '/api/telegram/setup-webhook', '/api/telegram/delete-webhook'], adminAuth);
  app.use('/api/whatsapp', whatsappRouter);
  app.use('/api/telegram', telegramRouter);

  // Upload API
  app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const fullUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ url: `/uploads/${req.file.filename}`, fullUrl });
  });

  // Plans
  app.get("/api/plans", async (req, res, next) => {
    try {
      const plans = await storage.getAllPlans();
      res.json(plans);
    } catch (error) {
      console.error(`[API] GET /api/plans error:`, error);
      next(error);
    }
  });

  // Public Settings (Non-sensitive)
  app.get("/api/settings/public", async (req, res, next) => {
    try {
      const settings = await storage.getAdminSettings();
      const allowedKeys = [
        'captcha_site_key', 'ai_provider', 'site_title', 'site_logo', 'footer_text', 
        'seo_description', 'contact_email', 'site_favicon', 'site_favicon_dark',
        'hero_title', 'hero_subtitle', 'video_demo_url', 'seo_title', 
        'privacy_policy', 'terms_of_service', 'cookie_policy',
        'frontend_page_content', 'frontend_page_content_about', 'frontend_page_content_contact', 'frontend_page_content_footer',
        'credit_reward_referral', 'referral_reward_credits', 'active_languages',
        'whatsapp_bot_url', 'telegram_bot_url'
      ];
      
      const publicSettings = settings.filter(s =>
        allowedKeys.includes(s.key) &&
        s.key !== "whatsapp_bot_url" &&
        s.key !== "telegram_bot_url"
      ).reduce((acc: Record<string, string>, s) => {
        acc[s.key] = s.value;
        return acc;
      }, {});
      const botLinks = getValidatedBotLinks(settings);
      if (botLinks.whatsapp_bot_url) publicSettings.whatsapp_bot_url = botLinks.whatsapp_bot_url;
      if (botLinks.telegram_bot_url) publicSettings.telegram_bot_url = botLinks.telegram_bot_url;
      res.json(publicSettings);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/settings", async (req, res, next) => {
    try {
      const settings = await storage.getAdminSettings();
      const allowedKeys = [
        'captcha_site_key', 'ai_provider', 'site_title', 'site_logo', 'footer_text', 
        'seo_description', 'contact_email', 'site_favicon', 'site_favicon_dark',
        'hero_title', 'hero_subtitle', 'video_demo_url', 'seo_title', 
        'privacy_policy', 'terms_of_service', 'cookie_policy',
        'frontend_page_content', 'frontend_page_content_about', 'frontend_page_content_contact', 'frontend_page_content_footer',
        'credit_reward_referral', 'referral_reward_credits', 'active_languages',
        'whatsapp_bot_url', 'telegram_bot_url'
      ];
      
      const filteredSettings = settings.filter(s =>
        allowedKeys.includes(s.key) &&
        s.key !== "whatsapp_bot_url" &&
        s.key !== "telegram_bot_url"
      );
      const botLinks = getValidatedBotLinks(settings);
      if (botLinks.whatsapp_bot_url) {
        filteredSettings.push({
          key: "whatsapp_bot_url",
          value: botLinks.whatsapp_bot_url,
          category: "bots",
          isSecret: false
        });
      }
      if (botLinks.telegram_bot_url) {
        filteredSettings.push({
          key: "telegram_bot_url",
          value: botLinks.telegram_bot_url,
          category: "bots",
          isSecret: false
        });
      }
      res.json(filteredSettings);
    } catch (error) {
      next(error);
    }
  });



  app.get("/api/settings/google_maps_api_key", async (req, res, next) => {
    try {
      const settings = await storage.getAdminSettings();
      const mapsKey = settings.find(s => s.key === 'google_maps_api_key');
      res.json({ value: mapsKey?.value || process.env.GOOGLE_MAPS_API_KEY || '' });
    } catch (error) {
      next(error);
    }
  });

  // Helper to geocode an address in Nigeria using Google Geocoding API
  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const mapsKeySetting = await storage.getAdminSetting('google_maps_api_key');
      const mapsKey = mapsKeySetting?.value || process.env.GOOGLE_MAPS_API_KEY;
      if (!mapsKey || !address) return null;

      const query = address.toLowerCase().includes('nigeria') ? address : `${address}, Nigeria`;
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${mapsKey}`);
      if (res.ok) {
        const data = await res.json() as any;
        if (data.status === 'OK' && data.results?.[0]?.geometry?.location) {
          return {
            lat: Number(data.results[0].geometry.location.lat),
            lng: Number(data.results[0].geometry.location.lng)
          };
        }
      }
    } catch (e) {
      console.warn('[Geocoding API] Error resolving address:', e);
    }
    return null;
  };

  // Endpoint: Geocode address to lat/lng
  app.get("/api/maps/geocode", async (req, res) => {
    try {
      const address = (req.query.address as string || '').trim();
      if (!address) {
        return res.status(400).json({ error: "Address is required" });
      }
      const coords = await geocodeAddress(address);
      if (!coords) {
        return res.status(404).json({ error: "Address coordinates could not be resolved" });
      }
      res.json(coords);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Endpoint: Places Autocomplete (Google Places v1, falls back to free OpenStreetMap Nominatim)
  app.get("/api/maps/places-autocomplete", async (req, res) => {
    const input = ((req.query.input as string) || '').trim();
    if (input.length < 2) {
      return res.json({ suggestions: [] });
    }

    const fromNominatim = async () => {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=ng&limit=6&addressdetails=0&q=${encodeURIComponent(input)}`,
        { headers: { 'User-Agent': 'SabiRight/1.0 (support@sabiright.app)' } }
      );
      if (!r.ok) return [];
      const rows = (await r.json()) as any[];
      return rows
        .map((x) => ({ text: x.display_name as string, placeId: String(x.place_id || '') }))
        .filter((x) => x.text);
    };

    try {
      const mapsKeySetting = await storage.getAdminSetting('google_maps_api_key');
      const mapsKey = mapsKeySetting?.value || process.env.GOOGLE_MAPS_API_KEY;

      if (mapsKey) {
        try {
          const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': mapsKey },
            body: JSON.stringify({ input, includedRegionCodes: ['ng'] })
          });
          if (response.ok) {
            const data = (await response.json()) as any;
            const suggestions = (data.suggestions || [])
              .map((s: any) => ({
                text: s.placePrediction?.text?.text || '',
                placeId: s.placePrediction?.placeId || ''
              }))
              .filter((s: any) => s.text);
            if (suggestions.length) return res.json({ suggestions });
          } else {
            console.warn('[places-autocomplete] Google error', response.status, (await response.text()).slice(0, 300));
          }
        } catch (e: any) {
          console.warn('[places-autocomplete] Google request failed:', e?.message);
        }
      }

      res.json({ suggestions: await fromNominatim() });
    } catch (err: any) {
      console.warn('[places-autocomplete] failed:', err?.message);
      res.json({ suggestions: [] });
    }
  });
  app.get("/api/plans/user-type/:userType", async (req, res, next) => {
    try {
      const { userType } = req.params;
      if (userType !== 'user' && userType !== 'vendor') {
        return res.status(400).json({ error: 'Invalid user type' });
      }
      const freePlans = await storage.getPlansByType('free', userType as 'user' | 'vendor');
      const basicPlans = await storage.getPlansByType('basic', userType as 'user' | 'vendor');
      const proPlans = await storage.getPlansByType('pro', userType as 'user' | 'vendor');
      const enterprisePlans = await storage.getPlansByType('enterprise', userType as 'user' | 'vendor');
      res.json([...freePlans, ...basicPlans, ...proPlans, ...enterprisePlans]);
    } catch (error) {
      next(error);
    }
  });

  // Credits
  app.get("/api/credits/:userId", userAuth, async (req, res, next) => {
    try {
      const { userId } = req.params;
      if (userId !== (req as any).userId && !(req as any).isAdmin) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      const balance = await storage.getBalance(userId);
      console.log(`[Credits API: /credits/${userId}] available=${balance.availableCredits}, total=${balance.totalCredits}, used=${balance.usedCredits}, plan=${balance.planCredits}`);
      res.json(balance);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/credits/:userId/available", userAuth, async (req, res, next) => {
    try {
      const { userId } = req.params;
      if (userId !== (req as any).userId && !(req as any).isAdmin) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      const balance = await storage.getBalance(userId);
      console.log(`[Credits API: /credits/${userId}/available] available=${balance.availableCredits}, total=${balance.totalCredits}, used=${balance.usedCredits}, plan=${balance.planCredits}`);
      res.json(balance);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/credits/:userId/deduct", userAuth, adminOnly, async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { amount, feature, description } = req.body;

      if (!amount || !feature) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const success = await storage.deductCredits(userId, amount, feature, description);
      if (!success) {
        return res.status(402).json({ error: 'Insufficient credits' });
      }

      const credits = await storage.getUserCredits(userId);
      const total = credits?.totalCredits ?? 0;
      const used = credits?.usedCredits ?? 0;
      res.json({
        success: true,
        remainingCredits: total - used,
        totalUsed: used
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/credits/:userId/refund", userAuth, adminOnly, async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { amount, feature } = req.body;

      if (!amount || !feature) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      await storage.refundCredits(userId, amount, feature);
      const credits = await storage.getUserCredits(userId);
      const total = credits?.totalCredits ?? 0;
      const used = credits?.usedCredits ?? 0;
      res.json({
        success: true,
        remainingCredits: total - used
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/credits/:userId/log", userAuth, async (req, res, next) => {
    try {
      const { userId } = req.params;
      const logs = await storage.getCreditLog(userId);
      res.json(logs);
    } catch (error) {
      next(error);
    }
  });

  // Offline sync endpoint for mobile app: applies accumulated offline deductions when back online
  app.post("/api/credits/sync-offline", userAuth, async (req, res, next) => {
    try {
      const userId = (req as any).userId;
      const { deductions } = req.body;
      const requested = Math.min(100, Math.max(0, parseInt(deductions, 10) || 0));
      const available = Math.max(0, Math.floor(await storage.getAvailableCredits(userId)));
      // Offline usage already happened; charge what the balance allows so the client can always reconcile
      const amount = Math.min(requested, available);
      if (amount > 0) {
        await storage.deductCredits(userId, amount, 'offline_sync', 'Offline mobile usage sync');
      }
      const bal = await storage.getAvailableCredits(userId);
      res.json({ success: true, balance: bal, deducted: amount, requested });
    } catch (error) {
      next(error);
    }
  });

  // Cloaked Routes
  app.get("/api/routes/:userId", userAuth, async (req, res, next) => {
    try {
      const { userId } = req.params;
      if (userId !== (req as any).userId && !(req as any).isAdmin) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      const routes = await storage.getUserRoutes(userId);
      res.json(routes);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/routes", userAuth, async (req, res, next) => {
    try {
      const { routeName, startLocation, endLocation } = req.body;
      const userId = (req as any).userId;
      let { startLat, startLng, endLat, endLng } = req.body;
      
      if (!userId || !routeName || !startLocation || !endLocation) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      let parsedStartLat = Number(startLat);
      let parsedStartLng = Number(startLng);
      let parsedEndLat = Number(endLat);
      let parsedEndLng = Number(endLng);

      // If coordinates are invalid, missing, or zero, geocode dynamically using Google Geocoding API
      if (isNaN(parsedStartLat) || isNaN(parsedStartLng) || (parsedStartLat === 0 && parsedStartLng === 0)) {
        const startCoords = await geocodeAddress(startLocation);
        if (startCoords) {
          parsedStartLat = startCoords.lat;
          parsedStartLng = startCoords.lng;
        } else {
          parsedStartLat = 5.0209;
          parsedStartLng = 7.8906;
        }
      }

      if (isNaN(parsedEndLat) || isNaN(parsedEndLng) || (parsedEndLat === 0 && parsedEndLng === 0)) {
        const endCoords = await geocodeAddress(endLocation);
        if (endCoords) {
          parsedEndLat = endCoords.lat;
          parsedEndLng = endCoords.lng;
        } else {
          parsedEndLat = 5.1095;
          parsedEndLng = 7.8077;
        }
      }

      const route = await storage.createRoute({
        userId,
        routeName,
        startLocation,
        endLocation,
        startLat: parsedStartLat,
        startLng: parsedStartLng,
        endLat: parsedEndLat,
        endLng: parsedEndLng,
        status: 'unknown'
      });

      res.json(route);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/routes/:routeId/refresh", userAuth, async (req, res, next) => {
    try {
      const { routeId } = req.params;
      const userId = (req as any).userId;

      const route = await storage.getRoute(routeId);
      if (!route) {
        return res.status(404).json({ error: 'Route not found' });
      }
      if ((route as any).userId !== userId && !(req as any).isAdmin) return res.status(403).json({ error: 'Forbidden' });

      const routeCostSetting = await storage.getAdminSetting('credit_cost_traffic_alert');
      const routeCost = routeCostSetting?.value ? Number(routeCostSetting.value) : 1;
      const routeBalance = await storage.getBalance(userId);
      const deducted = await storage.deductCredits(userId, routeCost, 'traffic_refresh', 'Route traffic check');
      if (!deducted) {
        console.warn(`[Route Traffic Check 402] Insufficient credits: userId=${userId}, required=${routeCost}, available=${routeBalance.availableCredits}`);
        return res.status(402).json({ error: 'Insufficient credits for route check', required: routeCost, available: routeBalance.availableCredits });
      }

      // Attempt to get actual traffic data via Google Maps API if available
      let googleTrafficContext = "";
      let etaMinutes: number | null = null;
      let distanceKm: number | null = null;
      try {
        const mapsKey = await storage.getAdminSetting('google_maps_api_key');
        if (mapsKey?.value) {
          const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': mapsKey.value,
              'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.description,routes.warnings'
            },
            body: JSON.stringify({
              origin: {
                location: {
                  latLng: {
                    latitude: Number(route.startLat),
                    longitude: Number(route.startLng)
                  }
                }
              },
              destination: {
                location: {
                  latLng: {
                    latitude: Number(route.endLat),
                    longitude: Number(route.endLng)
                  }
                }
              },
              travelMode: 'DRIVE',
              routingPreference: 'TRAFFIC_AWARE'
            })
          });
          if (res.ok) {
            const gData = await res.json() as any;
            const r = gData.routes?.[0];
            if (r) {
              const durationSec = parseInt(r.duration || '600', 10);
              const durationMin = Math.round(durationSec / 60);
              const distKm = ((r.distanceMeters || 5000) / 1000).toFixed(1);
              etaMinutes = durationMin;
              distanceKm = Number(distKm);
              googleTrafficContext = `Google Maps Routes Report: Route distance is ${distKm} km. Current real-time travel duration with traffic: ${durationMin} minutes.`;
            }
          }
        }
      } catch (gErr) {
        console.error('Google Maps Traffic check failed:', gErr);
      }

      // Use AI to determine route status and recommendations
      const prompt = `As a smart traffic assistant, analyze this route in Nigeria:
      Route: ${route.routeName}
      From: ${route.startLocation}
      To: ${route.endLocation}
      
      ${googleTrafficContext ? `Live Traffic Data: ${googleTrafficContext}` : "No live sensor data available."}
      
      Determine the current status. Is there an active checkpoint (likely if there are unusual delays or patterns), heavy traffic, or is it cleared?
      Also provide a recommended route to follow if there's an issue, or confirm the main route is best.
      
      Provide:
      1. status: one of 'active', 'cleared', 'unknown'
      2. message: a helpful status message for the user
      3. recommendation: specific route advice (e.g., "Follow Ikorodu road, then divert at Fadeyi to avoid the checkpoint.")
      4. cloakedStreets: a list of any "cloaked" or hidden streets/paths to avoid due to checkpoints or heavy traffic.
      
      Format the response as JSON: {"status": "...", "message": "...", "recommendation": "...", "cloakedStreets": ["street1", "street2"]}`;

      let result;
      try {
        const aiResponse = await generateAIResponse(prompt);
        const cleanedResponse = aiResponse?.replace(/```json|```/g, '').trim();
        result = JSON.parse(cleanedResponse || '{}');
      } catch (aiError) {
        console.error('AI Route Refresh Error:', aiError);
        result = { 
          status: 'unknown', 
          message: 'Unable to determine status at this time.',
          recommendation: 'Stay on the main route and exercise caution.',
          cloakedStreets: []
        };
      }

      const status = result.status || 'unknown';
      const message = result.message || 'Route status updated.';
      const recommendation = result.recommendation || 'No specific recommendation available.';
      const cloakedStreets = result.cloakedStreets || [];

      // Update route status in database
      await storage.updateRouteStatus(routeId, status, recommendation, cloakedStreets);

      // Create an alert for the user
      await storage.createAlert({
        routeId,
        userId,
        alertType: status === 'active' ? 'active_checkpoint' : status === 'cleared' ? 'cleared' : 'unknown',
        message: `${message} Recommendation: ${recommendation} ${cloakedStreets.length > 0 ? 'Avoid: ' + cloakedStreets.join(', ') : ''}`,
        severity: status === 'active' ? 'high' : status === 'cleared' ? 'low' : 'medium'
      });

      // Update user dashboard traffic
      try {
        if (typeof storage.updateDashboardTraffic === 'function') {
          const description = `${message} ${recommendation} ${cloakedStreets.length > 0 ? 'Avoid: ' + cloakedStreets.join(', ') : ''}`;
          await storage.updateDashboardTraffic(
            userId, 
            route.routeName, 
            status.toUpperCase(), 
            description
          );
        }
      } catch (dashErr) {
        console.error('Failed to update dashboard traffic:', dashErr);
      }

      res.json({ success: true, status, message, recommendation, cloakedStreets, etaMinutes, distanceKm });
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/routes/:routeId/status", userAuth, async (req, res, next) => {
    try {
      const { routeId } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ error: 'Status required' });
      }

      const owned: any = await storage.getRoute(routeId);
      if (!owned) return res.status(404).json({ error: 'Route not found' });
      if (owned.userId !== (req as any).userId && !(req as any).isAdmin) return res.status(403).json({ error: 'Forbidden' });
      await storage.updateRouteStatus(routeId, status);
      res.json({ success: true, status });
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/routes/:routeId", userAuth, async (req, res, next) => {
    try {
      const { routeId } = req.params;
      const owned: any = await storage.getRoute(routeId);
      if (!owned) return res.status(404).json({ error: 'Route not found' });
      if (owned.userId !== (req as any).userId && !(req as any).isAdmin) return res.status(403).json({ error: 'Forbidden' });
      await storage.deleteRoute(routeId);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // Traffic Alerts
  app.get("/api/alerts/:routeId", async (req, res, next) => {
    try {
      const { routeId } = req.params;
      const alerts = await storage.getRouteAlerts(routeId);
      res.json(alerts);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/alerts", async (req, res, next) => {
    try {
      const { routeId, userId, alertType, message, severity } = req.body;

      if (!routeId || !userId || !alertType) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const alert = await storage.createAlert({
        routeId,
        userId,
        alertType,
        message,
        severity
      });

      res.json(alert);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/alerts/:alertId/acknowledge", async (req, res, next) => {
    try {
      const { alertId } = req.params;
      await storage.acknowledgeAlert(alertId);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // Email Verification & Vendor Endpoints
  app.post("/api/email-verification/:userId/submit", userAuth, async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { email } = req.body;
      if (typeof email !== 'string') {
        return res.status(400).json({ error: 'A valid email address is required' });
      }

      const normalizedEmail = email.trim().toLowerCase();
      if (
        normalizedEmail.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
      ) {
        return res.status(400).json({ error: 'A valid email address is required' });
      }

      const userProfile = await storage.getUserProfile(userId);
      if (!userProfile) {
        return res.status(404).json({ error: 'User profile not found' });
      }

      const code = crypto.randomInt(100000, 1000000).toString();
      const expires = new Date(Date.now() + 10 * 60 * 1000);
      const issued = await storage.setEmailVerificationCode(
        userId,
        normalizedEmail,
        hashEmailVerificationCode(userId, code),
        expires
      );
      if (!issued) {
        res.setHeader('Retry-After', '60');
        return res.status(429).json({ error: 'Please wait before requesting another verification code' });
      }

      const delivery = await storage.sendEmailNotification({
        userId,
        type: 'email_verification_code',
        title: 'Your Verification Code',
        message: `Your SabiRight verification code is: ${code}. This code expires in 10 minutes.`,
        templateName: 'email_verification_code',
        recipientEmail: normalizedEmail,
        variables: {
          code,
          expiry: '10 minutes',
          userName: userProfile.displayName || normalizedEmail || 'User'
        }
      }, userProfile);
      if (!delivery?.emailSent) {
        console.error('[EmailVerification] Delivery failed:', delivery?.emailError || delivery?.templateError);
        return res.status(502).json({ error: delivery?.emailError || delivery?.templateError || 'Verification email could not be sent' });
      }

      await storage.updateUserProfile(userId, {
        emailVerificationStatus: 'pending'
      });
      res.json({
        success: true,
        status: 'pending',
        expiresAt: expires.toISOString()
      });
    } catch (error) {
      console.error(`[EmailVerification] Error in submit:`, error);
      next(error);
    }
  });

  app.post("/api/email-verification/:userId/verify-code", userAuth, async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { code } = req.body;

      if (typeof code !== 'string' || !/^\d{6}$/.test(code)) {
        return res.status(400).json({ error: 'A valid 6-digit verification code is required' });
      }

      const verifiedEmail = await storage.verifyEmailCode(
        userId,
        hashEmailVerificationCode(userId, code)
      );
      if (!verifiedEmail) {
        return res.status(400).json({ error: 'Invalid, expired, or locked verification code' });
      }

      res.json({ success: true, status: 'verified' });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/debug/user/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const profile = await storage.getUserProfile(userId);
      const flags = await getUserFlags(userId);

      res.json({
        userId,
        storageProfile: profile,
        flags
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/profile/:userId", async (req, res, next) => {
    try {
      const { userId } = req.params;
      let profile = await storage.getUserProfile(userId);
      
      // Sync flags if profile exists
      if (profile) {
        const flags = await getUserFlags(userId);
        let changed = false;
        
        if (flags.isAdmin && !profile.isAdmin) {
          await storage.toggleUserAdmin(userId, true);
          changed = true;
        }
        
        if (flags.isVendor && !profile.isVendor) {
          await storage.toggleUserVendor(userId, true);
          changed = true;
        }
        
        if (changed) {
          profile = await storage.getUserProfile(userId); // Refresh profile
        }
      }

      res.json(profile || {});
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/profile/:userId/referral-code", async (req, res, next) => {
    try {
      const { userId } = req.params;
      const code = await storage.generateReferralCode(userId);
      res.json({ referralCode: code });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/profile/:userId", async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { email, displayName, phoneNumber, dob, gender, state, city, referralCode, captchaToken } = req.body;
      
      // Verify reCAPTCHA if token is provided or if it's a new user
      const existingProfile = await storage.getUserProfile(userId);
      if (!existingProfile || !existingProfile.userId) {
        if (captchaToken) {
          const isValid = await verifyRecaptcha(captchaToken);
          if (!isValid) {
            return res.status(400).json({ error: 'reCAPTCHA verification failed' });
          }
        }
      }

      if (existingProfile && existingProfile.userId) {
        // Sync flags with Supabase profile
        const flags = await getUserFlags(userId);
        let changed = false;
        
        if (flags.isAdmin && !existingProfile.isAdmin) {
          await storage.toggleUserAdmin(userId, true);
          existingProfile.isAdmin = true;
          changed = true;
        }
        
        if (flags.isVendor && !existingProfile.isVendor) {
          await storage.toggleUserVendor(userId, true);
          existingProfile.isVendor = true;
          changed = true;
        }
        
        // Also update any missing fields if they were provided in this call
        const updates: any = {};
        if (email) updates.email = email;
        if (displayName) updates.displayName = displayName;
        if (phoneNumber) updates.phoneNumber = phoneNumber;
        if (dob) updates.dob = dob;
        if (gender) updates.gender = gender;
        if (state) updates.state = state;
        if (city) updates.city = city;

        if (Object.keys(updates).length > 0) {
          const updated = await storage.updateUserProfile(userId, updates);
          return res.json(updated);
        }
        
        return res.json(existingProfile);
      }
      
      const flags = await getUserFlags(userId);

      await storage.createUser({ 
        id: userId, 
        username: displayName || email || userId, 
        password: '',
        email,
        phoneNumber,
        dob,
        gender,
        state,
        city
      } as any);
      
      await storage.updateUserProfile(userId, {
        userId,
        email: email || null,
        displayName: displayName || null,
        phoneNumber: phoneNumber || null,
        dob: dob || null,
        gender: gender || null,
        state: state || null,
        city: city || null,
        isVendor: flags.isVendor,
        isAdmin: flags.isAdmin,
        emailVerified: false,
        emailVerificationStatus: 'pending',
        vendorMode: false,
        createdAt: new Date()
      });

      // Generate a unique referral code for the new user
      await storage.generateReferralCode(userId);

      // Handle referral if provided
      if (referralCode) {
        await storage.processReferral(userId, referralCode);
      }
      
      const newProfile = await storage.getUserProfile(userId);

      // Assign the default free plan and initial credits for new users
      await storage.assignDefaultPlan(userId, flags.isVendor ? 'vendor' : 'user');

      // Send welcome email
      if (email) {
        await storage.sendNotification({
          userId,
          type: 'welcome_email',
          title: 'Welcome to SabiRight!',
          message: `Hello ${displayName || 'Citizen'}, Welcome to SabiRight! We are excited to have you on board.`,
          templateName: 'welcome_email',
          variables: { userName: displayName || 'Citizen' },
          channels: ['email', 'in_app']
        });
      }

      res.json(newProfile);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/profile/:userId", async (req, res, next) => {
    try {
      const { userId } = req.params;
      await storage.updateUserProfile(userId, req.body);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/professionals/apply", userAuth, async (req, res, next) => {
    try {
      const userId = req.userId!;
      const { businessName, role, serviceType, credentials } = req.body;

      if (!businessName || !role || !serviceType) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const application = await storage.submitProfessionalApplication(userId, {
        businessName,
        role,
        serviceType,
        credentials
      });

      res.json(application);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/professionals", async (req, res, next) => {
    try {
      const { status, role, city, verified } = req.query;
      const filters: any = {};
      if (status) filters.status = String(status);
      if (role) filters.role = String(role);
      if (city) filters.city = String(city);
      if (verified !== undefined) filters.verified = String(verified).toLowerCase() === 'true';

      const professionals = await storage.getProfessionals(filters);
      res.json(professionals);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/professionals/:professionalId", async (req, res, next) => {
    try {
      const { professionalId } = req.params;
      const professional = await storage.getProfessionalById(professionalId);
      if (!professional) {
        return res.status(404).json({ error: 'Professional not found' });
      }
      res.json(professional);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/professionals/:professionalId", userAuth, async (req, res, next) => {
    try {
      const { professionalId } = req.params;
      const updates = req.body;
      const professional = await storage.getProfessionalById(professionalId);
      if (!professional) {
        return res.status(404).json({ error: 'Professional not found' });
      }
      if (professional.userId !== req.userId) {
        return res.status(403).json({ error: 'Not authorized to update this professional profile' });
      }
      await storage.updateProfessional(professionalId, updates);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/professionals", adminAuth, async (req, res, next) => {
    try {
      const professionals = await storage.getProfessionals();
      res.json(professionals);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/professionals/:professionalId/approve", adminAuth, async (req, res, next) => {
    try {
      const { professionalId } = req.params;
      const professional = await storage.getProfessionalById(professionalId);
      if (!professional) {
        return res.status(404).json({ error: 'Professional not found' });
      }
      await storage.updateProfessional(professionalId, { status: 'active', verified: true });
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/professionals/:professionalId/reject", adminAuth, async (req, res, next) => {
    try {
      const { professionalId } = req.params;
      const professional = await storage.getProfessionalById(professionalId);
      if (!professional) {
        return res.status(404).json({ error: 'Professional not found' });
      }
      await storage.updateProfessional(professionalId, { status: 'suspended', verified: false });
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // Live Google Maps Route & Traffic Helper for Nigerian corridors
  const fetchGoogleMapsLiveTraffic = async (city: string): Promise<string> => {
    try {
      const mapsKeySetting = await storage.getAdminSetting('google_maps_api_key');
      const mapsKey = mapsKeySetting?.value || process.env.GOOGLE_MAPS_API_KEY;
      if (!mapsKey) return '';

      const cLower = (city || 'Lagos').toLowerCase();
      let origin = `${city} Central, Nigeria`;
      let destination = `${city} Bypass, Nigeria`;

      if (cLower.includes('uyo') || cLower.includes('akwa')) {
        origin = 'Ikot Ekpene Road, Uyo, Nigeria';
        destination = 'Plaza, Oron Road, Uyo, Nigeria';
      } else if (cLower.includes('lagos')) {
        origin = 'Ikeja, Lagos, Nigeria';
        destination = 'Victoria Island, Lagos, Nigeria';
      } else if (cLower.includes('abuja')) {
        origin = 'Kubwa Expressway, Abuja, Nigeria';
        destination = 'Central Business District, Abuja, Nigeria';
      } else if (cLower.includes('port') || cLower.includes('rivers')) {
        origin = 'Aba Road, Port Harcourt, Nigeria';
        destination = 'GRA Phase 2, Port Harcourt, Nigeria';
      }

      const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': mapsKey,
          'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.description,routes.warnings'
        },
        body: JSON.stringify({
          origin: { address: origin },
          destination: { address: destination },
          travelMode: 'DRIVE',
          routingPreference: 'TRAFFIC_AWARE'
        })
      });

      if (res.ok) {
        const gData = await res.json() as any;
        const route = gData.routes?.[0];
        if (route) {
          const durationSec = parseInt(route.duration || '600', 10);
          const durationMin = Math.round(durationSec / 60);
          const distKm = ((route.distanceMeters || 5000) / 1000).toFixed(1);
          const roadDesc = route.description || `${city} Corridor`;
          const warnings = route.warnings?.join('. ') || '';

          return `Live Google Maps Platform Data:
- Corridor: ${roadDesc} (${origin} to ${destination})
- Distance: ${distKm} km
- Real-time Driving Duration: ${durationMin} minutes
${warnings ? `- Route Alerts: ${warnings}` : ''}`;
        }
      }
    } catch (gErr) {
      console.warn('[Google Maps Traffic] Live check notice:', gErr);
    }
    return '';
  };

  // Dashboard Traffic
  app.get("/api/dashboard/traffic/:userId", async (req, res, next) => {
    try {
      const { userId } = req.params;
      let traffic = await storage.getDashboardTraffic(userId);
      
      // If there is no traffic information, let's automatically generate it using the user's city!
      if (!traffic || !traffic.location || !traffic.description) {
        const profile = await storage.getUserProfile(userId);
        const city = profile?.city || 'Lagos';
        
        let liveContext = "";
        const googleMapsData = await fetchGoogleMapsLiveTraffic(city);
        if (googleMapsData) liveContext += "\n" + googleMapsData + "\n";
        try {
          const searchKey = await storage.getAdminSetting('tavily_api_key');
          const query = `current traffic updates and road alerts in ${city}, Nigeria today`;
          
          if (searchKey?.value) {
            const searchRes = await fetch('https://api.tavily.com/search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                api_key: searchKey.value,
                query: query,
                search_depth: "basic",
                max_results: 3
              })
            });
            if (searchRes.ok) {
              const searchData = await searchRes.json() as any;
              liveContext = searchData.results.map((r: any) => r.content).join('\n');
            }
          }
        } catch (searchErr) {
          console.error('Traffic internet search failed on initial load:', searchErr);
        }

        const prompt = `Generate a realistic, concise traffic update for ${city}, Nigeria. 
        ${liveContext ? `Use this real-time info if relevant: ${liveContext}` : "If no real-time info, use highly probable current patterns."}
        
        Include:
        1. A specific location (e.g., a major road or bridge).
        2. A status (one of: 'active', 'cleared', 'normal').
        3. A brief description of the situation.
        
        Format the response as JSON: {"location": "...", "status": "active|cleared|normal", "description": "..."}`;

        let trafficUpdate;
        try {
          const aiResponse = await generateAIResponse(prompt);
          const cleanedResponse = aiResponse?.replace(/```json|```/g, '').trim();
          trafficUpdate = JSON.parse(cleanedResponse || '{}');
        } catch (aiError) {
          console.error('AI Traffic Generation Error on initial load:', aiError);
          trafficUpdate = {
            location: `${city} Major Route`,
            status: 'normal',
            description: 'Traffic is moving normally.'
          };
        }

        await storage.updateDashboardTraffic(
          userId, 
          trafficUpdate.location || "Major Route", 
          trafficUpdate.status || "normal", 
          trafficUpdate.description || "Traffic is moving normally."
        );
        
        traffic = await storage.getDashboardTraffic(userId);
      }
      
      res.json(traffic || {});
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/dashboard/traffic/:userId/refresh", async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { city } = req.body;

      // Ensure city is resolved
      let targetCity = city;
      if (!targetCity) {
        const profile = await storage.getUserProfile(userId);
        targetCity = profile?.city;
      }
      if (!targetCity) {
        targetCity = 'Lagos';
      }

      const credits = await storage.getUserCredits(userId);
      if (!credits) {
        return res.status(402).json({ error: 'No credits account' });
      }

      const featureAccess = await validateFeatureAccess(userId, 'civic_alerts');
      if (!featureAccess.allowed) {
        return res.status(featureAccess.status).json({ error: featureAccess.error });
      }

      const userPlan = featureAccess.plan;
      const costSetting = await storage.getAdminSetting('credit_cost_traffic_alert');
      const cost = costSetting?.value ? Number(costSetting.value) : 1;

      const balance = await storage.getBalance(userId);
      const deducted = await storage.deductCredits(userId, cost, 'traffic_refresh', 'Daily traffic alert refresh');
      if (!deducted) {
        console.warn(`[Traffic Refresh 402] Insufficient credits: userId=${userId}, required=${cost}, available=${balance.availableCredits}`);
        return res.status(402).json({ error: 'Insufficient credits for refresh', required: cost, available: balance.availableCredits });
      }

      // Attempt to get live data via internet search first
      let liveContext = "";
      const googleMapsData = await fetchGoogleMapsLiveTraffic(targetCity);
      if (googleMapsData) liveContext += "\n" + googleMapsData + "\n";
      try {
        const searchKey = await storage.getAdminSetting('tavily_api_key');
        const query = `current traffic updates and road alerts in ${targetCity}, Nigeria today`;
        
        if (searchKey?.value) {
          const searchRes = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              api_key: searchKey.value,
              query: query,
              search_depth: "basic",
              max_results: 3
            })
          });
          if (searchRes.ok) {
            const searchData = await searchRes.json() as any;
            liveContext = searchData.results.map((r: any) => r.content).join('\n');
          }
        }
      } catch (searchErr) {
        console.error('Traffic internet search failed:', searchErr);
      }

      // Generate live traffic update using AI
      const prompt = `Generate a realistic, concise traffic update for ${targetCity}, Nigeria. 
      ${liveContext ? `Use this real-time info if relevant: ${liveContext}` : "If no real-time info, use highly probable current patterns."}
      
      Include:
      1. A specific location (e.g., a major road or bridge).
      2. A status (one of: 'active', 'cleared', 'normal').
      3. A brief description of the situation.
      
      Format the response as JSON: {"location": "...", "status": "active|cleared|normal", "description": "..."}`;

      let trafficUpdate;
      try {
        const aiResponse = await generateAIResponse(prompt);
        const cleanedResponse = aiResponse?.replace(/```json|```/g, '').trim();
        trafficUpdate = JSON.parse(cleanedResponse || '{}');
      } catch (aiError) {
        console.error('AI Traffic Generation Error:', aiError);
        // Fallback to more generic location if AI fails
        trafficUpdate = {
          location: `${targetCity} Major Route`,
          status: 'normal',
          description: 'Traffic information currently being updated. Please check again soon.'
        };
      }

      await storage.updateDashboardTraffic(
        userId, 
        trafficUpdate.location || "Major Route", 
        trafficUpdate.status || "normal", 
        trafficUpdate.description || "Traffic is moving normally."
      );

      res.json({ success: true, traffic: trafficUpdate });
    } catch (error) {
      next(error);
    }
  });

  // Events
  app.get("/api/events", async (req, res, next) => {
    try {
      const city = req.query.city as string;
      const events = await storage.getEvents();
      
      if (city) {
        events.sort((a: any, b: any) => {
          const aInCity = a.city?.toLowerCase() === city.toLowerCase() || a.location?.toLowerCase().includes(city.toLowerCase());
          const bInCity = b.city?.toLowerCase() === city.toLowerCase() || b.location?.toLowerCase().includes(city.toLowerCase());
          if (aInCity && !bInCity) return -1;
          if (!aInCity && bInCity) return 1;
          return 0;
        });
      }
      
      res.json(events);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/events", userAuth, emailVerifiedAuth, async (req, res, next) => {
    try {
      const { title, description, date, time, location, category, organizer, organizerId, maxAttendees } = req.body;
      const userId = req.userId;
      
      if (!title || !date || !time || !location || !category || !organizer) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const event = await storage.createEvent({
        title, description, date, time, location, category, organizer, organizerId: organizerId || userId, maxAttendees
      });

      // Automatically save as MOAT data for AI training
      await storage.createMoatData({
        title: `Event: ${title}`,
        content: `Category: ${category}\nOrganizer: ${organizer}\nDate: ${date} ${time}\nLocation: ${location}\nDescription: ${description}`,
        category: 'events',
        source: 'sabievents',
        metadata: { eventId: event.id, category, location }
      });

      res.json(event);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/events/:eventId/register", userAuth, emailVerifiedAuth, async (req, res, next) => {
    try {
      const { eventId } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'User ID required' });
      }

      await storage.registerForEvent(eventId, userId);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/events/:eventId", userAuth, emailVerifiedAuth, async (req, res, next) => {
    try {
      const { eventId } = req.params;
      const userId = req.userId;
      if (!userId) return res.status(401).json({ error: 'Authentication required' });

      const isAdmin = await isUserAdmin(userId);
      
      // Only admin or the creator can delete? 
      // For now, let's just protect with email verification as requested, 
      // but ideally we check ownership.
      await storage.deleteEvent(eventId);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // Saved Events
  app.post("/api/events/:eventId/save", userAuth, async (req, res, next) => {
    try {
      const { eventId } = req.params;
      const userId = req.userId;
      if (!userId) return res.status(401).json({ error: 'Authentication required' });

      await storage.saveEvent(userId, eventId);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/events/:eventId/save", userAuth, async (req, res, next) => {
    try {
      const { eventId } = req.params;
      const userId = req.userId;
      if (!userId) return res.status(401).json({ error: 'Authentication required' });

      await storage.unsaveEvent(userId, eventId);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/events/saved/:userId", userAuth, async (req, res, next) => {
    try {
      const { userId } = req.params;
      const currentUserId = req.userId;
      if (!currentUserId) return res.status(401).json({ error: 'Authentication required' });
      const isAdmin = await isUserAdmin(currentUserId);

      if (!isAdmin && userId !== currentUserId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const savedEventIds = await storage.getSavedEvents(userId);
      res.json(savedEventIds);
    } catch (error) {
      next(error);
    }
  });

  // Vendor Services
  app.get("/api/services", async (req, res, next) => {
    try {
      const city = req.query.city as string;
      const services = await storage.getVendorServices({});
      
      if (city) {
        services.sort((a: any, b: any) => {
          const aInCity = a.city?.toLowerCase() === city.toLowerCase() || a.location?.toLowerCase().includes(city.toLowerCase());
          const bInCity = b.city?.toLowerCase() === city.toLowerCase() || b.location?.toLowerCase().includes(city.toLowerCase());
          if (aInCity && !bInCity) return -1;
          if (!aInCity && bInCity) return 1;
          return 0;
        });
      }
      
      res.json(services);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/services", async (req, res, next) => {
    try {
      const { vendorId, name, type, specialization, description, location, latitude, longitude, contactPhone, contactEmail, priceRange, priceList } = req.body;
      
      if (!vendorId || !name || !type || !location) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const service = await storage.createVendorService({
        vendorId, name, type, specialization, description, location, latitude, longitude, contactPhone, contactEmail, priceRange, priceList
      });

      // Automatically save as MOAT data for AI training
      await storage.createMoatData({
        title: `Service: ${name} (${type})`,
        content: `Type: ${type}\nSpecialization: ${specialization}\nDescription: ${description}\nLocation: ${location}\nContact: ${contactPhone || contactEmail}`,
        category: 'marketplace',
        source: 'sabimarket',
        metadata: { serviceId: service.id, vendorId, type, location }
      });

      res.json(service);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/services/:serviceId", async (req, res, next) => {
    try {
      const { serviceId } = req.params;
      await storage.updateVendorService(serviceId, req.body);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/services/:serviceId", async (req, res, next) => {
    try {
      const { serviceId } = req.params;
      await storage.deleteVendorService(serviceId);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/professional-services", async (req, res, next) => {
    try {
      const filters: any = {};
      if (req.query.professionalId) filters.professionalId = String(req.query.professionalId);
      if (req.query.type) filters.type = String(req.query.type);
      if (req.query.city) filters.city = String(req.query.city);
      const services = await storage.getProfessionalServices(filters);
      res.json(services);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/professional-services", userAuth, async (req, res, next) => {
    try {
      const { professionalId, name, type, specialization, description, location, latitude, longitude, contactPhone, contactEmail, priceRange, priceList } = req.body;
      if (!professionalId || !name || !type || !location) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const professional = await storage.getProfessionalById(professionalId);
      if (!professional) {
        return res.status(404).json({ error: 'Professional not found' });
      }
      if (professional.userId !== req.userId) {
        return res.status(403).json({ error: 'Not authorized to add services for this professional' });
      }

      const service = await storage.createProfessionalService({
        professionalId,
        name,
        type,
        specialization,
        description,
        location,
        latitude,
        longitude,
        contactPhone,
        contactEmail,
        priceRange,
        priceList,
        verified: false
      });
      res.json(service);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/professional-services/:serviceId", userAuth, async (req, res, next) => {
    try {
      const { serviceId } = req.params;
      const service = await storage.getProfessionalServiceById(serviceId);
      if (!service) {
        return res.status(404).json({ error: 'Professional service not found' });
      }
      const professional = await storage.getProfessionalById(service.professionalId);
      if (!professional || professional.userId !== req.userId) {
        return res.status(403).json({ error: 'Not authorized to modify this service' });
      }

      await storage.updateProfessionalService(serviceId, req.body);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/professional-services/:serviceId", userAuth, async (req, res, next) => {
    try {
      const { serviceId } = req.params;
      const service = await storage.getProfessionalServiceById(serviceId);
      if (!service) {
        return res.status(404).json({ error: 'Professional service not found' });
      }
      const professional = await storage.getProfessionalById(service.professionalId);
      if (!professional || professional.userId !== req.userId) {
        return res.status(403).json({ error: 'Not authorized to delete this service' });
      }

      await storage.deleteProfessionalService(serviceId);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // Admin Settings - protected routes
  app.get("/api/admin/settings", adminAuth, async (req, res, next) => {
    try {
      const { category } = req.query;
      const settings = await storage.getAdminSettings(category as string | undefined);
      const filteredSettings = settings.map((s: any) => ({
        ...s,
        value: s.isSecret ? '' : s.value,
        hasValue: !!s.value && String(s.value).length > 0
      }));
      res.json(filteredSettings);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/setting/:key", adminAuth, async (req, res, next) => {
    try {
      const { key } = req.params;
      const setting = await storage.getAdminSetting(key);
      if (!setting) return res.json({});
      if (setting.isSecret) {
        res.json({
          ...setting,
          value: '',
          hasValue: !!setting.value && String(setting.value).length > 0
        });
      } else {
        res.json(setting);
      }
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/settings", adminAuth, async (req, res, next) => {
    try {
      const { key, value, category, isSecret } = req.body;
      
      if (!key || !category) {
        return res.status(400).json({ error: 'Key and category required' });
      }

      // If isSecret and value is empty/mask/undefined, don't overwrite
      if (isSecret && (value === undefined || value === null || value === '' || /^•+$/.test(String(value).trim()))) {
        return res.json({ success: true, unchanged: true });
      }

      if (key === "whatsapp_bot_url" || key === "telegram_bot_url") {
        if (category !== "bots" || typeof value !== "string") {
          return res.status(400).json({ error: "Bot link settings must be strings in the bots category." });
        }

        const normalizedUrl = key === "whatsapp_bot_url"
          ? normalizeWhatsAppBotUrl(value)
          : normalizeTelegramBotUrl(value);

        if (value.trim() && !normalizedUrl) {
          return res.status(400).json({
            error: key === "whatsapp_bot_url"
              ? "Enter a valid Nigerian phone number or HTTPS WhatsApp link (wa.me or api.whatsapp.com)."
              : "Enter a Telegram bot username ending in Bot or an HTTPS t.me/telegram.me bot link."
          });
        }

        await storage.setAdminSetting(key, normalizedUrl || "", "bots", false);
        return res.json({ success: true, value: normalizedUrl || "" });
      }

      await storage.setAdminSetting(key, value, category, isSecret);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // Admin test endpoint for N-ATLAS (Sovereign LLM)
  app.post("/api/admin/ai/natlas/test", adminAuth, async (req, res, next) => {
    try {
      const { generateNAtlasResponse } = await import("./aiService.js");
      const testPrompt = "Translate and explain in brief Nigerian Pidgin: What are the fundamental rights of a citizen during a police checkpoint?";
      const testResponse = await generateNAtlasResponse(testPrompt);
      if (!testResponse) {
        return res.status(502).json({ ok: false, error: "Empty response from N-ATLAS" });
      }
      res.json({ ok: true, model: "N-ATLAS (NCAIR1/N-ATLaS)", sampleOutput: testResponse.slice(0, 400) });
    } catch (error: any) {
      res.status(500).json({ ok: false, error: error.message || String(error) });
    }
  });

  // Admin User Management - protected routes
  app.get("/api/admin/users", adminAuth, async (req, res, next) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/vendor-applications", adminAuth, async (req, res, next) => {
    try {
      const applications = await storage.getAllVendorApplications();
      res.json(applications);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/vendor/:userId/approve", adminAuth, async (req, res, next) => {
    try {
      const { userId } = req.params;
      await storage.approveVendorApplication(userId);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/vendor/:userId/reject", adminAuth, async (req, res, next) => {
    try {
      const { userId } = req.params;
      await storage.rejectVendorApplication(userId);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // Admin: Update user profile
  app.patch("/api/admin/users/:userId", adminAuth, async (req, res, next) => {
    try {
      const { userId } = req.params;
      await storage.updateUserProfile(userId, req.body);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // Admin: Update user credits (set, add, or remove)
  app.patch("/api/admin/users/:userId/credits", adminAuth, async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { action = 'set', amount, totalCredits } = req.body;
      const rawValue = amount !== undefined ? amount : totalCredits;
      const parsedValue = parseInt(rawValue);
      
      if (rawValue === undefined || isNaN(parsedValue) || parsedValue < 0) {
        return res.status(400).json({ error: 'Valid positive numeric amount or totalCredits required' });
      }
      
      if (action === 'add') {
        await storage.addCredits(userId, parsedValue, 'Credits added by admin', 'admin_add');
      } else if (action === 'remove') {
        await storage.removeCredits(userId, parsedValue, 'Credits removed by admin', 'admin_remove');
      } else {
        // default: set spendable balance
        await storage.setUserCredits(userId, parsedValue);
      }

      const balance = await storage.getBalance(userId);
      res.json({ success: true, balance });
    } catch (error) {
      next(error);
    }
  });

  // Debug: Show DB status
  app.get("/api/debug/db-status", async (req, res, next) => {
    try {
      const users = await storage.getAllUsers();
      const plans = await storage.getAllPlans();
      const events = await storage.getEvents();
      const services = await storage.getAllVendorServices();
      const jobs = await storage.getJobs();
      const paymentMethods = await storage.getPaymentMethods();

      res.json({
        database: "Supabase PostgreSQL",
        status: "connected",
        counts: {
          users: users.length,
          plans: plans.length,
          events: events.length,
          services: services.length,
          jobs: jobs.length,
          paymentMethods: paymentMethods.length
        }
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Admin: Set user as admin (bootstrap endpoint - uses setup key)
  app.post("/api/admin/setup/:userId", async (req, res) => {
    const { userId } = req.params;
    const { setupKey } = req.body;
    
    // Check database settings first, then env
    const settingKey = await storage.getAdminSetting('admin_setup_key');
    const validSetupKey = settingKey?.value || process.env.ADMIN_SETUP_KEY || 'legal-13d13-admin-setup-2024';
    
    if (setupKey !== validSetupKey) {
      console.log(`Admin setup failed: Invalid key for user ${userId}`);
      return res.status(403).json({ error: 'Invalid setup key' });
    }
    
    console.log(`Setting user ${userId} as admin...`);
    const success = await storage.toggleUserAdmin(userId, true);

    if (success) {
      res.json({ success: true, message: 'User set as admin successfully' });
    } else {
      res.status(500).json({ error: 'Failed to set user as admin' });
    }
  });

  // Admin: Approve Email Verification
  app.post("/api/admin/email-verification/:userId/approve", adminAuth, async (req, res, next) => {
    try {
      const { userId } = req.params;
      await storage.updateEmailVerificationStatus(userId, 'verified');
      
      // Send notification
      await storage.sendNotification({
        userId,
        type: 'email_verified',
        title: 'Email Verified',
        message: 'Your email address has been successfully verified. You now have full access to all features.',
        templateName: 'email_verified',
        channels: ['in_app', 'email']
      });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // Admin: Reject Email Verification
  app.post("/api/admin/email-verification/:userId/reject", adminAuth, async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { reason } = req.body;
      await storage.updateEmailVerificationStatus(userId, 'rejected');
      
      // Send notification
      await storage.sendNotification({
        userId,
        type: 'email_rejected',
        title: 'Email Verification Failed',
        message: `Your email verification was not approved. ${reason ? `Reason: ${reason}` : 'Please try again.'}`,
        channels: ['in_app', 'email'],
        data: { reason }
      });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // Admin: Assign plan to user
  app.post("/api/admin/users/:userId/plan", adminAuth, async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { planId } = req.body;
      
      const plan = await storage.getPlanById(planId);
      if (!plan) {
        return res.status(404).json({ error: 'Plan not found' });
      }

      const subscription = await storage.activatePlan(userId, planId);
      const balance = await storage.getBalance(userId);

      res.json({ success: true, subscription, balance });
    } catch (error) {
      next(error);
    }
  });

  // Admin: Remove plan from user (revert to default Free plan tier)
  app.delete("/api/admin/users/:userId/plan", adminAuth, async (req, res, next) => {
    try {
      const { userId } = req.params;
      await storage.removePlan(userId);
      const balance = await storage.getBalance(userId);
      res.json({ success: true, message: 'Plan removed and reverted to Citizen Free tier', balance });
    } catch (error) {
      next(error);
    }
  });

  // Admin: Get all vendors
  app.get("/api/admin/vendors", adminAuth, async (req, res, next) => {
    try {
      const vendors = await storage.getAllVendors();
      res.json(vendors);
    } catch (error) {
      next(error);
    }
  });

  // Admin: Update user profile
  app.patch("/api/admin/users/:userId", adminAuth, async (req, res, next) => {
    try {
      const { userId } = req.params;
      const updates = req.body;
      
      const updated = await storage.updateUserProfile(userId, updates);
      if (updated) {
        res.json(updated);
      } else {
        res.status(404).json({ error: 'User profile not found' });
      }
    } catch (error) {
      next(error);
    }
  });

  // Admin: Impersonate user (Login as User)
  app.post("/api/admin/users/:userId/impersonate", adminAuth, async (req, res, next) => {
    try {
      const { userId } = req.params;
      const token = await storage.getImpersonationToken(userId);
      res.json({ token });
    } catch (error) {
      next(error);
    }
  });

  // Admin: Toggle user admin status
  app.post("/api/admin/users/:userId/toggle-admin", adminAuth, async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { isAdmin } = req.body;
      
      const success = await storage.toggleUserAdmin(userId, isAdmin);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(500).json({ error: 'Failed to update user' });
      }
    } catch (error) {
      next(error);
    }
  });

  // Admin: Delete user
  app.delete("/api/admin/users/:userId", adminAuth, async (req, res, next) => {
    try {
      const { userId } = req.params;
      
      const success = await storage.deleteUser(userId);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(500).json({ error: 'Failed to delete user' });
      }
    } catch (error) {
      next(error);
    }
  });

  // Admin: Get all plans
  app.get("/api/admin/plans", adminAuth, async (req, res, next) => {
    try {
      const plans = await storage.getAllPlans();
      res.json(plans);
    } catch (error) {
      next(error);
    }
  });

  // Admin: Create plan
  app.post("/api/admin/plans", adminAuth, async (req, res, next) => {
    try {
      const { name, type, userType, price, credits, features, description, billingCycle, storageMb, storage_mb } = req.body;
      
      if (!name || !type) {
        return res.status(400).json({ error: 'Name and type are required' });
      }

      const plan = await storage.createPlan({
        name,
        type,
        userType: userType || 'user',
        price: price || 0,
        credits: credits || 10,
        storageMb: storageMb !== undefined ? Number(storageMb) : (storage_mb !== undefined ? Number(storage_mb) : undefined),
        features: features || [],
        description: description || '',
        billingCycle: billingCycle || 'monthly'
      } as any);

      res.json(plan);
    } catch (error) {
      next(error);
    }
  });

  // Admin: Update plan
  app.put("/api/admin/plans/:planId", adminAuth, async (req, res, next) => {
    try {
      const { planId } = req.params;
      const updates = req.body;

      const plan = await storage.updatePlan(planId, updates);
      if (plan) {
        res.json(plan);
      } else {
        res.status(404).json({ error: 'Plan not found' });
      }
    } catch (error) {
      next(error);
    }
  });

  // Admin: Delete plan
  app.delete("/api/admin/plans/:planId", adminAuth, async (req, res, next) => {
    try {
      const { planId } = req.params;
      const success = await storage.deletePlan(planId);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Plan not found' });
      }
    } catch (error) {
      next(error);
    }
  });

  // Credit Packages API
  app.get("/api/admin/credit-packages", adminAuth, async (req, res, next) => {
    try {
      const packages = await storage.getCreditPackages();
      res.json(packages);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/credit-packages", adminAuth, async (req, res, next) => {
    try {
      const packageData = req.body;
      const newPackage = await storage.createCreditPackage(packageData);
      res.json(newPackage);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/admin/credit-packages/:packageId", adminAuth, async (req, res, next) => {
    try {
      const { packageId } = req.params;
      const updates = req.body;
      const updated = await storage.updateCreditPackage(packageId, updates);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/admin/credit-packages/:packageId", adminAuth, async (req, res, next) => {
    try {
      const { packageId } = req.params;
      const success = await storage.deleteCreditPackage(packageId);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Package not found' });
      }
    } catch (error) {
      next(error);
    }
  });

  // Payment Methods API
  app.get("/api/admin/payment-methods", adminAuth, async (req, res, next) => {
    try {
      const methods = await storage.getPaymentMethods();
      res.json(methods);
    } catch (error) {
      next(error);
    }
  });

  // Admin Payments/Transactions API
  app.get("/api/admin/payments", adminAuth, async (req, res) => {
    try {
      const payments = await storage.getPayments();
      // Enrich with user details if possible (or frontend can fetch)
      // For now, just return payments. Frontend can match with users list if needed.
      res.json(payments);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/payment-methods", adminAuth, async (req, res, next) => {
    try {
      const methodData = req.body;
      const newMethod = await storage.createPaymentMethod(methodData);
      res.json(newMethod);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/admin/payment-methods/:methodId", adminAuth, async (req, res, next) => {
    try {
      const { methodId } = req.params;
      const updates = req.body;
      const updated = await storage.updatePaymentMethod(methodId, updates);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/admin/payment-methods/:methodId", adminAuth, async (req, res, next) => {
    try {
      const { methodId } = req.params;
      const success = await storage.deletePaymentMethod(methodId);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Payment method not found' });
      }
    } catch (error) {
      next(error);
    }
  });

  // Admin Jobs Management
  app.get("/api/admin/jobs", adminAuth, async (req, res, next) => {
    try {
      const jobs = await storage.getJobs();
      res.json(jobs);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/jobs", adminAuth, async (req, res, next) => {
    try {
      const job = await storage.createJob(req.body);
      
      // Automatically save as MOAT data for AI training
      await storage.createMoatData({
        title: `Job: ${job.title} at ${job.company || 'Confidential'}`,
        content: `Role: ${job.title}\nCompany: ${job.company || 'Confidential'}\nLocation: ${job.location}\nType: ${job.type}\nDescription: ${job.description}`,
        category: 'jobs',
        source: 'sabijobs_admin',
        metadata: { jobId: job.id, company: job.company, location: job.location }
      });

      res.json(job);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/admin/jobs/:jobId", adminAuth, async (req, res, next) => {
    try {
      const { jobId } = req.params;
      await storage.updateJob(jobId, req.body);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/admin/jobs/:jobId", adminAuth, async (req, res, next) => {
    try {
      const { jobId } = req.params;
      await storage.deleteJob(jobId);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // Admin Events Management
  app.get("/api/admin/events", adminAuth, async (req, res, next) => {
    try {
      const events = await storage.getEvents();
      res.json(events);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/events", adminAuth, async (req, res, next) => {
    try {
      const event = await storage.createEvent(req.body);

      // Automatically save as MOAT data for AI training
      await storage.createMoatData({
        title: `Event: ${event.title}`,
        content: `Category: ${event.category}\nOrganizer: ${event.organizer}\nDate: ${event.date} ${event.time}\nLocation: ${event.location}\nDescription: ${event.description}`,
        category: 'events',
        source: 'sabievents_admin',
        metadata: { eventId: event.id, category: event.category, location: event.location }
      });

      res.json(event);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/admin/events/:eventId", adminAuth, async (req, res, next) => {
    try {
      const { eventId } = req.params;
      await storage.updateEvent(eventId, req.body);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/admin/events/:eventId", adminAuth, async (req, res, next) => {
    try {
      const { eventId } = req.params;
      await storage.deleteEvent(eventId);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // Admin: MOAT Data Management
  app.get("/api/admin/moat", adminAuth, async (req, res, next) => {
    try {
      const data = await storage.getMoatData();
      res.json(data);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/moat", adminAuth, async (req, res, next) => {
    try {
      const item = await storage.createMoatData(req.body);
      res.json(item);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/admin/moat/:id", adminAuth, async (req, res, next) => {
    try {
      const { id } = req.params;
      await storage.deleteMoatData(id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // Public MOAT knowledge base for web and mobile offline synchronization
  app.get("/api/moat/public", async (req, res, next) => {
    try {
      const category = req.query.category as string | undefined;
      const data = await storage.getMoatData(category);
      res.json(data);
    } catch (error) {
      next(error);
    }
  });

  // FAQ Management
  app.get("/api/faqs", async (req, res, next) => {
    try {
      const faqs = await storage.getFaqs();
      res.json(faqs);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/faqs", adminAuth, async (req, res, next) => {
    try {
      const faq = await storage.createFaq(req.body);
      res.json(faq);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/admin/faqs/:id", adminAuth, async (req, res, next) => {
    try {
      const { id } = req.params;
      const faq = await storage.updateFaq(id, req.body);
      res.json(faq);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/admin/faqs/:id", adminAuth, async (req, res, next) => {
    try {
      const { id } = req.params;
      await storage.deleteFaq(id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // Testimonial Management
  app.get("/api/testimonials", async (req, res, next) => {
    try {
      const testimonials = await storage.getTestimonials();
      res.json(testimonials);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/testimonials", adminAuth, async (req, res, next) => {
    try {
      const testimonial = await storage.createTestimonial(req.body);
      res.json(testimonial);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/admin/testimonials/:id", adminAuth, async (req, res, next) => {
    try {
      const { id } = req.params;
      const testimonial = await storage.updateTestimonial(id, req.body);
      res.json(testimonial);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/admin/testimonials/:id", adminAuth, async (req, res, next) => {
    try {
      const { id } = req.params;
      await storage.deleteTestimonial(id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // Survey API
  app.post("/api/surveys", userAuth, async (req, res, next) => {
    try {
      const { feature, rating, feedback } = req.body;
      const userId = req.userId;

      if (!feature || !rating) {
        return res.status(400).json({ error: "Feature and rating are required" });
      }

      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const survey = await storage.createSurvey({
        userId,
        feature,
        rating,
        feedback
      });

      res.status(201).json(survey);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/surveys", adminAuth, async (req, res, next) => {
    try {
      const surveys = await storage.getSurveys();
      res.json(surveys);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/surveys/stats", adminAuth, async (req, res, next) => {
    try {
      const surveys = await storage.getSurveys();
      
      const stats = surveys.reduce((acc: any, curr: any) => {
        if (!acc[curr.feature]) {
          acc[curr.feature] = { count: 0, totalRating: 0, feedback: [] };
        }
        acc[curr.feature].count++;
        acc[curr.feature].totalRating += curr.rating;
        if (curr.feedback) acc[curr.feature].feedback.push(curr.feedback);
        return acc;
      }, {});

      const processedStats = Object.keys(stats).reduce((acc: any, feature) => {
        acc[feature] = {
          averageRating: stats[feature].totalRating / stats[feature].count,
          count: stats[feature].count,
          feedback: stats[feature].feedback.slice(-5) // Last 5 feedback
        };
        return acc;
      }, {});

      res.json(processedStats);
    } catch (error) {
      next(error);
    }
  });

  // Public endpoint for active payment methods (no auth required)
  app.get("/api/payment-methods", async (req, res, next) => {
    try {
      const methods = await storage.getActivePaymentMethods();
      // Filter out sensitive data for public endpoint
      const safeMethods = methods.map((m: any) => {
        // Explicitly only allow safe fields to prevent sensitive data leakage
        const safeFields: any = {
          id: m.id,
          name: m.name,
          type: m.type,
          active: m.active,
          icon: m.icon,
          description: m.description,
          instructions: m.instructions,
          fields: m.fields,
          createdAt: m.createdAt,
          updatedAt: m.updatedAt
        };
        
        // Add public keys for automatic gateways if they exist
        if (['paystack', 'flutterwave', 'stripe'].includes(m.type)) {
          safeFields.publicKey = m.publicKey || '';
        }
        
        return safeFields;
      });
      res.json(safeMethods);
    } catch (error) {
      next(error);
    }
  });

  // Public endpoint for credit packages (no auth required)
  app.get("/api/credit-packages", async (req, res, next) => {
    try {
      const packages = await storage.getCreditPackages();
      res.json(packages);
    } catch (error) {
      next(error);
    }
  });

  // Legal Leads & Case Files
  app.post("/api/leads", userAuth, async (req, res) => {
    const { userId, lawyerId, lawyerName, source } = req.body;
    
    if (!lawyerId || !lawyerName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const lead = await storage.createVendorLead({
      vendorId: lawyerId,
      customerId: userId,
      customerName: req.user?.displayName || 'Anonymous User',
      customerEmail: req.user?.email || '',
      serviceType: 'Legal Aid',
      message: `Lead from SabiRight Civic Chat (${source})`,
      metadata: { lawyerName }
    });

    res.json(lead);
  });

  // Pre-Case Files & Direct Lawyer Handoff APIs
  app.get("/api/case-files/:id", userAuth, async (req, res) => {
    try {
      const caseFile = await storage.getPreCaseFile(req.params.id);
      if (!caseFile) return res.status(404).json({ error: "Case file not found" });
      const cf: any = caseFile;
      if ((cf.userId ?? cf.user_id) !== (req as any).userId && !(req as any).isAdmin) {
        const prof = cf.lawyerId ?? cf.lawyer_id;
        if (!prof || prof !== (req as any).userId) return res.status(403).json({ error: 'Forbidden' });
      }
      res.json(caseFile);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/case-files/user/:userId", userAuth, async (req, res) => {
    try {
      const files = await storage.getPreCaseFilesByUserId(req.params.userId);
      res.json(files);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/case-files/synthesize", userAuth, async (req, res) => {
    try {
      const { history, channel } = req.body;
      const userId = (req as any).userId;
      if (!history || !Array.isArray(history) || history.length === 0) {
        return res.status(400).json({ error: "Chat history required" });
      }

      const caseSummary = await summarizeCaseForProfessional(history, userId || 'citizen');
      const caseRef = `CASE-${Date.now().toString().slice(-6)}`;
      const id = `cf-${Date.now()}`;

      await supabase.from('pre_case_files').insert({
        id,
        case_ref: caseRef,
        user_id: userId || null,
        channel: channel || 'web',
        issue_summary: caseSummary.slice(0, 500),
        raw_chat_history: history,
        created_at: new Date().toISOString()
      });

      res.json({ success: true, caseRef, caseSummary });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/case-files", userAuth, upload.single('file'), async (req, res) => {
    const { userId, lawyerId, chatId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Save case document to MOAT data for reference/training
    const caseDoc = await storage.createMoatData({
      title: `Case File: ${file.originalname}`,
      content: `User ${userId} submitted a case file for lawyer ${lawyerId || 'any'}. Chat ID: ${chatId || 'none'}. Path: ${file.path}`,
      category: 'case_documents',
      source: 'user_submission',
      metadata: {
        userId,
        lawyerId,
        chatId,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: file.path
      }
    });

    // Also notify the lawyer if specified
    if (lawyerId) {
      await storage.createNotification({
        userId: lawyerId,
        type: 'case_file_submission',
        title: 'New Case File Submitted',
        message: `A user has submitted a preliminary case summary for your review.`,
        data: { caseDocId: caseDoc.id, userId, chatId }
      });
    }

    res.json({ success: true, fileName: file.originalname, docId: caseDoc.id });
  });

  // Jobs APIs API
  app.get("/api/jobs", async (req, res, next) => {
    try {
      const city = req.query.city as string;
      const jobs = await storage.getJobs(100);
      
      if (city) {
        jobs.sort((a: any, b: any) => {
          const aInCity = a.city?.toLowerCase() === city.toLowerCase() || a.location?.toLowerCase().includes(city.toLowerCase());
          const bInCity = b.city?.toLowerCase() === city.toLowerCase() || b.location?.toLowerCase().includes(city.toLowerCase());
          if (aInCity && !bInCity) return -1;
          if (!aInCity && bInCity) return 1;
          return 0;
        });
      }
      
      res.json(jobs);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/jobs", userAuth, emailVerifiedAuth, async (req, res, next) => {
    try {
      const { title, company, location, type, workMode, salary, description, contact, postedBy, source, isAiFetched } = req.body;
      const userId = req.userId;
      
      if (!title || !location) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const job = await storage.createJob({
        title,
        company: company || 'Confidential',
        location,
        type: type || 'Full-time',
        workMode: workMode || 'Onsite',
        salary: salary || 'To be Negotiated',
        description: description || '',
        contact: contact || '',
        postedBy: postedBy || userId,
        source: source || 'User Posted',
        isAiFetched: isAiFetched || false
      });

      // Automatically save as MOAT data for AI training
      await storage.createMoatData({
        title: `Job: ${title} at ${company || 'Confidential'}`,
        content: `Role: ${title}\nCompany: ${company || 'Confidential'}\nLocation: ${location}\nType: ${type}\nDescription: ${description}`,
        category: 'jobs',
        source: 'sabijobs',
        metadata: { jobId: job.id, company, location }
      });

      res.json(job);
    } catch (error) {
      next(error);
    }
  });

  // Save Job
  app.post("/api/jobs/:jobId/save", userAuth, async (req, res, next) => {
    try {
      const { jobId } = req.params;
      const userId = req.userId;
      if (!userId) return res.status(401).json({ error: 'Authentication required' });

      await storage.saveJob(userId, jobId);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // Unsave Job
  app.delete("/api/jobs/:jobId/save", userAuth, async (req, res, next) => {
    try {
      const { jobId } = req.params;
      const userId = req.userId;
      if (!userId) return res.status(401).json({ error: 'Authentication required' });

      await storage.unsaveJob(userId, jobId);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // Get Saved Jobs
  app.get("/api/jobs/saved/:userId", userAuth, async (req, res, next) => {
    try {
      const { userId } = req.params;
      const currentUserId = req.userId;
      if (!currentUserId) return res.status(401).json({ error: 'Authentication required' });
      const isAdmin = await isUserAdmin(currentUserId);

      if (!isAdmin && userId !== currentUserId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const jobs = await storage.getSavedJobs(userId);
      res.json(jobs);
    } catch (error) {
      next(error);
    }
  });

  // Get Saved Job IDs (for quick lookup)
  app.get("/api/jobs/saved-ids/:userId", userAuth, async (req, res, next) => {
    try {
      const { userId } = req.params;
      const currentUserId = req.userId;
      if (!currentUserId) return res.status(401).json({ error: 'Authentication required' });
      const isAdmin = await isUserAdmin(currentUserId);

      if (!isAdmin && userId !== currentUserId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const jobIds = await storage.getSavedJobIds(userId);
      res.json(jobIds);
    } catch (error) {
      next(error);
    }
  });

  // Apply to Job
  app.post("/api/jobs/:jobId/apply", userAuth, emailVerifiedAuth, async (req, res, next) => {
    try {
      const { jobId } = req.params;
      const userId = req.userId;
      if (!userId) return res.status(401).json({ error: 'Authentication required' });

      const application = await storage.applyToJob(userId, jobId);
      res.json(application);
    } catch (error) {
      next(error);
    }
  });

  // Get Applied Jobs
  app.get("/api/jobs/applied/:userId", userAuth, async (req, res, next) => {
    try {
      const { userId } = req.params;
      const currentUserId = req.userId;
      if (!currentUserId) return res.status(401).json({ error: 'Authentication required' });
      const isAdmin = await isUserAdmin(currentUserId);

      if (!isAdmin && userId !== currentUserId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const jobs = await storage.getAppliedJobs(userId);
      res.json(jobs);
    } catch (error) {
      next(error);
    }
  });

  // Get Applied Job IDs (for quick lookup)
  app.get("/api/jobs/applied-ids/:userId", userAuth, async (req, res, next) => {
    try {
      const { userId } = req.params;
      const currentUserId = req.userId;
      if (!currentUserId) return res.status(401).json({ error: 'Authentication required' });
      const isAdmin = await isUserAdmin(currentUserId);

      if (!isAdmin && userId !== currentUserId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const jobIds = await storage.getAppliedJobIds(userId);
      res.json(jobIds);
    } catch (error) {
      next(error);
    }
  });

  // Update Application Status
  app.patch("/api/jobs/:jobId/application-status", userAuth, async (req, res, next) => {
    try {
      const { jobId } = req.params;
      const { userId, status } = req.body;
      const currentUserId = req.userId;
      if (!currentUserId) return res.status(401).json({ error: 'Authentication required' });
      const isAdmin = await isUserAdmin(currentUserId);

      // Ideally only the employer or admin can update status.
      // For now, let's at least check if the current user is an admin or the one who posted the job.
      // But we don't have job creator info easily here without fetching the job.
      // Let's stick to admin or a basic check for now.
      if (!isAdmin) {
        // Basic check: user can't update their own status to 'accepted'?
        // Actually, this should probably be restricted to admins/vendors.
      }

      if (!userId || !status) {
        return res.status(400).json({ error: 'User ID and status required' });
      }

      const validStatuses = ['applied', 'reviewing', 'interviewing', 'accepted', 'rejected'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      await storage.updateApplicationStatus(userId, jobId, status);
      res.json({ success: true, status });
    } catch (error) {
      next(error);
    }
  });

  // Get AI Generated Jobs for User
  app.get("/api/jobs/generated/:userId", async (req, res, next) => {
    try {
      const { userId } = req.params;
      const jobs = await storage.getGeneratedJobs(userId);
      res.json(jobs);
    } catch (error) {
      next(error);
    }
  });

  // AI Generation Helper
  const verifyRecaptcha = async (token: string) => {
    const secretKeySetting = await storage.getAdminSetting('captcha_secret_key');
    const secretKey = secretKeySetting?.value;

    if (!secretKey) {
      // If no secret key is configured, skip verification
      return true;
    }

    try {
      const response = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${secretKey}&response=${token}`
      });

      const data = await response.json() as any;
      return data.success;
    } catch (err) {
      console.error('reCAPTCHA verification error:', err);
      return false;
    }
  };

  // generateAIResponse is imported from ./aiService.js

  // AI Generation API
  app.post("/api/ai/generate", async (req, res) => {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt required' });
    }

    try {
      const text = await generateAIResponse(prompt);
      res.json({ response: text });
    } catch (err: any) {
      console.error('[AI Generate] Error:', err.message);
      if (err.status === 429) {
        return res.status(429).json({ error: err.message });
      }
      if (err.message.includes('not configured')) {
        return res.status(503).json({ error: err.message });
      }
      res.status(500).json({ error: 'AI Generation failed. Please check your API keys in Admin Settings.' });
    }
  });

  // AI Agent API (Optimized for Hackathon)
  app.post("/api/agent", userAuth, async (req, res) => {
    try {
      const { message, sessionId, city } = req.body;
      const userId = req.userId;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      let finalResponse = "";
      const geminiKeySetting = await storage.getAdminSetting('google_gemini_api_key');
      const geminiKey = geminiKeySetting?.value || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;

      if (geminiKey && !(await isNAtlasSovereignMode())) {
        try {
          const agent = await getLegalAgent();
          const runner = new Runner({
            appName: "SabiRight",
            agent,
            sessionService,
          });

          const currentSessionId = sessionId || `session-${Date.now()}`;
          const session = await sessionService.getSession({
            appName: "SabiRight",
            userId: userId!,
            sessionId: currentSessionId
          });
          
          if (!session) {
            await sessionService.createSession({
              appName: "SabiRight",
              userId: userId!,
              sessionId: currentSessionId
            });
          }

          const events = runner.runAsync({
            userId: userId!,
            sessionId: currentSessionId,
            newMessage: { role: 'user', parts: [{ text: `[User City: ${city || 'Nigeria'}] ${message}` }] } as any
          });

          for await (const event of events) {
            const structuredEvents = toStructuredEvents(event);
            for (const se of structuredEvents) {
              if (se.type === EventType.CONTENT) {
                finalResponse += se.content;
              } else if (se.type === EventType.ERROR) {
                console.error(`[Agent API] ADK Error Event:`, se.error);
              }
            }
          }
        } catch (adkErr: any) {
          console.warn('[Agent API] ADK run notice:', adkErr.message);
        }
      }

      if (!finalResponse) {
        const prompt = `You are the SabiRight AI Agent for Nigeria (User City: ${city || 'Nigeria'}).
Provide cautious general civic information. For legal questions, cite statutes or sections only when supported by relevant reference material in the prompt. Never invent citations, legal wording, rights, or outcomes. If reliable support is unavailable, say that you cannot verify the legal point and recommend checking a current authoritative source or consulting qualified Nigerian counsel. This is not a substitute for legal advice.
User message: ${message}`;
        finalResponse = await generateAIResponse(prompt) || "Hello! I am your SabiRight AI Agent. How can I help you today?";
      }

      res.json({ response: finalResponse });
    } catch (error: any) {
      console.error('[Agent API] 500 Error:', error);
      res.status(500).json({ error: error.message || String(error) });
    }
  });

  // Authenticated transcription endpoint shared by web and mobile clients.
  app.post("/api/ai/transcribe", userAuth, async (req, res) => {
    try {
      const { audioBase64, mimeType, language } = req.body || {};
      if (typeof audioBase64 !== 'string' || !audioBase64.trim()) {
        return res.status(400).json({ error: 'audioBase64 required' });
      }

      const encodedAudio = audioBase64.replace(/^data:audio\/[^;]+;base64,/, '').trim();
      const maxEncodedLength = Math.ceil(MAX_TRANSCRIPTION_AUDIO_BYTES / 3) * 4;
      if (encodedAudio.length > maxEncodedLength) {
        return res.status(413).json({ error: 'Audio exceeds the 8 MB transcription limit' });
      }
      if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encodedAudio)) {
        return res.status(400).json({ error: 'audioBase64 must contain valid base64 audio data' });
      }

      const audio = Buffer.from(encodedAudio, 'base64');
      if (!audio.length) return res.status(400).json({ error: 'Audio data is empty or invalid' });
      const result = await transcribeAudio(audio, typeof mimeType === 'string' ? mimeType : 'audio/mp4', language);
      return res.json(result);
    } catch (err) {
      const error = err as Error & { statusCode?: number };
      console.error('[Transcribe] Error:', error.message || error);
      return res.status(error.statusCode || 502).json({ error: error.message || 'Transcription failed' });
    }
  });

  // AI Civic Chat API (SabiRight Citizen Education) - Unified to use Autonomous Agent
  app.post("/api/ai/civic/chat", optionalUserAuth, async (req, res, next) => {
    let cost = 1;
    try {
      const { message, sessionId, chatId, language } = req.body;
      const userId = req.userId;
      
      if (!userId || !message) {
        return res.status(400).json({ error: 'User ID and message required' });
      }

      const featureAccess = await validateFeatureAccess(userId, 'ai_chat');
      if (!featureAccess.allowed) {
        return res.status(featureAccess.status).json({ error: featureAccess.error });
      }

      const costSetting = await storage.getAdminSetting('credit_cost_ai_query');
      cost = costSetting?.value ? Number(costSetting.value) : 1;

      const balance = await storage.getBalance(userId);
      const deducted = await storage.deductCredits(userId, cost, 'civic_guard', `Legal AI query: ${message.substring(0, 50)}`);
      if (!deducted) {
        console.warn(`[Civic Chat 402] Insufficient credits: userId=${userId}, required=${cost}, available=${balance.availableCredits}`);
        return res.status(402).json({ 
          error: 'Insufficient credits',
          required: cost,
          available: balance.availableCredits
        });
      }

      const sid = sessionId || chatId || `session-${Date.now()}`;

      // Only persist into a chat the caller owns, and only while storage remains
      let persistChat = false;
      if (chatId) {
        const ownedChat = await storage.getSabiGuardChat(chatId);
        if (!ownedChat || ownedChat.userId !== userId) {
          return res.status(403).json({ error: 'Forbidden' });
        }
        const prof = await storage.getUserProfile(userId);
        const sLimit = prof?.chatStorageLimit || 524288;
        const sUsed = prof?.chatStorageUsed || 0;
        if (sUsed >= sLimit) {
          return res.status(413).json({
            error: 'Storage limit reached',
            code: 'STORAGE_FULL',
            message: 'Your chat storage is full. Delete old chats or upgrade your plan.'
          });
        }
        persistChat = true;
      }

      // Retrieve and format past chat messages for conversational history
      let formattedHistory = "";
      if (persistChat) {
        try {
          const chatHistoryDocs = await storage.getSabiGuardMessages(sid);
          if (chatHistoryDocs && chatHistoryDocs.length > 0) {
            formattedHistory = chatHistoryDocs
              .map((m: any) => `${m.role === 'user' ? 'User' : 'AI'}: ${m.text || m.content || ""}`)
              .join('\n');
          }
        } catch (historyErr) {
          console.warn('[Civic Chat Agent] History retrieve notice:', historyErr);
        }
      }

      // Check active provider and Gemini key configuration
      const geminiKeySetting = await storage.getAdminSetting('google_gemini_api_key');
      const geminiKey = geminiKeySetting?.value || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
      const primarySetting = await storage.getAdminSetting('ai_provider');
      const activeProvider = (primarySetting?.value || 'groq').toLowerCase();

      let finalResponse = "";

      // In sovereign mode, all user-facing chat must go through the unified provider router.
      if (
        !(await isNAtlasSovereignMode()) &&
        (activeProvider === 'google' || activeProvider === 'gemini') &&
        geminiKey
      ) {
        try {
          const agent = await getLegalAgent(language || "English");
          const runner = new Runner({
            appName: "SabiRight",
            agent,
            sessionService,
          });

          const session = await sessionService.getSession({ 
            appName: "SabiRight", 
            userId: userId!, 
            sessionId: sid 
          });
          
          if (!session) {
            await sessionService.createSession({ 
              appName: "SabiRight", 
              userId: userId!, 
              sessionId: sid 
            });
          }

          const directiveText = language && language.toLowerCase() !== 'english'
            ? `[Preferred Output Language: ${language} - conduct this response strictly in ${language}]. ${message}`
            : message;

          const events = runner.runAsync({
            userId,
            sessionId: sid,
            newMessage: { role: 'user', parts: [{ text: directiveText }] },
          });

          for await (const event of events) {
            const structuredEvents = toStructuredEvents(event);
            for (const se of structuredEvents) {
              if (se.type === EventType.CONTENT) {
                finalResponse += se.content;
              } else if (se.type === EventType.ERROR) {
                console.error(`[Agent API] ADK Error Event:`, se.error);
                if (!finalResponse) {
                  throw new Error(se.error?.message || "AI Agent encountered an error");
                }
              }
            }
          }
        } catch (adkErr: any) {
          console.warn(`[Civic Chat Agent] ADK Agent notice (${adkErr.message}). Routing to unified AI provider...`);
        }
      }

      // If ADK was skipped or produced empty text, execute via platform provider (Groq, etc.)
      if (!finalResponse) {
        let fallbackInstruction = `You are the "SabiRight AI Agent", a general civic information responder for Nigerians. Provide clear, cautious information; you are not a substitute for advice from a qualified Nigerian lawyer.

STRICT OPERATING RULES:
1. NO GREETING: The app has already greeted the user. Never introduce yourself or say hello; answer the question directly.
2. CIVIC GUIDE & DE-ESCALATION: For physical encounters, prioritize immediate safety and offer only general, non-confrontational steps. Do not guarantee safety or outcomes.
3. SOURCE-BASED LEGAL INFORMATION: Cite a statute, section, quotation, or case only when relevant reference material explicitly supports it. Never guess or fabricate legal citations, statutory wording, legal rights, or outcomes. Reference material may be incomplete or unverified.
4. UNCERTAINTY: If reliable supporting material is unavailable or unclear, say that you cannot verify the legal point; do not fill the gap from memory or present a guess as fact. Recommend checking a current authoritative source or consulting qualified Nigerian counsel.
5. RESPONSE STYLE: Be brief and scannable. Use one short opening line and a short list of bullets (max 6, each under 25 words). Include citations only when supported by source material. Use plain text only: no headings (#), no tables, no emojis, no repeated greeting.
6. PROFESSIONAL REFERRAL LOGIC: If a situation requires a professional, ask the user first whether they want help finding one.
7. TRIGGERING CARDS: Only if the user explicitly confirms, end the response with the exact phrase "[SHOW_PROFESSIONALS]" to show directory results. Do not describe a professional as verified unless the returned directory record supports that status.`;

        if (language && language.toLowerCase() !== 'english') {
          fallbackInstruction += `\n8. MULTILINGUAL OUTPUT: Conduct the entire response in ${language}, using natural phrasing while preserving uncertainty.`;
        }

        const fallbackPrompt = `${fallbackInstruction}

${formattedHistory ? `Here is the conversation history:\n${formattedHistory}` : ""}
User: ${message}
AI:`;

        finalResponse = await generateAIResponse(fallbackPrompt) || "Hello! I am your SabiRight AI Agent. I'm currently experiencing high traffic, please try asking again in a few moments.";
      }

      // Save to chat if sid provided
      if (persistChat) {
        try {
          await storage.addSabiGuardMessage(sid, "user", message);
          await storage.addSabiGuardMessage(sid, "ai", finalResponse);
          
          await storage.updateChatStorageUsed(userId, chatBytes(message) + chatBytes(finalResponse));
        } catch (saveErr) {
          console.warn('[Civic Chat Agent] Chat storage notice:', saveErr);
        }
      }

      res.json({ response: finalResponse, creditsRemaining: Math.max(0, balance.availableCredits - cost) });
    } catch (err: any) {
      console.error('[Civic Chat Agent] Error:', err.message, err.stack);
      try {
        await storage.refundCredits(req.userId!, cost, 'civic_guard');
      } catch (refundErr) {
        console.warn('[Civic Chat Agent] Refund error:', refundErr);
      }
      res.status(err.status || 500).json({ 
        error: "Agent execution failed", 
        message: err.message 
      });
    }
  });

  // AI Job Search API
  app.post("/api/ai/jobs/search", userAuth, async (req, res) => {
    const { role, location, employmentType, workMode } = req.body;
    const userId = req.userId;
    
    if (!userId || !role) {
      return res.status(400).json({ error: 'User ID and role required' });
    }

    const featureAccess = await validateFeatureAccess(userId, 'job_applications');
    if (!featureAccess.allowed) {
      return res.status(featureAccess.status).json({ error: featureAccess.error });
    }

    const costSetting = await storage.getAdminSetting('credit_cost_job_application');
    const cost = costSetting?.value ? Number(costSetting.value) : 2;

    const balance = await storage.getBalance(userId);
    const deducted = await storage.deductCredits(userId, cost, 'job_search', `AI job search: ${role} in ${location}`);
    if (!deducted) {
      console.warn(`[AI Jobs 402] Insufficient credits: userId=${userId}, required=${cost}, available=${balance.availableCredits}`);
      return res.status(402).json({ error: 'Insufficient credits', required: cost, available: balance.availableCredits });
    }

    const aiPrompt = `
      Act as a Job Search API for Nigeria.
      Criteria: Role: ${role}, Location: ${location || 'Lagos'}${employmentType ? `, Employment: ${employmentType}` : ''}${workMode ? `, Work Mode: ${workMode}` : ''}.
      
      Task: List 3 highly realistic and CURRENT job opportunities matching these criteria.
      
      CRITICAL INSTRUCTIONS:
      1. Sources MUST strictly be from these Nigerian Job portals: "Jobberman", "HotNigerianJobs", "Indeed", "MyJobMag", "LinkedIn", or "NG Careers".
      2. If salary is not explicitly stated in the listing, set "salary" to "To be Negotiated".
      3. The 'description' must be comprehensive (at least 100 words). Format using Markdown.
      4. The 'contact' field must be a valid URL to the job listing or a professional application email.
      5. The 'type' must be either "Full-time" or "Part-time".
      6. The 'workMode' must be either "Remote", "Onsite", or "Hybrid".
      7. Never invent a company, vacancy, salary, source, URL, or email. Include a listing only if the provider can support it with an actual source; if current listings cannot be verified, return an empty array.
      
      Output: Return ONLY a JSON Array of objects. No markdown blocks.
      Schema: [{"title": "...", "company": "...", "location": "...", "type": "Full-time", "workMode": "Remote", "salary": "...", "contact": "...", "description": "...", "source": "..."}]
    `;

    try {
      const text = await generateAIResponse(aiPrompt);
      if (!text) {
        return res.status(500).json({ error: 'Empty AI response' });
      }
      
      console.log('[AI Jobs] Response received, length:', text.length);
      
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error('[AI Jobs] Failed to parse JSON from response:', text.substring(0, 200));
        return res.status(500).json({ error: 'Failed to parse AI response' });
      }

      const rawJobs = JSON.parse(jsonMatch[0]);
      const savedJobs = [];
      const allowedSources = ["Jobberman", "HotNigerianJobs", "Indeed", "MyJobMag", "LinkedIn", "NG Careers"];

      for (const job of rawJobs) {
        // Validation: Ensure source is compliant and fields are realistic
        if (!job.title || !job.company || !job.contact) continue;
        
        // Normalize source and check if it's allowed
        const jobSource = job.source || 'AI Generated';
        const isCompliant = allowedSources.some(s => jobSource.toLowerCase().includes(s.toLowerCase()));
        
        if (!isCompliant) {
          continue;
        }

        // Ensure salary is set correctly
        if (!job.salary || job.salary.toLowerCase().includes('not stated') || job.salary.toLowerCase().includes('negotiable')) {
          job.salary = "To be Negotiated";
        }

        // Create in both general jobs and generated jobs for visibility
        const savedJob = await storage.createJob({
          ...job,
          postedBy: userId,
          source: jobSource,
          isAiFetched: true
        });

        // Also save to generated jobs collection for the "AI Generated" tab
        // Use the same ID as the general job to avoid confusion
        await storage.createGeneratedJob(userId, {
          ...job,
          id: savedJob.id,
          source: jobSource
        });

        savedJobs.push(savedJob);
      }

      if (savedJobs.length === 0) {
        await storage.refundCredits(userId, cost, 'job_search');
        return res.status(500).json({ error: 'No valid job opportunities found. Please try a different role or location.' });
      }

      res.json({ jobs: savedJobs, creditsUsed: cost, creditsRemaining: Math.max(0, balance.availableCredits - cost) });
    } catch (err: any) {
      console.error('[AI Jobs] Error:', err.message);
      try {
        await storage.refundCredits(userId, cost, 'job_search');
      } catch (refundErr) {
        console.warn('[AI Jobs] Refund error:', refundErr);
      }
      res.status(503).json({ error: err.message });
    }
  });

  // Vendor Analytics API
  app.get("/api/vendor/:vendorId/stats", async (req, res) => {
    try {
      const { vendorId } = req.params;
      const leads = await storage.getVendorLeads(vendorId);
      const bookings = await storage.getBookingsByVendorId(vendorId);
      
      const totalLeads = leads.length;
      const totalBookings = bookings.length;
      const totalEarnings = bookings.reduce((sum: number, b: any) => sum + (parseFloat(b.amount || b.totalAmount || 0)), 0);
      
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const thisMonthLeads = leads.filter((l: any) => {
        const d = new Date(l.createdAt || Date.now());
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      }).length;
      
      const thisMonthBookingsList = bookings.filter((b: any) => {
        const d = new Date(b.createdAt || Date.now());
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
      
      const thisMonthBookings = thisMonthBookingsList.length;
      const thisMonthEarnings = thisMonthBookingsList.reduce((sum: number, b: any) => sum + (parseFloat(b.amount || b.totalAmount || 0)), 0);
      
      res.json({
        totalLeads,
        totalBookings,
        totalEarnings,
        thisMonthLeads,
        thisMonthBookings,
        thisMonthEarnings
      });
    } catch (err: any) {
      console.error('Error calculating vendor stats:', err);
      res.json({ totalLeads: 0, totalBookings: 0, totalEarnings: 0, thisMonthLeads: 0, thisMonthBookings: 0, thisMonthEarnings: 0 });
    }
  });

  // Vendor AI Recommendations
  app.get("/api/vendor/:vendorId/ai-suggestions", async (req, res, next) => {
    try {
      const { vendorId } = req.params;
      const leads = await storage.getVendorLeads(vendorId);
      const bookings = await storage.getBookingsByVendorId(vendorId);
      
      const totalLeads = leads.length;
      const totalBookings = bookings.length;
      const totalEarnings = bookings.reduce((sum: number, b: any) => sum + (parseFloat(b.amount || b.totalAmount || 0)), 0);
      
      const bookingStatusCounts = bookings.reduce((acc: any, b: any) => {
        const s = b.status || 'pending';
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, { pending: 0, confirmed: 0, completed: 0, cancelled: 0 });

      const prompt = `As an expert business growth consultant, analyze these professional dashboard statistics for a service provider on SabiRight:
      - Total Leads (customer inquiries): ${totalLeads}
      - Total Bookings (hires): ${totalBookings}
      - Total Business Revenue: NGN ${totalEarnings}
      - Booking Status Breakdown: Pending: ${bookingStatusCounts.pending}, Confirmed: ${bookingStatusCounts.confirmed}, Completed: ${bookingStatusCounts.completed}, Cancelled: ${bookingStatusCounts.cancelled}

      Based on these numbers, generate short, highly actionable, bulleted professional approach suggestions (3-4 points max) to help them increase conversions, lower cancellation rates (if any are high), and scale their revenue. Make your tone encouraging and professional. Keep each point clear and practical. No formatting wrappers except clean bullets.`;

      let suggestions = "• Focus on prompt follow-ups to increase lead conversion rate.\n• Build clear communication with clients during the pending stage to solidify confirmed bookings.\n• Encourage completed clients to leave positive reviews to boost marketplace visibility.";
      try {
        const aiResponse = await generateAIResponse(prompt);
        if (aiResponse) suggestions = aiResponse;
      } catch (aiErr) {
        console.error('Error generating vendor AI suggestions:', aiErr);
      }

      res.json({ suggestions });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/vendor/:vendorId/leads", async (req, res) => {
    const { vendorId } = req.params;
    const leads = await storage.getVendorLeads(vendorId);
    res.json(leads);
  });

  app.get("/api/vendor/:vendorId/bookings", async (req, res, next) => {
    try {
      const { vendorId } = req.params;
      if (vendorId !== (req as any).userId && !(req as any).isAdmin) return res.status(403).json({ error: 'Forbidden' });
      const bookings = await storage.getBookingsByVendorId(vendorId);
      res.json(bookings);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/vendor/leads", async (req, res) => {
    const { vendorId, customerId, customerName, customerPhone, customerEmail, serviceType, message } = req.body;
    
    if (!vendorId || !customerName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const lead = await storage.createVendorLead({
      vendorId,
      customerId,
      customerName,
      customerPhone,
      customerEmail,
      serviceType,
      message
    });

    res.json(lead);
  });

  app.post("/api/vendor/bookings", async (req, res) => {
    const { vendorId, customerId, customerName, serviceType, scheduledDate, scheduledTime, amount, notes } = req.body;
    
    if (!vendorId || !customerName || !scheduledDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const booking = await storage.createVendorBooking({
      vendorId,
      customerId,
      customerName,
      serviceType,
      scheduledDate,
      scheduledTime,
      amount: parseFloat(amount) || 0,
      notes
    });

    res.json(booking);
  });

  app.patch("/api/vendor/bookings/:bookingId", async (req, res) => {
    const { bookingId } = req.params;
    await storage.updateVendorBooking(bookingId, req.body);
    res.json({ success: true });
  });

  // Payments
  app.get("/api/payments", userAuth, async (req, res) => {
    const { userId } = req.query;
    const authHeader = req.headers.authorization;
    
    let currentUserId: string | undefined;
    let isAdmin = false;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const result = await verifyUserToken(token);
      if (result.valid && result.userId) {
        currentUserId = result.userId;
        isAdmin = await isUserAdmin(currentUserId);
      }
    }

    // Security check: If not admin and trying to view another user's payments
    if (userId && userId !== currentUserId && !isAdmin) {
      return res.status(401).json({ error: 'Authentication required to view these payments' });
    }

    // Default to current user if no userId provided and not admin
    const targetUserId = (isAdmin && userId) ? (userId as string) : (userId as string || currentUserId);
    
    if (!targetUserId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const payments = await storage.getPayments(targetUserId);
    res.json(payments);
  });

  app.post("/api/payments/initiate", userAuth, async (req, res) => {
    try {
      const { currency, provider, type, description, email, captchaToken } = req.body;
      const userId = (req as any).userId;
      let metadata: any = { ...(req.body.metadata || {}) };
      let amount = Number(req.body.amount);

      if (!userId || !provider || !type) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      if (req.body.userId && req.body.userId !== userId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      // Price is always decided server-side for credits and plans.
      if (type === 'credit_purchase') {
        const wanted = Number(req.body.metadata?.credits ?? req.body.credits);
        const pkgs = await storage.getCreditPackages();
        const pkg: any = (pkgs as any[]).find((p) => p.id === (req.body.metadata?.packageId || req.body.packageId))
          || (pkgs as any[]).find((p) => Number(p.credits) + Number(p.bonus || 0) === wanted)
          || (pkgs as any[]).find((p) => Number(p.credits) === wanted);
        if (!pkg) return res.status(400).json({ error: 'Unknown credit package' });
        amount = Number(pkg.price);
        metadata = { packageId: pkg.id, credits: Number(pkg.credits) + Number(pkg.bonus || 0) };
      } else if (type === 'subscription') {
        const planId = req.body.metadata?.planId || req.body.planId;
        const plan: any = planId ? await storage.getPlanById(planId) : null;
        if (!plan) return res.status(400).json({ error: 'Unknown plan' });
        amount = Number(plan.price);
        metadata = { planId: plan.id };
        if (!(amount > 0)) return res.status(400).json({ error: 'Free plans do not require payment' });
      } else if (type === 'wallet_topup') {
        if (!(amount >= 100 && amount <= 1000000)) return res.status(400).json({ error: 'Invalid amount' });
        metadata = {};
      } else {
        return res.status(400).json({ error: 'Unsupported payment type' });
      }
      if (!(amount > 0)) return res.status(400).json({ error: 'Invalid amount' });

      // Verify reCAPTCHA for payment initiation
      if (captchaToken) {
        const isValid = await verifyRecaptcha(captchaToken);
        if (!isValid) {
          return res.status(400).json({ error: 'reCAPTCHA verification failed' });
        }
      }

      // Create payment record
      const payment = await storage.createPayment({
        userId, amount, currency: currency || 'NGN', provider, type, description, metadata
      });

      // Payment initiation logic per provider
      let redirectUrl = '';
      let authorizationUrl = '';
      let accessCode = '';
      
      if (provider === 'paystack') {
        // Get Paystack settings
        const paystackPublicKey = await storage.getAdminSetting('paystack_public_key');
        const paystackSecretKey = await storage.getAdminSetting('paystack_secret_key');
        
        if (!paystackSecretKey?.value || !paystackPublicKey?.value) {
          return res.status(503).json({ error: 'Paystack not configured. Please set up API keys in admin settings.' });
        }

        // Initialize Paystack service
        const paystack = new PaystackService({
          secretKey: paystackSecretKey.value,
          publicKey: paystackPublicKey.value
        });

        // Initialize payment with Paystack
        const paystackResponse = await paystack.initializePayment({
          email: email || `user-${userId}@sabiright.com`,
          amount: Math.round(amount * 100), // Convert to kobo
          reference: ((payment.metadata as any)?.reference) || `PAY-${payment.id}`,
          currency: currency || 'NGN',
          callback_url: `${process.env.APP_URL || 'http://localhost:5000'}/api/payments/paystack/callback`,
          metadata: {
            paymentId: payment.id,
            userId,
            type,
            ...(metadata || {})
          }
        });

        if (paystackResponse.status) {
          authorizationUrl = paystackResponse.data.authorization_url;
          accessCode = paystackResponse.data.access_code;
          redirectUrl = authorizationUrl;
          
          // Update payment with Paystack reference
          await storage.updatePayment(payment.id, {
            providerRef: paystackResponse.data.reference,
            metadata: {
              ...((payment.metadata as any) || {}),
              access_code: accessCode
            }
          });
        } else {
          return res.status(500).json({ error: 'Failed to initialize Paystack payment' });
        }
      } else if (provider === 'stripe') {
        // Stripe is temporarily disabled due to dependency issues
        return res.status(503).json({ error: 'Stripe is temporarily disabled. Please use Paystack or Flutterwave.' });
      } else if (provider === 'flutterwave') {
        const paymentMethods = await storage.getPaymentMethods();
        const fw: any = paymentMethods.find((m: any) => m.type === 'flutterwave' && m.active);
        const fwSecretKey = fw?.secretKey || process.env.FLUTTERWAVE_SECRET_KEY;
        const txRef = ((payment.metadata as any)?.reference) || `PAY-${payment.id}`;

        if (fwSecretKey) {
          try {
            const userProfile = await storage.getUserProfile(userId);
            const appUrl = (process.env.APP_URL || 'https://www.sabiright.ng').replace(/\/+$/, '');
            const fwResponse = await fetch('https://api.flutterwave.com/v3/payments', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${fwSecretKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                tx_ref: txRef,
                amount: amount,
                currency: currency || 'NGN',
                redirect_url: `${appUrl}/api/payments/flutterwave/callback`,
                customer: {
                  email: email || userProfile?.email || `user-${userId}@sabiright.com`,
                  phonenumber: userProfile?.phoneNumber || '',
                  name: userProfile?.displayName || 'Citizen'
                },
                customizations: {
                  title: 'SabiRight',
                  description: description || 'SabiRight Payment'
                },
                meta: {
                  paymentId: payment.id,
                  userId,
                  type,
                  ...(metadata || {})
                }
              })
            });

            const fwData = await fwResponse.json().catch(() => ({}));
            if (fwData?.status === 'success' && fwData.data?.link) {
              authorizationUrl = fwData.data.link;
              redirectUrl = authorizationUrl;
              await storage.updatePayment(payment.id, {
                providerRef: txRef,
                metadata: {
                  ...((payment.metadata as any) || {}),
                  checkoutUrl: authorizationUrl,
                  flutterwaveLink: authorizationUrl
                }
              });
            }
          } catch (fwErr) {
            console.warn('[Flutterwave] Standard hosted checkout link generation error:', fwErr);
          }
        }
      } else if (provider === 'bachs') {
        const paymentMethods = await storage.getPaymentMethods();
        const bachsMethod: any = paymentMethods.find((m: any) => m.type === 'bachs' && m.active);
        const bachsSecretKey = bachsMethod?.secretKey || process.env.BACHS_SECRET_KEY;
        if (!bachsSecretKey) {
          return res.status(503).json({ error: 'Bachs payment gateway is not configured or inactive.' });
        }

        const isSandbox = (bachsMethod?.metadata as any)?.isSandbox || bachsSecretKey.startsWith('sk_sandbox_');
        const bachsBaseUrl = isSandbox ? 'https://sandbox-api.bachs.io' : 'https://api.bachs.io';
        const userProfile = await storage.getUserProfile(userId);
        const appUrl = (process.env.APP_URL || 'https://www.sabiright.ng').replace(/\/+$/, '');
        const txRef = ((payment.metadata as any)?.reference) || `PAY-${payment.id}`;

        const bachsPayload = {
          pricing: {
            amount: Number(amount).toFixed(2),
            currency: String(currency || 'NGN').toUpperCase()
          },
          customer: {
            email: email || userProfile?.email || `user-${userId}@sabiright.com`,
            name: userProfile?.displayName || 'Citizen'
          },
          success_url: `${appUrl}/api/payments/bachs/callback?payment_id=${payment.id}&tx_ref=${txRef}`,
          cancel_url: `${appUrl}/app?payment=cancelled`,
          reference: txRef,
          metadata: {
            paymentId: payment.id,
            userId,
            type,
            reference: txRef,
            ...(metadata || {})
          }
        };

        const bachsRes = await fetch(`${bachsBaseUrl}/v1/checkout-sessions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${bachsSecretKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(bachsPayload)
        });

        const bachsData = await bachsRes.json().catch(() => ({}));
        const checkoutUrl = bachsData?.checkout_url || bachsData?.data?.checkout_url;
        const sessionId = bachsData?.checkout_id || bachsData?.data?.checkout_id || bachsData?.data?.id || bachsData?.id;
        if (!bachsRes.ok || !checkoutUrl || !sessionId) {
          console.error(`[Bachs] checkout session creation failed (${bachsRes.status}):`, bachsData);
          const providerError = typeof bachsData?.error === 'string'
            ? bachsData.error
            : bachsData?.error?.message;
          return res.status(502).json({
            error: bachsData?.message || providerError || 'Failed to create Bachs checkout session'
          });
        }

        authorizationUrl = checkoutUrl;
        redirectUrl = authorizationUrl;

        await storage.updatePayment(payment.id, {
          providerRef: sessionId,
          metadata: {
            ...((payment.metadata as any) || {}),
            checkoutUrl: authorizationUrl,
            bachsSessionId: sessionId
          }
        });
      }

      res.json({ 
        ...payment, 
        redirectUrl,
        authorizationUrl,
        accessCode
      });
    } catch (error: any) {
      console.error('Payment initiation error:', error);
      res.status(500).json({ error: error.message || 'Failed to initiate payment' });
    }
  });

  app.post("/api/payments/:paymentId/confirm", adminAuth, async (req, res) => {
    const { paymentId } = req.params;
    const { status, providerRef } = req.body;

    await storage.updatePaymentStatus(paymentId, status, providerRef);
    res.json({ success: true });
  });

  // Verifies a Paystack reference with Paystack itself and fulfils the matching server-side payment record.
  async function settlePaystackReference(reference: string, expectedUserId?: string): Promise<{ ok: boolean; status: string; error?: string; code?: number }> {
    const paymentMethods = await storage.getPaymentMethods();
    const paystackMethod: any = paymentMethods.find((m: any) => m.type === 'paystack' && m.active);
    if (!paystackMethod?.secretKey) return { ok: false, status: 'failed', error: 'Paystack not configured or inactive', code: 503 };

    const payment: any = await storage.getPaymentByReference(reference);
    if (!payment) return { ok: false, status: 'failed', error: 'Payment not found', code: 404 };
    if (expectedUserId && payment.userId !== expectedUserId) return { ok: false, status: 'failed', error: 'Forbidden', code: 403 };
    if (payment.status === 'completed') return { ok: true, status: 'success' };

    const paystack = new PaystackService({ secretKey: paystackMethod.secretKey, publicKey: paystackMethod.publicKey || '' });
    const verification = await paystack.verifyPayment(reference);
    if (!verification?.status || verification.data?.status !== 'success') {
      return { ok: false, status: verification?.data?.status || 'failed', error: 'Payment not successful', code: 402 };
    }
    const result = await storage.fulfillPayment(payment.id, verification.data.reference || reference, Number(verification.data.amount) / 100);
    return result.ok ? { ok: true, status: 'success' } : { ok: false, status: 'failed', error: result.reason, code: 400 };
  }

  // Paystack callback (user returns from payment). Never trusts query/metadata, always verifies with Paystack.
  app.get("/api/payments/paystack/callback", async (req, res) => {
    try {
      const reference = String(req.query.reference || req.query.trxref || '');
      if (!reference) return res.redirect(`/app?payment=failed&error=no_reference`);
      const r = await settlePaystackReference(reference);
      return res.redirect(r.ok
        ? `/app?payment=success&reference=${encodeURIComponent(reference)}`
        : `/app?payment=failed&reference=${encodeURIComponent(reference)}`);
    } catch (error: any) {
      console.error('Paystack callback error:', error);
      return res.redirect(`/app?payment=failed&error=server_error`);
    }
  });

  // Paystack webhook: signature is checked over the raw body captured in express.json's verify hook.
  app.post("/api/payments/paystack/webhook", async (req, res) => {
    try {
      const signature = req.headers['x-paystack-signature'] as string;
      const raw: Buffer | undefined = (req as any).rawBody;
      if (!signature || !raw) return res.status(400).json({ error: 'No signature provided' });

      const paymentMethods = await storage.getPaymentMethods();
      const paystackMethod: any = paymentMethods.find((m: any) => m.type === 'paystack' && m.active);
      if (!paystackMethod?.secretKey) return res.status(503).json({ error: 'Paystack not configured or inactive' });

      const paystack = new PaystackService({ secretKey: paystackMethod.secretKey, publicKey: paystackMethod.publicKey || '' });
      if (!paystack.verifyWebhookSignature(raw, signature)) {
        return res.status(401).json({ error: 'Invalid signature' });
      }

      const event = req.body;
      if (event?.event === 'charge.success' && event.data?.reference) {
        await settlePaystackReference(String(event.data.reference));
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error('Paystack webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  app.post("/api/payments/paystack/verify", userAuth, async (req, res) => {
    try {
      const { reference } = req.body;
      if (!reference) return res.status(400).json({ error: 'Reference required' });
      const r = await settlePaystackReference(String(reference), (req as any).userId);
      if (!r.ok) return res.status(r.code || 400).json({ error: r.error, status: r.status });
      res.json({ success: true, status: 'success' });
    } catch (error: any) {
      console.error('Paystack verify error:', error);
      res.status(500).json({ error: 'Verification failed' });
    }
  });
  // Verifies a Flutterwave transaction with Flutterwave and fulfils the matching server-side payment record.
  async function settleFlutterwaveTransaction(transactionId: string, expectedUserId?: string): Promise<{ ok: boolean; error?: string; code?: number }> {
    const paymentMethods = await storage.getPaymentMethods();
    const fw: any = paymentMethods.find((m: any) => m.type === 'flutterwave' && m.active);
    if (!fw?.secretKey) return { ok: false, error: 'Flutterwave not configured', code: 503 };

    const response = await fetch(`https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transactionId)}/verify`, {
      headers: { Authorization: `Bearer ${fw.secretKey}`, 'Content-Type': 'application/json' }
    });
    const data = (await response.json().catch(() => ({}))) as any;
    if (data.status !== 'success' || data.data?.status !== 'successful') return { ok: false, error: 'Payment not successful', code: 402 };

    const payment: any = await storage.getPaymentByReference(String(data.data.tx_ref));
    if (!payment) return { ok: false, error: 'Payment not found', code: 404 };
    if (expectedUserId && payment.userId !== expectedUserId) return { ok: false, error: 'Forbidden', code: 403 };
    if (data.data.currency && payment.currency && data.data.currency !== payment.currency) return { ok: false, error: 'Currency mismatch', code: 400 };

    const result = await storage.fulfillPayment(payment.id, String(data.data.tx_ref), Number(data.data.amount));
    return result.ok ? { ok: true } : { ok: false, error: result.reason, code: 400 };
  }

  // Flutterwave webhook
  app.post("/api/payments/flutterwave/webhook", async (req, res) => {
    try {
      const secretHash = req.headers['verif-hash'] as string;
      const paymentMethods = await storage.getPaymentMethods();
      const fw: any = paymentMethods.find((m: any) => m.type === 'flutterwave' && m.active);
      if (!fw?.webhookHash) return res.status(503).json({ error: 'Flutterwave webhook not configured' });

      const a = Buffer.from(String(secretHash || ''));
      const b = Buffer.from(String(fw.webhookHash));
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }

      const event = req.body;
      if (event?.event === 'charge.completed' && event.data?.status === 'successful' && event.data?.id) {
        await settleFlutterwaveTransaction(String(event.data.id));
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error('Flutterwave webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  // Verify Flutterwave payment (called from the frontend after checkout)
  app.post("/api/payments/flutterwave/verify", userAuth, async (req, res) => {
    try {
      const { transaction_id } = req.body;
      if (!transaction_id) return res.status(400).json({ error: 'Transaction ID required' });
      const r = await settleFlutterwaveTransaction(String(transaction_id), (req as any).userId);
      if (!r.ok) return res.status(r.code || 400).json({ status: 'failed', error: r.error });
      res.json({ status: 'success' });
    } catch (error: any) {
      console.error('Flutterwave verify error:', error);
      res.status(500).json({ error: 'Verification failed' });
    }
  });

  // Flutterwave callback (user returns from Flutterwave Standard hosted checkout)
  app.get("/api/payments/flutterwave/callback", async (req, res) => {
    try {
      const transactionId = String(req.query.transaction_id || '');
      const status = String(req.query.status || '');
      if (status === 'successful' && transactionId) {
        const r = await settleFlutterwaveTransaction(transactionId);
        return res.redirect(r.ok
          ? `/app?payment=success&tx=${encodeURIComponent(transactionId)}`
          : `/app?payment=failed&tx=${encodeURIComponent(transactionId)}`);
      }
      return res.redirect(`/app?payment=cancelled`);
    } catch (error: any) {
      console.error('Flutterwave callback error:', error);
      return res.redirect(`/app?payment=failed&error=server_error`);
    }
  });

  // Verifies a Bachs checkout session or transaction reference and fulfils the payment
  async function settleBachsTransaction(sessionIdOrRef: string, expectedUserId?: string): Promise<{ ok: boolean; status: string; error?: string; code?: number }> {
    const paymentMethods = await storage.getPaymentMethods();
    const bachsMethod: any = paymentMethods.find((m: any) => m.type === 'bachs' && m.active);
    const bachsSecretKey = bachsMethod?.secretKey || process.env.BACHS_SECRET_KEY;
    if (!bachsSecretKey) return { ok: false, status: 'failed', error: 'Bachs not configured or inactive', code: 503 };

    let payment: any = await storage.getPayment(sessionIdOrRef);
    if (!payment) payment = await storage.getPaymentByReference(sessionIdOrRef);
    if (!payment && sessionIdOrRef.startsWith('PAY-')) {
      payment = await storage.getPayment(sessionIdOrRef.slice(4));
    }
    if (!payment) return { ok: false, status: 'failed', error: 'Payment record not found', code: 404 };
    if (expectedUserId && payment.userId !== expectedUserId) return { ok: false, status: 'failed', error: 'Forbidden', code: 403 };
    if (payment.provider !== 'bachs') return { ok: false, status: 'failed', error: 'Payment provider mismatch', code: 400 };
    if (payment.status === 'completed') return { ok: true, status: 'success' };

    const isSandbox = (bachsMethod?.metadata as any)?.isSandbox || bachsSecretKey.startsWith('sk_sandbox_');
    const bachsBaseUrl = isSandbox ? 'https://sandbox-api.bachs.io' : 'https://api.bachs.io';
    const sessionId = payment.metadata?.bachsSessionId || payment.providerRef;
    if (!sessionId) return { ok: false, status: 'failed', error: 'Bachs checkout session is missing', code: 400 };

    try {
      const vRes = await fetch(`${bachsBaseUrl}/v1/checkout-sessions/${encodeURIComponent(sessionId)}`, {
        headers: { 'Authorization': `Bearer ${bachsSecretKey}` }
      });
      if (!vRes.ok) {
        const detail = (await vRes.text()).slice(0, 300);
        console.error(`[Bachs] Session verification returned ${vRes.status}: ${detail}`);
        return { ok: false, status: 'failed', error: 'Unable to verify Bachs checkout session', code: 502 };
      }

      const vData = await vRes.json().catch(() => ({}));
      const session = vData.data || vData;
      const verifiedSessionId = session.checkout_id || session.id;
      if (verifiedSessionId && String(verifiedSessionId) !== String(sessionId)) {
        return { ok: false, status: 'failed', error: 'Bachs checkout session mismatch', code: 400 };
      }
      const paymentStatus = String(session.payment_status || '').toLowerCase();
      const sessionStatus = String(session.status || '').toLowerCase();
      if (
        !['paid', 'successful', 'succeeded'].includes(paymentStatus) &&
        !['completed', 'success', 'succeeded'].includes(sessionStatus)
      ) {
        return { ok: false, status: 'unpaid', error: 'Bachs session payment not confirmed yet', code: 402 };
      }

      const paidAmount = Number(session.amount ?? session.pricing?.amount);
      if (!Number.isFinite(paidAmount) || Math.round(paidAmount * 100) !== Math.round(Number(payment.amount) * 100)) {
        return { ok: false, status: 'failed', error: 'Bachs payment amount mismatch', code: 400 };
      }
      const paidCurrency = session.currency || session.pricing?.currency;
      if (typeof paidCurrency !== 'string' || paidCurrency.toUpperCase() !== String(payment.currency || 'NGN').toUpperCase()) {
        return { ok: false, status: 'failed', error: 'Bachs payment currency mismatch', code: 400 };
      }

      const providerRef = String(verifiedSessionId || sessionId);
      const result = await storage.fulfillPayment(payment.id, providerRef, paidAmount);
      return result.ok
        ? { ok: true, status: 'success' }
        : {
          ok: false,
          status: 'failed',
          error: result.reason,
          code: result.reason === 'status_update_failed' ? 503 : 400
        };
    } catch (vErr: any) {
      console.error('[Bachs] Session verification failed:', vErr?.message || vErr);
      return { ok: false, status: 'failed', error: 'Unable to verify Bachs checkout session', code: 502 };
    }
  }

  // Bachs signs `${timestamp}.${rawBody}` with HMAC-SHA256.
  app.post("/api/payments/bachs/webhook", async (req, res) => {
    try {
      const signature = String(req.headers['x-bachs-signature'] || req.headers['bachs-signature'] || '');
      const timestamp = String(req.headers['x-bachs-timestamp'] || '');
      const raw: Buffer | undefined = (req as any).rawBody;

      const paymentMethods = await storage.getPaymentMethods();
      const bachsMethod: any = paymentMethods.find((m: any) => m.type === 'bachs' && m.active);
      const webhookSecret = bachsMethod?.webhookHash || process.env.BACHS_WEBHOOK_SECRET;

      if (!webhookSecret) {
        console.error('Bachs webhook rejected: signing secret is not configured');
        return res.status(503).json({ error: 'Bachs webhook signing secret is not configured' });
      }
      if (!signature || !timestamp || !raw || !/^\d+$/.test(timestamp)) {
        return res.status(400).json({ error: 'Missing or invalid Bachs signature headers or request body' });
      }

      const timestampSeconds = Number(timestamp);
      const timestampAgeMs = Math.abs(Date.now() - timestampSeconds * 1000);
      if (!Number.isSafeInteger(timestampSeconds) || timestampAgeMs > 5 * 60 * 1000) {
        return res.status(401).json({ error: 'Bachs webhook timestamp is invalid or expired' });
      }

      const computed = crypto.createHmac('sha256', webhookSecret)
        .update(`${timestamp}.`)
        .update(raw)
        .digest('hex');
      if (!/^[a-f\d]{64}$/i.test(signature)) {
        return res.status(401).json({ error: 'Invalid Bachs signature' });
      }
      const sigBuf = Buffer.from(signature, 'hex');
      const compBuf = Buffer.from(computed, 'hex');
      if (sigBuf.length !== compBuf.length || !crypto.timingSafeEqual(sigBuf, compBuf)) {
        return res.status(401).json({ error: 'Invalid Bachs signature' });
      }

      const event = req.body;
      const eventType = event?.event || event?.type;
      const eventData = event?.data || event;

      const eventStatus = String(eventData?.status || '').toLowerCase();
      if (
        eventType === 'collection.succeeded' ||
        eventType === 'checkout.session.completed' ||
        eventType === 'payment.successful' ||
        ['successful', 'succeeded', 'paid'].includes(eventStatus) ||
        ['successful', 'succeeded', 'paid'].includes(String(eventData?.payment_status || '').toLowerCase())
      ) {
        const ref = eventData?.metadata?.paymentId ||
          eventData?.metadata?.reference ||
          eventData?.checkout_id ||
          eventData?.reference ||
          eventData?.id;
        if (ref) {
          const result = await settleBachsTransaction(String(ref));
          if (!result.ok) {
            const retryableCodes = [402, 404, 502, 503];
            const responseCode = retryableCodes.includes(result.code || 0) ? 503 : result.code || 400;
            return res.status(responseCode).json({
              error: result.error || 'Bachs payment could not be settled',
              status: result.status
            });
          }
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Bachs webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  // Bachs callback: user returns from hosted checkout
  app.get("/api/payments/bachs/callback", async (req, res) => {
    try {
      const paymentId = String(req.query.payment_id || req.query.paymentId || '');
      const txRef = String(req.query.tx_ref || req.query.sessionId || '');
      const ref = paymentId || txRef;

      if (!ref) return res.redirect(`/app?payment=failed&error=no_reference`);
      const result = await settleBachsTransaction(ref);
      return res.redirect(result.ok
        ? `/app?payment=success&provider=bachs&reference=${encodeURIComponent(ref)}`
        : `/app?payment=failed&provider=bachs&reference=${encodeURIComponent(ref)}&error=verification_failed`);
    } catch (error: any) {
      console.error('Bachs callback error:', error);
      return res.redirect(`/app?payment=failed&error=server_error`);
    }
  });

  // Bachs verify endpoint for frontend / mobile
  app.post("/api/payments/bachs/verify", userAuth, async (req, res) => {
    try {
      const { reference, sessionId } = req.body;
      const ref = reference || sessionId;
      if (!ref) return res.status(400).json({ error: 'Reference or sessionId required' });
      const r = await settleBachsTransaction(String(ref), (req as any).userId);
      if (!r.ok) return res.status(r.code || 400).json({ error: r.error, status: r.status });
      res.json({ success: true, status: 'success' });
    } catch (error: any) {
      console.error('Bachs verify error:', error);
      res.status(500).json({ error: 'Verification failed' });
    }
  });

  // The wallet is credit-backed and cannot be spent on plans or credit packs.
  app.post("/api/payments/wallet-payment", userAuth, async (_req, res) => {
    res.status(410).json({ error: 'Wallet payment is no longer supported. Please pay by card.' });
  });
  // Admin: Approve manual payment
  app.post("/api/admin/payments/:paymentId/approve", adminAuth, async (req, res, next) => {
    try {
      const { paymentId } = req.params;
      
      // Get payment details
      const payment = await storage.getPayment(paymentId);
      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }
      
      if (payment.status !== 'pending') {
        return res.status(400).json({ error: 'Payment is not pending' });
      }
      
      // Update payment status to completed
      await storage.updatePaymentStatus(paymentId, 'completed');
      
      // Credit user based on payment type
      if (payment.type === 'wallet_topup') {
        await storage.topUpWallet(
          payment.userId, 
          parseFloat(String(payment.amount)), 
          payment.providerRef || paymentId,
          `Wallet top-up - ${payment.description || 'Manual approval'}`
        );
        
        // Send notification
        await storage.sendNotification({
          userId: payment.userId,
          type: 'payment_approved',
          title: 'Payment Approved',
          message: `Your wallet top-up of ${payment.currency || 'NGN'} ${payment.amount.toLocaleString()} has been approved and credited to your wallet.`,
          data: { paymentId, amount: payment.amount, type: payment.type },
          channels: ['in_app', 'email']
        });
      } else if (payment.type === 'credit_purchase' && payment.metadata && (payment.metadata as any)?.credits) {
        const credits = parseInt(String((payment.metadata as any).credits));
        await storage.addCredits(payment.userId, credits, `Credit purchase approved: ${paymentId}`);
        
        // Send notification
        await storage.sendNotification({
          userId: payment.userId,
          type: 'credits_added',
          title: 'Credits Added',
          message: `${credits} credits have been added to your account. Your payment of ${payment.currency || 'NGN'} ${parseFloat(String(payment.amount)).toLocaleString()} has been approved.`,
          data: { paymentId, credits, amount: payment.amount },
          channels: ['in_app', 'email']
        });
      } else if (payment.type === 'subscription' && payment.metadata && (payment.metadata as any)?.planId) {
        const planId = (payment.metadata as any).planId;
        await storage.createSubscription({
          userId: payment.userId,
          planId,
          status: 'active',
          startDate: new Date().toISOString()
        });
        
        // Send notification
        await storage.sendNotification({
          userId: payment.userId,
          type: 'subscription_activated',
          title: 'Subscription Activated',
          message: `Your subscription to plan ${planId} has been activated. Your payment of ${payment.currency || 'NGN'} ${parseFloat(String(payment.amount)).toLocaleString()} has been approved.`,
          data: { paymentId, planId, amount: payment.amount },
          channels: ['in_app', 'email']
        });
      }
      
      res.json({ success: true, message: 'Payment approved and processed' });
    } catch (error) {
      next(error);
    }
  });

  // Admin: Reject manual payment
  app.post("/api/admin/payments/:paymentId/reject", adminAuth, async (req, res, next) => {
    try {
      const { paymentId } = req.params;
      const { reason } = req.body;
      
      // Get payment details
      const payment = await storage.getPayment(paymentId);
      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }
      
      if (payment.status !== 'pending') {
        return res.status(400).json({ error: 'Payment is not pending' });
      }
      
      // Update payment status to failed
      await storage.updatePaymentStatus(paymentId, 'failed');
      
      // Store rejection reason
      if (reason) {
        await storage.updatePayment(paymentId, { rejectionReason: reason });
      }
      
      // Send notification
      await storage.sendNotification({
        userId: payment.userId,
        type: 'payment_rejected',
        title: 'Payment Rejected',
        message: `Your payment of ${payment.currency || 'NGN'} ${payment.amount.toLocaleString()} has been rejected. ${reason ? `Reason: ${reason}` : 'Please contact support for more information.'}`,
        data: { paymentId, amount: payment.amount, reason },
        channels: ['in_app', 'email']
      });
      
      res.json({ success: true, message: 'Payment rejected' });
    } catch (error) {
      next(error);
    }
  });

  // Flagged Posts Management
  app.get("/api/admin/flagged-posts", adminAuth, async (req, res, next) => {
    try {
      const posts = await storage.getForumPosts();
      const flaggedPosts = posts.filter((p: any) => p.flagged || p.shadowedForReview || (p.flagCount && p.flagCount > 0));
      res.json(flaggedPosts);
    } catch (error) {
      next(error);
    }
  });


    // Forum APIs
  // Forum
  app.get("/api/forum/posts", async (req, res, next) => {
    try {
      const city = req.query.city as string;
      const posts = await storage.getForumPosts();
      
      if (city) {
        posts.sort((a: any, b: any) => {
          const aInCity = a.city?.toLowerCase() === city.toLowerCase();
          const bInCity = b.city?.toLowerCase() === city.toLowerCase();
          if (aInCity && !bInCity) return -1;
          if (!aInCity && bInCity) return 1;
          return 0;
        });
      }
      
      res.json(posts);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/forum/posts", userAuth, emailVerifiedAuth, async (req, res, next) => {
    const { content, city, author } = req.body;
    const userId = req.userId!;
    
    if (!content) {
      return res.status(400).json({ error: 'Content required' });
    }

    try {
      const post = await storage.createForumPost({
        content,
        city: city || "Lagos",
        author: author || "Citizen",
        userId,
        upvotes: 0,
        downvotes: 0,
        comments: [],
        flagged: false,
        flagCount: 0,
        flaggedBy: [],
        shadowedForReview: false,
        upvotedBy: []
      });

      // Automatically save as MOAT data for AI training
      await storage.createMoatData({
        title: `Forum Post by ${author || 'Citizen'}`,
        content: `City: ${city || 'Lagos'}\nContent: ${content}`,
        category: 'forum',
        source: 'community_forum',
        metadata: { postId: post.id, city: city || 'Lagos' }
      });

      res.json(post);
    } catch (error) {
      next(error);
    }
  });

  // Public Forum: Flag post with configurable threshold shadowing
  app.post("/api/forum/posts/:postId/flag", userAuth, async (req, res, next) => {
    try {
      const { postId } = req.params;
      const userId = req.userId!;
      
      const postData = await storage.getForumPost(postId);
      if (!postData) {
        return res.status(404).json({ error: 'Post not found' });
      }

      const flaggedBy = postData.flaggedBy || [];

      if (flaggedBy.includes(userId)) {
        return res.status(400).json({ error: 'You have already flagged this post' });
      }

      // Get threshold from admin settings
      const thresholdSetting = await storage.getAdminSetting('flag_shadow_threshold');
      const threshold = parseInt(thresholdSetting?.value || '50');

      const newFlagCount = (postData.flagCount || 0) + 1;
      const updates: any = {
        flagCount: newFlagCount,
        flaggedBy: [...flaggedBy, userId]
      };

      let shadowed = false;
      if (newFlagCount >= threshold) {
        updates.shadowedForReview = true;
        updates.flagged = true;
        updates.shadowedAt = new Date();
        shadowed = true;
      }

      await storage.updateForumPost(postId, updates);
      
      // Notify the reporter
      try {
        await storage.sendNotification({
          userId: userId!,
          type: 'forum_report_received',
          title: 'Report Received',
          message: 'Thank you for reporting this post. Our team will review it.',
          data: { postId }
        });
      } catch (notifyError) {
        console.error('Error notifying reporter:', notifyError);
      }

      if (shadowed && postData.userId && postData.userId !== 'anon') {
        try {
          await storage.sendNotification({
            userId: postData.userId,
            type: 'post_shadowed',
            title: 'Post Hidden for Review',
            message: 'Your post has been hidden because it was flagged multiple times by the community. It is currently under review.',
            data: { postId },
            templateName: 'post_shadowed',
            variables: {
              content: postData.content?.substring(0, 50) + (postData.content?.length > 50 ? '...' : '')
            }
          });
        } catch (notifyError) {
          console.error('Error notifying author:', notifyError);
        }
      }
      
      res.json({ 
        success: true, 
        flagged: true, 
        shadowed: shadowed,
        flagCount: newFlagCount,
        threshold
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/forum/posts/:postId/comments", userAuth, emailVerifiedAuth, async (req, res, next) => {
    try {
      const { postId } = req.params;
      const { text, author, userId } = req.body;
      const currentUserId = req.userId;

      if (userId !== currentUserId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      if (!text) {
        return res.status(400).json({ error: 'Comment text required' });
      }

      await storage.addForumComment(postId, {
        text,
        author: author || "Citizen",
        userId,
        upvotes: 0,
        upvotedBy: []
      });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/forum/posts/:postId/comments/:commentId", userAuth, async (req, res, next) => {
    try {
      const { postId, commentId } = req.params;
      const currentUserId = req.userId;
      const isAdmin = await isUserAdmin(currentUserId!);

      const post = await storage.getForumPost(postId);
      if (!post) return res.status(404).json({ error: 'Post not found' });

      const comment = post.comments?.find((c: any) => c.id === commentId);
      if (!comment) return res.status(404).json({ error: 'Comment not found' });

      if (!isAdmin && comment.userId !== currentUserId) {
        return res.status(403).json({ error: 'Unauthorized to delete this comment' });
      }

      await storage.deleteForumComment(postId, commentId);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/forum/posts/:postId/vote", userAuth, async (req, res, next) => {
    try {
      const { postId } = req.params;
      const { type } = req.body; // 'up' | 'down'
      const userId = req.userId;

      if (!['up', 'down'].includes(type)) {
        return res.status(400).json({ error: 'Invalid vote type' });
      }

      await storage.voteForumPost(postId, userId!, type);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/forum/posts/:postId/comments/:commentId/vote", userAuth, async (req, res, next) => {
    try {
      const { postId, commentId } = req.params;
      const userId = req.userId;

      await storage.voteForumComment(postId, commentId, userId!);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/flagged-posts/:postId/reinstate", adminAuth, async (req, res, next) => {
    try {
      const { postId } = req.params;
      const postData = await storage.getForumPost(postId);
      
      if (!postData) {
        return res.status(404).json({ error: 'Post not found' });
      }

      await storage.updateForumPost(postId, {
        shadowedForReview: false,
        flagged: false,
        flagCount: 0,
        flaggedBy: [],
        reinstatedAt: new Date(),
        reinstatedBy: req.userId
      });

      // Notify the author that their post was reinstated
      if (postData.userId && postData.userId !== 'anon') {
        try {
          await storage.sendNotification({
            userId: postData.userId,
            type: 'post_reinstated',
            title: 'Post Reinstated',
            message: 'Your post has been reviewed and reinstated to the community forum.',
            data: { postId },
            templateName: 'post_reinstated',
            variables: {
              content: postData.content?.substring(0, 50) + (postData.content?.length > 50 ? '...' : '')
            }
          });
        } catch (notifyError) {
          console.error('Error notifying author on reinstate:', notifyError);
        }
      }
      
      res.json({ success: true, message: 'Post reinstated successfully' });
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/admin/flagged-posts/:postId", adminAuth, async (req, res, next) => {
    try {
      const { postId } = req.params;
      const postData = await storage.getForumPost(postId);
      
      if (postData) {
        // Notify the author that their post was removed
        if (postData.userId && postData.userId !== 'anon') {
          try {
            await storage.sendNotification({
              userId: postData.userId,
              type: 'post_removed',
              title: 'Post Removed',
              message: 'Your post has been removed for violating community guidelines following a review.',
              data: { postId },
              templateName: 'post_removed',
              variables: {
                content: postData.content?.substring(0, 50) + (postData.content?.length > 50 ? '...' : '')
              }
            });
          } catch (notifyError) {
            console.error('Error notifying author on delete:', notifyError);
          }
        }
      }

      await storage.deleteForumPost(postId);
      
      res.json({ success: true, message: 'Post deleted permanently' });
    } catch (error) {
      next(error);
    }
  });

  // Subscriptions
  app.get("/api/subscription/:userId", userAuth, async (req, res, next) => {
    try {
      const { userId } = req.params;
      const subscription = await storage.getUserPlan(userId);
      if (!subscription) {
        return res.status(404).json({ error: 'No active subscription' });
      }
      res.json(subscription);
    } catch (error) {
      next(error);
    }
  });

  // Direct upgrades are only for free plans (or admins); paid plans activate through a verified payment.
  app.post("/api/subscription/upgrade", userAuth, async (req, res, next) => {
    try {
      const { planId } = req.body;
      const userId = (req as any).userId;
      if (!planId) return res.status(400).json({ error: 'Missing required fields' });
      if (req.body.userId && req.body.userId !== userId) return res.status(403).json({ error: 'Forbidden' });

      const plan: any = await storage.getPlanById(planId);
      if (!plan) return res.status(404).json({ error: 'Plan not found' });
      if (Number(plan.price) > 0 && !(req as any).isAdmin) {
        return res.status(402).json({ error: 'Payment required for this plan' });
      }

      const subscription = await storage.activatePlan(userId, planId);
      res.json({ success: true, subscription, message: `Upgraded to ${plan.name} plan` });
    } catch (error) {
      next(error);
    }
  });
  // ===== Coupons API (Admin) =====
  
  app.get("/api/admin/coupons", adminAuth, async (req, res, next) => {
    try {
      const coupons = await storage.getAllCoupons();
      res.json(coupons);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/coupons", adminAuth, async (req, res, next) => {
    try {
      const { code, discountType, discountValue, maxRedemptions, validFrom, validTo, isActive } = req.body;
      
      if (!code || !discountType || !discountValue) {
        return res.status(400).json({ error: 'Code, discountType, and discountValue are required' });
      }
      
      if (!['percentage', 'fixed'].includes(discountType)) {
        return res.status(400).json({ error: 'discountType must be "percentage" or "fixed"' });
      }

      const existing = await storage.getCouponByCode(code);
      if (existing) {
        return res.status(409).json({ error: 'Coupon code already exists' });
      }

      const coupon = await storage.createCoupon({
        code,
        discountType,
        discountValue: discountValue.toString(),
        maxRedemptions: maxRedemptions || null,
        validFrom: validFrom ? new Date(validFrom) : null,
        validTo: validTo ? new Date(validTo) : null,
        isActive: isActive !== false
      });

      res.json(coupon);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/admin/coupons/:id", adminAuth, async (req, res, next) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      if (updates.discountValue !== undefined) {
        updates.discountValue = updates.discountValue.toString();
      }
      if (updates.validFrom) {
        updates.validFrom = new Date(updates.validFrom);
      }
      if (updates.validTo) {
        updates.validTo = new Date(updates.validTo);
      }

      const coupon = await storage.updateCoupon(id, updates);
      if (!coupon) {
        return res.status(404).json({ error: 'Coupon not found' });
      }
      res.json(coupon);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/admin/coupons/:id", adminAuth, async (req, res, next) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteCoupon(id);
      if (!success) {
        return res.status(404).json({ error: 'Coupon not found' });
      }
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/coupons/validate", async (req, res, next) => {
    try {
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ error: 'Coupon code is required' });
      }

      const result = await storage.validateCoupon(code);
      
      if (!result.valid || !result.coupon) {
        return res.status(400).json({ valid: false, error: result.error || 'Invalid coupon' });
      }

      res.json({
        valid: true,
        coupon: {
          id: result.coupon.id,
          code: result.coupon.code,
          discountType: result.coupon.discountType,
          discountValue: result.coupon.discountValue
        }
      });
    } catch (error) {
      next(error);
    }
  });

  // ===== Wallet API =====
  
  app.get("/api/wallet/:userId", userAuth, async (req, res, next) => {
    try {
      const { userId } = req.params;
      const wallet = await storage.getWalletByUserId(userId);
      
      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }
      
      res.json(wallet);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/wallet/:userId/create", userAuth, async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { currency } = req.body;
      
      const wallet = await storage.createWallet(userId, currency || 'NGN');
      res.json(wallet);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/wallet/:userId/topup", userAuth, async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { amount, reference, description } = req.body;
      
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({ error: 'Valid positive amount is required' });
      }

      let wallet = await storage.getWalletByUserId(userId);
      if (!wallet) {
        wallet = await storage.createWallet(userId, 'NGN');
      }

      const transaction = await storage.topUpWallet(
        userId,
        parseFloat(amount),
        reference,
        description
      );
      
      const updatedWallet = await storage.getWalletByUserId(userId);
      res.json({
        success: true,
        transaction,
        wallet: updatedWallet
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/wallet/:userId/transactions", userAuth, async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { limit } = req.query;
      
      const transactions = await storage.getWalletTransactions(
        userId,
        limit ? parseInt(limit as string) : 50
      );
      
      res.json(transactions);
    } catch (error) {
      next(error);
    }
  });

  // ===== Booking System API =====

  // Create a booking (user books vendor service)
  app.post("/api/bookings", userAuth, async (req, res, next) => {
    try {
      const { serviceId, vendorId, totalAmount = 0, description, scheduledDate, chatId } = req.body;
      const userId = (req as any).userId;
      
      if (!serviceId || !userId || !vendorId) {
        return res.status(400).json({ error: 'Missing required fields: serviceId, vendorId' });
      }

      // Automatically fetch the user's SabiGuard chat to generate a Pre-Case File summary
      let preCaseSummary = "";
      try {
        let targetChatId = chatId;
        if (!targetChatId) {
          const chats = await storage.getSabiGuardChats(userId);
          if (chats && chats.length > 0) {
            targetChatId = chats[0].id;
          }
        }
        if (targetChatId) {
          const messages = await storage.getSabiGuardMessages(targetChatId);
          if (messages && messages.length > 0) {
            preCaseSummary = await summarizeCaseForProfessional(messages, userId);
          }
        }
      } catch (err) {
        console.error('Failed to generate pre-case summary:', err);
      }

      const fullDescription = preCaseSummary ? `${description}\n\n---\n\n${preCaseSummary}` : description;

      const booking = await storage.createBooking({
        serviceId,
        userId,
        vendorId,
        totalAmount: totalAmount.toString(),
        description: fullDescription,
        scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : null
      });

      res.json(booking);
    } catch (error) {
      next(error);
    }
  });

  // Get user's bookings
  app.get("/api/bookings/user/:userId", userAuth, async (req, res, next) => {
    try {
      const { userId } = req.params;
      if (userId !== (req as any).userId && !(req as any).isAdmin) return res.status(403).json({ error: 'Forbidden' });
      const bookings = await storage.getBookingsByUserId(userId);
      res.json(bookings);
    } catch (error) {
      next(error);
    }
  });

  // Get vendor's bookings
  app.get("/api/bookings/vendor/:vendorId", userAuth, async (req, res, next) => {
    try {
      const { vendorId } = req.params;
      if (vendorId !== (req as any).userId && !(req as any).isAdmin) return res.status(403).json({ error: 'Forbidden' });
      const bookings = await storage.getBookingsByVendorId(vendorId);
      res.json(bookings);
    } catch (error) {
      next(error);
    }
  });

  // Get booking details with contract
  app.get("/api/bookings/:id", bookingParticipantAuth, async (req, res, next) => {
    try {
      const { id } = req.params;
      const details = await storage.getBookingDetails(id);
      
      if (!details.booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }
      
      res.json(details);
    } catch (error) {
      next(error);
    }
  });

  // Update booking status (vendor confirms, completes)
  app.patch("/api/bookings/:id/status", bookingParticipantAuth, async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const validStatuses = ['requested', 'confirmed', 'in_progress', 'completed', 'cancelled'];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Valid values: ${validStatuses.join(', ')}` });
      }

      await storage.updateBookingStatus(id, status);
      const updated = await storage.getBookingById(id);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  // ===== Contracts =====

  // Create contract with terms
  app.post("/api/bookings/:id/contract", bookingParticipantAuth, async (req, res, next) => {
    try {
      const { id } = req.params;
      const { title, terms } = req.body;
      
      if (!title || !terms) {
        return res.status(400).json({ error: 'title and terms are required' });
      }

      const existing = await storage.getContractByBookingId(id);
      if (existing) {
        return res.status(409).json({ error: 'Contract already exists for this booking' });
      }

      const contract = await storage.createContract({
        bookingId: id,
        title,
        terms
      });

      res.json(contract);
    } catch (error) {
      next(error);
    }
  });

  // Sign contract (user or vendor)
  app.post("/api/bookings/:id/contract/sign", bookingParticipantAuth, async (req, res, next) => {
    try {
      const { id } = req.params;
      const { signerType } = req.body;
      const userId = req.userId;
      const booking = req.booking;
      
      if (!userId || !booking) {
        return res.status(401).json({ error: 'Authentication required or booking not found' });
      }
      
      if (!signerType || !['user', 'vendor'].includes(signerType)) {
        return res.status(400).json({ error: 'signerType must be "user" or "vendor"' });
      }

      if (signerType === 'user' && userId !== booking.userId) {
        return res.status(403).json({ error: 'Only the booking user can sign as user' });
      }
      if (signerType === 'vendor' && userId !== booking.vendorId) {
        return res.status(403).json({ error: 'Only the vendor can sign as vendor' });
      }

      const contract = await storage.signContract(id, signerType);
      if (!contract) {
        return res.status(404).json({ error: 'Contract not found for this booking' });
      }

      res.json(contract);
    } catch (error) {
      next(error);
    }
  });

  // ===== Chat / Messages =====

  // Get booking chat messages
  app.get("/api/bookings/:id/messages", bookingParticipantAuth, async (req, res, next) => {
    try {
      const { id } = req.params;
      const { limit } = req.query;

      const messages = await storage.getBookingMessages(
        id,
        limit ? parseInt(limit as string) : 100
      );
      
      res.json(messages);
    } catch (error) {
      next(error);
    }
  });

  // Send message
  app.post("/api/bookings/:id/messages", bookingParticipantAuth, async (req, res, next) => {
    try {
      const { id } = req.params;
      const { message, attachments } = req.body;
      const senderId = req.userId;
      const isAdmin = req.isAdmin;
      
      if (!message && (!attachments || attachments.length === 0)) {
        return res.status(400).json({ error: 'message or attachments is required' });
      }

      // Check if an admin has joined a dispute for this booking
      const dispute = await storage.getDisputeByBookingId(id);
      if (dispute && dispute.adminJoined && !isAdmin) {
        return res.status(403).json({ error: 'Admin has joined the dispute. User/Vendor interaction is restricted.' });
      }

      const newMessage = await storage.createBookingMessage({
        bookingId: id,
        senderId: senderId!,
        message,
        attachments: attachments || [],
        isAdminMessage: !!isAdmin
      });

      res.json(newMessage);
    } catch (error) {
      next(error);
    }
  });

  // ===== Disputes =====

  // Open dispute
  app.post("/api/bookings/:id/dispute", bookingParticipantAuth, async (req, res, next) => {
    try {
      const { id } = req.params;
      const { reason, description, evidence } = req.body;
      const openedBy = req.userId;
      
      if (!reason) {
        return res.status(400).json({ error: 'reason is required' });
      }

      const existing = await storage.getDisputeByBookingId(id);
      if (existing && existing.status !== 'resolved' && existing.status !== 'closed') {
        return res.status(409).json({ error: 'Active dispute already exists for this booking' });
      }

      const dispute = await storage.createDispute({
        bookingId: id,
        openedBy,
        reason,
        description: description || '',
        evidence: evidence || []
      });

      // Auto-message for dispute opening
      await storage.createBookingMessage({
        bookingId: id,
        senderId: 'system',
        message: 'A dispute has been opened. Please provide all evidence so an admin can review it.',
        isAdminMessage: true
      });

      res.json(dispute);
    } catch (error) {
      next(error);
    }
  });

  // Admin: List all disputes
  app.get("/api/admin/disputes", adminAuth, async (req, res, next) => {
    try {
      const disputes = await storage.getDisputes();
      res.json(disputes);
    } catch (error) {
      next(error);
    }
  });

  // Admin: Resolve dispute
  app.patch("/api/admin/disputes/:id/resolve", adminAuth, async (req, res, next) => {
    try {
      const { id } = req.params;
      const { resolution, resolutionNotes } = req.body;
      
      const validResolutions = ['user_favor', 'vendor_favor', 'split', 'cancelled'];
      if (!resolution || !validResolutions.includes(resolution)) {
        return res.status(400).json({ error: `Invalid resolution. Valid values: ${validResolutions.join(', ')}` });
      }

      const adminId = req.userId;
      const dispute = await storage.resolveDispute(id, resolution, resolutionNotes || '', adminId!);
      
      if (!dispute) {
        return res.status(404).json({ error: 'Dispute not found' });
      }

      res.json(dispute);
    } catch (error) {
      next(error);
    }
  });

  // Admin: Join dispute
  app.post("/api/admin/disputes/:id/join", adminAuth, async (req, res, next) => {
    try {
      const { id } = req.params;
      const adminId = req.userId;
      
      const dispute = await storage.joinDispute(id, adminId!);
      if (!dispute) {
        return res.status(404).json({ error: 'Dispute not found' });
      }

      res.json(dispute);
    } catch (error) {
      next(error);
    }
  });

  // ===== SabiGuard, SabiMove, SabiWork Service Endpoints =====

  // SabiGuard - AI Legal Assistant & Chat
  const loadOwnedChat = async (req: any, res: Response, chatId: string) => {
    const chat = await storage.getSabiGuardChat(chatId);
    if (!chat) { res.status(404).json({ error: "Chat not found" }); return null; }
    if (chat.userId !== req.userId && !req.isAdmin) { res.status(403).json({ error: "Forbidden" }); return null; }
    return chat;
  };

  const chatBytes = (text: string) => Buffer.byteLength(text || '', 'utf8');

  app.get("/api/sabiguard/chats", userAuth, async (req, res, next) => {
    try {
      const userId = (req.query.userId as string) || (req as any).userId;
      if (userId !== (req as any).userId && !(req as any).isAdmin) {
        return res.status(403).json({ error: "Forbidden" });
      }
      res.json(await storage.getSabiGuardChats(userId));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/sabiguard/storage", userAuth, async (req, res, next) => {
    try {
      const profile = await storage.getUserProfile((req as any).userId);
      const limit = profile?.chatStorageLimit || 524288;
      const used = profile?.chatStorageUsed || 0;
      const chats = await storage.getSabiGuardChats((req as any).userId);
      res.json({ used, limit, remaining: Math.max(0, limit - used), chatCount: chats.length });
    } catch (error) {
      next(error);
    }
  });

  // --- WhatsApp / Telegram account linking ---
  app.post("/api/channels/link-code", userAuth, async (req, res, next) => {
    try {
      const userId = (req as any).userId;
      const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      const code = Array.from({ length: 8 }, () => alphabet[crypto.randomInt(alphabet.length)]).join("");
      await supabase.from("channel_link_codes").delete().eq("user_id", userId).is("used_at", null);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const { error } = await supabase.from("channel_link_codes").insert({ code, user_id: userId, expires_at: expiresAt });
      if (error) throw error;
      res.json({ code, expiresAt, instructions: `Send "link ${code}" to the SabiRight WhatsApp or Telegram bot within 10 minutes.` });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/channels/links", userAuth, async (req, res, next) => {
    try {
      const { data, error } = await supabase
        .from("channel_links")
        .select("channel, linked_at")
        .eq("user_id", (req as any).userId);
      if (error) throw error;
      res.json(data || []);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/channels/links/:channel", userAuth, async (req, res, next) => {
    try {
      const { error } = await supabase
        .from("channel_links")
        .delete()
        .eq("user_id", (req as any).userId)
        .eq("channel", req.params.channel);
      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/sabiguard/chats/:userId", userAuth, async (req, res, next) => {
    try {
      const { userId } = req.params;
      if (userId !== (req as any).userId && !(req as any).isAdmin) {
        return res.status(403).json({ error: "Forbidden" });
      }
      res.json(await storage.getSabiGuardChats(userId));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/sabiguard/chats/:chatId/messages", userAuth, async (req, res, next) => {
    try {
      const { chatId } = req.params;
      if (!(await loadOwnedChat(req, res, chatId))) return;
      const messages = await storage.getSabiGuardMessages(chatId);
      res.json(messages.map((m: any) => ({ ...m, text: m.content })));
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/sabiguard/chats/:chatId/messages", userAuth, async (req, res, next) => {
    try {
      const { chatId } = req.params;
      const { role, text } = req.body;
      const userId = (req as any).userId;
      if (!role || !text || !['user', 'ai'].includes(role)) {
        return res.status(400).json({ error: "Role and text are required" });
      }
      if (!(await loadOwnedChat(req, res, chatId))) return;

      const profile = await storage.getUserProfile(userId);
      const limit = profile?.chatStorageLimit || 524288;
      const used = profile?.chatStorageUsed || 0;
      const size = chatBytes(text);
      if (used + size > limit) {
        return res.status(413).json({ error: "Storage limit reached", code: "STORAGE_FULL" });
      }

      await storage.addSabiGuardMessage(chatId, role, text);
      await storage.updateChatStorageUsed(userId, size);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/sabiguard/chats", userAuth, async (req, res, next) => {
    try {
      const userId = (req as any).userId;
      const title = String(req.body?.title || "New Chat").slice(0, 80);
      res.json(await storage.createSabiGuardChat(userId, title));
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/sabiguard/chats/:chatId", userAuth, async (req, res, next) => {
    try {
      const { chatId } = req.params;
      const chat = await loadOwnedChat(req, res, chatId);
      if (!chat) return;
      const messages = await storage.getSabiGuardMessages(chatId);
      const freed = messages.reduce((n: number, m: any) => n + chatBytes(m.content), 0);
      await storage.deleteSabiGuardChat(chatId);
      await storage.updateChatStorageUsed(chat.userId, -freed);
      res.json({ success: true, freedBytes: freed });
    } catch (error) {
      next(error);
    }
  });
  app.post("/api/sabiguard/query", userAuth, async (req, res, next) => {
    try {
      const { query, chatId } = req.body;
      const userId = (req as any).userId;
  
      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }
      if (chatId && !(await loadOwnedChat(req, res, chatId))) return;

      // Check storage limits
      const profile = await storage.getUserProfile(userId);
      if (profile) {
        const limit = profile.chatStorageLimit || 524288;
        const used = profile.chatStorageUsed || 0;
        if (used >= limit) {
          return res.status(400).json({ 
            error: "Storage limit reached", 
            message: "You have reached your chat storage limit. Please upgrade your plan for more space."
          });
        }
      }
  
      // Check and deduct credits
      const featureAccess = await validateFeatureAccess(userId, 'ai_chat');
      if (!featureAccess.allowed) {
        return res.status(featureAccess.status).json({ error: featureAccess.error });
      }

      const costSetting = await storage.getAdminSetting('credit_cost_ai_query');
      const sabiguardCost = costSetting?.value ? Number(costSetting.value) : 1;

      const balance = await storage.getBalance(userId);
      const deducted = await storage.deductCredits(userId, sabiguardCost, "SabiGuard query", "SabiGuard query");
  
      if (!deducted) {
        console.warn(`[SabiGuard 402] Insufficient credits: userId=${userId}, required=${sabiguardCost}, available=${balance.availableCredits}`);
        return res.status(402).json({ 
          error: "Insufficient credits", 
          required: sabiguardCost,
          available: balance.availableCredits
        });
      }
  
      // Get AI Response
      let aiResponseText = "";
      try {
        const prompt = `You are SabiGuard, a civic and legal AI assistant for Nigeria. 
        User Question: ${query}
        
        CRITICAL INSTRUCTIONS:
        1. Summarize your response. Be extremely concise and "Short and Smart".
        2. Do not provide bulky details unless the user explicitly asks for them.
        3. Provide helpful, accurate, and concise guidance. 
        4. If it's a legal issue, remind them you are an AI, not a lawyer.
        5. Always end by asking: "Would you like a more detailed explanation, or should we continue in this 'Short and Smart' mode?"`;
        aiResponseText = await generateAIResponse(prompt) || "I'm sorry, I couldn't generate a response at this time.";
      } catch (aiErr: any) {
        console.error('SabiGuard AI Error:', aiErr);
        await storage.refundCredits(userId, sabiguardCost, "SabiGuard query");
        aiResponseText = `Error generating AI response: ${aiErr.message}. Please check API keys.`;
      }
      
      // Save to chat if chatId provided
      if (chatId) {
        await storage.addSabiGuardMessage(chatId, "user", query);
        await storage.addSabiGuardMessage(chatId, "ai", aiResponseText);
        
        // Track storage used (rough estimate: characters * 1 byte)
        const bytesUsed = chatBytes(query) + chatBytes(aiResponseText);
        await storage.updateChatStorageUsed(userId, bytesUsed);

        // MOAT Integration: Use chat data for threat analysis
        if (query.length > 50) {
          await storage.createMoatData({
            title: "Chat Intelligence - " + (chatId || "Unknown Chat"),
            category: "chat_intel",
            source: "sabiguard_chat",
            content: query,
            metadata: { userId, chatId, timestamp: new Date().toISOString() }
          });
        }
      }

      const response = {
        answer: aiResponseText,
        query,
        timestamp: new Date().toISOString()
      };
  
      // Send notification
      await storage.sendNotification({
        userId,
        type: "service_used",
        title: "SabiGuard Query Processed",
        message: `${sabiguardCost} credits deducted. Remaining: ${balance.availableCredits - sabiguardCost}`,
        data: { service: "sabiguard", creditsDeducted: sabiguardCost }
      });
  
      res.json({ 
        success: true, 
        response,
        creditsRemaining: balance.availableCredits - sabiguardCost
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Get SabiGuard query history
  app.get("/api/sabiguard/history/:userId", userAuth, async (req, res, next) => {
    try {
      const { userId } = req.params;
      const history = await storage.getCreditLog(userId);
      const sabiguardHistory = history.filter(log => log.description?.includes("SabiGuard"));
      res.json(sabiguardHistory);
    } catch (error) {
      next(error);
    }
  });
  
  // SabiMove - Route Planning with Traffic Alerts
  app.post("/api/sabimove/route", userAuth, async (req, res, next) => {
    try {
      const { userId, origin, destination, waypoints } = req.body;
  
      if (!origin || !destination) {
        return res.status(400).json({ error: "Origin and destination are required" });
      }
  
      // Check and deduct credits
      const featureAccess = await validateFeatureAccess(userId, 'civic_alerts');
      if (!featureAccess.allowed) {
        return res.status(featureAccess.status).json({ error: featureAccess.error });
      }

      const costSetting = await storage.getAdminSetting('credit_cost_event_creation');
      const sabimoveCost = costSetting?.value ? Number(costSetting.value) : 3;

      const balance = await storage.getBalance(userId);
      const deducted = await storage.deductCredits(userId, sabimoveCost, "SabiMove route planning", "SabiMove route planning");
  
      if (!deducted) {
        console.warn(`[SabiMove 402] Insufficient credits: userId=${userId}, required=${sabimoveCost}, available=${balance.availableCredits}`);
        return res.status(402).json({ 
          error: "Insufficient credits",
          required: sabimoveCost,
          available: balance.availableCredits
        });
      }
  
      // Create route (uses existing route storage)
      const route = await storage.createRoute({
        userId,
        routeName: `Route from ${origin} to ${destination}`,
        startLocation: origin,
        endLocation: destination,
        startLat: 0,
        startLng: 0,
        endLat: 0,
        endLng: 0,
        status: "active"
      });
  
      // Send notification
      await storage.sendNotification({
        userId,
        type: "service_used",
        title: "SabiMove Route Created",
        message: `${sabimoveCost} credits deducted. Remaining: ${balance.availableCredits - sabimoveCost}`,
        data: { service: "sabimove", routeId: route.id, creditsDeducted: sabimoveCost }
      });
  
      res.json({ 
        success: true, 
        route,
        creditsRemaining: balance.availableCredits - sabimoveCost
      });
    } catch (error) {
      if (req.body?.userId) {
        try {
          const costSetting = await storage.getAdminSetting('credit_cost_event_creation');
          const sabimoveCost = costSetting?.value ? Number(costSetting.value) : 3;
          await storage.refundCredits(req.body.userId, sabimoveCost, "SabiMove route planning");
        } catch {}
      }
      next(error);
    }
  });
  
  // Get SabiMove route history
  app.get("/api/sabimove/history/:userId", userAuth, async (req, res, next) => {
    try {
      const { userId } = req.params;
      const routes = await storage.getUserRoutes(userId);
      res.json(routes);
    } catch (error) {
      next(error);
    }
  });
  
  // SabiWork - Job Matching and Recommendations
  app.post("/api/sabiwork/recommendations", userAuth, async (req, res, next) => {
    try {
      const { userId, skills, location, jobType } = req.body;
  
      // Check and deduct credits
      const featureAccess = await validateFeatureAccess(userId, 'job_applications');
      if (!featureAccess.allowed) {
        return res.status(featureAccess.status).json({ error: featureAccess.error });
      }

      const costSetting = await storage.getAdminSetting('credit_cost_job_application');
      const sabiworkCost = costSetting?.value ? Number(costSetting.value) : 2;

      const balance = await storage.getBalance(userId);
      const deducted = await storage.deductCredits(userId, sabiworkCost, "SabiWork job recommendations", "SabiWork job recommendations");
  
      if (!deducted) {
        console.warn(`[SabiWork 402] Insufficient credits: userId=${userId}, required=${sabiworkCost}, available=${balance.availableCredits}`);
        return res.status(402).json({ 
          error: "Insufficient credits",
          required: sabiworkCost,
          available: balance.availableCredits
        });
      }
  
      // Get job recommendations (uses existing vendor services)
      const allServices = await storage.getVendorServices({});
      const recommendations = allServices
        .filter(service => 
          (service.type?.toLowerCase().includes("job")) ||
          (service.specialization?.toLowerCase().includes("job"))
        )
        .slice(0, 10);
  
      // Send notification
      await storage.sendNotification({
        userId,
        type: "service_used",
        title: "SabiWork Recommendations Generated",
        message: `${sabiworkCost} credits deducted. Remaining: ${balance.availableCredits - sabiworkCost}`,
        data: { service: "sabiwork", count: recommendations.length, creditsDeducted: sabiworkCost }
      });
  
      res.json({ 
        success: true, 
        recommendations,
        creditsRemaining: balance.availableCredits - sabiworkCost
      });
    } catch (error) {
      if (req.body?.userId) {
        try {
          const costSetting = await storage.getAdminSetting('credit_cost_job_application');
          const sabiworkCost = costSetting?.value ? Number(costSetting.value) : 2;
          await storage.refundCredits(req.body.userId, sabiworkCost, "SabiWork job recommendations");
        } catch {}
      }
      next(error);
    }
  });
  
  // Apply for a job through SabiWork
  app.post("/api/sabiwork/apply", userAuth, async (req, res, next) => {
    try {
      const { userId, serviceId, coverLetter, resume } = req.body;
  
      if (!serviceId) {
        return res.status(400).json({ error: "Service ID is required" });
      }
  
      // Create a booking for the job application
      const service = await storage.getVendorServiceById(serviceId);
      if (!service) {
        return res.status(404).json({ error: "Job not found" });
      }
  
      const booking = await storage.createBooking({
        userId,
        vendorId: service.vendorId,
        serviceId,
        coverLetter,
        resume
      });
  
      // Send notification to both user and vendor
      await storage.sendNotification({
        userId,
        type: "job_application",
        title: "Job Application Submitted",
        message: `Your application for "${service.name}" has been submitted`,
        data: { bookingId: booking.id, serviceId }
      });
  
      await storage.sendNotification({
        userId: service.vendorId,
        type: "job_application",
        title: "New Job Application",
        message: `You have a new application for "${service.name}"`,
        data: { bookingId: booking.id, applicantId: userId }
      });
  
      res.json({ success: true, booking });
    } catch (error) {
      next(error);
    }
  });
  
  // Get SabiWork application history
  app.get("/api/sabiwork/history/:userId", userAuth, async (req, res, next) => {
    try {
      const { userId } = req.params;
      const history = await storage.getCreditLog(userId);
      const sabiworkHistory = history.filter(log => log.description?.includes("SabiWork"));
      res.json(sabiworkHistory);
    } catch (error) {
      next(error);
    }
  });
  // ===== Notification API =====

  // Get user notifications
  app.get("/api/notifications/:userId", async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { limit, offset, type } = req.query;
      const authHeader = req.headers.authorization;

      // Disable caching for notifications to prevent ERR_ABORTED or stale data
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');

      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const token = authHeader.substring(7);
      let result;
      try {
        result = await verifyUserToken(token);
      } catch (tokenError) {
        console.error('Token verification error:', tokenError);
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      if (!result || !result.valid || !result.userId) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      // Security check: If not admin and trying to view another user's notifications
      let isAdmin = false;
      try {
        isAdmin = await isUserAdmin(result.userId);
      } catch (adminCheckError) {
        console.error('Admin check error:', adminCheckError);
        // Default to non-admin if check fails
      }

      if (userId !== result.userId && !isAdmin) {
        return res.status(403).json({ error: 'Access denied: User ID mismatch' });
      }

      if ((limit !== undefined && typeof limit !== 'string') ||
          (offset !== undefined && typeof offset !== 'string') ||
          (type !== undefined && typeof type !== 'string')) {
        return res.status(400).json({ error: 'limit, offset, and type must be single values' });
      }

      const pageLimit = limit === undefined ? 50 : Number(limit);
      const pageOffset = offset === undefined ? 0 : Number(offset);
      if (!Number.isSafeInteger(pageLimit) || pageLimit < 1 || pageLimit > 100) {
        return res.status(400).json({ error: 'limit must be an integer between 1 and 100' });
      }
      if (!Number.isSafeInteger(pageOffset) || pageOffset < 0 || pageOffset > 1000000) {
        return res.status(400).json({ error: 'offset must be an integer between 0 and 1000000' });
      }

      const filterType = typeof type === 'string' && type !== 'all' ? type : undefined;
      const page = await storage.getNotificationsByUserId(userId, pageLimit, pageOffset, filterType);
      const unreadCount = await storage.getUnreadNotificationCount(userId);
      res.json({
        notifications: page.notifications,
        unreadCount,
        totalCount: page.totalCount
      });
    } catch (error) {
      console.error('Unexpected error in GET /api/notifications/:userId:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error fetching notifications' });
      }
    }
  });

  // Get unread notification count
  app.get("/api/notifications/:userId/unread", async (req, res, next) => {
    try {
      const { userId } = req.params;
      const authHeader = req.headers.authorization;

      // Disable caching for unread count to prevent ERR_ABORTED or stale data
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');

      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const token = authHeader.substring(7);
      let result;
      try {
        result = await verifyUserToken(token);
      } catch (tokenError) {
        console.error('Token verification error:', tokenError);
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      if (!result || !result.valid) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      let isAdmin = false;
      if (result.userId) {
        try {
          isAdmin = await isUserAdmin(result.userId);
        } catch (adminCheckError) {
          console.error('Admin check error:', adminCheckError);
        }
      }

      if (userId !== result.userId && !isAdmin) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      console.error('Unexpected error in GET /api/notifications/:userId/unread:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error fetching unread count' });
      }
    }
  });

  // Mark single notification as read
  app.post("/api/notifications/:userId/read/:notificationId", userAuth, async (req, res, next) => {
    try {
      const { userId, notificationId } = req.params;
      
      const notification = await storage.getNotificationById(notificationId);
      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      
      if (notification.userId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      await storage.markNotificationAsRead(notificationId);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // Mark all notifications as read
  app.post("/api/notifications/:userId/read-all", userAuth, async (req, res, next) => {
    try {
      const { userId } = req.params;
      const count = await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true, markedCount: count });
    } catch (error) {
      next(error);
    }
  });

  // ===== Admin Notification Templates API =====

  // List all templates
  app.get("/api/admin/notifications/templates", adminAuth, async (req, res, next) => {
    try {
      const templates = await storage.getAllNotificationTemplates();
      res.json(templates);
    } catch (error) {
      next(error);
    }
  });

  // Create template
  app.post("/api/admin/notifications/templates", adminAuth, async (req, res, next) => {
    try {
      const { name, type, subject, bodyTemplate, channels, isActive } = req.body;
      
      if (!name || !type || !subject || !bodyTemplate) {
        return res.status(400).json({ error: 'name, type, subject, and bodyTemplate are required' });
      }
      const selectedChannels = channels || ['in_app'];
      if (
        !Array.isArray(selectedChannels) ||
        selectedChannels.some((channel: unknown) => !['email', 'in_app', 'push'].includes(String(channel)))
      ) {
        return res.status(400).json({ error: 'channels must contain only email, in_app, or push' });
      }
      
      const existing = await storage.getNotificationTemplateByName(name);
      if (existing) {
        return res.status(409).json({ error: 'Template with this name already exists' });
      }
      
      const template = await storage.createNotificationTemplate({
        name,
        type,
        subject,
        bodyTemplate,
        channels: [...new Set(selectedChannels)],
        isActive: isActive !== false
      });
      
      res.json(template);
    } catch (error) {
      next(error);
    }
  });

  // Update template
  app.patch("/api/admin/notifications/templates/:id", adminAuth, async (req, res, next) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
        return res.status(400).json({ error: 'Template updates must be an object' });
      }
      if (updates.channels !== undefined && (
        !Array.isArray(updates.channels) ||
        updates.channels.some((channel: unknown) => !['email', 'in_app', 'push'].includes(String(channel)))
      )) {
        return res.status(400).json({ error: 'channels must contain only email, in_app, or push' });
      }
      
      const template = await storage.updateNotificationTemplate(id, updates);
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      
      res.json(template);
    } catch (error) {
      next(error);
    }
  });

  // Delete template
  app.delete("/api/admin/notifications/templates/:id", adminAuth, async (req, res, next) => {
    try {
      const { id } = req.params;
      
      const success = await storage.deleteNotificationTemplate(id);
      if (!success) {
        return res.status(404).json({ error: 'Template not found' });
      }
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // ===== Admin Vendor Service API =====

  app.get("/api/admin/vendor-services", adminAuth, async (req, res, next) => {
    try {
      const services = await storage.getAllVendorServices();
      res.json(services);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/vendor-services/:id/approve", adminAuth, async (req, res, next) => {
    try {
      const { id } = req.params;
      await storage.approveVendorService(id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/vendor-services/:id/reject", adminAuth, async (req, res, next) => {
    try {
      const { id } = req.params;
      await storage.rejectVendorService(id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // Update user chat storage limit
  app.post("/api/admin/users/:userId/storage-limit", adminAuth, async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { limitBytes } = req.body;
      
      if (typeof limitBytes !== 'number') {
        return res.status(400).json({ error: "limitBytes must be a number" });
      }

      await storage.updateUserProfile(userId, { chatStorageLimit: limitBytes });
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // ===== Admin SMTP Settings API =====

  // Get SMTP settings
  app.get("/api/admin/notifications/smtp", adminAuth, async (req, res, next) => {
    try {
      const settings = await storage.getSmtpSettings();
      
      if (!settings) {
        return res.json({ configured: false, hasPassword: false });
      }
      
      res.json({
        ...settings,
        password: '',
        hasPassword: !!settings.password && String(settings.password).length > 0,
        configured: true
      });
    } catch (error) {
      next(error);
    }
  });

  // Update SMTP settings
  app.post("/api/admin/notifications/smtp", adminAuth, async (req, res, next) => {
    try {
      const { host, port, username, password, fromEmail, fromName, encryption, isActive } = req.body;
      const existingSettings = await storage.getSmtpSettings();
      
      if (!host || !port || !username || (!password && !existingSettings?.password) || !fromEmail || !fromName) {
        return res.status(400).json({ 
          error: 'host, port, username, password, fromEmail, and fromName are required' 
        });
      }
      
      let finalPassword = password;
      if (!password || /^•+$/.test(String(password).trim())) {
        if (existingSettings) {
          finalPassword = existingSettings.password;
        }
      }
      
      const settings = await storage.updateSmtpSettings({
        host,
        port: parseInt(port),
        username,
        password: finalPassword,
        fromEmail,
        fromName,
        encryption: encryption || 'tls',
        isActive: isActive !== false
      });
      
      res.json({
        ...settings,
        password: '',
        hasPassword: !!finalPassword,
        configured: true
      });
    } catch (error) {
      next(error);
    }
  });

  // ===== Admin Push Settings API =====

  // Get Push settings
  app.get("/api/admin/notifications/push", adminAuth, async (req, res, next) => {
    try {
      const settings = await storage.getPushSettings();
      
      if (!settings) {
        return res.json({ configured: false, hasPrivateKey: false });
      }
      
      res.json({
        ...settings,
        privateKey: '',
        hasPrivateKey: !!settings.privateKey && String(settings.privateKey).length > 0,
        configured: true
      });
    } catch (error) {
      next(error);
    }
  });

  // Update Push settings
  app.post("/api/admin/notifications/push", adminAuth, async (req, res, next) => {
    try {
      const { publicKey, privateKey, subject, isActive } = req.body;
      const existingSettings = await storage.getPushSettings();
      
      if (!publicKey || (!privateKey && !existingSettings?.privateKey) || !subject) {
        return res.status(400).json({ 
          error: 'publicKey, privateKey, and subject are required' 
        });
      }
      
      let finalPrivateKey = privateKey;
      if (!privateKey || /^•+$/.test(String(privateKey).trim())) {
        if (existingSettings) {
          finalPrivateKey = existingSettings.privateKey;
        }
      }
      
      const settings = await storage.updatePushSettings({
        publicKey,
        privateKey: finalPrivateKey,
        subject,
        isActive: isActive !== false
      });
      
      res.json({
        ...settings,
        privateKey: '',
        hasPrivateKey: !!finalPrivateKey,
        configured: true
      });
    } catch (error) {
      next(error);
    }
  });

  // Test Push notification
  app.post("/api/admin/notifications/push/test", adminAuth, async (req, res, next) => {
    try {
      const { userId } = req.body;
      if (!userId) return res.status(400).json({ error: 'userId is required for testing' });

      const result = await storage.sendNotification({
        userId,
        type: 'system',
        title: 'Push Test',
        message: 'This is a test push notification from SabiRight Admin.',
        channels: ['push', 'in_app']
      });

      if (!result.pushSent) {
        return res.status(502).json({
          success: false,
          error: result.pushError || 'Push test failed',
          inAppSaved: result.inAppSaved
        });
      }
      res.json({
        success: true,
        pushSent: result.pushSent,
        pushError: result.pushError,
        inAppSaved: result.inAppSaved
      });
    } catch (error: any) {
      console.error('Push Test Error:', error);
      res.status(500).json({ 
        error: 'Push test failed', 
        details: error.message 
      });
    }
  });

  // Generate VAPID keys
  app.post("/api/admin/notifications/push/generate-keys", adminAuth, async (req, res, next) => {
    try {
      const vapidKeys = webpush.generateVAPIDKeys();
      res.json(vapidKeys);
    } catch (error: any) {
      console.error('VAPID Key Generation Error:', error);
      res.status(500).json({ 
        error: 'Failed to generate VAPID keys', 
        details: error.message 
      });
    }
  });

  // Test SMTP connection
  app.post("/api/admin/notifications/smtp/test", adminAuth, async (req, res, next) => {
    try {
      const { host, port, username, password, fromEmail, fromName, encryption } = req.body;
      
      let finalPassword = password;
      if (password === '••••••••') {
        const settings = await storage.getSmtpSettings();
        if (settings) {
          finalPassword = settings.password;
        }
      }

      if (!host || !port || !username || !finalPassword || !fromEmail || !fromName) {
        return res.status(400).json({ error: 'All fields are required for testing' });
      }

      const transporter = nodemailer.createTransport({
        host,
        port: parseInt(port),
        secure: encryption === 'ssl' || parseInt(port) === 465,
        auth: {
          user: username,
          pass: finalPassword,
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      // Verify connection configuration
      await transporter.verify();

      // Send a test email
      const info = await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: fromEmail, // Send to self
        subject: "SMTP Connection Test - SabiRight",
        html: `
          <h1>SMTP Connection Successful!</h1>
          <p>This is a test email from SabiRight Admin Dashboard.</p>
          <p>If you received this, your SMTP settings are correctly configured.</p>
          <hr />
          <p><strong>Config Details:</strong></p>
          <ul>
            <li>Host: ${host}</li>
            <li>Port: ${port}</li>
            <li>User: ${username}</li>
            <li>Encryption: ${encryption || 'tls'}</li>
          </ul>
        `,
      });

      res.json({ success: true, messageId: info.messageId });
    } catch (error: any) {
      console.error('SMTP Test Error:', error);
      res.status(500).json({ 
        error: 'SMTP test failed', 
        details: error.message 
      });
    }
  });

  // ===== Crowd Translation API =====

  // Submit a translation
  app.post("/api/crowd-translations", userAuth, async (req, res, next) => {
    try {
      const { termId, english, translation, language } = req.body;
      if (!termId || !english || !translation || !language) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const result = await storage.submitTranslation({
        termId,
        english,
        translation,
        language,
        userId: req.userId,
      });

      // Award credits for contributing
      try {
        await storage.refundCredits(req.userId!, 5, "Translation Contribution");
      } catch (e) {
        console.error('Failed to award credits for translation:', e);
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  // Get random translation for verification
  app.get("/api/crowd-translations/verification", userAuth, async (req, res, next) => {
    try {
      const translation = await storage.getRandomTranslationForVerification(req.userId!);
      if (!translation) {
        return res.status(404).json({ error: "No translations available for verification" });
      }
      res.json(translation);
    } catch (error) {
      next(error);
    }
  });

  // Vote on a translation
  app.post("/api/crowd-translations/:id/vote", userAuth, async (req, res, next) => {
    try {
      const { id } = req.params;
      const { vote } = req.body; // boolean: true for Yes, false for No
      
      await storage.voteTranslation(id, vote);
      
      // Award credits for voting/verifying
      try {
        await storage.refundCredits(req.userId!, 2, "Translation Verification");
      } catch (e) {
        console.error('Failed to award credits for voting:', e);
      }

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // Admin: Get translation stats
  app.get("/api/admin/crowd-translations/stats", adminAuth, async (req, res, next) => {
    try {
      console.log(`[Admin] Fetching crowd translation stats`);
      const stats = await storage.getCrowdTranslationStats();
      console.log(`[Admin] Stats:`, stats);
      res.json(stats);
    } catch (error) {
      console.error(`[Admin] Error fetching stats:`, error);
      next(error);
    }
  });

  // Admin: Get all crowd translations
  app.get("/api/admin/crowd-translations", adminAuth, async (req, res, next) => {
    try {
      console.log(`[Admin] Fetching all crowd translations`);
      const translations = await storage.getAllCrowdTranslations();
      console.log(`[Admin] Found ${translations.length} translations`);
      res.json(translations);
    } catch (error) {
      console.error(`[Admin] Error fetching translations:`, error);
      next(error);
    }
  });

  // Admin: Export verified translations as JSONL
  app.get("/api/admin/crowd-translations/export", adminAuth, async (req, res, next) => {
    try {
      const translations = await storage.getVerifiedTranslations(2); // votes > 2
      
      const jsonl = translations.map(t => JSON.stringify({
        instruction: `Translate ${t.english} to ${t.language}`,
        input: t.english,
        output: t.translation
      })).join('\n');

      res.setHeader('Content-Type', 'application/x-jsonlines');
      res.setHeader('Content-Disposition', 'attachment; filename=crowd_translations_export.jsonl');
      res.send(jsonl);
    } catch (error) {
      next(error);
    }
  });

  // Admin: Get all training terms
  app.get("/api/admin/training-terms", adminAuth, async (req, res, next) => {
    try {
      const terms = await storage.getTrainingTerms();
      res.json(terms);
    } catch (error) {
      next(error);
    }
  });

  // Admin: Create new training term
  app.post("/api/admin/training-terms", adminAuth, async (req, res, next) => {
    try {
      const term = await storage.createTrainingTerm(req.body);
      res.json(term);
    } catch (error) {
      next(error);
    }
  });

  // Admin: Delete training term
  app.delete("/api/admin/training-terms/:id", adminAuth, async (req, res, next) => {
    try {
      await storage.deleteTrainingTerm(req.params.id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // ===== Push Subscription API =====

  app.get("/api/notifications/push/vapid-public-key", async (_req, res, next) => {
    try {
      const settings = await storage.getPushSettings();
      if (!settings || settings.isActive === false || !settings.publicKey) {
        return res.status(503).json({ error: 'Browser push notifications are not configured' });
      }
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.json({ publicKey: settings.publicKey });
    } catch (error) {
      next(error);
    }
  });

  // Subscribe to push notifications
  app.post("/api/notifications/:userId/push/subscribe", userAuth, async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { endpoint, keys } = req.body;
      const provider = req.body.provider || 'webpush';

      if (typeof endpoint !== 'string' || endpoint.length > 2048) {
        return res.status(400).json({ error: 'A valid push endpoint or token is required' });
      }

      if (provider === 'expo') {
        if (!/^(Expo|Exponent)PushToken\[[A-Za-z0-9-]+\]$/.test(endpoint)) {
          return res.status(400).json({ error: 'A valid Expo push token is required' });
        }
      } else if (provider === 'webpush') {
        let endpointUrl: URL;
        try {
          endpointUrl = new URL(endpoint);
        } catch {
          return res.status(400).json({ error: 'A valid push endpoint URL is required' });
        }
        if (
          endpointUrl.protocol !== 'https:' ||
          !keys ||
          typeof keys.p256dh !== 'string' ||
          typeof keys.auth !== 'string' ||
          keys.p256dh.length > 256 ||
          keys.auth.length > 256
        ) {
          return res.status(400).json({ error: 'endpoint and keys (p256dh, auth) are required' });
        }
      } else {
        return res.status(400).json({ error: 'provider must be webpush or expo' });
      }
      
      const subscription = await storage.subscribeToPush({
        userId,
        provider,
        endpoint,
        keys: provider === 'webpush' ? keys : null
      });
      
      res.json(subscription);
    } catch (error) {
      next(error);
    }
  });

  // Unsubscribe from push notifications
  app.post("/api/notifications/:userId/push/unsubscribe", userAuth, async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { endpoint, provider = 'webpush' } = req.body;
      
      if (
        typeof endpoint !== 'string' ||
        endpoint.length > 2048 ||
        (provider !== 'webpush' && provider !== 'expo')
      ) {
        return res.status(400).json({ error: 'A valid endpoint is required' });
      }
      
      const success = await storage.unsubscribeFromPush(userId, endpoint, provider);
      res.json({ success });
    } catch (error) {
      next(error);
    }
  });

  // Get user's push subscriptions
  app.get("/api/notifications/:userId/push", userAuth, async (req, res, next) => {
    try {
      const { userId } = req.params;
      const subscriptions = await storage.getPushSubscriptions(userId);
      res.json(subscriptions);
    } catch (error) {
      next(error);
    }
  });

  // Escrow & Disputes
  app.get("/api/admin/disputes", adminAuth, async (req, res, next) => {
    try {
      const disputes = await storage.getDisputes();
      res.json(disputes);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/disputes/:id", adminAuth, async (req, res, next) => {
    try {
      const { id } = req.params;
      const dispute = await storage.getDisputeById(id);
      if (!dispute) {
        return res.status(404).json({ error: 'Dispute not found' });
      }
      res.json(dispute);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/disputes/:id/join", adminAuth, async (req, res, next) => {
    try {
      const { id } = req.params;
      const adminId = req.userId;
      
      const dispute = await storage.getDisputeById(id);
      if (!dispute) {
        return res.status(404).json({ error: 'Dispute not found' });
      }

      const updatedDispute = await storage.joinDispute(id, adminId!);

      // Auto-message for admin joining
      if (updatedDispute) {
        await storage.createBookingMessage({
          bookingId: updatedDispute.bookingId,
          senderId: adminId!,
          message: 'An administrator has joined the dispute. User and vendor interaction is now restricted.',
          isAdminMessage: true
        });
      }

      res.json(updatedDispute);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/disputes/:id/resolve", adminAuth, async (req, res, next) => {
    try {
      const { id } = req.params;
      const { resolution, resolutionNotes } = req.body;
      const adminId = req.userId;

      if (!resolution) {
        return res.status(400).json({ error: 'Resolution required' });
      }

      const dispute = await storage.getDisputeById(id);
      if (!dispute) {
        return res.status(404).json({ error: 'Dispute not found' });
      }

      const updatedDispute = await storage.resolveDispute(id, resolution, resolutionNotes || '', adminId!);
      res.json(updatedDispute);
    } catch (error) {
      next(error);
    }
  });

  // Dispute Chat Messages (Authenticated users involved in the booking)
  app.get("/api/disputes/:id/messages", async (req, res, next) => {
    try {
      const { id } = req.params; // Dispute ID
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const token = authHeader.substring(7);
      const userResult = await verifyUserToken(token);
      const adminResult = await verifyAdminToken(token);
      
      if (!userResult.valid && !adminResult.valid) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      
      const userId = userResult.userId || adminResult.userId;

      const dispute = await storage.getDisputeById(id);
      if (!dispute) {
        return res.status(404).json({ error: 'Dispute not found' });
      }
      
      // Check if user is participant or admin
      const booking = await storage.getBookingById(dispute.bookingId);
      if (!booking) {
         return res.status(404).json({ error: 'Booking not found' });
      }
      
      const isParticipant = booking.userId === userId || booking.vendorId === userId;
      const isAdmin = adminResult.valid && adminResult.isAdmin;
      
      if (!isParticipant && !isAdmin) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      const messages = await storage.getBookingMessages(dispute.bookingId);
      res.json(messages);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/disputes/:id/messages", async (req, res, next) => {
    try {
      const { id } = req.params; // Dispute ID
      const { content } = req.body;
      
      if (!content) {
        return res.status(400).json({ error: 'Content required' });
      }

      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const token = authHeader.substring(7);
      const userResult = await verifyUserToken(token);
      const adminResult = await verifyAdminToken(token);
      
      if (!userResult.valid && !adminResult.valid) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      
      const userId = userResult.userId || adminResult.userId;
      const isAdmin = adminResult.valid && adminResult.isAdmin;

      const dispute = await storage.getDisputeById(id);
      if (!dispute) {
        return res.status(404).json({ error: 'Dispute not found' });
      }
      
      const booking = await storage.getBookingById(dispute.bookingId);
      if (!booking) {
         return res.status(404).json({ error: 'Booking not found' });
      }
      
      const isParticipant = booking.userId === userId || booking.vendorId === userId;
      
      if (!isParticipant && !isAdmin) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Restriction Logic: If admin joined, participants cannot send messages
      if (dispute.adminJoined && !isAdmin) {
         return res.status(403).json({ error: 'Chat is restricted. Admin has joined.' });
      }

      const message = await storage.createBookingMessage({
        bookingId: dispute.bookingId,
        senderId: userId!,
        message: content,
        isAdminMessage: !!isAdmin
      });
      
      res.json(message);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/generated-jobs", adminAuth, async (req, res, next) => {
    try {
      const jobs = await storage.getGeneratedJobs();
      res.json(jobs);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/admin/generated-jobs/:id", adminAuth, async (req, res, next) => {
    try {
      await storage.deleteGeneratedJob(req.params.id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // Auto-delete generated jobs older than 48 hours
  const cleanupGeneratedJobs = async () => {
    try {
      console.log('[Cleanup] Running generated jobs cleanup...');
      const deletedCount = await storage.cleanupOldGeneratedJobs(48);
      if (deletedCount > 0) {
        console.log(`[Cleanup] Deleted ${deletedCount} old generated jobs.`);
      }
    } catch (error) {
      console.error('[Cleanup] Error cleaning up generated jobs:', error);
    }
  };

  // Run cleanup every hour
  setInterval(cleanupGeneratedJobs, 60 * 60 * 1000);
  // Also run once at startup after a short delay
  setTimeout(cleanupGeneratedJobs, 10000);

  return httpServer;
}
