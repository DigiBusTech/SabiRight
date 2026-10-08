import { supabaseStorage as storage } from "../../supabaseStorage.js";
import type { BotResponse } from "../types.js";
import crypto from "crypto";
import { normalizeMarkdown, chunkText } from "../format.js";

async function getTelegramToken(): Promise<string | null> {
  const setting = await storage.getAdminSetting('telegram_bot_token');
  return setting?.value || process.env.TELEGRAM_BOT_TOKEN || null;
}

export async function sendTelegramChatAction(chatId: string | number, action: string = 'typing'): Promise<void> {
  const token = await getTelegramToken();
  if (!token) return;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendChatAction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, action })
    });
  } catch (e) {
    console.error('[TelegramService] sendChatAction error:', e);
  }
}

export async function getTelegramWebhookSecret(): Promise<string | null> {
  const setting = await storage.getAdminSetting('telegram_webhook_secret');
  return setting?.value || process.env.TELEGRAM_WEBHOOK_SECRET || null;
}

export async function answerTelegramCallback(callbackQueryId: string): Promise<void> {
  const token = await getTelegramToken();
  if (!token) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackQueryId })
    });
  } catch (e) {
    console.error('[TelegramService] answerCallbackQuery error:', e);
  }
}

async function sendOne(token: string, payload: any): Promise<any> {
  const post = async (p: any) => {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p)
    });
    return await res.json() as any;
  };
  const data = await post(payload);
  if (!data.ok && /parse entities/i.test(data.description || '')) {
    const { parse_mode, ...plain } = payload;
    return await post(plain);
  }
  if (!data.ok) console.error('[TelegramService] sendMessage failed:', data);
  return data;
}

export async function sendTelegramMessage(chatId: string | number, response: BotResponse): Promise<any> {
  const token = await getTelegramToken();
  if (!token) {
    console.warn('[TelegramService] Telegram Bot Token not configured in Admin Settings or ENV');
    return null;
  }

  const chunks = chunkText(normalizeMarkdown(response.text), 3900);
  let result: any = null;
  try {
    for (let i = 0; i < chunks.length; i++) {
      const payload: any = { chat_id: chatId, text: chunks[i], parse_mode: 'Markdown', disable_web_page_preview: true };
      if (i === chunks.length - 1 && response.quickActions?.length) {
        const rows: any[] = [];
        for (let j = 0; j < response.quickActions.length; j += 2) {
          rows.push(response.quickActions.slice(j, j + 2).map(a => ({ text: a.title, callback_data: a.payload.slice(0, 64) })));
        }
        payload.reply_markup = { inline_keyboard: rows };
      }
      result = await sendOne(token, payload);
    }
    return result;
  } catch (err) {
    console.error('[TelegramService] Network error sending message:', err);
    return null;
  }
}

export async function setTelegramWebhook(webhookUrl: string, secretToken?: string): Promise<any> {
  const token = await getTelegramToken();
  if (!token) throw new Error('Telegram bot token not configured');

  if (!secretToken) {
    secretToken = (await getTelegramWebhookSecret()) || crypto.randomBytes(24).toString('hex');
    await storage.setAdminSetting('telegram_webhook_secret', secretToken, 'bots', true);
  }

  const body: any = { url: webhookUrl };
  if (secretToken) body.secret_token = secretToken;

  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  return await res.json();
}

export async function getTelegramWebhookInfo(): Promise<any> {
  const token = await getTelegramToken();
  if (!token) return { ok: false, error: 'Telegram bot token not configured' };

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    return await res.json();
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export async function deleteTelegramWebhook(): Promise<any> {
  const token = await getTelegramToken();
  if (!token) return { ok: false, error: 'Telegram bot token not configured' };

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`, {
      method: 'POST'
    });
    return await res.json();
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}
