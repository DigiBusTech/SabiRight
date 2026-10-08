-- SabiRight Bot Hardening Migration
-- Apply after: 20261008140000_notification_hardening.sql
-- Adds is_guest column to profiles and an inbound_bot_messages outbox table.

-- 1. Mark channel-only profiles explicitly as guests
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_guest BOOLEAN NOT NULL DEFAULT FALSE;

-- Retroactively flag any profile that has no auth_id (channel-only guest)
-- and was auto-created by the bot (channel_id set, no email, email_verified
-- was incorrectly set true).  This is advisory; it does not break existing access.
UPDATE profiles
SET is_guest = TRUE
WHERE auth_id IS NULL
  AND email IS NULL
  AND channel_id IS NOT NULL;

-- 2. Outbox table for inbound bot messages
-- Messages are persisted here before the webhook 200 is sent; a background
-- retry handler can re-process rows whose delivered_at is still NULL after a
-- configurable delay.
CREATE TABLE IF NOT EXISTS inbound_bot_messages (
  id          TEXT PRIMARY KEY,
  channel     TEXT NOT NULL,                       -- 'telegram' | 'whatsapp'
  channel_user_id TEXT NOT NULL,
  raw_sender_id TEXT,
  user_name   TEXT,
  phone_number TEXT,
  text        TEXT NOT NULL DEFAULT '',
  action_payload TEXT,
  location    JSONB,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,                        -- set when processing succeeds
  delivered_at TIMESTAMPTZ,                        -- set when outbound send succeeds
  error       TEXT,                                -- last processing error if any
  retry_count INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS inbound_bot_messages_undelivered_idx
  ON inbound_bot_messages(channel, received_at)
  WHERE delivered_at IS NULL;

-- 3. professionals: add lat/lon columns for proximity-aware sorting (PostGIS not
-- required; we store degrees and sort in-application by Haversine distance).
ALTER TABLE professionals
  ADD COLUMN IF NOT EXISTS latitude  DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Backfill from vendor_services where available
UPDATE professionals p
SET latitude  = (
  SELECT vs.latitude
  FROM vendor_services vs
  WHERE vs.professional_id = p.id AND vs.latitude IS NOT NULL
  LIMIT 1
),
longitude = (
  SELECT vs.longitude
  FROM vendor_services vs
  WHERE vs.professional_id = p.id AND vs.longitude IS NOT NULL
  LIMIT 1
)
WHERE p.latitude IS NULL;

