-- Harden verification-code storage and ensure push endpoints are unique per user.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS email_verification_status TEXT NOT NULL DEFAULT 'verified',
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

ALTER TABLE email_verification_codes
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS code_hash TEXT,
  ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 0,
  ALTER COLUMN code DROP NOT NULL;

-- Existing plaintext codes are invalidated rather than migrated into the new format.
UPDATE email_verification_codes SET code = NULL WHERE code IS NOT NULL;
DELETE FROM email_verification_codes
WHERE email IS NULL OR code_hash IS NULL;

ALTER TABLE email_verification_codes
  ALTER COLUMN email SET NOT NULL,
  ALTER COLUMN code_hash SET NOT NULL;

WITH duplicates AS (
  SELECT ctid,
         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC, id DESC) AS row_number
  FROM email_verification_codes
)
DELETE FROM email_verification_codes
WHERE ctid IN (SELECT ctid FROM duplicates WHERE row_number > 1);

CREATE UNIQUE INDEX IF NOT EXISTS email_verif_user_uidx
  ON email_verification_codes(user_id);
CREATE INDEX IF NOT EXISTS email_verif_expiry_idx
  ON email_verification_codes(expires_at);
ALTER TABLE email_verification_codes ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.issue_email_verification_code(
  p_id TEXT,
  p_user_id TEXT,
  p_email TEXT,
  p_code_hash TEXT,
  p_expires_at TIMESTAMPTZ
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_created_at TIMESTAMPTZ;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id));
  DELETE FROM public.email_verification_codes WHERE expires_at <= NOW();

  SELECT created_at INTO v_created_at
  FROM public.email_verification_codes
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_created_at IS NOT NULL AND v_created_at > NOW() - INTERVAL '60 seconds' THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.email_verification_codes (
    id, user_id, email, code, code_hash, attempts, expires_at, created_at
  ) VALUES (
    p_id, p_user_id, LOWER(TRIM(p_email)), NULL, p_code_hash, 0, p_expires_at, NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    id = EXCLUDED.id,
    email = EXCLUDED.email,
    code = NULL,
    code_hash = EXCLUDED.code_hash,
    attempts = 0,
    expires_at = EXCLUDED.expires_at,
    created_at = NOW();

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_email_verification_code(
  p_user_id TEXT,
  p_code_hash TEXT
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
BEGIN
  DELETE FROM public.email_verification_codes
  WHERE user_id = p_user_id
    AND code_hash = p_code_hash
    AND expires_at > NOW()
    AND attempts < 5
  RETURNING email INTO v_email;

  IF v_email IS NOT NULL THEN
    UPDATE public.profiles
    SET email = v_email,
        email_verified = TRUE,
        email_verification_status = 'verified',
        email_verified_at = NOW()
    WHERE id = p_user_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Profile not found for email verification';
    END IF;

    RETURN v_email;
  END IF;

  UPDATE public.email_verification_codes
  SET attempts = attempts + 1
  WHERE user_id = p_user_id
    AND expires_at > NOW()
    AND attempts < 5;

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.issue_email_verification_code(TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.consume_email_verification_code(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.issue_email_verification_code(TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ) TO service_role;
GRANT EXECUTE ON FUNCTION public.consume_email_verification_code(TEXT, TEXT) TO service_role;

ALTER TABLE push_subscriptions
  ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'webpush',
  ALTER COLUMN p256dh DROP NOT NULL,
  ALTER COLUMN auth DROP NOT NULL;

-- Collapse legacy duplicate subscriptions before adding the provider-scoped uniqueness constraint.
WITH duplicates AS (
  SELECT ctid,
         ROW_NUMBER() OVER (PARTITION BY user_id, provider, endpoint ORDER BY created_at DESC, id DESC) AS row_number
  FROM push_subscriptions
)
DELETE FROM push_subscriptions
WHERE ctid IN (SELECT ctid FROM duplicates WHERE row_number > 1);

DROP INDEX IF EXISTS push_sub_user_endpoint_uidx;
CREATE UNIQUE INDEX IF NOT EXISTS push_sub_user_provider_endpoint_uidx
  ON push_subscriptions(user_id, provider, endpoint);

CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON notifications(user_id, created_at DESC, id DESC);
