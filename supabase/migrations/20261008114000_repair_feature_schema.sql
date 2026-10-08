-- Reconcile deployed Supabase databases with the current server storage layer.
-- Safe to run more than once in the Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.admin_settings (
  "key" TEXT PRIMARY KEY,
  value TEXT,
  category TEXT DEFAULT 'general',
  is_secret BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_settings
  ADD COLUMN IF NOT EXISTS value TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS is_secret BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  user_type TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  credits INT NOT NULL DEFAULT 10,
  monthly_credits INT NOT NULL DEFAULT 0,
  billing_cycle TEXT DEFAULT 'monthly',
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS storage_mb NUMERIC DEFAULT 1;

CREATE TABLE IF NOT EXISTS public.payment_methods (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  public_key TEXT,
  secret_key TEXT,
  encryption_key TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.payment_methods
  ADD COLUMN IF NOT EXISTS webhook_hash TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS instructions TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS fields JSONB DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS public.routes (
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
CREATE INDEX IF NOT EXISTS routes_user_idx ON public.routes(user_id);

CREATE TABLE IF NOT EXISTS public.alerts (
  id TEXT PRIMARY KEY,
  route_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT DEFAULT 'info',
  acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS alerts_route_id_idx ON public.alerts(route_id);
CREATE INDEX IF NOT EXISTS alerts_user_id_idx ON public.alerts(user_id);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
