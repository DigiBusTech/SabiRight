import nodemailer from 'nodemailer';
import webpush from 'web-push';
import { supabaseStorage as storage } from './supabaseStorage.js';

export type NotificationChannel = 'email' | 'in_app' | 'push';

export interface NotificationPayload {
  userId: string;
  type?: string;
  title: string;
  message: string;
  templateName?: string;
  variables?: Record<string, unknown>;
  channels?: NotificationChannel[];
  data?: Record<string, unknown>;
  recipientEmail?: string;
}

export interface DispatchResult {
  inAppSaved: boolean;
  inAppError?: string;
  emailSent: boolean;
  emailError?: string;
  pushSent: boolean;
  pushError?: string;
  templateError?: string;
}

const CHANNELS = new Set<NotificationChannel>(['email', 'in_app', 'push']);

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeChannels(value: unknown): NotificationChannel[] {
  const candidates = Array.isArray(value)
    ? value
    : value && typeof value === 'object'
      ? Object.entries(value).filter(([, enabled]) => enabled === true).map(([channel]) => channel)
      : [];

  return [...new Set(candidates.filter((channel): channel is NotificationChannel =>
    typeof channel === 'string' && CHANNELS.has(channel as NotificationChannel)
  ))];
}

export function interpolateTemplate(
  template: string,
  variables: Record<string, unknown>,
  escapeValues = false
): string {
  if (!template) return '';
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => {
    const value = variables[key];
    if (value === undefined || value === null) return '';
    const text = String(value);
    return escapeValues ? escapeHtml(text) : text.replace(/[\r\n]+/g, ' ');
  });
}

export async function sendNotification(payload: NotificationPayload): Promise<DispatchResult> {
  const result: DispatchResult = {
    inAppSaved: false,
    emailSent: false,
    pushSent: false
  };

  let template: any = null;
  let subject = payload.title;
  let htmlBody = `<p>${escapeHtml(payload.message)}</p>`;

  if (payload.templateName) {
    try {
      template = await storage.getNotificationTemplateByName(payload.templateName);
    } catch (error) {
      console.error(`[NotificationService] Could not load template '${payload.templateName}':`, error);
      result.templateError = 'Notification template lookup failed';
      return result;
    }

    if (template?.isActive === false) {
      result.templateError = 'Notification template is inactive';
      return result;
    }

    if (template) {
      const variables: Record<string, unknown> = {
        title: payload.title,
        message: payload.message,
        ...payload.data,
        ...payload.variables
      };
      subject = interpolateTemplate(template.subject || '', variables).trim() || payload.title;
      subject = subject.replace(/[\r\n]+/g, ' ');
      htmlBody = interpolateTemplate(template.bodyTemplate || '', variables, true)
        || `<p>${escapeHtml(payload.message)}</p>`;
    } else {
      console.warn(`[NotificationService] Template '${payload.templateName}' was not found; using the supplied notification content.`);
    }
  }

  const configuredChannels = normalizeChannels(template?.channels);
  const explicitChannels = normalizeChannels(payload.channels);
  let requestedChannels: NotificationChannel[] = explicitChannels.length > 0
    ? explicitChannels
    : configuredChannels.length > 0
      ? configuredChannels
      : ['in_app'];

  if (explicitChannels.length > 0 && configuredChannels.length > 0) {
    requestedChannels = explicitChannels.filter(channel => configuredChannels.includes(channel));
  }

  if (requestedChannels.length === 0) {
    result.templateError = 'No enabled notification channels are available';
    return result;
  }

  if (requestedChannels.includes('in_app')) {
    try {
      await storage.createNotification({
        userId: payload.userId,
        type: payload.type || template?.type || 'system',
        title: subject,
        message: payload.message,
        data: payload.data || {}
      });
      result.inAppSaved = true;
    } catch (error) {
      console.error('[NotificationService] In-app notification persistence failed:', error);
      result.inAppError = 'In-app notification could not be saved';
    }
  }

  if (requestedChannels.includes('email')) {
    try {
      const userProfile = await storage.getUserProfile(payload.userId);
      const recipientEmail = payload.recipientEmail?.trim() || userProfile?.email;
      const smtpSettings = await storage.getSmtpSettings();

      if (!recipientEmail) {
        result.emailError = 'Recipient email address is not available';
      } else if (!smtpSettings || smtpSettings.isActive === false) {
        result.emailError = 'SMTP is not configured or is disabled';
      } else if (!smtpSettings.host || !smtpSettings.username || !smtpSettings.password) {
        result.emailError = 'SMTP settings are incomplete';
      } else {
        const port = Number(smtpSettings.port) || 587;
        const secure = smtpSettings.encryption === 'ssl' || port === 465;
        const transporter = nodemailer.createTransport({
          host: smtpSettings.host,
          port,
          secure,
          requireTLS: !secure,
          auth: {
            user: smtpSettings.username,
            pass: smtpSettings.password
          },
          tls: { rejectUnauthorized: true }
        });

        await transporter.sendMail({
          from: `"${smtpSettings.fromName || 'SabiRight'}" <${smtpSettings.fromEmail || smtpSettings.username}>`,
          to: recipientEmail,
          subject,
          html: htmlBody,
          text: payload.message
        });
        result.emailSent = true;
      }
    } catch (error) {
      console.error('[NotificationService] Email delivery failed:', error);
      result.emailError = 'Email delivery failed';
    }
  }

  if (requestedChannels.includes('push')) {
    try {
      const subscriptions = await storage.getPushSubscriptions(payload.userId);
      let sentCount = 0;
      let failedCount = 0;

      const webSubscriptions = subscriptions.filter(subscription =>
        (subscription.provider || 'webpush') === 'webpush'
      );
      if (webSubscriptions.length > 0) {
        const settings = await storage.getPushSettings();
        if (!settings || settings.isActive === false || !settings.publicKey || !settings.privateKey) {
          result.pushError = 'Web Push is not configured or is disabled';
          failedCount += webSubscriptions.length;
        } else if (!/^(mailto:|https:\/\/)/i.test(String(settings.subject || ''))) {
          result.pushError = 'VAPID subject must be a mailto: or HTTPS URL';
          failedCount += webSubscriptions.length;
        } else {
          let vapidConfigured = true;
          try {
            webpush.setVapidDetails(settings.subject, settings.publicKey, settings.privateKey);
          } catch (error) {
            vapidConfigured = false;
            result.pushError = 'VAPID settings are invalid';
            failedCount += webSubscriptions.length;
            console.error('[NotificationService] Invalid VAPID settings:', error);
          }

          if (vapidConfigured) {
            for (const subscription of webSubscriptions) {
              try {
                await webpush.sendNotification(
                  { endpoint: subscription.endpoint, keys: subscription.keys },
                  JSON.stringify({
                    title: 'SabiRight',
                    body: 'You have a new notification. Sign in to view it.',
                    icon: '/assets/sabiright-icon.png',
                    badge: '/favicon.png',
                    data: { url: '/app/notifications' }
                  })
                );
                sentCount += 1;
              } catch (error) {
                failedCount += 1;
                const statusCode = (error as { statusCode?: number }).statusCode;
                if (statusCode === 404 || statusCode === 410) {
                  try {
                    await storage.unsubscribeFromPush(payload.userId, subscription.endpoint, 'webpush');
                  } catch (cleanupError) {
                    console.error('[NotificationService] Could not remove expired Web Push subscription:', cleanupError);
                  }
                } else {
                  console.error('[NotificationService] Web Push delivery failed:', error);
                }
              }
            }
          }
        }
      }

      const expoSubscriptions = subscriptions.filter(subscription => subscription.provider === 'expo');
      for (let index = 0; index < expoSubscriptions.length; index += 100) {
        const batch = expoSubscriptions.slice(index, index + 100);
        try {
          const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(process.env.EXPO_ACCESS_TOKEN
                ? { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` }
                : {})
            },
            body: JSON.stringify(batch.map(subscription => ({
              to: subscription.endpoint,
              sound: 'default',
              title: 'SabiRight',
              body: 'You have a new notification. Sign in to view it.',
              data: { route: 'notifications' }
            })))
          });
          const responseBody = await response.json() as {
            data?: Array<{ status?: string; message?: string; details?: { error?: string } }>;
          };
          if (!response.ok || !Array.isArray(responseBody.data)) {
            throw new Error(`Expo Push Service returned HTTP ${response.status}`);
          }

          for (let ticketIndex = 0; ticketIndex < batch.length; ticketIndex += 1) {
            const ticket = responseBody.data[ticketIndex];
            if (ticket?.status === 'ok') {
              sentCount += 1;
            } else {
              failedCount += 1;
              if (ticket?.details?.error === 'DeviceNotRegistered') {
                try {
                  await storage.unsubscribeFromPush(payload.userId, batch[ticketIndex].endpoint, 'expo');
                } catch (error) {
                  console.error('[NotificationService] Could not remove expired Expo subscription:', error);
                }
              } else {
                console.error('[NotificationService] Expo Push delivery failed:', ticket?.message || 'Unknown ticket error');
              }
            }
          }
        } catch (error) {
          failedCount += batch.length;
          console.error('[NotificationService] Expo Push batch failed:', error);
        }
      }

      result.pushSent = sentCount > 0;
      if (sentCount === 0 && !result.pushError) {
        result.pushError = subscriptions.length === 0
          ? 'No push subscriptions are registered for this user'
          : 'Push delivery failed for all subscriptions';
      } else if (sentCount > 0 && failedCount > 0) {
        const partialFailure = `Push accepted for ${sentCount} subscription(s); ${failedCount} failed`;
        result.pushError = result.pushError ? `${result.pushError}. ${partialFailure}` : partialFailure;
      }
    } catch (error) {
      console.error('[NotificationService] Push setup or delivery failed:', error);
      result.pushError = 'Push delivery failed';
    }
  }

  return result;
}
