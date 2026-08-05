-- Migration to add pinterest_accounts, board_cache, and pin_jobs tables

CREATE TABLE IF NOT EXISTS public.pinterest_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pinterest_user_id text,
  username text,
  access_token text NOT NULL,
  refresh_token text,
  expires_at timestamptz,
  scope text,
  connected_at timestamptz NOT NULL DEFAULT now(),
  disconnected_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pinterest_accounts_user_active_idx
  ON public.pinterest_accounts (user_id, is_active);

CREATE TABLE IF NOT EXISTS public.board_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  board_id text NOT NULL,
  board_name text NOT NULL,
  board_description text,
  pin_count integer NOT NULL DEFAULT 0,
  cached_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, board_id)
);

CREATE INDEX IF NOT EXISTS board_cache_user_idx
  ON public.board_cache (user_id, board_name);

CREATE TABLE IF NOT EXISTS public.pin_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id text NOT NULL,
  board_id text,
  board_name text,
  title text,
  description text,
  image_url text,
  link text,
  status text NOT NULL DEFAULT 'queued',
  scheduled_at timestamptz,
  attempted_at timestamptz,
  completed_at timestamptz,
  attempt_count integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  last_error text,
  pinterest_pin_id text,
  pin_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pin_jobs_status_scheduled_idx
  ON public.pin_jobs (status, scheduled_at, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pinterest_accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.board_cache TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pin_jobs TO authenticated;

GRANT ALL ON public.pinterest_accounts TO service_role;
GRANT ALL ON public.board_cache TO service_role;
GRANT ALL ON public.pin_jobs TO service_role;

ALTER TABLE public.pinterest_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pin_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own pinterest accounts" ON public.pinterest_accounts;
CREATE POLICY "Users can manage their own pinterest accounts"
ON public.pinterest_accounts FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own board cache" ON public.board_cache;
CREATE POLICY "Users can manage their own board cache"
ON public.board_cache FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own pin jobs" ON public.pin_jobs;
CREATE POLICY "Users can manage their own pin jobs"
ON public.pin_jobs FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS pinterest_accounts_touch_updated_at ON public.pinterest_accounts;
CREATE TRIGGER pinterest_accounts_touch_updated_at
BEFORE UPDATE ON public.pinterest_accounts
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS pin_jobs_touch_updated_at ON public.pin_jobs;
CREATE TRIGGER pin_jobs_touch_updated_at
BEFORE UPDATE ON public.pin_jobs
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();
