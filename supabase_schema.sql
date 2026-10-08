-- =================================================================================
-- SabiRight: Lean Supabase PostgreSQL Schema (Zero Escrow, B2C/B2B Model)
-- =================================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Unified across Web, WhatsApp, and Telegram)
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    auth_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    channel TEXT NOT NULL DEFAULT 'web',
    channel_id TEXT UNIQUE,
    email TEXT,
    display_name TEXT,
    phone_number TEXT,
    dob TEXT,
    gender TEXT,
    state TEXT DEFAULT 'Lagos',
    city TEXT DEFAULT 'Lagos',
    language TEXT DEFAULT 'English',
    is_admin BOOLEAN DEFAULT FALSE,
    is_vendor BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_status TEXT DEFAULT 'verified',
    email_verified_at TIMESTAMPTZ,
    vendor_mode BOOLEAN DEFAULT FALSE,
    referral_code TEXT,
    referred_by TEXT,
    chat_storage_limit INT DEFAULT 524288,
    chat_storage_used INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_profiles_channel_id ON profiles(channel_id);

-- 2. CREDITS & TRANSACTIONS (Lean B2C Monetization)
CREATE TABLE IF NOT EXISTS credits (
    user_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    total_credits INT DEFAULT 10,
    used_credits INT DEFAULT 0,
    plan_credits INT DEFAULT 0,
    renewal_date TEXT,
    last_free_refresh TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    amount INT NOT NULL,
    description TEXT,
    feature TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PLANS & SUBSCRIPTIONS (B2B Monetization for Professionals)
CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    user_type TEXT NOT NULL,
    price NUMERIC NOT NULL DEFAULT 0,
    credits INT NOT NULL DEFAULT 10,
    monthly_credits INT NOT NULL DEFAULT 0,
    billing_cycle TEXT DEFAULT 'monthly',
    storage_mb NUMERIC DEFAULT 1,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    plan_id TEXT REFERENCES plans(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active',
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. VERIFIED PROFESSIONALS (Lawyers, CAC Agents, Tax/Immigration Consultants)
CREATE TABLE IF NOT EXISTS professionals (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    display_name TEXT,
    email TEXT,
    phone_number TEXT,
    role TEXT NOT NULL DEFAULT 'lawyer',
    specializations JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'pending',
    verified BOOLEAN DEFAULT FALSE,
    credentials JSONB DEFAULT '{}'::jsonb,
    location JSONB DEFAULT '{}'::jsonb,
    rating NUMERIC(2,1) DEFAULT 5.0,
    review_count INT DEFAULT 0,
    public_profile JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vendor_services (
    id TEXT PRIMARY KEY,
    professional_id TEXT REFERENCES professionals(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    specialization TEXT,
    description TEXT,
    location TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    contact_phone TEXT,
    contact_email TEXT,
    price_range TEXT,
    price_list JSONB DEFAULT '[]'::jsonb,
    verified BOOLEAN DEFAULT FALSE,
    rating TEXT DEFAULT '5.0',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vendor_applications (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    business_name TEXT,
    role TEXT,
    service_type TEXT,
    credentials JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ
);

-- 5. PRE-CASE FILES & DIRECT BOOKINGS (Zero Escrow - Direct Agreement Model)
CREATE TABLE IF NOT EXISTS pre_case_files (
    id TEXT PRIMARY KEY,
    case_ref TEXT UNIQUE NOT NULL,
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    channel TEXT DEFAULT 'web',
    issue_summary TEXT NOT NULL,
    urgency_level TEXT DEFAULT 'Medium',
    statutory_citations JSONB DEFAULT '[]'::jsonb,
    facts JSONB DEFAULT '[]'::jsonb,
    evidence_mentioned JSONB DEFAULT '[]'::jsonb,
    desired_outcome TEXT,
    intake_notes TEXT,
    raw_chat_history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS direct_bookings (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    vendor_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    service_id TEXT,
    case_file_id TEXT REFERENCES pre_case_files(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending',
    title TEXT,
    description TEXT,
    channel TEXT DEFAULT 'web',
    contact_phone TEXT,
    agreed_fee TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS direct_booking_messages (
    id TEXT PRIMARY KEY,
    booking_id TEXT REFERENCES direct_bookings(id) ON DELETE CASCADE,
    sender_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    is_admin_message BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. LEGAL MOAT KNOWLEDGE (Constitutional Grounding & Police Act 2020)
CREATE TABLE IF NOT EXISTS moat_data (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    source TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CIVIC CONTENT & FORUM
CREATE TABLE IF NOT EXISTS faqs (
    id TEXT PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS testimonials (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT,
    content TEXT NOT NULL,
    rating INT DEFAULT 5,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forum_posts (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    author_name TEXT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    city TEXT,
    upvotes INT DEFAULT 0,
    downvotes INT DEFAULT 0,
    comments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    date TEXT,
    time TEXT,
    location TEXT,
    city TEXT,
    category TEXT,
    organizer TEXT,
    organizer_id TEXT,
    max_attendees INT,
    attendees JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    company TEXT,
    location TEXT,
    city TEXT,
    type TEXT,
    description TEXT,
    requirements JSONB DEFAULT '[]'::jsonb,
    salary TEXT,
    contact_email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. SABIGUARD CHAT ARCHIVE
CREATE TABLE IF NOT EXISTS sabiguard_chats (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sabiguard_messages (
    id TEXT PRIMARY KEY,
    chat_id TEXT REFERENCES sabiguard_chats(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. PAYMENT GATEWAYS & SETTINGS
CREATE TABLE IF NOT EXISTS payment_methods (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    public_key TEXT,
    secret_key TEXT,
    encryption_key TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS webhook_hash TEXT;
ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS instructions TEXT DEFAULT '';
ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS fields JSONB DEFAULT '[]'::jsonb;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS storage_mb NUMERIC DEFAULT 1;

CREATE TABLE IF NOT EXISTS admin_settings (
    "key" TEXT PRIMARY KEY,
    value TEXT,
    category TEXT DEFAULT 'general',
    is_secret BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. IMPACT METRICS (For Grants, NGOs, and Sustainable Development ESG Reporting)
CREATE TABLE IF NOT EXISTS impact_metrics (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    metric_key TEXT NOT NULL,
    city TEXT DEFAULT 'Lagos',
    channel TEXT DEFAULT 'web',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SEED INITIAL CORE DATA
INSERT INTO plans (id, name, type, user_type, price, credits, monthly_credits, billing_cycle, storage_mb, description, features)
VALUES 
('plan-free', 'Citizen Free', 'free', 'user', 0, 10, 10, 'monthly', 0.5, 'Perfect for everyday civic awareness', '["10 Free Monthly Credits", "512KB Chat Storage", "Basic AI Legal Guidance", "Community Forum Access", "Real-time Traffic Alerts", "Public Marketplace View"]'::jsonb),
('plan-pro', 'Sabi Pro', 'pro', 'user', 2500, 500, 500, 'monthly', 5, 'Enhanced features for frequent users', '["500 Monthly Credits", "5MB Chat Storage", "Priority AI Support", "Advanced Route Optimization", "Verified Pro Matching", "Job Board Early Access", "Ad-free Experience"]'::jsonb),
('plan-vendor', 'Vendor Elite', 'pro', 'vendor', 10000, 1000, 1000, 'monthly', 10, 'For professionals offering services', '["1,000 Monthly Credits", "10MB Chat Storage", "Unlimited Marketplace Listings", "Verified Professional Badge", "Featured Service Placement", "Client Lead Analytics", "Custom Business Profile", "Direct Messaging Access"]'::jsonb),
('plan-vendor-enterprise', 'Vendor Enterprise', 'enterprise', 'vendor', 25000, 10000, 10000, 'yearly', 50, 'Best value for large vendors and legal firms', '["10,000 Annual Credits", "50MB Chat Storage", "Unlimited Marketplace Listings", "Dedicated Account Support", "Advanced Analytics & Reporting", "Priority Lead Matching", "Custom Business Growth Plan", "Enterprise Workflow Automation"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    credits = EXCLUDED.credits,
    storage_mb = EXCLUDED.storage_mb,
    features = EXCLUDED.features;

INSERT INTO admin_settings (key, value, category)
VALUES 
('site_title', 'SabiRight', 'general'),
('seo_title', 'SabiRight - AI Civic Super-App', 'general'),
('seo_description', 'SabiRight is an AI-powered Civic Super-App for emerging markets. Legal First Aid, Smart Traffic routing, AI-powered Jobs, and a Verified Marketplace.', 'general'),
('ai_provider', 'google', 'ai'),
('active_languages', '["English", "Nigerian Pidgin", "Hausa", "Yoruba", "Igbo"]', 'general'),
('flag_shadow_threshold', '5', 'moderation')
ON CONFLICT (key) DO NOTHING;

INSERT INTO faqs (id, question, answer, category, sort_order)
VALUES
('faq-1', 'How accurate is the SabiRight AI Agent?', 'SabiRight uses Retrieval-Augmented Generation (RAG) referencing the 1999 Constitution and Police Act 2020 to minimize hallucinations.', 'general', 1),
('faq-2', 'Is the platform free to use?', 'Yes! Core features like basic AI legal guidance, community forums, and traffic updates are completely free with daily credit topups.', 'general', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO testimonials (id, name, role, content, rating)
VALUES
('testi-1', 'Chidi O.', 'Business Owner', 'SabiRight helped me understand my rights during a police stop in Lagos. The AI guidance was calm and accurate.', 5),
('testi-2', 'Amaka E.', 'Law Student', 'The Legal First Aid feature is revolutionary. It breaks down complex Nigerian laws into simple, actionable steps.', 5)
ON CONFLICT (id) DO NOTHING;
-- 12. CREDIT PACKAGES
CREATE TABLE IF NOT EXISTS credit_packages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    credits INT NOT NULL DEFAULT 50,
    price NUMERIC NOT NULL DEFAULT 500,
    bonus INT DEFAULT 0,
    description TEXT,
    popular BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO credit_packages (id, name, credits, price, bonus, description, popular)
VALUES
('cp-starter', 'Starter Civic Pack', 50, 500, 0, '50 credits for emergency inquiries', false),
('cp-standard', 'Standard Citizen Pack', 200, 1800, 20, '200 + 20 bonus credits for regular consultations', true),
('cp-pro', 'Pro Legal Pack', 500, 4000, 50, '500 + 50 bonus credits for comprehensive advocacy', false)
ON CONFLICT (id) DO NOTHING;

-- 13. USER WALLETS & TRANSACTIONS (Ledger)
CREATE TABLE IF NOT EXISTS wallets (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    balance NUMERIC NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'NGN',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
    id TEXT PRIMARY KEY,
    wallet_id TEXT REFERENCES wallets(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL,
    reference TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'NGN',
    provider TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    provider_ref TEXT,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. DASHBOARD TRAFFIC & SAVED ITEMS
CREATE TABLE IF NOT EXISTS dashboard_traffic (
    user_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    location TEXT NOT NULL,
    status TEXT DEFAULT 'normal',
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saved_jobs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    job_id TEXT REFERENCES jobs(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, job_id)
);

CREATE TABLE IF NOT EXISTS applied_jobs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    job_id TEXT REFERENCES jobs(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, job_id)
);

CREATE TABLE IF NOT EXISTS saved_events (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, event_id)
);

-- 16. AUTOMATIC AUTH USER SYNC TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    auth_id, 
    email, 
    display_name, 
    phone_number, 
    channel, 
    city, 
    state, 
    created_at
  )
  VALUES (
    NEW.id::text,
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone_number',
    'web',
    COALESCE(NEW.raw_user_meta_data->>'city', 'Lagos'),
    COALESCE(NEW.raw_user_meta_data->>'state', 'Lagos'),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(EXCLUDED.display_name, public.profiles.display_name);

  INSERT INTO public.credits (user_id, total_credits, used_credits, plan_credits)
  VALUES (NEW.id::text, 10, 0, 10)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.wallets (id, user_id, balance, currency)
  VALUES ('w-' || NEW.id::text, NEW.id::text, 0, 'NGN')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 17. SUPABASE REALTIME REPLICATION (For live chat & instant notifications)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'direct_booking_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE direct_booking_messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;

-- 18. ROW LEVEL SECURITY (RLS)
-- The Express server uses the service-role key, which bypasses RLS, and performs every
-- write (credits, plans, bookings, payments, admin settings). Browser/mobile clients use
-- the anon key, so they only get: read of their OWN rows, and update of safe profile fields.

-- 18a. Enable RLS on every public table. Tables with no policy are server-only.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
  END LOOP;
END $$;

-- 18b. Drop every previous permissive policy.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- 18c. Own-row policies. profiles.id is the auth user id (text) for web/mobile accounts.
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT TO authenticated
  USING (auth_id = auth.uid() OR id = auth.uid()::text);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated
  USING (auth_id = auth.uid() OR id = auth.uid()::text)
  WITH CHECK (auth_id = auth.uid() OR id = auth.uid()::text);

-- Clients may only change harmless profile fields. Roles, storage and channel links stay server-side.
REVOKE INSERT, UPDATE, DELETE ON profiles FROM anon, authenticated;
GRANT UPDATE (display_name, phone_number, dob, gender, state, city, language, updated_at) ON profiles TO authenticated;

CREATE POLICY "credits_select_own" ON credits FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text);
REVOKE INSERT, UPDATE, DELETE ON credits FROM anon, authenticated;

CREATE POLICY "pre_case_files_select_own" ON pre_case_files FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY "direct_bookings_select_party" ON direct_bookings FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text OR vendor_id = auth.uid()::text);

CREATE POLICY "direct_booking_messages_select_party" ON direct_booking_messages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM direct_bookings b
    WHERE b.id = direct_booking_messages.booking_id
      AND (b.user_id = auth.uid()::text OR b.vendor_id = auth.uid()::text)
  ));

CREATE POLICY "sabiguard_chats_select_own" ON sabiguard_chats FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY "sabiguard_messages_select_own" ON sabiguard_messages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM sabiguard_chats c
    WHERE c.id = sabiguard_messages.chat_id AND c.user_id = auth.uid()::text
  ));

-- 18d. Public marketing content that is safe to read without the server.
CREATE POLICY "plans_public_read" ON plans FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "faqs_public_read" ON faqs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "testimonials_public_read" ON testimonials FOR SELECT TO anon, authenticated USING (true);

-- admin_settings (API keys), payments, wallets, subscriptions, impact_metrics, routes,
-- bot_sessions and channel_link_codes intentionally have NO client policy: server only.

-- 19. BOT CHAT SESSIONS (persist WhatsApp/Telegram conversations across server restarts)
CREATE TABLE IF NOT EXISTS bot_sessions (
  user_id TEXT PRIMARY KEY,
  history JSONB NOT NULL DEFAULT '[]'::jsonb,
  adk_state JSONB,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE bot_sessions ENABLE ROW LEVEL SECURITY;

-- 20. CHANNEL LINK CODES (link a WhatsApp/Telegram identity to a web/mobile account)
CREATE TABLE IF NOT EXISTS channel_link_codes (
  code TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS channel_link_codes_user_idx ON channel_link_codes(user_id);
ALTER TABLE channel_link_codes ENABLE ROW LEVEL SECURITY;

-- Linked channel identities (one account may have both WhatsApp and Telegram).
CREATE TABLE IF NOT EXISTS channel_links (
  channel TEXT NOT NULL,
  channel_user_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  linked_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (channel, channel_user_id)
);
CREATE INDEX IF NOT EXISTS channel_links_user_idx ON channel_links(user_id);
ALTER TABLE channel_links ENABLE ROW LEVEL SECURITY;
-- Saved commute routes (Home, Office, ...)
CREATE TABLE IF NOT EXISTS routes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  route_name TEXT NOT NULL,
  start_location TEXT,
  end_location TEXT,
  start_lat DOUBLE PRECISION,
  start_lng DOUBLE PRECISION,
  end_lat DOUBLE PRECISION,
  end_lng DOUBLE PRECISION,
  status TEXT DEFAULT 'unknown',
  recommendation TEXT,
  cloaked_streets JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS routes_user_idx ON routes(user_id);
ALTER TABLE routes ENABLE ROW LEVEL SECURITY; -- server uses service role; no public policies

-- Persist route alerts in Supabase; this table is server-only under RLS.
CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  route_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT DEFAULT 'info',
  acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS alerts_route_id_idx ON alerts(route_id);
CREATE INDEX IF NOT EXISTS alerts_user_id_idx ON alerts(user_id);
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- 12. NATIONAL AI INNOVATION CHALLENGE (N-ATLAS Sovereign LLM Seed Configuration)
INSERT INTO admin_settings ("key", value, category, is_secret)
VALUES 
    ('ai_mode', 'natlas_sovereign', 'ai', false),
    ('natlas_model_id', 'NCAIR1/N-ATLaS', 'ai', false),
    ('natlas_api_endpoint', 'https://api-inference.huggingface.co/models/NCAIR1/N-ATLaS', 'ai', false),
    ('natlas_prompt_vernacular_support', 'true', 'ai', false)
ON CONFLICT ("key") DO NOTHING;

-- 13. OMNICHANNEL NOTIFICATIONS & TEMPLATES
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

-- Seed Standard Transactional Notification Templates
INSERT INTO notification_templates (id, name, type, subject, body_template, channels, is_active)
VALUES
    ('tmpl-welcome', 'welcome_email', 'transactional', 'Welcome to SabiRight — Your Civic Protection Partner', '<h1>Welcome to SabiRight, {{userName}}!</h1><p>We are thrilled to have you join our platform. SabiRight gives you immediate access to Nigerian statutory legal first-aid, civic education, and verified professionals in your community.</p><p>Get started by exploring our AI Civic Chat or booking a verified legal professional.</p>', '["email", "in_app"]'::jsonb, true),
    ('tmpl-verify-code', 'email_verification_code', 'transactional', 'Your SabiRight Verification Code', '<h2>Email Verification</h2><p>Hello {{userName}},</p><p>Your single-use 6-digit SabiRight verification code is:</p><div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; padding: 12px; background: #f1f5f9; text-align: center; border-radius: 8px;">{{code}}</div><p>This code will expire in {{expiry}}.</p><p>If you did not request this verification code, please ignore this email.</p>', '["email"]'::jsonb, true),
    ('tmpl-booking-confirmed', 'booking_confirmed', 'transactional', 'Booking Confirmed: {{serviceTitle}}', '<h2>Booking Confirmation</h2><p>Hello {{userName}},</p><p>Your booking for <strong>{{serviceTitle}}</strong> with <strong>{{providerName}}</strong> has been confirmed.</p><p><strong>Scheduled Time:</strong> {{scheduledTime}}<br/><strong>Location:</strong> {{location}}</p>', '["email", "in_app"]'::jsonb, true),
    ('tmpl-credit-topup', 'credit_topup', 'transactional', 'Wallet Credited — SabiRight', '<h2>Credits Added Successfully</h2><p>Hello {{userName}},</p><p>Your SabiRight account has been topped up with <strong>{{creditsAdded}} credits</strong> (Payment Reference: {{reference}}).</p><p>Your updated balance is <strong>{{currentBalance}} credits</strong>.</p>', '["email", "in_app"]'::jsonb, true)
ON CONFLICT (name) DO NOTHING;