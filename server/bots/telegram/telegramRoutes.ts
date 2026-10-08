import { Router, Request, Response } from "express";
import { processBotMessage } from "../botController.js";
import { 
  sendTelegramMessage, 
  sendTelegramChatAction, 
  setTelegramWebhook, 
  getTelegramWebhookInfo, 
  deleteTelegramWebhook,
  answerTelegramCallback,
  getTelegramWebhookSecret
} from "./telegramService.js";
import type { IncomingBotMessage } from "../types.js";
import crypto from "crypto";
import { isDuplicate } from "../format.js";

export const telegramRouter = Router();

telegramRouter.post("/webhook", async (req: Request, res: Response) => {
  const secret = await getTelegramWebhookSecret();
  if (secret) {
    const got = String(req.headers["x-telegram-bot-api-secret-token"] || "");
    const ok = got.length === secret.length && crypto.timingSafeEqual(Buffer.from(got), Buffer.from(secret));
    if (!ok) return res.sendStatus(403);
  } else if (process.env.NODE_ENV === "production") {
    console.warn("[TelegramWebhook] No webhook secret configured; run /setup-webhook to generate one.");
    return res.sendStatus(403);
  }
  // Acknowledge Telegram immediately to prevent timeout retries
  res.status(200).json({ ok: true });

  try {
    const update = req.body;
    if (!update) return;
    if (isDuplicate(`tg_update_${update.update_id}`)) return;

    let incoming: IncomingBotMessage | null = null;
    let chatId: number | string | null = null;
    let callbackQueryId: string | null = null;

    // Handle normal message
    if (update.message) {
      const msg = update.message;
      chatId = msg.chat?.id;
      const from = msg.from;
      if (!chatId || !from) return;

      const fullName = [from.first_name, from.last_name].filter(Boolean).join(' ') || from.username || 'Citizen';

      incoming = {
        channel: 'telegram',
        channelUserId: `tg_${from.id}`,
        rawSenderId: String(from.id),
        userName: fullName,
        text: msg.text || '',
        location: msg.location ? {
          latitude: msg.location.latitude,
          longitude: msg.location.longitude
        } : undefined
      };
    } 
    // Handle inline button click (callback_query)
    else if (update.callback_query) {
      const cb = update.callback_query;
      callbackQueryId = cb.id;
      const from = cb.from;
      chatId = cb.message?.chat?.id;
      if (!chatId || !from) return;

      const fullName = [from.first_name, from.last_name].filter(Boolean).join(' ') || from.username || 'Citizen';

      incoming = {
        channel: 'telegram',
        channelUserId: `tg_${from.id}`,
        rawSenderId: String(from.id),
        userName: fullName,
        text: cb.data || '',
        actionPayload: cb.data
      };
    }

    if (callbackQueryId) await answerTelegramCallback(callbackQueryId);
    if (!incoming || !chatId) return;
    if (!incoming.text && !incoming.actionPayload && !incoming.location) {
      await sendTelegramMessage(chatId, { text: "I can read text messages for now. Please type your question and I will help." });
      return;
    }
    if (!incoming.text && incoming.location) incoming.text = "Shared my location";

    // Send typing action to Telegram
    await sendTelegramChatAction(chatId, 'typing');

    // Process through unified SabiRight AI agent controller
    const response = await processBotMessage(incoming);

    // Send formatted response with inline keyboards back to Telegram user
    await sendTelegramMessage(chatId, response);
  } catch (err) {
    console.error("[TelegramWebhook] Error handling update:", err);
  }
});

telegramRouter.post("/setup-webhook", async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    const webhookUrl = url || `${req.protocol}://${req.get('host')}/api/telegram/webhook`;
    const result = await setTelegramWebhook(webhookUrl);
    res.json({ success: true, result, webhookUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

telegramRouter.get("/status", async (req: Request, res: Response) => {
  try {
    const info = await getTelegramWebhookInfo();
    res.json(info);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

telegramRouter.post("/delete-webhook", async (req: Request, res: Response) => {
  try {
    const result = await deleteTelegramWebhook();
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
