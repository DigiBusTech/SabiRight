import { supabase, supabaseStorage as storage } from "../supabaseStorage.js";
import { getLegalAgent, summarizeCaseForProfessional } from "../agent/legalAgent.js";
import { Runner, InMemorySessionService, toStructuredEvents, EventType } from "@google/adk";
import { generateAIResponse, isNAtlasSovereignMode } from "../aiService.js";
import PaystackService from "../paystackService.js";
import type { IncomingBotMessage, BotResponse } from "./types.js";

const botSessionService = new InMemorySessionService();
type ChatTurn = { role: string; content: string };
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
          cancel_url: `${appUrl}/app/wallet?payment=cancelled`,
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
  let history: ChatTurn[] = [];
  try {
    const { data } = await supabase.from('bot_sessions').select('history').eq('user_id', userId).maybeSingle();
    if (data && Array.isArray(data.history)) history = data.history.slice(-20);
  } catch (e) {
    console.error('[BotController] history load failed:', e);
  }
  userChatBuffers.set(userId, history);
  return history;
}

async function saveHistory(userId: string, history: ChatTurn[]): Promise<void> {
  try {
    await supabase.from('bot_sessions').upsert({
      user_id: userId,
      history: history.slice(-20),
      updated_at: new Date().toISOString()
    });
  } catch (e) {
    console.error('[BotController] history save failed:', e);
  }
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

interface RankedProfessional {
  pro: any;
  distanceKm?: number;
}

async function searchNearbyProfessionals(
  role: string = 'lawyer',
  userLocation?: { latitude: number; longitude: number },
  userCity?: string | null
): Promise<RankedProfessional[]> {
  const allVerified = await storage.getProfessionals({ role, verified: true, status: 'active' });
  // Fall back to any verified if none active yet
  const pool = allVerified.length > 0 ? allVerified : await storage.getProfessionals({ role, verified: true });

  const ranked: RankedProfessional[] = pool.map(pro => {
    const pLat = pro.location?.latitude;
    const pLon = pro.location?.longitude;
    let dist: number | undefined;
    if (userLocation && typeof pLat === 'number' && typeof pLon === 'number') {
      dist = haversineDistance(userLocation.latitude, userLocation.longitude, pLat, pLon);
    }
    return { pro, distanceKm: dist };
  });

  ranked.sort((a, b) => {
    if (a.distanceKm !== undefined && b.distanceKm !== undefined) {
      return a.distanceKm - b.distanceKm;
    }
    if (a.distanceKm !== undefined) return -1;
    if (b.distanceKm !== undefined) return 1;

    // Secondary city match
    if (userCity) {
      const aCity = (a.pro.location?.city || '').toLowerCase();
      const bCity = (b.pro.location?.city || '').toLowerCase();
      const target = userCity.toLowerCase();
      if (aCity.includes(target) && !bCity.includes(target)) return -1;
      if (!aCity.includes(target) && bCity.includes(target)) return 1;
    }

    return (b.pro.rating || 0) - (a.pro.rating || 0);
  });

  return ranked;
}

const LINK_COMMAND = /^\/?link\s+([A-Za-z0-9]{6,10})$/i;

function getAccountLinkInstructions(isLinked: boolean): string {
  if (isLinked) {
    return '✅ Your Telegram chat is connected to your SabiRight account. Your account credits and chat history are shared here.';
  }

  const appUrl = (process.env.APP_URL || 'https://www.sabiright.ng').replace(/\/+$/, '');
  return [
    '🔗 Connect this Telegram chat to SabiRight',
    `New to SabiRight? Create an account here: ${appUrl}/auth/login?mode=register`,
    `Already have an account? Sign in here: ${appUrl}/auth/login, then open ${appUrl}/app/settings.`,
    'In Settings, generate a WhatsApp / Telegram link code, then send this bot: link CODE (replace CODE with your one-time code).',
    'You can keep using this bot without linking; linking shares your web-account credits and history.'
  ].join('\n\n');
}

async function handleLinkCommand(msg: IncomingBotMessage, code: string): Promise<BotResponse> {
  const fail = { text: '\u26A0\uFE0F That code is invalid or has expired. Open SabiRight > Profile > Link WhatsApp/Telegram to get a new one.' };
  const { data: row, error: lookupError } = await supabase
    .from('channel_link_codes')
    .select('code, user_id, expires_at, used_at')
    .eq('code', code.toUpperCase())
    .maybeSingle();
  if (lookupError) {
    console.error('[BotController] link-code lookup failed:', lookupError);
    return { text: '⚠️ I could not check that link code right now. Please try again in a moment.' };
  }
  if (!row || row.used_at || new Date(row.expires_at).getTime() < Date.now()) return fail;

  // Mark the code used first (conditional) so it can never be redeemed twice.
  const claimedAt = new Date().toISOString();
  const { data: claimed, error: claimError } = await supabase
    .from('channel_link_codes')
    .update({ used_at: claimedAt })
    .eq('code', row.code)
    .is('used_at', null)
    .gt('expires_at', claimedAt)
    .select('code');
  if (claimError) {
    console.error('[BotController] link-code claim failed:', claimError);
    return { text: '⚠️ I could not verify that link code right now. Please try again in a moment.' };
  }
  if (!claimed || claimed.length === 0) return fail;

  const previousGuestUserId = msg.channelUserId;

  const { error } = await supabase.from('channel_links').upsert({
    channel: msg.channel,
    channel_user_id: msg.channelUserId,
    user_id: row.user_id,
    linked_at: new Date().toISOString()
  });
  if (error) {
    console.error('[BotController] link failed:', error);
    const { error: rollbackError } = await supabase
      .from('channel_link_codes')
      .update({ used_at: null })
      .eq('code', row.code)
      .eq('used_at', claimedAt);
    if (rollbackError) console.error('[BotController] link-code rollback failed:', rollbackError);
    return { text: '\u26A0\uFE0F Could not link your account right now. Please try again.' };
  }

  // Migrate guest records (pre-case files and bookings) to the newly linked real account
  try {
    await supabase.from('pre_case_files').update({ user_id: row.user_id }).eq('user_id', previousGuestUserId);
    await supabase.from('direct_bookings').update({ user_id: row.user_id }).eq('user_id', previousGuestUserId);
  } catch (migErr) {
    console.warn('[BotController] Guest record migration warning:', migErr);
  }

  userChatBuffers.delete(row.user_id);
  userChatBuffers.delete(msg.channelUserId);
  return { text: '\u2705 Account linked successfully! Your credits, chats, and case files now sync with your SabiRight account.' };
}

async function handleUnlinkCommand(msg: IncomingBotMessage): Promise<BotResponse> {
  const { data: link } = await supabase
    .from('channel_links')
    .select('user_id')
    .eq('channel', msg.channel)
    .eq('channel_user_id', msg.channelUserId)
    .maybeSingle();

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

export async function resolveBotProfile(msg: IncomingBotMessage): Promise<any> {
  const { channel, channelUserId, userName, phoneNumber } = msg;

  // 1. Check explicit channel links table (user authenticated and linked via link code)
  const { data: link } = await supabase
    .from('channel_links')
    .select('user_id')
    .eq('channel', channel)
    .eq('channel_user_id', channelUserId)
    .maybeSingle();
  if (link?.user_id) {
    const { data: linked } = await supabase.from('profiles').select('*').eq('id', link.user_id).maybeSingle();
    if (linked) return linked;
  }

  // 2. Check existing guest profile by channel_id
  const { data: existingByChannel } = await supabase
    .from('profiles')
    .select('*')
    .eq('channel_id', channelUserId)
    .maybeSingle();

  if (existingByChannel) return existingByChannel;

  // 3. Create a new guest profile with is_guest = true, unverified email status, and no presumed city
  const newProfile = {
    id: channelUserId,
    channel,
    channel_id: channelUserId,
    display_name: userName || `${channel.toUpperCase()} Citizen`,
    phone_number: phoneNumber || null,
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
  if (insertErr) {
    console.error('[BotController] Guest profile creation failed:', insertErr);
    // If insert errored due to a race condition, try reading existing again
    const { data: retryProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('channel_id', channelUserId)
      .maybeSingle();
    if (retryProfile) return retryProfile;
  }

  await storage.activatePlan(channelUserId, 'free').catch(() => {});

  return newProfile;
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

  const profile = await resolveBotProfile(msg);
  const userId = profile.id;
  const userLang = profile.language || 'English';
  const rawText = (msg.text || '').trim();
  const payload = msg.actionPayload;
  const isLinked = profile.id !== msg.channelUserId;

  const history = await loadHistory(userId);
  if (rawText) {
    history.push({ role: 'user', content: rawText });
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
      text: getAccountLinkInstructions(isLinked),
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

  if (payload === 'ACTION_LAWYER' || rawText.toLowerCase() === '/lawyer' || payload?.startsWith('PROS_ROLE_')) {
    const role = payload?.startsWith('PROS_ROLE_') ? payload.replace('PROS_ROLE_', '') : 'lawyer';
    const ranked = await searchNearbyProfessionals(role, msg.location, profile.city);
    const topThree = ranked.slice(0, 3);

    if (topThree.length === 0) {
      const locationText = profile.city ? ` in ${profile.city}` : '';
      return {
        text: `🔍 *No Verified ${role.replace('_', ' ').toUpperCase()}s Found${locationText}*\n\n` +
          `There are currently no verified ${role.replace('_', ' ')}s listed in this area.\n\n` +
          `• You can share your GPS location using the chat attachment button to search by distance.\n` +
          `• Or open the full directory on the SabiRight web app.`,
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
      const distInfo = item.distanceKm !== undefined ? ` (~${item.distanceKm} km away)` : '';
      const loc = p.location?.city || p.location?.state || 'Nigeria';
      return `*${idx + 1}. ${p.displayName || 'Verified Practitioner'}*\n` +
        `📍 Location: ${loc}${distInfo}\n` +
        `📞 Contact: ${p.phoneNumber || 'Available upon booking'}${waLink}\n` +
        `⭐ Rating: ${p.rating || 5.0}/5.0\n` +
        `👉 _To connect, tap below: Connect with #${idx + 1}_`;
    }).join('\n\n');

    const connectActions = topThree.map((item, idx) => ({
      id: `book_${item.pro.id}`,
      title: `🤝 Connect #${idx + 1}`,
      payload: `BOOK_PRO_${item.pro.id}`
    }));

    return {
      text: `⚖️ *Verified ${role.replace('_', ' ').toUpperCase()} Directory*\n\n` +
        `Here are the verified practitioners found for you:\n\n` +
        `${proListText}\n\n` +
        `_Your case brief will ONLY be shared with a practitioner after you tap to connect._`,
      quickActions: [
        ...connectActions,
        { id: 'categories', title: '📂 Categories', payload: 'ACTION_DIRECTORY' },
        { id: 'menu', title: '🏠 Main Menu', payload: 'ACTION_START' }
      ]
    };
  }

  // Explicit Consent-Based Lead Creation
  if (payload?.startsWith('BOOK_PRO_')) {
    const targetProId = payload.replace('BOOK_PRO_', '');
    const matchedPro = await storage.getProfessionalById(targetProId);

    if (!matchedPro) {
      return {
        text: '⚠️ Could not find that professional. Please search the directory again.',
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

    const caseRef = `CASE-${Date.now().toString().slice(-6)}`;
    const caseFileId = `cf-${Date.now()}`;
    await supabase.from('pre_case_files').insert({
      id: caseFileId,
      case_ref: caseRef,
      user_id: userId,
      channel: msg.channel,
      issue_summary: caseSummary.slice(0, 500),
      raw_chat_history: history,
      created_at: new Date().toISOString()
    });

    // Create Direct Lead now that user gave explicit consent
    const bookingId = `bk-${Date.now()}`;
    await supabase.from('direct_bookings').insert({
      id: bookingId,
      user_id: userId,
      vendor_id: matchedPro.userId || matchedPro.id,
      case_file_id: caseFileId,
      title: `Civic Lead (${msg.channel.toUpperCase()}) - ${caseRef}`,
      description: caseSummary.slice(0, 500),
      contact_phone: msg.phoneNumber || profile.phone_number || '',
      channel: msg.channel,
      status: 'pending',
      created_at: new Date().toISOString()
    });

    // Notify the professional
    await storage.sendNotification({
      userId: matchedPro.userId || matchedPro.id,
      type: 'new_case_lead',
      title: `🚨 New Case Lead (${caseRef})`,
      message: `A client from ${msg.channel.toUpperCase()} selected you for legal representation. Pre-case brief generated.`,
      data: { caseRef, caseFileId, bookingId }
    });

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

  if (rawText.toLowerCase() === '/start' || rawText.toLowerCase() === 'hi' || rawText.toLowerCase() === 'hello' || payload === 'ACTION_START') {
    const appUrl = (process.env.APP_URL || 'https://www.sabiright.ng').replace(/\/+$/, '');
    const accountStatusText = isLinked
      ? `✅ *Account Status:* Connected to SabiRight account (${profile.email || profile.display_name || 'Citizen'})`
      : `👤 *Account Status:* Operating as Guest\n` +
        `• To connect an existing web account, enter: \`link CODE\`\n` +
        `• To create a full account, register at: ${appUrl}/auth/login?mode=register\n` +
        `• Or continue directly as a guest with free introductory access below.`;

    return {
      text: `⚖️ *Welcome to SabiRight Civic Assistant*\n\n` +
        `Hello ${profile.display_name || msg.userName || 'Citizen'}! I am your AI Civic and Legal First-Aid guide for Nigeria.\n\n` +
        `${accountStatusText}\n\n` +
        `*What I can do for you:*\n` +
        `• Instant rights guidance during police stops (Police Act 2020)\n` +
        `• Clarify fundamental rights (1999 Constitution Chapter IV)\n` +
        `• Tenancy, land, and debt dispute guidance\n` +
        `• Connecting you directly with verified Nigerian lawyers\n\n` +
        `Ask your question below or select an option:`,
      quickActions: [
        { id: 'urgent', title: '🚨 Urgent Mode', payload: 'ACTION_URGENT' },
        { id: 'lawyer', title: '👨‍⚖️ Find Lawyer', payload: 'ACTION_LAWYER' },
        { id: 'bookings', title: '📋 My Bookings', payload: 'ACTION_BOOKINGS' },
        { id: 'balance', title: '💳 Credits', payload: 'ACTION_BALANCE' },
        { id: 'lang', title: '🌐 Language', payload: 'ACTION_LANG' },
        { id: 'link', title: isLinked ? '🔗 Account Info' : '🔗 Link Account', payload: 'ACTION_LINK' }
      ]
    };
  }

  // Unified Credit Verification & Dynamic Cost
  const balance = await storage.getBalance(userId);
  const cost = await storage.getCreditCost('credit_cost_ai_query', 1);

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

  const charged = await storage.deductCredits(userId, cost, 'civic_guard', `${msg.channel.toUpperCase()} Civic Query: ${rawText.substring(0, 50)}`);
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

  // Execute AI Response (Unified ADK with platform-wide provider fallback)
  let finalResponse = "";
  try {
    const geminiKeySetting = await storage.getAdminSetting('google_gemini_api_key');
    const geminiKey = geminiKeySetting?.value || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
    const primarySetting = await storage.getAdminSetting('ai_provider');
    const activeProvider = (primarySetting?.value || 'groq').toLowerCase();

    // In sovereign mode, route through the shared provider layer instead of Google ADK.
    if (
      !(await isNAtlasSovereignMode()) &&
      (activeProvider === 'google' || activeProvider === 'gemini') &&
      geminiKey
    ) {
      try {
        const agent = await getLegalAgent(userLang);
        const runner = new Runner({
          appName: "SabiRight",
          agent,
          sessionService: botSessionService,
        });

        const sessionId = `bot-session-${userId}`;
        const existingSession = await botSessionService.getSession({
          appName: "SabiRight",
          userId,
          sessionId
        });

        // Replay recent turns from memory or Supabase if fresh session
        let recap = '';
        if (!existingSession) {
          await botSessionService.createSession({
            appName: "SabiRight",
            userId,
            sessionId
          });
          const earlier = history.slice(0, -1).slice(-10);
          if (earlier.length > 0) {
            recap = 'Earlier in this conversation:\n' +
              earlier.map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content.slice(0, 500)}`).join('\n') +
              '\n\nCurrent message:\n';
          }
        }

        const promptWithLocation = `[Location: ${profile.city || 'Lagos'}, Language: ${userLang}] ${recap}${rawText}`;

        const events = runner.runAsync({
          userId,
          sessionId,
          newMessage: { role: 'user', parts: [{ text: promptWithLocation }] } as any
        });

        for await (const event of events) {
          const structuredEvents = toStructuredEvents(event);
          for (const se of structuredEvents) {
            if (se.type === EventType.CONTENT) {
              finalResponse += se.content;
            } else if (se.type === EventType.ERROR) {
              console.error(`[BotController] ADK error:`, se.error);
            }
          }
        }
      } catch (adkErr: any) {
        console.warn(`[BotController] ADK notice: ${adkErr.message}. Routing to unified AI fallback...`);
      }
    }

    // 2. If ADK was skipped or returned empty, execute via unified multi-provider fallback (Groq, OpenAI, etc.)
    if (!finalResponse) {
      const historyContext = history.slice(0, -1).slice(-6)
        .map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content.slice(0, 400)}`)
        .join('\n');

      let fallbackInstruction = `You are the "SabiRight AI Agent", a general civic information responder for Nigerians communicating via ${msg.channel.toUpperCase()}. Be clear and cautious; you are not a substitute for advice from a qualified Nigerian lawyer.

STRICT OPERATING RULES:
1. NO GREETING: Answer the citizen's enquiry directly and immediately.
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
User: ${rawText}
AI:`;

      const aiText = await generateAIResponse(fallbackPrompt);
      if (aiText) {
        finalResponse = aiText;
      }
    }

    if (!finalResponse) {
      await storage.refundCredits(userId, cost, 'civic_guard');
      finalResponse = "I have noted your enquiry. For formal advice on this situation, you can connect directly with a verified Nigerian attorney by typing /lawyer.";
    } else {
      history.push({ role: 'ai', content: finalResponse });
      await saveHistory(userId, history);

      try {
        await supabase.from('impact_metrics').insert({
          metric_key: 'civic_guidance_delivered',
          city: profile.city || 'Lagos',
          channel: msg.channel,
          metadata: { length: finalResponse.length },
          created_at: new Date().toISOString()
        });
      } catch (e) {}
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
    await storage.refundCredits(userId, cost, 'civic_guard').catch(() => {});
    return {
      text: `⚠️ I couldn't complete that response. If you need legal help, you can type /lawyer to look for an advocate in your area.`,
      quickActions: [
        { id: 'lawyer', title: '👨‍⚖️ Find Lawyer', payload: 'ACTION_LAWYER' },
        { id: 'urgent', title: '🚨 Urgent Mode', payload: 'ACTION_URGENT' },
        { id: 'balance', title: '💳 Balance', payload: 'ACTION_BALANCE' }
      ]
    };
  }
}
