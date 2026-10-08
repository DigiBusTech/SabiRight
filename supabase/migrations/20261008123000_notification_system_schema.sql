-- Migration: Create notification_templates, email_verification_codes, and push_subscriptions
CREATE TABLE IF NOT EXISTS notification_templates (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL DEFAULT 'system',
    subject TEXT NOT NULL,
    body_template TEXT NOT NULL,
    channels JSONB DEFAULT '["in_app"]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS notif_templates_name_idx ON notification_templates(name);
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS email_verification_codes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS email_verif_user_idx ON email_verification_codes(user_id);
ALTER TABLE email_verification_codes ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS push_sub_user_idx ON push_subscriptions(user_id);
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

INSERT INTO notification_templates (id, name, type, subject, body_template, channels, is_active)
VALUES
    ('tmpl-welcome', 'welcome_email', 'transactional', 'Welcome to SabiRight — Your Civic Protection Partner', '<h1>Welcome to SabiRight, {{userName}}!</h1><p>We are thrilled to have you join our platform. SabiRight gives you immediate access to Nigerian statutory legal first-aid, civic education, and verified professionals in your community.</p><p>Get started by exploring our AI Civic Chat or booking a verified legal professional.</p>', '["email", "in_app"]'::jsonb, true),
    ('tmpl-verify-code', 'email_verification_code', 'transactional', 'Your SabiRight Verification Code', '<h2>Email Verification</h2><p>Hello {{userName}},</p><p>Your single-use 6-digit SabiRight verification code is:</p><div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; padding: 12px; background: #f1f5f9; text-align: center; border-radius: 8px;">{{code}}</div><p>This code will expire in {{expiry}}.</p><p>If you did not request this verification code, please ignore this email.</p>', '["email"]'::jsonb, true),
    ('tmpl-booking-confirmed', 'booking_confirmed', 'transactional', 'Booking Confirmed: {{serviceTitle}}', '<h2>Booking Confirmation</h2><p>Hello {{userName}},</p><p>Your booking for <strong>{{serviceTitle}}</strong> with <strong>{{providerName}}</strong> has been confirmed.</p><p><strong>Scheduled Time:</strong> {{scheduledTime}}<br/><strong>Location:</strong> {{location}}</p>', '["email", "in_app"]'::jsonb, true),
    ('tmpl-credit-topup', 'credit_topup', 'transactional', 'Wallet Credited — SabiRight', '<h2>Credits Added Successfully</h2><p>Hello {{userName}},</p><p>Your SabiRight account has been topped up with <strong>{{creditsAdded}} credits</strong> (Payment Reference: {{reference}}).</p><p>Your updated balance is <strong>{{currentBalance}} credits</strong>.</p>', '["email", "in_app"]'::jsonb, true)
ON CONFLICT (name) DO NOTHING;
