-- Pseudonymous aggregate analytics for innovation-impact reporting.
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL CHECK (channel IN ('web', 'native_app', 'whatsapp', 'telegram')),
  event_type TEXT NOT NULL CHECK (event_type IN ('visit', 'language_interaction')),
  visitor_id TEXT NOT NULL,
  language TEXT CHECK (language IS NULL OR language IN ('English', 'Nigerian Pidgin', 'Hausa', 'Yoruba', 'Igbo')),
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT analytics_events_type_payload_check CHECK (
    (event_type = 'visit' AND language IS NULL) OR
    (event_type = 'language_interaction' AND language IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS analytics_events_date_channel_idx
  ON analytics_events(event_date, channel, event_type);
CREATE UNIQUE INDEX IF NOT EXISTS analytics_events_daily_visit_uidx
  ON analytics_events(channel, visitor_id, event_date)
  WHERE event_type = 'visit';
CREATE UNIQUE INDEX IF NOT EXISTS analytics_events_daily_language_uidx
  ON analytics_events(channel, visitor_id, event_date, language)
  WHERE event_type = 'language_interaction';

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE analytics_events FROM anon, authenticated;
GRANT ALL ON TABLE analytics_events TO service_role;
