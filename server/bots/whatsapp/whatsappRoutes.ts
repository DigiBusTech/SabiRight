import { Router, Request, Response } from "express";
import { supabaseStorage as storage } from "../../supabaseStorage.js";
import { processBotMessage } from "../botController.js";
import { sendWhatsAppMessage, markWhatsAppAsRead, checkWhatsAppStatus, downloadWhatsAppAudio } from "./whatsappService.js";
import { transcribeAudio } from "../../aiService.js";
import type { IncomingBotMessage } from "../types.js";
import crypto from "crypto";
import { isDuplicate } from "../format.js";

export const whatsappRouter = Router();

whatsappRouter.get("/status", async (req: Request, res: Response) => {
  try {
    const status = await checkWhatsAppStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET: Meta Webhook Verification Handshake
whatsappRouter.get("/webhook", async (req: Request, res: Response) => {
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

// POST: Incoming WhatsApp Message Events
whatsappRouter.post("/webhook", async (req: Request, res: Response) => {
  if (!(await validSignature(req))) return res.sendStatus(403);
  // Acknowledge immediately to Meta
  res.sendStatus(200);

  try {
    const body = req.body;
    if (body.object !== "whatsapp_business_account") return;

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value;
        for (const message of value?.messages || []) {
          const contact = (value.contacts || []).find((c: any) => c.wa_id === message.from) || value.contacts?.[0];
          await handleMessage(message, contact);
        }
      }
    }
  } catch (err) {
    console.error("[WhatsAppWebhook] Error handling incoming payload:", err);
  }
});

async function handleMessage(message: any, contact: any) {
  try {
    const messageId = message.id;
    if (isDuplicate(messageId)) return;

    const senderPhone = message.from; // e.g. "2348012345678"
    const senderName = contact?.profile?.name || "Citizen";

    if (messageId) await markWhatsAppAsRead(messageId);

    let text = "";
    let actionPayload: string | undefined;

    if (message.type === "text") {
      text = message.text?.body || "";
    } else if (message.type === "interactive") {
      const btnReply = message.interactive?.button_reply;
      const listReply = message.interactive?.list_reply;
      actionPayload = btnReply?.id || listReply?.id;
      text = btnReply?.title || listReply?.title || actionPayload || "";
    } else if (message.type === "location") {
      text = "Shared my location";
    } else if (
      message.type === "audio" ||
      (message.type === "document" && message.document?.mime_type?.toLowerCase().startsWith('audio/'))
    ) {
      const audioMessage = message.audio || message.document;
      if (!audioMessage?.id) {
        await sendWhatsAppMessage(senderPhone, {
          text: "I couldn't access that audio. Please try recording a new voice note or type your question.",
        });
        return;
      }

      try {
        const { audio, mimeType } = await downloadWhatsAppAudio(audioMessage.id);
        const transcript = await transcribeAudio(audio, mimeType);
        text = transcript.text;
      } catch (error: any) {
        console.warn('[WhatsAppWebhook] Audio transcription failed:', error.message || error);
        await sendWhatsAppMessage(senderPhone, {
          text: "I couldn't transcribe that audio. Please send a shorter, clearer voice note or type your question.",
        });
        return;
      }
      if (!text.trim()) {
        await sendWhatsAppMessage(senderPhone, {
          text: "I couldn't hear any speech in that recording. Please try again or type your question.",
        });
        return;
      }
    } else {
      await sendWhatsAppMessage(senderPhone, {
        text: "I can read text and audio messages. Please send a voice note, supported audio file, or type your question.",
      });
      return;
    }

    if (!text && !actionPayload) return;

    const incoming: IncomingBotMessage = {
      channel: "whatsapp",
      channelUserId: `wa_${senderPhone}`,
      rawSenderId: senderPhone,
      userName: senderName,
      phoneNumber: `+${senderPhone}`,
      text,
      actionPayload,
      location: message.location ? {
        latitude: message.location.latitude,
        longitude: message.location.longitude
      } : undefined
    };

    const response = await processBotMessage(incoming);
    await sendWhatsAppMessage(senderPhone, response);
  } catch (err) {
    console.error("[WhatsAppWebhook] Message handling failed:", err);
  }
}
