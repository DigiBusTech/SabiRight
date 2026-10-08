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
    const appUrl = process.env.APP_URL || 'http://localhost:5000';
    const customerEmail = profile.email || `${profile.channel || 'bot'}-${userId}@sabiright.com`;
    const customerName = profile.display_name || profile.fullName || 'Citizen';

    let checkoutUrl = '';

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

      const bachsRes = await fetch(`${baseUrl}/v1/checkout/sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pricing: { amount, currency: 'NGN' },
          amount,
          currency: 'NGN',
          customer: { email: customerEmail, name: customerName },
          success_url: `${appUrl}/api/payments/bachs/callback?payment_id=${payment.id}&tx_ref=${txRef}`,
          cancel_url: `${appUrl}/app/wallet?payment=cancelled`,
          metadata: { paymentId: payment.id, userId, type, reference: txRef, ...metadata }
        })
      });

      const bachsData = await bachsRes.json().catch(() => ({}));
      if (bachsRes.ok && (bachsData?.data?.checkout_url || bachsData?.checkout_url)) {
        checkoutUrl = bachsData.data?.checkout_url || bachsData.checkout_url;
      } else {
        return { error: bachsData?.message || 'Failed to generate Bachs checkout link.' };
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
      providerRef: txRef,
      metadata: {
        ...((payment.metadata as any) || {}),
        checkoutUrl
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

const LINK_COMMAND = /^\/?link\s+([A-Za-z0-9]{6,10})$/i;

async function handleLinkCommand(msg: IncomingBotMessage, code: string): Promise<BotResponse> {
  const fail = { text: '\u26A0\uFE0F That code is invalid or has expired. Open SabiRight > Profile > Link WhatsApp/Telegram to get a new one.' };
  const { data: row } = await supabase
    .from('channel_link_codes')
    .select('*')
    .eq('code', code.toUpperCase())
    .maybeSingle();
  if (!row || row.used_at || new Date(row.expires_at).getTime() < Date.now()) return fail;

  // Mark the code used first (conditional) so it can never be redeemed twice.
  const { data: claimed } = await supabase
    .from('channel_link_codes')
    .update({ used_at: new Date().toISOString() })
    .eq('code', row.code)
    .is('used_at', null)
    .select('code');
  if (!claimed || claimed.length === 0) return fail;

  const { error } = await supabase.from('channel_links').upsert({
    channel: msg.channel,
    channel_user_id: msg.channelUserId,
    user_id: row.user_id,
    linked_at: new Date().toISOString()
  });
  if (error) {
    console.error('[BotController] link failed:', error);
    return { text: '\u26A0\uFE0F Could not link your account right now. Please try again.' };
  }
  userChatBuffers.delete(row.user_id);
  userChatBuffers.delete(msg.channelUserId);
  return { text: '\u2705 Account linked. Your credits, chats and case files now sync with your SabiRight account.' };
}

export async function resolveBotProfile(msg: IncomingBotMessage): Promise<any> {
  const { channel, channelUserId, userName, phoneNumber } = msg;

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
  const { data: existingByChannel } = await supabase
    .from('profiles')
    .select('*')
    .eq('channel_id', channelUserId)
    .maybeSingle();

  if (existingByChannel) return existingByChannel;

  if (phoneNumber) {
    const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');
    const { data: existingByPhone } = await supabase
      .from('profiles')
      .select('*')
      .eq('phone_number', cleanPhone)
      .maybeSingle();

    if (existingByPhone) {
      await supabase
        .from('profiles')
        .update({ channel_id: channelUserId, updated_at: new Date().toISOString() })
        .eq('id', existingByPhone.id);
      return existingByPhone;
    }
  }

  const newProfile = {
    id: channelUserId,
    channel,
    channel_id: channelUserId,
    display_name: userName || `${channel.toUpperCase()} Citizen`,
    phone_number: phoneNumber || null,
    city: 'Lagos',
    state: 'Lagos',
    language: 'English',
    is_admin: false,
    is_vendor: false,
    email_verified: true,
    email_verification_status: 'verified',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  await supabase.from('profiles').insert(newProfile);
  await storage.activatePlan(channelUserId, 'free');

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

  const history = await loadHistory(userId);
  if (rawText) {
    history.push({ role: 'user', content: rawText });
    if (history.length > 20) history.shift();
  }

  if (payload === 'ACTION_URGENT' || rawText.toLowerCase() === '/urgent') {
    return {
      text: `🚨 *URGENT EMERGENCY MODE ACTIVATED*\n\n` +
        `Stay calm. Keep your hands visible and speak in a polite, firm voice.\n\n` +
        `*Your Immediate Constitutional Rights:*\n` +
        `• Under *Section 34 of the 1999 Constitution*, you have the right to dignity—no torture or abuse.\n` +
        `• Under *Police Act 2020 (Sec 37)*, officers CANNOT search your phone without a warrant.\n` +
        `• Under *Section 35*, you have the right to remain silent until consulting legal counsel.\n\n` +
        `Describe what is happening right now, or tap below to connect with an advocate:`,
      quickActions: [
        { id: 'lawyer', title: '👨‍⚖️ Find Lawyer', payload: 'ACTION_LAWYER' },
        { id: 'lang', title: '🌐 Language', payload: 'ACTION_LANG' }
      ]
    };
  }
  if (payload === 'ACTION_LAWYER' || rawText.toLowerCase() === '/lawyer') {
    const professionals = await storage.getProfessionals({ role: 'lawyer', verified: true });
    const nearby = professionals.slice(0, 3);
    const matchedPro = professionals.find(p => p.location?.city?.toLowerCase() === profile.city?.toLowerCase()) || professionals[0];

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

    if (matchedPro) {
      // Create Direct Lead on matched advocate's dashboard
      await supabase.from('direct_bookings').insert({
        id: `bk-${Date.now()}`,
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

      // Send in-app notification to the matched advocate
      await storage.sendNotification({
        userId: matchedPro.userId || matchedPro.id,
        type: 'new_case_lead',
        title: `🚨 New Case File Received (${caseRef})`,
        message: `A client from ${msg.channel.toUpperCase()} requires legal representation in ${profile.city || 'your area'}. Pre-case brief generated.`,
        data: { caseRef, caseFileId }
      });
    }

    let proListText = "";
    if (nearby.length > 0) {
      proListText = nearby.map((pro, idx) => {
        const cleanPhone = (pro.phoneNumber || '').replace(/[^0-9]/g, '');
        const waLink = cleanPhone ? ` | [Chat on WhatsApp](https://wa.me/${cleanPhone})` : '';
        return `*${idx + 1}. ${pro.displayName || 'Legal Practitioner'}*\n` +
          `📍 Location: ${pro.location?.city || profile.city || 'Lagos'}\n` +
          `📞 Contact: ${pro.phoneNumber || 'Available upon booking'}${waLink}\n` +
          `⭐ Rating: ${pro.rating || 5.0}/5.0`;
      }).join('\n\n');
    } else {
      proListText = `We have logged your Pre-Case Brief (${caseRef}) and routed it to verified advocates in ${profile.city || 'Nigeria'}.`;
    }

    return {
      text: `📋 *Pre-Case File Generated: ${caseRef}*\n\n` +
        `We have summarized your dispute into a legal discovery file and dispatched it to verified advocates. Here are your matched practitioners:\n\n` +
        `${proListText}\n\n` +
        `_Note: SabiRight handles no payments. You agree on consultation terms directly with the professional._`,
      quickActions: [
        { id: 'urgent', title: '🚨 Urgent Mode', payload: 'ACTION_URGENT' },
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

  if (rawText.toLowerCase() === '/help' || payload === 'ACTION_HELP') {
    return {
      text: `⚖️ *SabiRight Civic Assistant Commands*\n\n` +
        `• */start* - Welcome & quick options\n` +
        `• */balance* - Check your available credits and active plan\n` +
        `• */topup* - Buy extra credits via direct payment link\n` +
        `• */plans* - View & subscribe to monthly membership plans\n` +
        `• */urgent* - Emergency constitutional advice during stops/checkpoints\n` +
        `• */lawyer* - Connect directly with verified Nigerian legal advocates\n` +
        `• */language* - Change response language (English, Pidgin, Hausa, Yoruba, Igbo)\n` +
        `• *link <CODE>* - Link this chat to your web/mobile account\n\n` +
        `Or simply type your question naturally!`,
      quickActions: [
        { id: 'topup', title: '💳 Buy Credits', payload: 'ACTION_TOPUP' },
        { id: 'balance', title: '💳 Balance', payload: 'ACTION_BALANCE' },
        { id: 'urgent', title: '🚨 Urgent Mode', payload: 'ACTION_URGENT' },
        { id: 'lawyer', title: '👨‍⚖️ Find Lawyer', payload: 'ACTION_LAWYER' }
      ]
    };
  }

  if (rawText.toLowerCase() === '/start' || rawText.toLowerCase() === 'hi' || rawText.toLowerCase() === 'hello' || payload === 'ACTION_START') {
    return {
      text: `⚖️ *Welcome to SabiRight Civic Assistant*\n\n` +
        `Hello ${profile.display_name || msg.userName || 'Citizen'}! I am your AI Civic and Legal First-Aid guide for Nigeria.\n\n` +
        `*What I can do for you:*\n` +
        `• Instant rights guidance during police stops (Police Act 2020)\n` +
        `• Clarify fundamental rights (1999 Constitution Chapter IV)\n` +
        `• Tenancy, land, and debt dispute guidance\n` +
        `• Connecting you directly with verified Nigerian lawyers\n\n` +
        `Ask your question below or select a quick option:`,
      quickActions: [
        { id: 'balance', title: '💳 Check Credits', payload: 'ACTION_BALANCE' },
        { id: 'topup', title: '💳 Buy Credits', payload: 'ACTION_TOPUP' },
        { id: 'urgent', title: '🚨 Urgent Mode', payload: 'ACTION_URGENT' },
        { id: 'lawyer', title: '👨‍⚖️ Find Lawyer', payload: 'ACTION_LAWYER' },
        { id: 'lang', title: '🌐 Language', payload: 'ACTION_LANG' }
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

      let fallbackInstruction = `You are the "SabiRight AI Agent", a general civic and legal responder for Nigerians communicating via ${msg.channel.toUpperCase()}. Your mission is to provide INSTANT, actionable, and verified civic guidance.

STRICT OPERATING RULES:
1. NO GREETING: Answer the citizen's enquiry directly and immediately.
2. CIVIC GUIDE & DE-ESCALATION: For any physical encounter (police, checkpoints, landlords, debt collectors), you MUST provide a step-by-step guide to peacefully de-escalate the situation and avoid violence or arbitrary harassment.
3. EXPLICIT CITATIONS: You MUST cite specific sections of the 1999 Constitution of Nigeria (e.g., Section 34 right to dignity, Section 35 right to liberty), Police Act 2020 (e.g., Section 37 phone search prohibition without warrant), or other relevant Nigerian statutes in every legal response.
4. RESPONSE STYLE: Be concise and formatted for chat screens. Use short bullet points with the law cited in bold.
5. ADVOCATE REFERRAL: If the dispute needs formal representation, inform the user they can type /lawyer anytime to connect directly with a verified Nigerian attorney.`;

      if (userLang && userLang.toLowerCase() !== 'english') {
        fallbackInstruction += `\n6. MULTILINGUAL OUTPUT: You must conduct the entire response strictly in ${userLang}. Use natural idioms and tone appropriate for Nigerian citizens.`;
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
      text: `⚠️ Under Section 35 of the 1999 Constitution, you always retain the right to speak to a legal representative.\n\nWould you like to connect directly with a verified lawyer in your area? Type /lawyer to find advocates near you.`,
      quickActions: [
        { id: 'lawyer', title: '👨‍⚖️ Find Lawyer', payload: 'ACTION_LAWYER' },
        { id: 'urgent', title: '🚨 Urgent Mode', payload: 'ACTION_URGENT' },
        { id: 'balance', title: '💳 Balance', payload: 'ACTION_BALANCE' }
      ]
    };
  }
}
