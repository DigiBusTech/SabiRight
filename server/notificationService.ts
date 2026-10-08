import nodemailer from 'nodemailer';
import { supabaseStorage as storage } from './supabaseStorage.js';

export interface NotificationPayload {
  userId: string;
  type?: string;
  title: string;
  message: string;
  templateName?: string;
  variables?: Record<string, any>;
  channels?: ('email' | 'in_app' | 'push')[];
  data?: Record<string, any>;
}

export interface DispatchResult {
  inAppSaved: boolean;
  emailSent: boolean;
  emailError?: string;
  pushSent: boolean;
  pushError?: string;
}

/**
 * Interpolates variables into template strings (e.g., {{userName}} => "John")
 */
export function interpolateTemplate(template: string, variables: Record<string, any>): string {
  if (!template) return '';
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    return variables[key] !== undefined && variables[key] !== null ? String(variables[key]) : '';
  });
}

/**
 * Unified notification service for SabiRight.
 * Handles templating, multi-channel dispatch (Email via SMTP, In-App via Supabase, Push via VAPID).
 */
export async function sendNotification(payload: NotificationPayload): Promise<DispatchResult> {
  const result: DispatchResult = {
    inAppSaved: false,
    emailSent: false,
    pushSent: false
  };

  const requestedChannels = payload.channels && payload.channels.length > 0
    ? payload.channels
    : ['in_app'];

  // Resolve template if requested
  let subject = payload.title;
  let htmlBody = `<p>${payload.message}</p>`;

  if (payload.templateName) {
    try {
      const template = await storage.getNotificationTemplateByName(payload.templateName);
      if (template && template.isActive !== false) {
        const vars = payload.variables || {};
        subject = interpolateTemplate(template.subject, vars) || payload.title;
        htmlBody = interpolateTemplate(template.bodyTemplate, vars) || `<p>${payload.message}</p>`;
      }
    } catch (tmplErr) {
      console.warn(`[NotificationService] Template '${payload.templateName}' resolve notice:`, tmplErr);
    }
  }

  // 1. In-App Notification Dispatch (Persisted to Supabase)
  if (requestedChannels.includes('in_app')) {
    try {
      await storage.sendNotification({
        userId: payload.userId,
        type: payload.type || 'system',
        title: subject,
        message: payload.message,
        data: payload.data || {}
      });
      result.inAppSaved = true;
    } catch (inAppErr: any) {
      console.error('[NotificationService] In-App save error:', inAppErr.message);
    }
  }

  // 2. Email Notification Dispatch (via Admin-configured SMTP)
  if (requestedChannels.includes('email')) {
    try {
      const userProfile = await storage.getUserProfile(payload.userId);
      const recipientEmail = userProfile?.email;

      if (!recipientEmail) {
        result.emailError = 'User email address not found';
      } else {
        const smtpSettings = await storage.getSmtpSettings();
        if (!smtpSettings || smtpSettings.isActive === false) {
          result.emailError = 'SMTP is not configured or disabled in Admin Dashboard';
        } else {
          const transporter = nodemailer.createTransport({
            host: smtpSettings.host,
            port: Number(smtpSettings.port) || 587,
            secure: smtpSettings.encryption === 'ssl' || Number(smtpSettings.port) === 465,
            auth: {
              user: smtpSettings.username,
              pass: smtpSettings.password
            },
            tls: {
              rejectUnauthorized: process.env.NODE_ENV === 'production'
            }
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
      }
    } catch (emailErr: any) {
      console.error('[NotificationService] Email delivery error:', emailErr.message);
      result.emailError = emailErr.message;
    }
  }

  return result;
}
