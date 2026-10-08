import { supabaseStorage as storage } from "../../supabaseStorage.js";
import type { BotResponse } from "../types.js";
import { normalizeMarkdown, chunkText } from "../format.js";

interface WhatsAppCredentials {
  accessToken: string;
  phoneNumberId: string;
}

async function getWhatsAppCredentials(): Promise<WhatsAppCredentials | null> {
  const tokenSetting = await storage.getAdminSetting('whatsapp_access_token');
  const phoneIdSetting = await storage.getAdminSetting('whatsapp_phone_number_id');

  const accessToken = tokenSetting?.value || process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = phoneIdSetting?.value || process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    return null;
  }

  return { accessToken, phoneNumberId };
}

export async function markWhatsAppAsRead(messageId: string): Promise<void> {
  const creds = await getWhatsAppCredentials();
  if (!creds) return;

  try {
    await fetch(`https://graph.facebook.com/v21.0/${creds.phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${creds.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId
      })
    });
  } catch (e) {
    console.error('[WhatsAppService] markAsRead error:', e);
  }
}

async function postMessage(creds: WhatsAppCredentials, payload: any): Promise<any> {
  const res = await fetch(`https://graph.facebook.com/v21.0/${creds.phoneNumberId}/messages`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${creds.accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return await res.json();
}

export async function sendWhatsAppMessage(to: string, response: BotResponse): Promise<any> {
  const creds = await getWhatsAppCredentials();
  if (!creds) {
    console.warn('[WhatsAppService] WhatsApp credentials not configured in Admin Settings or ENV');
    return null;
  }

  const cleanTo = to.replace(/[^0-9]/g, '');
  const chunks = chunkText(normalizeMarkdown(response.text), 3800);
  if (chunks.length === 0) return null;

  // Everything except the last chunk is plain text; the last one carries the actions.
  for (const c of chunks.slice(0, -1)) await sendWhatsAppPlainText(cleanTo, c, creds);
  const last = chunks[chunks.length - 1];
  const actions = response.quickActions || [];

  try {
    let interactive: any = null;
    if (actions.length > 0 && actions.length <= 3 && last.length <= 1024) {
      interactive = {
        type: 'button',
        body: { text: last },
        action: { buttons: actions.map(a => ({ type: 'reply', reply: { id: a.payload.slice(0, 256), title: a.title.slice(0, 20) } })) }
      };
    } else if (actions.length > 3 && last.length <= 1024) {
      interactive = {
        type: 'list',
        body: { text: last },
        action: {
          button: 'Options',
          sections: [{ title: 'Choose', rows: actions.slice(0, 10).map(a => ({ id: a.payload.slice(0, 200), title: a.title.slice(0, 24) })) }]
        }
      };
    }
    if (interactive) {
      const data = await postMessage(creds, { messaging_product: 'whatsapp', recipient_type: 'individual', to: cleanTo, type: 'interactive', interactive });
      if (!data.error) return data;
      console.error('[WhatsAppService] Interactive send failed, falling back to text:', data.error);
    }
  } catch (e) {
    console.error('[WhatsAppService] Interactive message error:', e);
  }

  const menu = actions.length ? '\n\n' + actions.map(a => `? ${a.title}`).join('\n') : '';
  return await sendWhatsAppPlainText(cleanTo, last + (actions.length ? menu : ''), creds);
}

async function sendWhatsAppPlainText(to: string, text: string, creds: WhatsAppCredentials): Promise<any> {
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: {
      preview_url: false,
      body: text
    }
  };

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${creds.phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${creds.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (err) {
    console.error('[WhatsAppService] Send text error:', err);
    return null;
  }
}

export async function checkWhatsAppStatus(): Promise<any> {
  const creds = await getWhatsAppCredentials();
  if (!creds) {
    return { ok: false, error: 'WhatsApp credentials not configured' };
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${creds.phoneNumberId}?fields=verified_name,display_phone_number,quality_rating,code_verification_status`, {
      headers: {
        'Authorization': `Bearer ${creds.accessToken}`
      }
    });
    const data = await res.json() as any;
    if (data.error) {
      return { ok: false, error: data.error.message || 'Meta API returned an error', details: data.error };
    }
    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}
