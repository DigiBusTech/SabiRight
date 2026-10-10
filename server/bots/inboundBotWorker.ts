import crypto from "crypto";
import { supabase } from "../supabaseStorage.js";
import { processBotMessage, getBotLanguage } from "./botController.js";
import type { BotResponse, IncomingBotMessage } from "./types.js";
import { transcribeAudio } from "../aiService.js";
import {
  answerTelegramCallback,
  downloadTelegramAudio,
  startTelegramTypingIndicator,
  sendTelegramMessage
} from "./telegram/telegramService.js";
import {
  downloadWhatsAppAudio,
  startWhatsAppTypingIndicator,
  sendWhatsAppMessage
} from "./whatsapp/whatsappService.js";

interface InboundBotRow {
  id: string;
  channel: "telegram" | "whatsapp";
  channel_user_id: string;
  provider_event_id: string;
  provider_payload: Record<string, any>;
  response: BotResponse | null;
  processed_at: string | null;
  received_at?: string;
  retry_count: number;
  lease_token: string;
}

interface TelegramEvent {
  kind: "telegram_message" | "telegram_callback";
  message?: any;
  callbackQuery?: any;
}

interface WhatsAppEvent {
  kind: "whatsapp_message";
  message: any;
  contact?: any;
}

const MAX_DELIVERY_ATTEMPTS = 8;
const MAX_BACKOFF_MS = 15 * 60 * 1000;
const MAX_INBOUND_WORKER_CONCURRENCY = 3;

let activeDrain: Promise<{ claimed: number; delivered: number; failed: number }> | null = null;
let pendingDrainRequests = 0;
let pollTimer: NodeJS.Timeout | null = null;

export async function enqueueInboundBotEvent(
  channel: InboundBotRow["channel"],
  providerEventId: string,
  providerPayload: TelegramEvent | WhatsAppEvent,
  message: {
    channelUserId: string;
    rawSenderId: string;
    userName?: string;
    phoneNumber?: string;
  }
): Promise<{ id: string; duplicate: boolean }> {
  if (!providerEventId) throw new Error(`Missing ${channel} provider event ID`);

  const id = `in_${crypto.randomUUID()}`;
  const { data, error } = await supabase
    .from("inbound_bot_messages")
    .insert({
      id,
      channel,
      provider_event_id: providerEventId,
      provider_payload: providerPayload,
      channel_user_id: message.channelUserId,
      raw_sender_id: message.rawSenderId,
      user_name: message.userName || null,
      phone_number: message.phoneNumber || null,
      text: "",
      received_at: new Date().toISOString()
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      const { data: existing, error: lookupError } = await supabase
        .from("inbound_bot_messages")
        .select("id")
        .eq("channel", channel)
        .eq("provider_event_id", providerEventId)
        .maybeSingle();
      if (lookupError) throw lookupError;
      if (existing?.id) return { id: existing.id, duplicate: true };
    }
    throw error;
  }

  if (!data?.id) throw new Error("Inbound bot event was not persisted");
  return { id: data.id, duplicate: false };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function retryDelayMs(attempt: number): number {
  return Math.min(5_000 * 2 ** Math.max(0, attempt - 1), MAX_BACKOFF_MS);
}

async function updateClaimedRow(row: InboundBotRow, patch: Record<string, unknown>): Promise<void> {
  const { data, error } = await supabase
    .from("inbound_bot_messages")
    .update(patch)
    .eq("id", row.id)
    .eq("lease_token", row.lease_token)
    .select("id");
  if (error) throw error;
  if (!data?.length) throw new Error(`Bot inbox lease expired before updating event ${row.provider_event_id}`);
}

async function scheduleRetry(row: InboundBotRow, error: unknown): Promise<void> {
  const message = errorMessage(error).slice(0, 2000);
  const terminal = row.retry_count >= MAX_DELIVERY_ATTEMPTS;
  await updateClaimedRow(row, {
    error: message,
    next_attempt_at: terminal
      ? new Date().toISOString()
      : new Date(Date.now() + retryDelayMs(row.retry_count)).toISOString(),
    dead_letter_at: terminal ? new Date().toISOString() : null,
    locked_until: null,
    lease_token: null
  });
  if (terminal) {
    console.error(`[BotInbox] Event ${row.provider_event_id} moved to dead letter after ${row.retry_count} attempts: ${message}`);
  }
}

function userSafeFailureResponse(error?: unknown): BotResponse {
  const isTranscriptionFailure = /N-ATLAS|transcrib|speech recognition|audio/i.test(errorMessage(error));
  return {
    text: isTranscriptionFailure
      ? "⚠️ I couldn't transcribe that voice note. Please try a shorter recording or type your question instead."
      : "⚠️ I couldn't complete that response. Please try again shortly, or type /urgent if you are in an emergency.",
    quickActions: [
      { id: "urgent", title: "🚨 Urgent Mode", payload: "ACTION_URGENT" },
      { id: "start", title: "🏠 Main Menu", payload: "ACTION_START" }
    ]
  };
}

async function buildTelegramMessage(
  row: InboundBotRow,
  event: TelegramEvent
): Promise<{ chatId: number | string; callbackQueryId?: string; incoming: IncomingBotMessage }> {
  if (event.kind === "telegram_callback") {
    const callback = event.callbackQuery;
    const from = callback?.from;
    const chatId = callback?.message?.chat?.id;
    if (!from || chatId === undefined || chatId === null) {
      throw new Error("Telegram callback is missing a sender or chat");
    }
    const userName = [from.first_name, from.last_name].filter(Boolean).join(" ") || from.username || "Citizen";
    const channelUserId = `tg_${from.id}`;
    return {
      chatId,
      callbackQueryId: callback.id,
      incoming: {
        channel: "telegram",
        channelUserId,
        rawSenderId: String(from.id),
        userName,
        text: callback.data || "",
        actionPayload: callback.data || undefined,
        eventId: row.provider_event_id
      }
    };
  }

  const message = event.message;
  const from = message?.from;
  const chatId = message?.chat?.id;
  if (!from || chatId === undefined || chatId === null) {
    throw new Error("Telegram message is missing a sender or chat");
  }

  const userName = [from.first_name, from.last_name].filter(Boolean).join(" ") || from.username || "Citizen";
  const channelUserId = `tg_${from.id}`;
  let text = message.text || message.caption || "";
  const audio = message.voice || message.audio ||
    (message.document?.mime_type?.toLowerCase().startsWith("audio/") ? message.document : null);

  if (audio) {
    const downloaded = await downloadTelegramAudio(audio.file_id, audio.mime_type);
    const transcript = await transcribeAudio(
      downloaded.audio,
      downloaded.mimeType,
      await getBotLanguage("telegram", channelUserId)
    );
    text = [message.caption, transcript.text].filter(Boolean).join("\n\n").trim();
    if (!text) {
      return {
        chatId,
        incoming: {
          channel: "telegram",
          channelUserId,
          rawSenderId: String(from.id),
          userName,
          text: "",
          eventId: row.provider_event_id
        }
      };
    }
  }

  const location = message.location
    ? { latitude: Number(message.location.latitude), longitude: Number(message.location.longitude) }
    : undefined;
  if (!text && location) text = "Shared my location";

  return {
    chatId,
    incoming: {
      channel: "telegram",
      channelUserId,
      rawSenderId: String(from.id),
      userName,
      text,
      location,
      eventId: row.provider_event_id
    }
  };
}

async function buildWhatsAppMessage(
  row: InboundBotRow,
  event: WhatsAppEvent
): Promise<{ recipient: string; incoming?: IncomingBotMessage; immediateResponse?: BotResponse }> {
  const message = event.message;
  const recipient = String(message?.from || "");
  if (!recipient) throw new Error("WhatsApp message is missing the sender");

  const contact = event.contact;
  const userName = contact?.profile?.name || "Citizen";
  const channelUserId = `wa_${recipient}`;
  let text = "";
  let actionPayload: string | undefined;
  let location: IncomingBotMessage["location"];

  if (message.type === "text") {
    text = message.text?.body || "";
  } else if (message.type === "interactive") {
    const buttonReply = message.interactive?.button_reply;
    const listReply = message.interactive?.list_reply;
    actionPayload = buttonReply?.id || listReply?.id;
    text = buttonReply?.title || listReply?.title || actionPayload || "";
  } else if (message.type === "location") {
    location = {
      latitude: Number(message.location?.latitude),
      longitude: Number(message.location?.longitude)
    };
    text = "Shared my location";
  } else if (
    message.type === "audio" ||
    (message.type === "document" && message.document?.mime_type?.toLowerCase().startsWith("audio/"))
  ) {
    const audioMessage = message.audio || message.document;
    if (!audioMessage?.id) {
      return {
        recipient,
        immediateResponse: { text: "I couldn't access that audio. Please send a new voice note or type your question." }
      };
    }
    const downloaded = await downloadWhatsAppAudio(audioMessage.id);
    const transcript = await transcribeAudio(
      downloaded.audio,
      downloaded.mimeType,
      await getBotLanguage("whatsapp", channelUserId)
    );
    text = transcript.text.trim();
    if (!text) {
      return {
        recipient,
        immediateResponse: { text: "I couldn't hear any speech in that recording. Please try again or type your question." }
      };
    }
  } else {
    return {
      recipient,
      immediateResponse: { text: "I can read text and audio messages. Please send a voice note, supported audio file, or type your question." }
    };
  }

  return {
    recipient,
    incoming: {
      channel: "whatsapp",
      channelUserId,
      rawSenderId: recipient,
      userName,
      phoneNumber: `+${recipient}`,
      text,
      actionPayload,
      location,
      eventId: row.provider_event_id
    }
  };
}

async function buildResponse(row: InboundBotRow): Promise<{ recipient: string | number; response: BotResponse; callbackQueryId?: string }> {
  const event = row.provider_payload as TelegramEvent | WhatsAppEvent;
  if (row.channel === "telegram") {
    const chatId = event.kind === "telegram_callback"
      ? event.callbackQuery?.message?.chat?.id
      : event.message?.chat?.id;
    if (chatId === undefined || chatId === null) throw new Error("Telegram update is missing its chat ID");
    const { chatId: responseChatId, callbackQueryId, incoming } = await buildTelegramMessage(row, event as TelegramEvent);
    if (!incoming.text && !incoming.actionPayload && !incoming.location) {
      return {
        recipient: responseChatId,
        callbackQueryId,
        response: { text: "I can read text and audio messages. Please send a voice note, supported audio file, or type your question." }
      };
    }
    return {
      recipient: responseChatId,
      callbackQueryId,
      response: await processBotMessage(incoming)
    };
  }

  const { recipient, incoming, immediateResponse } = await buildWhatsAppMessage(row, event as WhatsAppEvent);
  if (immediateResponse) return { recipient, response: immediateResponse };
  if (!incoming) throw new Error("WhatsApp event did not produce a message");
  return { recipient, response: await processBotMessage(incoming) };
}

async function sendResponse(
  row: InboundBotRow,
  recipient: string | number,
  response: BotResponse,
  callbackQueryId?: string
): Promise<void> {
  if (row.channel === "telegram") {
    if (callbackQueryId) await answerTelegramCallback(callbackQueryId);
    const result = await sendTelegramMessage(recipient, response);
    if (!result?.ok) throw new Error(result?.description || "Telegram failed to send the bot response");
    return;
  }

  const result = await sendWhatsAppMessage(String(recipient), response);
  if (!result || result.error || !Array.isArray(result.messages) || result.messages.length === 0) {
    throw new Error(result?.error?.message || "WhatsApp failed to send the bot response");
  }
}

async function processClaimedRow(row: InboundBotRow): Promise<boolean> {
  let response = row.response;
  let recipient: string | number;
  let callbackQueryId: string | undefined;
  const startedAt = Date.now();
  const receivedAt = row.received_at ? Date.parse(row.received_at) : Number.NaN;
  const queueWaitMs = Number.isFinite(receivedAt) ? Math.max(0, startedAt - receivedAt) : undefined;
  let responseGenerationMs: number | undefined;
  let responseGenerationError: string | null = null;
  let stopTyping = () => {};
  const event = row.provider_payload as TelegramEvent | WhatsAppEvent;
  if (row.channel === "telegram") {
    const chatId = event.kind === "telegram_callback"
      ? event.callbackQuery?.message?.chat?.id
      : event.message?.chat?.id;
    if (chatId !== undefined && chatId !== null) stopTyping = startTelegramTypingIndicator(chatId);
  } else {
    stopTyping = startWhatsAppTypingIndicator(row.provider_event_id);
  }

  try {
    if (!response) {
      try {
        const generationStartedAt = Date.now();
        const generated = await buildResponse(row);
        responseGenerationMs = Date.now() - generationStartedAt;
        recipient = generated.recipient;
        callbackQueryId = generated.callbackQueryId;
        response = generated.response;
      } catch (error) {
        responseGenerationError = errorMessage(error).slice(0, 2000);
        console.error(`[BotInbox] Processing ${row.provider_event_id} failed; sending safe fallback: ${responseGenerationError}`);
        response = userSafeFailureResponse(error);
      }

      await updateClaimedRow(row, {
        response,
        processed_at: new Date().toISOString(),
        error: responseGenerationError
      });
      row.response = response;
    }

    if (row.channel === "telegram") {
      const event = row.provider_payload as TelegramEvent;
      recipient = event.kind === "telegram_callback"
        ? event.callbackQuery?.message?.chat?.id
        : event.message?.chat?.id;
      callbackQueryId = event.kind === "telegram_callback" ? event.callbackQuery?.id : undefined;
    } else {
      const event = row.provider_payload as WhatsAppEvent;
      recipient = String(event.message?.from || "");
    }

    const deliveryStartedAt = Date.now();
    await sendResponse(row, recipient, response, callbackQueryId);
    const deliveryMs = Date.now() - deliveryStartedAt;
    await updateClaimedRow(row, {
      delivered_at: new Date().toISOString(),
      error: null,
      locked_until: null,
      lease_token: null,
      next_attempt_at: new Date().toISOString(),
      dead_letter_at: null
    });
    console.info(
      `[BotInbox] Delivered channel=${row.channel} event=${row.provider_event_id}` +
      ` queue_wait_ms=${queueWaitMs ?? "unknown"}` +
      ` generation_ms=${responseGenerationMs ?? "cached"}` +
      ` delivery_ms=${deliveryMs} total_ms=${Date.now() - startedAt} attempt=${row.retry_count}`
    );
    return true;
  } catch (error) {
    const retryInMs = row.retry_count >= MAX_DELIVERY_ATTEMPTS ? 0 : retryDelayMs(row.retry_count);
    console.warn(
      `[BotInbox] Event ${row.provider_event_id} failed after ${Date.now() - startedAt}ms;` +
      ` attempt=${row.retry_count} retry_in_ms=${retryInMs}: ${errorMessage(error)}`
    );
    await scheduleRetry(row, error);
    return false;
  } finally {
    stopTyping();
  }
}

async function drain(limit: number): Promise<{ claimed: number; delivered: number; failed: number }> {
  const { data, error } = await supabase.rpc("claim_inbound_bot_messages", {
    p_limit: Math.min(limit, MAX_INBOUND_WORKER_CONCURRENCY)
  });
  if (error) throw error;

  const rows = (data || []) as InboundBotRow[];
  const results = await Promise.all(rows.map(processClaimedRow));
  return {
    claimed: rows.length,
    delivered: results.filter(Boolean).length,
    failed: results.filter(result => !result).length
  };
}

export function drainInboundBotQueue(limit = 10): Promise<{ claimed: number; delivered: number; failed: number }> {
  const requestedLimit = Math.min(Math.max(Math.floor(limit) || 1, 1), 50);
  if (activeDrain) {
    pendingDrainRequests = Math.min(50, pendingDrainRequests + requestedLimit);
    return activeDrain;
  }

  activeDrain = (async () => {
    const totals = { claimed: 0, delivered: 0, failed: 0 };
    let requestBudget = requestedLimit;

    while (requestBudget > 0) {
      const batchLimit = Math.min(requestBudget, MAX_INBOUND_WORKER_CONCURRENCY);
      const result = await drain(batchLimit);
      totals.claimed += result.claimed;
      totals.delivered += result.delivered;
      totals.failed += result.failed;
      requestBudget -= result.claimed;

      if (result.claimed < batchLimit) requestBudget = 0;
      if (requestBudget === 0 && pendingDrainRequests > 0) {
        requestBudget = pendingDrainRequests;
        pendingDrainRequests = 0;
      }
    }

    return totals;
  })().finally(() => {
    const followUpLimit = pendingDrainRequests;
    pendingDrainRequests = 0;
    activeDrain = null;
    if (followUpLimit > 0) {
      void drainInboundBotQueue(followUpLimit).catch(error => {
        console.error("[BotInbox] Follow-up queue drain failed:", error);
      });
    }
  });
  return activeDrain;
}

export function startInboundBotWorker(): void {
  if (pollTimer || process.env.VERCEL) return;
  const poll = () => {
    void drainInboundBotQueue(20).catch(error => {
      console.error("[BotInbox] Queue poll failed:", error);
    });
  };
  pollTimer = setInterval(poll, 5_000);
  pollTimer.unref();
  setTimeout(poll, 1_000).unref();
}
