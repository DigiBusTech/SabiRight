-- Durable bot delivery, explicit channel linking, and idempotent bot side effects.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS bot_location_latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS bot_location_longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS bot_location_updated_at TIMESTAMPTZ;

-- channel_id was historically assigned after phone-number matching. It is not
-- proof of an authenticated channel link; explicit links live in channel_links.
UPDATE profiles
SET channel_id = NULL
WHERE id <> channel_id
  AND LEFT(channel_id, 3) IN ('tg_', 'wa_');

ALTER TABLE inbound_bot_messages
  ADD COLUMN IF NOT EXISTS provider_event_id TEXT,
  ADD COLUMN IF NOT EXISTS provider_payload JSONB,
  ADD COLUMN IF NOT EXISTS response JSONB,
  ADD COLUMN IF NOT EXISTS next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS lease_token UUID,
  ADD COLUMN IF NOT EXISTS dead_letter_at TIMESTAMPTZ;

UPDATE inbound_bot_messages
SET dead_letter_at = NOW(),
    error = COALESCE(error, 'Cannot replay legacy row: original provider payload was not stored')
WHERE delivered_at IS NULL
  AND response IS NULL
  AND provider_payload IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS inbound_bot_messages_provider_event_uidx
  ON inbound_bot_messages(channel, provider_event_id)
  WHERE provider_event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS inbound_bot_messages_ready_idx
  ON inbound_bot_messages(next_attempt_at, received_at)
  WHERE delivered_at IS NULL AND dead_letter_at IS NULL;

ALTER TABLE inbound_bot_messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE inbound_bot_messages FROM anon, authenticated;
GRANT ALL ON TABLE inbound_bot_messages TO service_role;

ALTER TABLE channel_link_codes
  ADD COLUMN IF NOT EXISTS redeemed_channel TEXT,
  ADD COLUMN IF NOT EXISTS redeemed_channel_user_id TEXT;

ALTER TABLE credit_logs
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS credit_logs_user_idempotency_uidx
  ON credit_logs(user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE OR REPLACE FUNCTION public.claim_inbound_bot_messages(p_limit INTEGER DEFAULT 10)
RETURNS SETOF public.inbound_bot_messages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT id
    FROM public.inbound_bot_messages
    WHERE delivered_at IS NULL
      AND dead_letter_at IS NULL
      AND next_attempt_at <= NOW()
      AND (locked_until IS NULL OR locked_until <= NOW())
    ORDER BY received_at
    FOR UPDATE SKIP LOCKED
    LIMIT LEAST(GREATEST(COALESCE(p_limit, 10), 1), 50)
  )
  UPDATE public.inbound_bot_messages AS message
  SET locked_until = NOW() + INTERVAL '5 minutes',
      lease_token = gen_random_uuid(),
      retry_count = retry_count + 1
  FROM candidates
  WHERE message.id = candidates.id
  RETURNING message.*;
END;
$$;

CREATE OR REPLACE FUNCTION public.link_bot_channel(
  p_code TEXT,
  p_channel TEXT,
  p_channel_user_id TEXT,
  p_guest_user_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code public.channel_link_codes%ROWTYPE;
  v_linked_user_id TEXT;
  v_guest_history JSONB;
  v_owner_history JSONB;
  v_guest_updated_at TIMESTAMPTZ;
  v_owner_updated_at TIMESTAMPTZ;
  v_combined_history JSONB;
  v_merged_history JSONB;
  v_case_count INTEGER := 0;
  v_booking_count INTEGER := 0;
BEGIN
  IF p_channel NOT IN ('telegram', 'whatsapp')
     OR NULLIF(p_channel_user_id, '') IS NULL
     OR NULLIF(p_code, '') IS NULL THEN
    RETURN jsonb_build_object('success', FALSE);
  END IF;

  SELECT * INTO v_code
  FROM public.channel_link_codes
  WHERE code = UPPER(p_code)
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE);
  END IF;

  IF v_code.used_at IS NOT NULL THEN
    SELECT user_id INTO v_linked_user_id
    FROM public.channel_links
    WHERE channel = p_channel AND channel_user_id = p_channel_user_id;

    IF v_code.redeemed_channel = p_channel
       AND v_code.redeemed_channel_user_id = p_channel_user_id
       AND v_linked_user_id = v_code.user_id THEN
      RETURN jsonb_build_object('success', TRUE, 'already_linked', TRUE, 'user_id', v_code.user_id);
    END IF;
    RETURN jsonb_build_object('success', FALSE);
  END IF;

  IF v_code.expires_at <= NOW()
     OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_code.user_id) THEN
    RETURN jsonb_build_object('success', FALSE);
  END IF;

  INSERT INTO public.channel_links(channel, channel_user_id, user_id, linked_at)
  VALUES (p_channel, p_channel_user_id, v_code.user_id, NOW())
  ON CONFLICT (channel, channel_user_id)
  DO UPDATE SET user_id = EXCLUDED.user_id, linked_at = EXCLUDED.linked_at;

  IF p_guest_user_id IS NOT NULL AND p_guest_user_id <> v_code.user_id THEN
    UPDATE public.pre_case_files SET user_id = v_code.user_id WHERE user_id = p_guest_user_id;
    GET DIAGNOSTICS v_case_count = ROW_COUNT;

    UPDATE public.direct_bookings SET user_id = v_code.user_id WHERE user_id = p_guest_user_id;
    GET DIAGNOSTICS v_booking_count = ROW_COUNT;

    SELECT history, updated_at INTO v_guest_history, v_guest_updated_at
    FROM public.bot_sessions WHERE user_id = p_guest_user_id;
    SELECT history, updated_at INTO v_owner_history, v_owner_updated_at
    FROM public.bot_sessions WHERE user_id = v_code.user_id;

    IF v_guest_history IS NOT NULL OR v_owner_history IS NOT NULL THEN
      IF v_guest_history IS NULL THEN
        v_combined_history := COALESCE(v_owner_history, '[]'::jsonb);
      ELSIF v_owner_history IS NULL THEN
        v_combined_history := COALESCE(v_guest_history, '[]'::jsonb);
      ELSIF v_guest_updated_at <= v_owner_updated_at THEN
        v_combined_history := v_guest_history || v_owner_history;
      ELSE
        v_combined_history := v_owner_history || v_guest_history;
      END IF;

      SELECT COALESCE(jsonb_agg(item ORDER BY ordinal), '[]'::jsonb)
      INTO v_merged_history
      FROM (
        SELECT item, ordinal
        FROM jsonb_array_elements(v_combined_history) WITH ORDINALITY AS turns(item, ordinal)
        ORDER BY ordinal DESC
        LIMIT 20
      ) AS recent_turns;

      INSERT INTO public.bot_sessions(user_id, history, updated_at)
      VALUES (v_code.user_id, v_merged_history, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET history = EXCLUDED.history, updated_at = EXCLUDED.updated_at;

      DELETE FROM public.bot_sessions WHERE user_id = p_guest_user_id;
    END IF;
  END IF;

  UPDATE public.channel_link_codes
  SET used_at = NOW(),
      redeemed_channel = p_channel,
      redeemed_channel_user_id = p_channel_user_id
  WHERE code = v_code.code;

  RETURN jsonb_build_object(
    'success', TRUE,
    'already_linked', FALSE,
    'user_id', v_code.user_id,
    'migrated_case_files', v_case_count,
    'migrated_bookings', v_booking_count
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.create_bot_professional_lead(
  p_case_file_id TEXT,
  p_case_ref TEXT,
  p_booking_id TEXT,
  p_user_id TEXT,
  p_professional_id TEXT,
  p_channel TEXT,
  p_summary TEXT,
  p_raw_chat_history JSONB,
  p_contact_phone TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_professional public.professionals%ROWTYPE;
  v_booking public.direct_bookings%ROWTYPE;
  v_booking_rows INTEGER;
  v_created BOOLEAN;
BEGIN
  SELECT * INTO v_professional
  FROM public.professionals
  WHERE id = p_professional_id AND verified = TRUE AND status = 'active';

  IF NOT FOUND OR v_professional.user_id IS NULL THEN
    RETURN jsonb_build_object('success', FALSE, 'eligible', FALSE);
  END IF;

  INSERT INTO public.pre_case_files(
    id, case_ref, user_id, channel, issue_summary, raw_chat_history, created_at
  )
  VALUES (
    p_case_file_id, p_case_ref, p_user_id, p_channel, LEFT(p_summary, 500),
    COALESCE(p_raw_chat_history, '[]'::jsonb), NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.direct_bookings(
    id, user_id, vendor_id, case_file_id, title, description,
    contact_phone, channel, status, created_at, updated_at
  )
  VALUES (
    p_booking_id, p_user_id, v_professional.user_id, p_case_file_id,
    'Civic Lead (' || UPPER(p_channel) || ') - ' || p_case_ref,
    LEFT(p_summary, 500), COALESCE(p_contact_phone, ''), p_channel,
    'pending', NOW(), NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  GET DIAGNOSTICS v_booking_rows = ROW_COUNT;
  v_created := v_booking_rows > 0;

  SELECT * INTO v_booking
  FROM public.direct_bookings
  WHERE id = p_booking_id
    AND user_id = p_user_id
    AND vendor_id = v_professional.user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bot lead booking could not be verified after insert';
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'eligible', TRUE,
    'created', v_created,
    'booking_id', v_booking.id,
    'professional_user_id', v_professional.user_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.deduct_bot_credits_once(
  p_user_id TEXT,
  p_amount INTEGER,
  p_feature TEXT,
  p_description TEXT,
  p_idempotency_key TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_credits public.credits%ROWTYPE;
  v_existing_amount INTEGER;
BEGIN
  IF p_amount <= 0 OR NULLIF(p_idempotency_key, '') IS NULL THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.credits(user_id, total_credits, used_credits, plan_credits)
  VALUES (p_user_id, 10, 0, 10)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT amount INTO v_existing_amount
  FROM public.credit_logs
  WHERE user_id = p_user_id AND idempotency_key = p_idempotency_key;
  IF FOUND THEN
    RETURN v_existing_amount = -p_amount;
  END IF;

  SELECT * INTO v_credits FROM public.credits WHERE user_id = p_user_id FOR UPDATE;
  IF v_credits.total_credits - v_credits.used_credits < p_amount THEN
    RETURN FALSE;
  END IF;

  UPDATE public.credits
  SET used_credits = used_credits + p_amount, updated_at = NOW()
  WHERE user_id = p_user_id;

  INSERT INTO public.credit_logs(id, user_id, amount, description, feature, created_at, idempotency_key)
  VALUES (
    'cl-' || gen_random_uuid()::text, p_user_id, -p_amount,
    p_description, p_feature, NOW(), p_idempotency_key
  );
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.refund_bot_credits_once(
  p_user_id TEXT,
  p_amount INTEGER,
  p_feature TEXT,
  p_idempotency_key TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_credits public.credits%ROWTYPE;
BEGIN
  IF p_amount <= 0 OR NULLIF(p_idempotency_key, '') IS NULL THEN
    RETURN FALSE;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.credit_logs
    WHERE user_id = p_user_id AND idempotency_key = p_idempotency_key
  ) THEN
    RETURN TRUE;
  END IF;

  SELECT * INTO v_credits FROM public.credits WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  UPDATE public.credits
  SET used_credits = GREATEST(0, used_credits - p_amount), updated_at = NOW()
  WHERE user_id = p_user_id;

  INSERT INTO public.credit_logs(id, user_id, amount, description, feature, created_at, idempotency_key)
  VALUES (
    'cl-' || gen_random_uuid()::text, p_user_id, p_amount,
    'Refund for failed bot response', p_feature, NOW(), p_idempotency_key
  );
  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_inbound_bot_messages(INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.link_bot_channel(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_bot_professional_lead(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.deduct_bot_credits_once(TEXT, INTEGER, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refund_bot_credits_once(TEXT, INTEGER, TEXT, TEXT) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.claim_inbound_bot_messages(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.link_bot_channel(TEXT, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_bot_professional_lead(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.deduct_bot_credits_once(TEXT, INTEGER, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_bot_credits_once(TEXT, INTEGER, TEXT, TEXT) TO service_role;
