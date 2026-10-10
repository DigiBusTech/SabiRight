import { supabase, supabaseStorage as storage } from "../supabaseStorage.js";
import crypto from "crypto";
import { summarizeCaseForProfessional } from "../agent/legalAgent.js";
import { generateAIResponse } from "../aiService.js";
import PaystackService from "../paystackService.js";
import type { IncomingBotMessage, BotResponse } from "./types.js";

const BOT_AI_RESPONSE_BUDGET_MS = 7_000;
type ChatTurn = { role: string; content: string; eventId?: string };
const userChatBuffers: Map<string, ChatTurn[]> = new Map();

/**
 * Generates an omnichannel hosted checkout URL using the platform's primary active gateway (Flutterwave, Bachs, or Paystack)
 */
async function generateBotCheckoutLink(
  profile: any,
  type: 'credit_purchase' | 'subscription',
  identifier?: string
): Promise<{ checkoutUrl: string; title: string; price: number; credits?: number } | { error: string }> {
  try {
    const userId = profile.id;
    const methods = await storage.getPaymentMethods();
    const activeMethods = methods.filter((m: any) => m.active);

    // Pick primary active automatic gateway: Flutterwave first, then Bachs, then Paystack
    let chosenMethod = activeMethods.find((m: any) => m.type === 'flutterwave');
    if (!chosenMethod) chosenMethod = activeMethods.find((m: any) => m.type === 'bachs');
    if (!chosenMethod) chosenMethod = activeMethods.find((m: any) => m.type === 'paystack');

    if (!chosenMethod) {
      return { error: 'No automatic payment gateway is currently enabled. Please contact support or visit SabiRight web app.' };
    }

    const provider = chosenMethod.type;
    let amount = 0;
    let title = '';
    let metadata: any = {};
    let credits = 0;

    if (type === 'credit_purchase') {
      const pkgs = await storage.getCreditPackages();
      let pkg = pkgs.find((p: any) => p.id === identifier);
      if (!pkg && identifier) {
        pkg = pkgs.find((p: any) => String(p.credits) === String(identifier) || p.name?.toLowerCase().includes(identifier.toLowerCase()));
      }
      if (!pkg) pkg = pkgs[0];
      if (!pkg) return { error: 'No credit packages available at this time.' };

      amount = Number(pkg.price);
      credits = Number(pkg.credits) + Number(pkg.bonus || 0);
      title = `${pkg.name} (${credits} Credits)`;
      metadata = { packageId: pkg.id, credits };
    } else if (type === 'subscription') {
      const plans = await storage.getAllPlans();
      let plan = plans.find((p: any) => p.id === identifier || p.type === identifier);
      if (!plan && identifier) {
        plan = plans.find((p: any) => p.name?.toLowerCase().includes(identifier.toLowerCase()));
      }
      if (!plan) plan = plans.find((p: any) => p.type !== 'free');
      if (!plan) return { error: 'No subscription plans available at this time.' };

      amount = Number(plan.price);
      title = `${plan.name} Plan (${plan.billingCycle || 'Monthly'})`;
      metadata = { planId: plan.id };
    }

    if (!(amount > 0)) {
      return { error: 'Invalid payment amount.' };
    }

    const payment = await storage.createPayment({
      userId,
      amount,
      currency: 'NGN',
      provider,
      type,
      description: title,
      metadata
    });

    const txRef = `PAY-${payment.id}`;
    const appUrl = (process.env.APP_URL || 'https://www.sabiright.ng').replace(/\/+$/, '');
    const customerEmail = profile.email || `${profile.channel || 'bot'}-${userId}@sabiright.com`;
    const customerName = profile.display_name || profile.fullName || 'Citizen';

    let checkoutUrl = '';
    let providerReference = txRef;
    let providerMetadata: Record<string, string> = {};

    if (provider === 'flutterwave') {
      const secretKey = chosenMethod.secretKey || process.env.FLUTTERWAVE_SECRET_KEY;
      if (!secretKey) return { error: 'Flutterwave secret key is not configured.' };

      const fwRes = await fetch('https://api.flutterwave.com/v3/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tx_ref: txRef,
          amount,
          currency: 'NGN',
          redirect_url: `${appUrl}/api/payments/flutterwave/callback`,
          customer: {
            email: customerEmail,
            phonenumber: profile.phone_number || '',
            name: customerName
          },
          customizations: {
            title: 'SabiRight',
            description: title
          },
          meta: {
            paymentId: payment.id,
            userId,
            type,
            ...metadata
          }
        })
      });

      const fwData = await fwRes.json().catch(() => ({}));
      if (fwData?.status === 'success' && fwData.data?.link) {
        checkoutUrl = fwData.data.link;
      } else {
        return { error: fwData?.message || 'Failed to generate Flutterwave checkout link.' };
      }
    } else if (provider === 'bachs') {
      const secretKey = chosenMethod.secretKey || process.env.BACHS_SECRET_KEY;
      if (!secretKey) return { error: 'Bachs secret key is not configured.' };

      const isSandbox = ((chosenMethod as any).metadata as any)?.isSandbox || secretKey.startsWith('sk_sandbox_');
      const baseUrl = isSandbox ? 'https://sandbox-api.bachs.io' : 'https://api.bachs.io';

      const bachsRes = await fetch(`${baseUrl}/v1/checkout-sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pricing: { amount: Number(amount).toFixed(2), currency: 'NGN' },
          customer: { email: customerEmail, name: customerName },
          success_url: `${appUrl}/api/payments/bachs/callback?payment_id=${payment.id}&tx_ref=${txRef}`,
          cancel_url: `${appUrl}/app?payment=cancelled`,
          reference: txRef,
          metadata: { paymentId: payment.id, userId, type, reference: txRef, ...metadata }
        })
      });

      const bachsData = await bachsRes.json().catch(() => ({}));
      const checkoutUrlResponse = bachsData?.checkout_url || bachsData?.data?.checkout_url;
      const sessionId = bachsData?.checkout_id || bachsData?.data?.checkout_id || bachsData?.data?.id || bachsData?.id;
      if (bachsRes.ok && checkoutUrlResponse && sessionId) {
        checkoutUrl = checkoutUrlResponse;
        providerReference = String(sessionId);
        providerMetadata = { bachsSessionId: String(sessionId) };
      } else {
        const providerError = typeof bachsData?.error === 'string'
          ? bachsData.error
          : bachsData?.error?.message;
        console.error(`[Bachs] Bot checkout creation failed (${bachsRes.status}):`, bachsData);
        return { error: bachsData?.message || providerError || 'Bachs did not return a valid checkout URL and session ID.' };
      }
    } else if (provider === 'paystack') {
      const secretKey = chosenMethod.secretKey || process.env.PAYSTACK_SECRET_KEY;
      const publicKey = chosenMethod.publicKey || '';
      if (!secretKey) return { error: 'Paystack secret key is not configured.' };

      const paystack = new PaystackService({ secretKey, publicKey });
      const pRes = await paystack.initializePayment({
        email: customerEmail,
        amount: Math.round(amount * 100),
        reference: txRef,
        currency: 'NGN',
        callback_url: `${appUrl}/api/payments/paystack/callback`,
        metadata: { paymentId: payment.id, userId, type, ...metadata }
      });

      if (pRes?.status && pRes.data?.authorization_url) {
        checkoutUrl = pRes.data.authorization_url;
      } else {
        return { error: pRes?.message || 'Failed to generate Paystack checkout link.' };
      }
    }

    await storage.updatePayment(payment.id, {
      providerRef: providerReference,
      metadata: {
        ...((payment.metadata as any) || {}),
        checkoutUrl,
        ...providerMetadata
      }
    });

    return { checkoutUrl, title, price: amount, credits };
  } catch (err: any) {
    console.error('[generateBotCheckoutLink] error:', err);
    return { error: err.message || 'Payment initiation failed' };
  }
}

async function loadHistory(userId: string): Promise<ChatTurn[]> {
  const cached = userChatBuffers.get(userId);
  if (cached) return cached;
  const { data, error } = await supabase.from('bot_sessions').select('history').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  const history: ChatTurn[] = data && Array.isArray(data.history) ? data.history.slice(-20) : [];
  userChatBuffers.set(userId, history);
  return history;
}

async function saveHistory(userId: string, history: ChatTurn[]): Promise<void> {
  const { error } = await supabase.from('bot_sessions').upsert({
    user_id: userId,
    history: history.slice(-20),
    updated_at: new Date().toISOString()
  });
  if (error) throw error;
}

interface RankedProfessional {
  pro: any;
  travelTimeMinutes?: number;
  travelDistanceKm?: number;
  trafficAware?: boolean;
}

interface ProfessionalSearchResult {
  results: RankedProfessional[];
  travelTimeUnavailable: boolean;
  trafficDataUnavailable: boolean;
}

async function searchNearbyProfessionals(
  role: string = 'lawyer',
  userLocation?: { latitude: number; longitude: number },
  userCity?: string | null
): Promise<ProfessionalSearchResult> {
  const pool = await storage.getProfessionals({ role, verified: true, status: 'active' });
  const ranked: RankedProfessional[] = pool.map(pro => ({ pro }));
  const city = userCity?.trim().toLocaleLowerCase();
  ranked.sort((a, b) => {
    const aCity = String(a.pro.location?.city || '').toLocaleLowerCase();
    const bCity = String(b.pro.location?.city || '').toLocaleLowerCase();
    const aCityMatch = !!city && aCity.includes(city);
    const bCityMatch = !!city && bCity.includes(city);
    if (aCityMatch !== bCityMatch) return aCityMatch ? -1 : 1;
    return (b.pro.rating || 0) - (a.pro.rating || 0);
  });

  if (!userLocation || !Number.isFinite(userLocation.latitude) || !Number.isFinite(userLocation.longitude)) {
    return { results: ranked, travelTimeUnavailable: true, trafficDataUnavailable: true };
  }

  const mapsSetting = await storage.getAdminSetting('google_maps_api_key');
  const apiKey = mapsSetting?.value || process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return { results: ranked, travelTimeUnavailable: true, trafficDataUnavailable: true };

  const candidates = ranked.filter(({ pro }) =>
    Number.isFinite(pro.location?.latitude) && Number.isFinite(pro.location?.longitude)
  );
  if (candidates.length === 0) return { results: ranked, travelTimeUnavailable: true, trafficDataUnavailable: true };

  const byEta: RankedProfessional[] = [];
  let trafficDataUnavailable = false;
  for (let start = 0; start < candidates.length; start += 25) {
    const batch = candidates.slice(start, start + 25);
    const params = new URLSearchParams({
      origins: `${userLocation.latitude},${userLocation.longitude}`,
      destinations: batch.map(({ pro }) => `${pro.location.latitude},${pro.location.longitude}`).join('|'),
      mode: 'driving',
      departure_time: 'now',
      traffic_model: 'best_guess',
      key: apiKey
    });
    const response = await fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?${params}`, {
      signal: AbortSignal.timeout(10_000)
    });
    if (!response.ok) throw new Error(`Google Maps travel-time request failed (${response.status})`);
    const matrix = await response.json() as {
      status?: string;
      error_message?: string;
      rows?: Array<{ elements?: Array<{
        status?: string;
        duration_in_traffic?: { value?: number };
        duration?: { value?: number };
        distance?: { value?: number };
      }> }>;
    };
    if (matrix.status !== 'OK') {
      throw new Error(`Google Maps travel-time lookup failed: ${matrix.error_message || matrix.status || 'unknown status'}`);
    }

    const elements = matrix.rows?.[0]?.elements || [];
    for (const [index, { pro }] of batch.entries()) {
      const element = elements[index];
      const trafficSeconds = element?.duration_in_traffic?.value;
      const seconds = trafficSeconds ?? element?.duration?.value;
      if (trafficSeconds === undefined) trafficDataUnavailable = true;
      if (element?.status !== 'OK' || !Number.isFinite(seconds)) continue;
      byEta.push({
        pro,
        travelTimeMinutes: Math.ceil(Number(seconds) / 60),
        travelDistanceKm: Number.isFinite(element.distance?.value)
          ? Math.round(Number(element.distance?.value) / 100) / 10
          : undefined,
        trafficAware: trafficSeconds !== undefined
      });
    }
  }
  byEta.sort((a, b) => a.travelTimeMinutes! - b.travelTimeMinutes!);
  return { results: byEta, travelTimeUnavailable: false, trafficDataUnavailable };
}

const LINK_COMMAND = /^\/?link\s+([A-Za-z0-9]{6,10})$/i;
const BOT_GREETING = /^(?:hi|hello|hey|hiya|yo|howfa|how\s+far|how\s+far\s+are\s+you|wetin\s+dey|good\s+morning|good\s+afternoon|good\s+evening)[\s.!?,]*$/i;

function isBotGreeting(text: string): boolean {
  return BOT_GREETING.test(text.trim());
}

function getAccountLinkInstructions(isLinked: boolean, channel: IncomingBotMessage['channel']): string {
  if (isLinked) {
    return `✅ Your ${channel} chat is connected to your SabiRight account. Your account credits and chat history are shared here.`;
  }

  const appUrl = (process.env.APP_URL || 'https://www.sabiright.ng').replace(/\/+$/, '');
  return [
    `🔗 Connect this ${channel} chat to SabiRight`,
    `Sign in or register at ${appUrl}/auth/login, then generate a code in ${appUrl}/app/settings.`,
    'Send the code here as: link CODE. Each code links one bot; generate another to connect your other channel.'
  ].join('\n\n');
}

async function handleLinkCommand(msg: IncomingBotMessage, code: string): Promise<BotResponse> {
  const currentProfile = await resolveBotProfile(msg);
  const { data: result, error } = await supabase.rpc('link_bot_channel', {
    p_code: code.toUpperCase(),
    p_channel: msg.channel,
    p_channel_user_id: msg.channelUserId,
    p_guest_user_id: currentProfile?.is_guest ? msg.channelUserId : null
  });
  if (error) {
    console.error(`[BotController] transactional channel linking failed event=${msg.eventId || 'unknown'}:`, error);
    return {
      text: `⚠️ I could not reach the account-linking service just now. Your code was not confirmed as used. Please wait a moment and send \`link CODE\` again. If this keeps happening, contact SabiRight support with reference ${msg.eventId || 'unavailable'}.`
    };
  }
  if (!result?.success) {
    return { text: '⚠️ That code is invalid or expired, or it belongs to a different account. Generate a new code in SabiRight settings and try again.' };
  }

  userChatBuffers.delete(msg.channelUserId);
  if (result.user_id) userChatBuffers.delete(result.user_id);
  if (result.already_linked) return { text: '✅ This chat is already linked to that SabiRight account.' };
  return {
    text: `✅ Account linked successfully. Your chat history and case records were moved to your SabiRight account (${result.migrated_case_files || 0} case files, ${result.migrated_bookings || 0} bookings).`
  };
}

async function handleUnlinkCommand(msg: IncomingBotMessage): Promise<BotResponse> {
  const { data: link, error: lookupError } = await supabase
    .from('channel_links')
    .select('user_id')
    .eq('channel', msg.channel)
    .eq('channel_user_id', msg.channelUserId)
    .maybeSingle();
  if (lookupError) throw lookupError;

  if (!link) {
    return {
      text: 'ℹ️ This chat is not linked to any web account. You are operating as a guest.',
      quickActions: [
        { id: 'link', title: '🔗 Link Account', payload: 'ACTION_LINK' },
        { id: 'start', title: '🏠 Main Menu', payload: 'ACTION_START' }
      ]
    };
  }

  const { error } = await supabase
    .from('channel_links')
    .delete()
    .eq('channel', msg.channel)
    .eq('channel_user_id', msg.channelUserId);

  if (error) {
    console.error('[BotController] Unlink error:', error);
    return { text: '⚠️ Could not disconnect your account right now. Please try again.' };
  }

  userChatBuffers.delete(link.user_id);
  userChatBuffers.delete(msg.channelUserId);

  return {
    text: '✅ Your chat has been unlinked from your SabiRight account. You are now operating as a guest.',
    quickActions: [
      { id: 'link', title: '🔗 Reconnect Account', payload: 'ACTION_LINK' },
      { id: 'start', title: '🏠 Main Menu', payload: 'ACTION_START' }
    ]
  };
}

export async function resolveBotProfile(msg: IncomingBotMessage): Promise<any | null> {
  const { channel, channelUserId } = msg;
  const { data: link, error: linkError } = await supabase
    .from('channel_links')
    .select('user_id')
    .eq('channel', channel)
    .eq('channel_user_id', channelUserId)
    .maybeSingle();
  if (linkError) throw linkError;
  if (link?.user_id) {
    const { data: linked, error } = await supabase.from('profiles').select('*').eq('id', link.user_id).maybeSingle();
    if (error) throw error;
    if (linked) return linked;
    throw new Error('Channel link points to a missing SabiRight profile');
  }

  const { data: guest, error: guestError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', channelUserId)
    .eq('is_guest', true)
    .maybeSingle();
  if (guestError) throw guestError;
  return guest || null;
}

async function createBotGuestProfile(msg: IncomingBotMessage): Promise<any> {
  let profile = await resolveBotProfile(msg);
  if (!profile) {
    const newProfile = {
      id: msg.channelUserId,
      channel: msg.channel,
      channel_id: msg.channelUserId,
      display_name: msg.userName || `${msg.channel.toUpperCase()} Citizen`,
      phone_number: msg.phoneNumber || null,
      city: null,
      state: null,
      language: 'English',
      is_admin: false,
      is_vendor: false,
      is_guest: true,
      email_verified: false,
      email_verification_status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const { error: insertErr } = await supabase.from('profiles').insert(newProfile);
    if (insertErr && insertErr.code !== '23505') {
      console.error('[BotController] Explicit guest profile creation failed:', insertErr);
      throw insertErr;
    }
    profile = await resolveBotProfile(msg);
    if (!profile) throw new Error('Guest profile could not be read after creation');
  }

  if (profile.id === msg.channelUserId && profile.is_guest) {
    const subscription = await storage.getUserSubscription(msg.channelUserId);
    if (!subscription) {
      const activated = await storage.activatePlan(msg.channelUserId, 'free');
      if (!activated) throw new Error('Could not activate the guest account plan');
    }
  }
  return profile;
}

export async function getBotLanguage(channel: IncomingBotMessage['channel'], channelUserId: string): Promise<string> {
  const { data: link, error: linkError } = await supabase
    .from('channel_links')
    .select('user_id')
    .eq('channel', channel)
    .eq('channel_user_id', channelUserId)
    .maybeSingle();
  if (linkError) throw linkError;
  const userId = link?.user_id || channelUserId;
  const { data: profile, error } = await supabase.from('profiles').select('language').eq('id', userId).maybeSingle();
  if (error) throw error;
  return profile?.language || 'English';
}

async function refundBotCredit(userId: string, amount: number, idempotencyKey: string): Promise<void> {
  const { data, error } = await supabase.rpc('refund_bot_credits_once', {
    p_user_id: userId,
    p_amount: amount,
    p_feature: 'civic_guard',
    p_idempotency_key: `${idempotencyKey}:refund`
  });
  if (error) throw error;
  if (data !== true) throw new Error('Bot credit refund was not applied');
}

// Serialise messages per user so rapid-fire messages cannot race on credits or history.
const userLocks = new Map<string, Promise<unknown>>();
export async function processBotMessage(msg: IncomingBotMessage): Promise<BotResponse> {
  const key = msg.channelUserId;
  const prev = userLocks.get(key) || Promise.resolve();
  const run = prev.catch(() => {}).then(() => handleBotMessage(msg));
  userLocks.set(key, run);
  try {
    return await run;
  } finally {
    if (userLocks.get(key) === run) userLocks.delete(key);
  }
}

async function handleBotMessage(msg: IncomingBotMessage): Promise<BotResponse> {
  const linkMatch = (msg.text || '').trim().match(LINK_COMMAND);
  if (linkMatch) return handleLinkCommand(msg, linkMatch[1]);

  const rawText = (msg.text || '').trim();
  const payload = msg.actionPayload;
  let profile = await resolveBotProfile(msg);
  if (!profile && payload === 'ACTION_CONTINUE_GUEST') {
    profile = await createBotGuestProfile(msg);
  }
  if (!profile && !payload) {
    profile = await createBotGuestProfile(msg);
  }
  if (!profile) {
    const appUrl = (process.env.APP_URL || 'https://www.sabiright.ng').replace(/\/+$/, '');
    return {
      text: `To register or sign in, open ${appUrl}/auth/login?mode=register. You can also continue as a guest using the option below.`,
      quickActions: [
        { id: 'register', title: 'Register / Sign in', payload: 'ACTION_REGISTER', url: `${appUrl}/auth/login?mode=register` },
        { id: 'guest', title: 'Continue as Guest', payload: 'ACTION_CONTINUE_GUEST' }
      ]
    };
  }

  const userId = profile.id;
  const userLang = profile.language || 'English';
  const isLinked = profile.id !== msg.channelUserId;

  if (msg.location) {
    const { error } = await supabase.from('profiles').update({
      bot_location_latitude: msg.location.latitude,
      bot_location_longitude: msg.location.longitude,
      bot_location_updated_at: new Date().toISOString()
    }).eq('id', userId);
    if (error) throw error;
    profile.bot_location_latitude = msg.location.latitude;
    profile.bot_location_longitude = msg.location.longitude;
    return {
      text: '✅ Location received and saved for travel-time matching. Choose a professional category or send `/lawyer` to search.',
      quickActions: [
        { id: 'directory', title: '📂 Find Professionals', payload: 'ACTION_DIRECTORY' },
        { id: 'lawyer', title: '👨‍⚖️ Find Lawyers', payload: 'ACTION_LAWYER' },
        { id: 'clear_location', title: 'Clear Saved Location', payload: 'ACTION_CLEAR_LOCATION' }
      ]
    };
  }

  if (/^\/?location\s+clear$/i.test(rawText) || payload === 'ACTION_CLEAR_LOCATION') {
    const { error } = await supabase.from('profiles').update({
      bot_location_latitude: null,
      bot_location_longitude: null,
      bot_location_updated_at: null
    }).eq('id', userId);
    if (error) throw error;
    return { text: '✅ Your saved location has been cleared. Share a new location whenever you want travel-time matching.' };
  }

  const history = await loadHistory(userId);
  const priorAnswer = msg.eventId && history.find(turn => turn.role === 'ai' && turn.eventId === msg.eventId);
  if (priorAnswer) return { text: priorAnswer.content };
  if (rawText && !msg.actionPayload && (!msg.eventId || !history.some(turn => turn.eventId === msg.eventId))) {
    history.push({ role: 'user', content: rawText, eventId: msg.eventId });
    if (history.length > 20) history.shift();
  }

  if (payload === 'ACTION_URGENT' || rawText.toLowerCase() === '/urgent') {
    return {
      text: `🚨 *URGENT EMERGENCY MODE ACTIVATED*\n\n` +
        `Prioritize your immediate safety. If you can do so safely, move to a public or safer place and contact local emergency services or someone you trust.\n\n` +
        `• Keep your voice calm and avoid sudden movements or physical confrontation.\n` +
        `• If detained or unsure of your rights, ask to contact a lawyer or trusted person. The legal position depends on the circumstances.\n\n` +
        `Describe what is happening, or tap below to find a lawyer:`,
      quickActions: [
        { id: 'lawyer', title: '👨‍⚖️ Find Lawyer', payload: 'ACTION_LAWYER' },
        { id: 'lang', title: '🌐 Language', payload: 'ACTION_LANG' }
      ]
    };
  }
  if (payload === 'ACTION_LINK' || /^\/?link$/i.test(rawText)) {
    return {
      text: getAccountLinkInstructions(isLinked, msg.channel),
      quickActions: [
        { id: 'start', title: '🏠 Main Menu', payload: 'ACTION_START' },
        { id: 'balance', title: '💳 Check Credits', payload: 'ACTION_BALANCE' }
      ]
    };
  }
  // Professional Search & Category Discovery
  if (payload === 'ACTION_DIRECTORY' || rawText.toLowerCase() === '/directory' || rawText.toLowerCase() === '/professionals') {
    return {
      text: `📂 *Verified Professional Directory*\n\n` +
        `Choose a category to find verified practitioners near you:`,
      quickActions: [
        { id: 'cat_lawyer', title: '👨‍⚖️ Lawyers', payload: 'PROS_ROLE_lawyer' },
        { id: 'cat_cac', title: '🏢 CAC Agents', payload: 'PROS_ROLE_cac_agent' },
        { id: 'cat_tax', title: '📊 Tax Agents', payload: 'PROS_ROLE_tax_agent' },
        { id: 'cat_acc', title: '💼 Accountants', payload: 'PROS_ROLE_accountant' },
        { id: 'menu', title: '🏠 Main Menu', payload: 'ACTION_START' }
      ]
    };
  }

  const moreMatch = rawText.match(/^\/?more\s+(lawyer|cac_agent|tax_agent|accountant)\s+(\d+)$/i);
  if (
    payload === 'ACTION_LAWYER' ||
    rawText.toLowerCase() === '/lawyer' ||
    payload?.startsWith('PROS_ROLE_') ||
    !!moreMatch
  ) {
    const role = moreMatch
      ? moreMatch[1].toLowerCase()
      : payload?.startsWith('PROS_ROLE_') ? payload.replace('PROS_ROLE_', '') : 'lawyer';
    const offset = moreMatch ? Math.max(0, Number(moreMatch[2])) : 0;
    const location = Number.isFinite(profile.bot_location_latitude) && Number.isFinite(profile.bot_location_longitude)
      ? { latitude: profile.bot_location_latitude, longitude: profile.bot_location_longitude }
      : undefined;
    const search = await searchNearbyProfessionals(role, location, profile.city);
    const ranked = search.results;
    const topThree = ranked.slice(offset, offset + 3);

    if (topThree.length === 0) {
      const locationText = profile.city ? ` in ${profile.city}` : '';
      return {
        text: `🔍 *No Verified ${role.replace('_', ' ').toUpperCase()}s Found${locationText}*\n\n` +
          (ranked.length > 0
            ? 'There are no more results in this set. Open the SabiRight directory for the full list.'
            : `There are currently no verified, active ${role.replace('_', ' ')}s listed.\n\n` +
              'Share your GPS location for travel-time ranking, or open the full directory on the SabiRight web app.'),
        quickActions: [
          { id: 'all_pros', title: '📂 Other Categories', payload: 'ACTION_DIRECTORY' },
          { id: 'urgent', title: '🚨 Urgent Mode', payload: 'ACTION_URGENT' },
          { id: 'menu', title: '🏠 Main Menu', payload: 'ACTION_START' }
        ]
      };
    }

    const proListText = topThree.map((item, idx) => {
      const p = item.pro;
      const cleanPhone = (p.phoneNumber || '').replace(/[^0-9]/g, '');
      const waLink = cleanPhone ? ` | [Chat on WhatsApp](https://wa.me/${cleanPhone})` : '';
      const routeInfo = item.travelTimeMinutes !== undefined
        ? ` (~${item.travelTimeMinutes} min drive${item.travelDistanceKm !== undefined ? `, ${item.travelDistanceKm} km` : ''})`
        : '';
      const loc = p.location?.city || p.location?.state || 'Nigeria';
      return `*${idx + 1 + offset}. ${p.displayName || 'Verified Practitioner'}*\n` +
        `📍 Location: ${loc}${routeInfo}\n` +
        `📞 Contact: ${p.phoneNumber || 'Available upon booking'}${waLink}\n` +
        `⭐ Rating: ${p.reviewCount ? `${p.rating}/5.0 (${p.reviewCount} reviews)` : 'Not yet rated'}\n` +
        `👉 _To connect, tap below: Connect with #${idx + 1 + offset}_`;
    }).join('\n\n');

    const connectActions = topThree.map((item, idx) => ({
      id: `book_${item.pro.id}`.slice(0, 64),
      title: `🤝 Connect #${idx + 1 + offset}`.slice(0, 20),
      payload: `BOOK_PRO_${item.pro.id}`
    }));
    const nextPage = offset + topThree.length;

    return {
      text: `⚖️ *Verified ${role.replace('_', ' ').toUpperCase()} Directory*\n\n` +
        `Here are the verified practitioners found for you:\n\n` +
        `${proListText}\n\n` +
        (search.travelTimeUnavailable
          ? '_Traffic-aware driving times are unavailable. Share a location and configure Google Maps routing for ETA ranking._\n\n'
          : search.trafficDataUnavailable
            ? '_Live traffic data was unavailable for some routes; those results use the standard driving duration._\n\n'
            : '') +
        (nextPage < ranked.length ? `To see more results, send \`/more ${role} ${nextPage}\`.\n\n` : '') +
        `_Your case brief will ONLY be shared with a practitioner after you tap to connect._`,
      quickActions: [
        ...connectActions,
        { id: 'categories', title: '📂 Categories', payload: 'ACTION_DIRECTORY' }
      ]
    };
  }

  // Explicit Consent-Based Lead Creation
  if (payload?.startsWith('BOOK_PRO_')) {
    const targetProId = payload.replace('BOOK_PRO_', '');
    const matchedPro = await storage.getProfessionalById(targetProId);

    if (!matchedPro || matchedPro.status !== 'active' || !matchedPro.verified || !matchedPro.userId) {
      return {
        text: '⚠️ That professional is no longer available in the verified directory. Please search again.',
        quickActions: [{ id: 'lawyer', title: '👨‍⚖️ Find Lawyer', payload: 'ACTION_LAWYER' }]
      };
    }

    let caseSummary = "Citizen enquiry via bot.";
    try {
      if (history.length > 0) {
        caseSummary = await summarizeCaseForProfessional(history, userId);
      }
    } catch (e) {
      console.error("[BotController] Summarization error:", e);
    }

    const requestKey = msg.eventId || crypto.randomUUID();
    const suffix = crypto.createHash('sha256').update(`${msg.channel}:${requestKey}`).digest('hex').slice(0, 24);
    const caseRef = `CASE-${suffix.slice(0, 10).toUpperCase()}`;
    const caseFileId = `cf-${suffix}`;
    const bookingId = `bk-${suffix}`;
    const { data: lead, error: leadError } = await supabase.rpc('create_bot_professional_lead', {
      p_case_file_id: caseFileId,
      p_case_ref: caseRef,
      p_booking_id: bookingId,
      p_user_id: userId,
      p_professional_id: matchedPro.id,
      p_channel: msg.channel,
      p_summary: caseSummary.slice(0, 500),
      p_raw_chat_history: history,
      p_contact_phone: msg.phoneNumber || profile.phone_number || ''
    });
    if (leadError) {
      console.error('[BotController] Professional lead creation failed:', leadError);
      throw leadError;
    }
    if (!lead?.success || !lead.eligible) {
      return {
        text: '⚠️ This professional is no longer accepting new enquiries. Please choose someone else from the directory.',
        quickActions: [{ id: 'lawyer', title: '🔍 Search Directory', payload: 'ACTION_LAWYER' }]
      };
    }

    if (lead.created) {
      await storage.sendNotification({
        userId: matchedPro.userId,
        type: 'new_case_lead',
        title: `🚨 New Case Lead (${caseRef})`,
        message: `A client from ${msg.channel.toUpperCase()} selected you for a new professional enquiry.`,
        data: { caseRef, caseFileId, bookingId }
      });
    }

    const cleanPhone = (matchedPro.phoneNumber || '').replace(/[^0-9]/g, '');
    const waLink = cleanPhone ? `\n💬 *WhatsApp Direct:* https://wa.me/${cleanPhone}` : '';

    return {
      text: `✅ *Pre-Case File Dispatched! (Ref: ${caseRef})*\n\n` +
        `Your case summary has been sent directly to *${matchedPro.displayName || 'Advocate'}*.\n\n` +
        `• *Phone:* ${matchedPro.phoneNumber || 'Listed upon contact'}${waLink}\n` +
        `• *Booking ID:* ${bookingId}\n\n` +
        `You can check the status of your bookings anytime with */bookings*.\n\n` +
        `_Note: SabiRight charges zero fees. You agree on consultation terms directly with your advocate._`,
      quickActions: [
        { id: 'bookings', title: '📋 My Bookings', payload: 'ACTION_BOOKINGS' },
        { id: 'menu', title: '🏠 Main Menu', payload: 'ACTION_START' }
      ]
    };
  }

  if (payload === 'ACTION_LANG' || rawText.toLowerCase() === '/language') {
    return {
      text: `🌐 *Select Your Preferred Language:*\n\n` +
        `Choose the language you would like SabiRight to respond in:`,
      quickActions: [
        { id: 'pidgin', title: 'Nigerian Pidgin 🇳🇬', payload: 'SET_LANG_PIDGIN' },
        { id: 'hausa', title: 'Hausa 🇳🇬', payload: 'SET_LANG_HAUSA' },
        { id: 'yoruba', title: 'Yoruba 🇳🇬', payload: 'SET_LANG_YORUBA' },
        { id: 'igbo', title: 'Igbo \u{1F1F3}\u{1F1EC}', payload: 'SET_LANG_IGBO' },
        { id: 'english', title: 'English', payload: 'SET_LANG_ENGLISH' }
      ]
    };
  }

  if (payload?.startsWith('SET_LANG_')) {
    const langMap: Record<string, string> = {
      'SET_LANG_PIDGIN': 'Nigerian Pidgin',
      'SET_LANG_HAUSA': 'Hausa',
      'SET_LANG_YORUBA': 'Yoruba',
      'SET_LANG_IGBO': 'Igbo',
      'SET_LANG_ENGLISH': 'English'
    };
    const targetLang = langMap[payload] || 'English';
    await supabase.from('profiles').update({ language: targetLang, updated_at: new Date().toISOString() }).eq('id', userId);

    return {
      text: `✅ Language updated to *${targetLang}*. How may I help you with your civic enquiry today?`,
      quickActions: [
        { id: 'urgent', title: '🚨 Urgent Mode', payload: 'ACTION_URGENT' },
        { id: 'lawyer', title: '👨‍⚖️ Find Lawyer', payload: 'ACTION_LAWYER' }
      ]
    };
  }

  if (rawText.toLowerCase() === '/balance' || rawText.toLowerCase() === '/credits' || rawText.toLowerCase() === 'balance' || rawText.toLowerCase() === 'credits' || payload === 'ACTION_BALANCE') {
    const balance = await storage.getBalance(userId);
    const sub = await storage.getUserSubscription(userId);
    const isLinked = profile.id !== msg.channelUserId;

    const linkInfo = isLinked
      ? `🔗 *Account:* Linked to SabiRight account (${profile.email || profile.display_name || 'Citizen'})\n`
      : `📱 *Account:* Channel-only\n_Tip: Link your account via SabiRight Web/Mobile (Profile > Link WhatsApp/Telegram) to share your credits everywhere._\n`;

    return {
      text: `💳 *SabiRight Credit & Plan Status*\n\n` +
        `• *Available Credits:* ${balance.availableCredits}\n` +
        `• *Plan Allowance:* ${balance.planCredits}\n` +
        `• *Used This Period:* ${balance.usedCredits}\n` +
        `• *Current Plan:* ${(sub?.planId || balance.planName || 'Free').toUpperCase()}\n` +
        (balance.renewalDate ? `• *Next Renewal:* ${new Date(balance.renewalDate).toLocaleDateString()}\n` : '') +
        `\n${linkInfo}\n` +
        `Ask any legal or civic question, or choose an option below:`,
      quickActions: [
        { id: 'topup', title: '💳 Top Up Credits', payload: 'ACTION_TOPUP' },
        { id: 'urgent', title: '🚨 Urgent Mode', payload: 'ACTION_URGENT' },
        { id: 'lawyer', title: '👨‍⚖️ Find Lawyer', payload: 'ACTION_LAWYER' },
        { id: 'lang', title: '🌐 Language', payload: 'ACTION_LANG' }
      ]
    };
  }

  if (rawText.toLowerCase() === '/topup' || rawText.toLowerCase() === '/packages' || payload === 'ACTION_TOPUP') {
    const pkgs = await storage.getCreditPackages();
    let pkgList = "";
    const quickActions: any[] = [];

    pkgs.forEach((p: any, idx: number) => {
      const credits = Number(p.credits) + Number(p.bonus || 0);
      pkgList += `• *${idx + 1}. ${p.name}:* ${credits} Credits — *₦${Number(p.price).toLocaleString()}*\n  _To buy: type_ \`/buy ${p.id}\`\n\n`;
      if (idx < 3) {
        quickActions.push({
          id: `buy_${p.id}`,
          title: `₦${Number(p.price).toLocaleString()} (${credits} cr)`,
          payload: `BUY_${p.id}`
        });
      }
    });

    return {
      text: `💳 *SabiRight Credit Packages*\n\n` +
        `Top up extra credits instantly. Your balance updates automatically upon payment:\n\n` +
        `${pkgList}` +
        `Tap an option below to receive your direct checkout link:`,
      quickActions: [
        ...quickActions,
        { id: 'balance', title: '💳 Balance', payload: 'ACTION_BALANCE' }
      ]
    };
  }

  if (rawText.toLowerCase().startsWith('/buy') || payload?.startsWith('BUY_')) {
    const rawTarget = payload ? payload.replace('BUY_', '') : rawText.replace(/^\/buy\s*/i, '').trim();
    const linkRes = await generateBotCheckoutLink(profile, 'credit_purchase', rawTarget || undefined);
    if ('error' in linkRes) {
      return {
        text: `⚠️ *Payment Notice:*\n${linkRes.error}\n\nYou can also manage your wallet directly on web or mobile.`,
        quickActions: [
          { id: 'topup', title: '📦 View Packages', payload: 'ACTION_TOPUP' },
          { id: 'balance', title: '💳 Check Balance', payload: 'ACTION_BALANCE' }
        ]
      };
    }

    return {
      text: `💳 *Secure Checkout Link Generated*\n\n` +
        `• *Package:* ${linkRes.title}\n` +
        `• *Price:* ₦${linkRes.price.toLocaleString()}\n` +
        (linkRes.credits ? `• *Credits Granted:* ${linkRes.credits}\n\n` : '\n') +
        `👉 *Tap the secure link below to complete payment:* \n` +
        `${linkRes.checkoutUrl}\n\n` +
        `⚡ _Payment is processed through our primary verified gateway. Once confirmed, your credits will be activated immediately!_`,
      quickActions: [
        { id: 'balance', title: '💳 Check Balance', payload: 'ACTION_BALANCE' },
        { id: 'lawyer', title: '👨‍⚖️ Find Lawyer', payload: 'ACTION_LAWYER' }
      ]
    };
  }

  if (rawText.toLowerCase() === '/plans' || payload === 'ACTION_PLANS') {
    const plans = await storage.getAllPlans();
    const paidPlans = plans.filter((p: any) => p.type !== 'free');
    let planList = "";
    const quickActions: any[] = [];

    paidPlans.forEach((p: any, idx: number) => {
      planList += `• *${idx + 1}. ${p.name}:* ₦${Number(p.price).toLocaleString()} / ${p.billingCycle || 'month'}\n` +
        `  Allowance: ${p.credits} credits\n` +
        `  _To subscribe: type_ \`/subscribe ${p.id}\`\n\n`;
      if (idx < 3) {
        quickActions.push({
          id: `plan_${p.id}`,
          title: `Subscribe: ${p.name}`,
          payload: `PLAN_${p.id}`
        });
      }
    });

    return {
      text: `👑 *SabiRight Membership Plans*\n\n` +
        `Upgrade your tier to receive regular credit allowances and priority legal tools:\n\n` +
        `${planList}` +
        `Tap an option below to subscribe securely:`,
      quickActions: [
        ...quickActions,
        { id: 'balance', title: '💳 Balance', payload: 'ACTION_BALANCE' }
      ]
    };
  }

  if (rawText.toLowerCase().startsWith('/subscribe') || payload?.startsWith('PLAN_')) {
    const rawTarget = payload ? payload.replace('PLAN_', '') : rawText.replace(/^\/subscribe\s*/i, '').trim();
    const linkRes = await generateBotCheckoutLink(profile, 'subscription', rawTarget || undefined);
    if ('error' in linkRes) {
      return {
        text: `⚠️ *Subscription Notice:*\n${linkRes.error}`,
        quickActions: [
          { id: 'plans', title: '👑 View Plans', payload: 'ACTION_PLANS' },
          { id: 'balance', title: '💳 Check Balance', payload: 'ACTION_BALANCE' }
        ]
      };
    }

    return {
      text: `👑 *Plan Subscription Link Generated*\n\n` +
        `• *Plan:* ${linkRes.title}\n` +
        `• *Price:* ₦${linkRes.price.toLocaleString()}\n\n` +
        `👉 *Tap the secure link below to activate your plan:* \n` +
        `${linkRes.checkoutUrl}\n\n` +
        `⚡ _Your subscription and plan allowances will be activated immediately upon payment confirmation._`,
      quickActions: [
        { id: 'balance', title: '💳 Check Balance', payload: 'ACTION_BALANCE' }
      ]
    };
  }

  // Bookings & Case Status Check
  if (rawText.toLowerCase() === '/bookings' || payload === 'ACTION_BOOKINGS') {
    const userBookings = await storage.getBookingsByUserId(userId);
    if (!userBookings || userBookings.length === 0) {
      return {
        text: `📋 *My Case Leads & Bookings*\n\n` +
          `You have no active case leads or professional bookings.\n\n` +
          `• To connect with a verified advocate, type */lawyer* or use the menu.`,
        quickActions: [
          { id: 'lawyer', title: '👨‍⚖️ Find Lawyer', payload: 'ACTION_LAWYER' },
          { id: 'menu', title: '🏠 Main Menu', payload: 'ACTION_START' }
        ]
      };
    }

    const listText = userBookings.slice(0, 5).map((b: any, idx: number) => {
      const statusIcon = b.status === 'confirmed' ? '✅' : b.status === 'completed' ? '🏁' : '⏳';
      const created = b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'Recent';
      return `*${idx + 1}. ${b.title || 'Legal Consultation'}*\n` +
        `• Ref ID: \`${b.id}\`\n` +
        `• Status: ${statusIcon} ${String(b.status).toUpperCase()}\n` +
        `• Date: ${created}\n` +
        `👉 View details: \`/booking ${b.id}\``;
    }).join('\n\n');

    return {
      text: `📋 *Your Case Leads & Bookings (${userBookings.length})*\n\n` +
        `${listText}\n\n` +
        `_To inspect a specific booking, send /booking followed by the Ref ID._`,
      quickActions: [
        { id: 'lawyer', title: '👨‍⚖️ New Booking', payload: 'ACTION_LAWYER' },
        { id: 'balance', title: '💳 Balance', payload: 'ACTION_BALANCE' },
        { id: 'menu', title: '🏠 Main Menu', payload: 'ACTION_START' }
      ]
    };
  }

  // Single Booking Detail Lookup
  if (rawText.toLowerCase().startsWith('/booking ') || payload?.startsWith('VIEW_BOOKING_')) {
    const bookingId = payload ? payload.replace('VIEW_BOOKING_', '') : rawText.replace(/^\/booking\s+/i, '').trim();
    const booking = await storage.getBookingById(bookingId);

    if (!booking || (booking.userId !== userId && booking.vendorId !== userId)) {
      return {
        text: `⚠️ Booking \`${bookingId}\` was not found under your account.`,
        quickActions: [
          { id: 'bookings', title: '📋 My Bookings', payload: 'ACTION_BOOKINGS' },
          { id: 'menu', title: '🏠 Main Menu', payload: 'ACTION_START' }
        ]
      };
    }

    const messages = await storage.getBookingMessages(bookingId, 3).catch(() => []);
    const msgsPreview = messages.length > 0
      ? `\n*Recent Updates:*\n` + messages.map((m: any) => `• _${m.message}_`).join('\n')
      : '';

    return {
      text: `📄 *Booking Details: ${booking.title || 'Legal Consultation'}*\n\n` +
        `• *ID:* \`${booking.id}\`\n` +
        `• *Status:* ${String(booking.status).toUpperCase()}\n` +
        `• *Channel:* ${String(booking.channel || 'web').toUpperCase()}\n` +
        (booking.agreedFee ? `• *Agreed Fee:* ₦${booking.agreedFee}\n` : '') +
        (booking.description ? `• *Case Summary:* ${booking.description.slice(0, 300)}\n` : '') +
        msgsPreview +
        `\n\n_Log in on web/mobile to send direct secure messages on this case._`,
      quickActions: [
        { id: 'bookings', title: '📋 All Bookings', payload: 'ACTION_BOOKINGS' },
        { id: 'menu', title: '🏠 Main Menu', payload: 'ACTION_START' }
      ]
    };
  }

  // Unlink Command
  if (rawText.toLowerCase() === '/unlink' || payload === 'ACTION_UNLINK') {
    return handleUnlinkCommand(msg);
  }

  if (rawText.toLowerCase() === '/help' || payload === 'ACTION_HELP') {
    return {
      text: `⚖️ *SabiRight Civic Assistant Commands*\n\n` +
        `• */start* - Welcome & onboarding choices\n` +
        `• */balance* - Check your credits & active plan\n` +
        `• */topup* - Buy extra credits via direct payment link\n` +
        `• */plans* - View & subscribe to monthly membership plans\n` +
        `• */urgent* - Emergency constitutional advice during stops/checkpoints\n` +
        `• */lawyer* - Find verified nearby legal advocates\n` +
        `• */directory* - Browse professional directory categories\n` +
        `• */bookings* - View your active case leads & booking statuses\n` +
        `• */language* - Change response language (English, Pidgin, Hausa, Yoruba, Igbo)\n` +
        `• *link <CODE>* - Link this chat to your web/mobile account\n` +
        `• */unlink* - Disconnect linked web account and return to guest mode\n\n` +
        `Or simply type your legal question naturally!`,
      quickActions: [
        { id: 'urgent', title: '🚨 Urgent Mode', payload: 'ACTION_URGENT' },
        { id: 'lawyer', title: '👨‍⚖️ Find Lawyer', payload: 'ACTION_LAWYER' },
        { id: 'bookings', title: '📋 Bookings', payload: 'ACTION_BOOKINGS' },
        { id: 'balance', title: '💳 Balance', payload: 'ACTION_BALANCE' }
      ]
    };
  }

  if (
    rawText.toLowerCase() === '/start' ||
    isBotGreeting(rawText) ||
    payload === 'ACTION_START' ||
    payload === 'ACTION_CONTINUE_GUEST'
  ) {
    const appUrl = (process.env.APP_URL || 'https://www.sabiright.ng').replace(/\/+$/, '');
    const accountStatusText = isLinked
      ? `✅ *Account Status:* Connected to SabiRight account (${profile.email || profile.display_name || 'Citizen'})`
      : `👤 *Account Status:* Operating as Guest\n` +
        `• To connect an existing web account, enter: \`link CODE\`\n` +
        `• To create a full account, register at: ${appUrl}/auth/login?mode=register\n` +
        `• Or continue directly as a guest with free introductory access below.`;

    return {
      text: `👋 Hello ${profile.display_name || msg.userName || 'Citizen'}! I'm Sabi, your Nigerian civic and legal first-aid assistant.\n\n` +
        `${isLinked ? '✅ Your SabiRight account is connected.' : `You are using guest chat. To sync account credits and history, open ${appUrl}/app/settings and send the generated code here as: link CODE.`}\n\n` +
        `Ask a question or choose an option:`,
      quickActions: [
        { id: 'urgent', title: '🚨 Urgent Mode', payload: 'ACTION_URGENT' },
        { id: 'lawyer', title: '👨‍⚖️ Find Lawyer', payload: 'ACTION_LAWYER' },
        { id: 'balance', title: '💳 Credits', payload: 'ACTION_BALANCE' },
        { id: 'link', title: isLinked ? '🔗 Account Info' : '🔗 Link Account', payload: 'ACTION_LINK' }
      ]
    };
  }

  // Unified Credit Verification & Dynamic Cost
  const [balance, costSetting] = await Promise.all([
    storage.getBalance(userId),
    storage.getAdminSetting('credit_cost_ai_query')
  ]);
  const parsedCost = Number(costSetting?.value ?? 1);
  const cost = Math.max(1, Math.ceil(Number.isFinite(parsedCost) ? parsedCost : 1));

  if (balance.availableCredits < cost) {
    return {
      text: `⚠️ *Insufficient Credits*\n\n` +
        `You have ${balance.availableCredits} credit(s) available, but this enquiry requires ${cost}.\n\n` +
        `You can buy extra credits below with one tap, or connect directly with an advocate:`,
      quickActions: [
        { id: 'topup', title: '💳 Buy Credits', payload: 'ACTION_TOPUP' },
        { id: 'balance', title: '💳 Check Balance', payload: 'ACTION_BALANCE' },
        { id: 'lawyer', title: '👨‍⚖️ Connect Lawyer', payload: 'ACTION_LAWYER' }
      ]
    };
  }

  const creditKey = `bot-ai:${crypto.createHash('sha256').update(`${msg.channel}:${msg.eventId || crypto.randomUUID()}`).digest('hex')}`;
  const { data: charged, error: chargeError } = await supabase.rpc('deduct_bot_credits_once', {
    p_user_id: userId,
    p_amount: cost,
    p_feature: 'civic_guard',
    p_description: `${msg.channel.toUpperCase()} Civic Query: ${rawText.substring(0, 50)}`,
    p_idempotency_key: creditKey
  });
  if (chargeError) throw chargeError;
  if (!charged) {
    const updatedBalance = await storage.getBalance(userId);
    return {
      text: `⚠️ *Insufficient Credits*\n\n` +
        `You currently have ${updatedBalance.availableCredits} credit(s). Please top up below to continue chatting with AI:`,
      quickActions: [
        { id: 'topup', title: '💳 Buy Credits', payload: 'ACTION_TOPUP' },
        { id: 'balance', title: '💳 Check Balance', payload: 'ACTION_BALANCE' },
        { id: 'lawyer', title: '👨‍⚖️ Connect Lawyer', payload: 'ACTION_LAWYER' }
      ]
    };
  }

  const safetyConcern = /\b(?:police|officer|checkpoint|arrest|detain(?:ed|tion)?|search(?:ing|ed)?|phone|device|threat|danger|emergency|violence)\b/i.test(rawText);
  const fallbackGuidance = safetyConcern
    ? ' If this involves an immediate physical encounter, prioritize your safety, stay calm, avoid physical confrontation, and contact someone you trust or local emergency services if needed. I cannot verify the specific legal position right now.'
    : '';

  // Use the configured provider pipeline with a total bot inference deadline.
  try {
    const historyContext = history.slice(0, -1).slice(-6)
      .map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content.slice(0, 400)}`)
      .join('\n');

    let fallbackInstruction = `You are Sabi, SabiRight's friendly, helpful, empathetic civic-tech guide for Nigerians communicating via ${msg.channel.toUpperCase()}. Be clear and cautious; you are not a substitute for advice from a qualified Nigerian lawyer.

PERSONA AND LOCALIZATION:
- You are Sabi, SabiRight's friendly, helpful, empathetic civic-tech guide for Nigeria.
- Understand Nigerian English and common Pidgin expressions such as "Howfa?" Respond naturally in the user's language or selected bot language; do not force slang.
- Acknowledge frustration or distress briefly and respectfully. Use occasional professional emojis only when they improve the tone.
- Format for chat screens with short paragraphs, bold key phrases, and brief bullets. Avoid long walls of text.

STRICT OPERATING RULES:
1. GREETINGS: Respond warmly to a greeting. For all other messages, answer the enquiry directly without repeating the introduction.
2. CIVIC GUIDE & DE-ESCALATION: For physical encounters, prioritize immediate safety and offer only general, non-confrontational steps. Do not guarantee safety or outcomes.
3. SOURCE-BASED LEGAL INFORMATION: Cite a statute, section, quotation, or case only when relevant reference material explicitly supports it. Never guess or fabricate legal citations, statutory wording, legal rights, or outcomes. Reference material may be incomplete or unverified.
4. UNCERTAINTY: If reliable supporting material is unavailable or unclear, say that you cannot verify the legal point; do not fill the gap from memory or present a guess as fact. Recommend checking a current authoritative source or consulting qualified Nigerian counsel.
5. RESPONSE STYLE: Be concise and formatted for chat screens. Use short bullet points when useful; include citations only when supported by the available source.
6. ADVOCATE REFERRAL: If the dispute needs formal representation, inform the user they can type /lawyer to search the professional directory.`;

    if (userLang && userLang.toLowerCase() !== 'english') {
      fallbackInstruction += `\n7. MULTILINGUAL OUTPUT: Conduct the entire response in ${userLang}, using natural phrasing while preserving uncertainty.`;
    }

    const fallbackPrompt = `${fallbackInstruction}

${historyContext ? `Conversation history:\n${historyContext}\n` : ""}
[Location: ${profile.city || profile.state || 'not provided'}]
User: ${rawText}
AI:`;

    let finalResponse = await generateAIResponse(fallbackPrompt, false, {
      maxLatencyMs: BOT_AI_RESPONSE_BUDGET_MS
    }) || '';

    if (!finalResponse) {
      await refundBotCredit(userId, cost, creditKey);
      finalResponse = `I couldn't generate a reliable response to that enquiry. Your credits have been refunded.${fallbackGuidance} Please try again or type /lawyer to find a verified professional.`;
    } else {
      history.push({ role: 'ai', content: finalResponse, eventId: msg.eventId });
      try {
        await saveHistory(userId, history);
      } catch (historyError) {
        console.error('[BotController] Could not persist bot conversation history:', historyError);
      }

      void (async () => {
        const { error: metricError } = await supabase.from('impact_metrics').insert({
          metric_key: 'civic_guidance_delivered',
          city: profile.city || null,
          channel: msg.channel,
          metadata: { length: finalResponse.length },
          created_at: new Date().toISOString()
        });
        if (metricError) console.error('[BotController] Could not record delivered guidance metric:', metricError);
      })().catch(metricError => {
        console.error('[BotController] Could not record delivered guidance metric:', metricError);
      });
    }

    return {
      text: finalResponse,
      quickActions: [
        { id: 'balance', title: '💳 Balance', payload: 'ACTION_BALANCE' },
        { id: 'lawyer', title: '👨‍⚖️ Connect Lawyer', payload: 'ACTION_LAWYER' },
        { id: 'urgent', title: '🚨 Urgent Mode', payload: 'ACTION_URGENT' },
        { id: 'lang', title: '🌐 Language', payload: 'ACTION_LANG' }
      ]
    };
  } catch (error: any) {
    console.error("[BotController] Agent Error:", error);
    let refundNotice = 'The request failed.';
    try {
      await refundBotCredit(userId, cost, creditKey);
      refundNotice = 'Your credits have been refunded.';
    } catch (refundError) {
      console.error('[BotController] Could not confirm bot credit refund:', refundError);
      refundNotice = 'I could not confirm the credit refund; please contact support if your balance does not update.';
    }
    return {
      text: `⚠️ The answer service did not respond in time. ${refundNotice}${fallbackGuidance} You can try again or type /lawyer to look for an advocate in your area.`,
      quickActions: [
        { id: 'lawyer', title: '👨‍⚖️ Find Lawyer', payload: 'ACTION_LAWYER' },
        { id: 'urgent', title: '🚨 Urgent Mode', payload: 'ACTION_URGENT' },
        { id: 'balance', title: '💳 Balance', payload: 'ACTION_BALANCE' }
      ]
    };
  }
}
