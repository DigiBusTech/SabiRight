import { Router, Request, Response } from "express";
import { supabaseStorage as storage } from "../../supabaseStorage.js";
import { checkWhatsAppStatus } from "./whatsappService.js";
import { enqueueInboundBotEvent, drainInboundBotQueue } from "../inboundBotWorker.js";
import crypto from "crypto";

export const whatsappRouter = Router();

whatsappRouter.get("/status", async (_req: Request, res: Response) => {
  try {
    res.json(await checkWhatsAppStatus());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

whatsappRouter.get("/webhook", async (req: Request, res: Response) => {
  try {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    const setting = await storage.getAdminSetting("whatsapp_verify_token");
    const expectedToken = setting?.value || process.env.WHATSAPP_VERIFY_TOKEN;

    if (expectedToken && mode === "subscribe" && token === expectedToken) {
      console.log("[WhatsAppWebhook] Webhook successfully verified with Meta.");
      return res.status(200).send(challenge);
    }

    console.warn("[WhatsAppWebhook] Verification failed (token mismatch or not configured).");
    return res.sendStatus(403);
  } catch (err) {
    console.error("[WhatsAppWebhook] Webhook verification failed:", err);
    return res.sendStatus(503);
  }
});

async function validSignature(req: Request): Promise<boolean> {
  const setting = await storage.getAdminSetting("whatsapp_app_secret");
  const secret = setting?.value || process.env.WHATSAPP_APP_SECRET;
  if (!secret) {
    console.warn("[WhatsAppWebhook] whatsapp_app_secret not configured - signature NOT verified. Set it in Admin Settings.");
    return process.env.NODE_ENV !== "production";
  }

  const header = String(req.headers["x-hub-signature-256"] || "");
  const raw: Buffer | undefined = (req as any).rawBody;
  if (!raw || !header.startsWith("sha256=")) return false;
  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  const got = header.slice(7);
  return got.length === expected.length && crypto.timingSafeEqual(Buffer.from(got), Buffer.from(expected));
}

whatsappRouter.post("/webhook", async (req: Request, res: Response) => {
  try {
    if (!(await validSignature(req))) return res.sendStatus(403);
    const body = req.body;
    if (body?.object !== "whatsapp_business_account") return res.sendStatus(200);

    const messages: Array<{ message: any; contact: any }> = [];
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value;
        for (const message of value?.messages || []) {
          const contact = (value.contacts || []).find((candidate: any) => candidate.wa_id === message.from)
            || value.contacts?.[0];
          messages.push({ message, contact });
        }
      }
    }

    if (messages.length === 0) return res.sendStatus(200);

    let newlyQueued = 0;
    for (const { message, contact } of messages) {
      if (!message.id || !message.from) {
        throw new Error("WhatsApp message is missing its provider ID or sender");
      }
      const senderPhone = String(message.from);
      const queued = await enqueueInboundBotEvent(
        "whatsapp",
        String(message.id),
        { kind: "whatsapp_message", message, contact },
        {
          channelUserId: `wa_${senderPhone}`,
          rawSenderId: senderPhone,
          userName: contact?.profile?.name || "Citizen",
          phoneNumber: `+${senderPhone}`
        }
      );
      if (!queued.duplicate) newlyQueued++;
    }

    res.sendStatus(200);
    if (newlyQueued > 0) {
      const result = await drainInboundBotQueue(Math.min(newlyQueued, 5));
      if (result.failed > 0) console.warn(`[WhatsAppWebhook] ${result.failed} queued message(s) will be retried`);
    }
  } catch (err) {
    console.error("[WhatsAppWebhook] Error handling incoming payload:", err);
    if (!res.headersSent) res.sendStatus(503);
  }
});
