import { Router, Request, Response } from "express";
import {
  setTelegramWebhook,
  getTelegramWebhookInfo,
  deleteTelegramWebhook,
  getTelegramWebhookSecret
} from "./telegramService.js";
import { enqueueInboundBotEvent, drainInboundBotQueue } from "../inboundBotWorker.js";
import crypto from "crypto";

export const telegramRouter = Router();

telegramRouter.post("/webhook", async (req: Request, res: Response) => {
  try {
    const secret = await getTelegramWebhookSecret();
    if (secret) {
      const got = String(req.headers["x-telegram-bot-api-secret-token"] || "");
      const ok = got.length === secret.length && crypto.timingSafeEqual(Buffer.from(got), Buffer.from(secret));
      if (!ok) return res.sendStatus(403);
    } else if (process.env.NODE_ENV === "production") {
      console.warn("[TelegramWebhook] No webhook secret configured; run /setup-webhook to generate one.");
      return res.sendStatus(403);
    }

    const update = req.body;
    if (!update) return res.sendStatus(400);

    let providerPayload:
      | { kind: "telegram_message"; message: any }
      | { kind: "telegram_callback"; callbackQuery: any }
      | null = null;
    let sender: { channelUserId: string; rawSenderId: string; userName: string } | null = null;
    if (update.message?.from && update.message?.chat?.id !== undefined) {
      const from = update.message.from;
      providerPayload = { kind: "telegram_message", message: update.message };
      sender = {
        channelUserId: `tg_${from.id}`,
        rawSenderId: String(from.id),
        userName: [from.first_name, from.last_name].filter(Boolean).join(" ") || from.username || "Citizen"
      };
    } else if (
      update.callback_query?.from &&
      update.callback_query?.message?.chat?.id !== undefined
    ) {
      const from = update.callback_query.from;
      providerPayload = { kind: "telegram_callback", callbackQuery: update.callback_query };
      sender = {
        channelUserId: `tg_${from.id}`,
        rawSenderId: String(from.id),
        userName: [from.first_name, from.last_name].filter(Boolean).join(" ") || from.username || "Citizen"
      };
    }

    if (!providerPayload || !sender) return res.status(200).json({ ok: true });
    if (update.update_id === undefined || update.update_id === null) {
      throw new Error("Telegram update is missing update_id");
    }

    const queued = await enqueueInboundBotEvent(
      "telegram",
      `tg_update_${update.update_id}`,
      providerPayload,
      sender
    );

    res.status(200).json({ ok: true });
    if (!queued.duplicate) {
      const result = await drainInboundBotQueue(1);
      if (result.failed > 0) console.warn(`[TelegramWebhook] ${result.failed} queued message(s) will be retried`);
    }
  } catch (err) {
    console.error("[TelegramWebhook] Error handling update:", err);
    if (!res.headersSent) res.sendStatus(503);
  }
});

telegramRouter.post("/setup-webhook", async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    const webhookUrl = url || `${req.protocol}://${req.get("host")}/api/telegram/webhook`;
    const result = await setTelegramWebhook(webhookUrl);
    res.json({ success: true, result, webhookUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

telegramRouter.get("/status", async (_req: Request, res: Response) => {
  try {
    res.json(await getTelegramWebhookInfo());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

telegramRouter.post("/delete-webhook", async (_req: Request, res: Response) => {
  try {
    const result = await deleteTelegramWebhook();
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
