-- ============================================================================
-- DailyVerse AI — Complete Production Consolidated Schema
-- Can be executed directly in Supabase SQL Editor on a fresh project.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  affiliate_link_template text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- 2. CAMPAIGNS
CREATE TABLE IF NOT EXISTS public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  niche text,
  status text NOT NULL DEFAULT 'draft',
  scheduled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. CAMPAIGN PRODUCTS
CREATE TABLE IF NOT EXISTS public.campaign_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  source_url text,
  trend_note text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. PRODUCTS (Standalone / Google Sheets Import)
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE,
  source_system text NOT NULL DEFAULT 'google_sheets',
  source_spreadsheet_id text,
  source_sheet_name text,
  source_row_number integer,
  source_hash text,
  product_name text NOT NULL,
  product_category text NOT NULL,
  source_url text,
  trend_note text,
  description text,
  affiliate_link text,
  tags text[] DEFAULT '{}'::text[],
  image_url text,
  status text NOT NULL DEFAULT 'pending',
  locked_at timestamptz,
  locked_by uuid,
  processed_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, source_system, source_hash)
);

CREATE INDEX IF NOT EXISTS products_owner_status_idx ON public.products (owner_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS products_campaign_idx ON public.products (campaign_id, created_at DESC);
CREATE INDEX IF NOT EXISTS products_source_lookup_idx ON public.products (source_system, source_spreadsheet_id, source_sheet_name);

-- 5. GENERATED CONTENT
CREATE TABLE IF NOT EXISTS public.generated_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  campaign_product_id uuid REFERENCES public.campaign_products(id) ON DELETE CASCADE,
  headline text,
  description text,
  pinterest_title text,
  pin_description text,
  affiliate_link text,
  seo_keywords text[] NOT NULL DEFAULT '{}'::text[],
  hashtags text[] NOT NULL DEFAULT '{}'::text[],
  image_prompt text,
  alt_text text,
  affiliate_cta text,
  image_url text,
  model_name text,
  prompt_version text,
  prompt_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  response_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS generated_content_status_idx ON public.generated_content (status, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS generated_content_campaign_product_id_idx ON public.generated_content (campaign_product_id) WHERE campaign_product_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS generated_content_product_id_idx ON public.generated_content (product_id) WHERE product_id IS NOT NULL;

-- 6. GENERATED IMAGES
CREATE TABLE IF NOT EXISTS public.generated_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  generated_content_id uuid REFERENCES public.generated_content(id) ON DELETE SET NULL,
  image_url text,
  image_storage_path text,
  image_prompt text NOT NULL,
  alt_text text,
  model_name text,
  prompt_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  response_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  width integer,
  height integer,
  retry_count integer NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS generated_images_primary_idx ON public.generated_images (product_id) WHERE is_primary;
CREATE INDEX IF NOT EXISTS generated_images_status_idx ON public.generated_images (status, created_at DESC);

-- 7. PUBLISHED PINS
CREATE TABLE IF NOT EXISTS public.published_pins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.campaign_products(id) ON DELETE CASCADE,
  pinterest_pin_id text,
  pin_url text,
  published_at timestamptz,
  status text NOT NULL DEFAULT 'scheduled',
  board_id text,
  board_name text,
  scheduled_at timestamptz,
  error_message text,
  request_payload jsonb DEFAULT '{}'::jsonb,
  response_payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 8. PINTEREST POSTS
CREATE TABLE IF NOT EXISTS public.pinterest_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  campaign_product_id uuid REFERENCES public.campaign_products(id) ON DELETE CASCADE,
  generated_content_id uuid REFERENCES public.generated_content(id) ON DELETE SET NULL,
  generated_image_id uuid REFERENCES public.generated_images(id) ON DELETE SET NULL,
  pinterest_pin_id text,
  pin_url text,
  board_id text,
  board_name text,
  scheduled_at timestamptz,
  published_at timestamptz,
  status text NOT NULL DEFAULT 'scheduled',
  request_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  response_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pinterest_posts_status_idx ON public.pinterest_posts (status, created_at DESC);

-- 9. PINTEREST ACCOUNTS
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

CREATE INDEX IF NOT EXISTS pinterest_accounts_user_active_idx ON public.pinterest_accounts (user_id, is_active);

-- 10. BOARD CACHE
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

CREATE INDEX IF NOT EXISTS board_cache_user_idx ON public.board_cache (user_id, board_name);

-- 11. PIN JOBS
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

CREATE INDEX IF NOT EXISTS pin_jobs_status_scheduled_idx ON public.pin_jobs (status, scheduled_at, created_at);

-- 12. AUTOMATION LOGS
CREATE TABLE IF NOT EXISTS public.automation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  generated_content_id uuid REFERENCES public.generated_content(id) ON DELETE CASCADE,
  generated_image_id uuid REFERENCES public.generated_images(id) ON DELETE CASCADE,
  pinterest_post_id uuid REFERENCES public.pinterest_posts(id) ON DELETE CASCADE,
  run_id text,
  source_system text NOT NULL DEFAULT 'google_sheets',
  event_type text NOT NULL,
  level text NOT NULL DEFAULT 'info',
  message text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS automation_logs_run_idx ON public.automation_logs (run_id, created_at DESC);
CREATE INDEX IF NOT EXISTS automation_logs_product_idx ON public.automation_logs (product_id, created_at DESC);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_touch_updated_at ON public.products;
CREATE TRIGGER products_touch_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS generated_content_touch_updated_at ON public.generated_content;
CREATE TRIGGER generated_content_touch_updated_at BEFORE UPDATE ON public.generated_content FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS generated_images_touch_updated_at ON public.generated_images;
CREATE TRIGGER generated_images_touch_updated_at BEFORE UPDATE ON public.generated_images FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS pinterest_posts_touch_updated_at ON public.pinterest_posts;
CREATE TRIGGER pinterest_posts_touch_updated_at BEFORE UPDATE ON public.pinterest_posts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS pinterest_accounts_touch_updated_at ON public.pinterest_accounts;
CREATE TRIGGER pinterest_accounts_touch_updated_at BEFORE UPDATE ON public.pinterest_accounts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS pin_jobs_touch_updated_at ON public.pin_jobs;
CREATE TRIGGER pin_jobs_touch_updated_at BEFORE UPDATE ON public.pin_jobs FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.claim_pending_products(p_owner_id uuid, p_limit integer DEFAULT 1)
RETURNS SETOF public.products
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH claimed AS (
    UPDATE public.products
    SET status = 'processing',
        locked_at = now(),
        locked_by = p_owner_id,
        updated_at = now()
    WHERE id IN (
      SELECT id
      FROM public.products
      WHERE owner_id = p_owner_id
        AND status IN ('pending', 'failed')
      ORDER BY created_at
      LIMIT p_limit
      FOR UPDATE SKIP LOCKED
    )
    RETURNING *
  )
  SELECT * FROM claimed;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_pending_products(uuid, integer) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES & PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.generated_content TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.generated_images TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.published_pins TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pinterest_posts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pinterest_accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.board_cache TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pin_jobs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.automation_logs TO authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.published_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pinterest_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pinterest_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pin_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;
CREATE POLICY "Users can manage their own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own campaigns" ON public.campaigns;
CREATE POLICY "Users can manage their own campaigns" ON public.campaigns FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can manage products in their own campaigns" ON public.campaign_products;
CREATE POLICY "Users can manage products in their own campaigns" ON public.campaign_products FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.campaigns WHERE campaigns.id = campaign_products.campaign_id AND campaigns.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.campaigns WHERE campaigns.id = campaign_products.campaign_id AND campaigns.owner_id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage their own products" ON public.products;
CREATE POLICY "Users can manage their own products" ON public.products FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can manage generated content for their own products" ON public.generated_content;
CREATE POLICY "Users can manage generated content for their own products" ON public.generated_content FOR ALL TO authenticated USING (product_id IS NULL OR EXISTS (SELECT 1 FROM public.products WHERE products.id = generated_content.product_id AND products.owner_id = auth.uid())) WITH CHECK (product_id IS NULL OR EXISTS (SELECT 1 FROM public.products WHERE products.id = generated_content.product_id AND products.owner_id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage generated images for their own products" ON public.generated_images;
CREATE POLICY "Users can manage generated images for their own products" ON public.generated_images FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.products WHERE products.id = generated_images.product_id AND products.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.products WHERE products.id = generated_images.product_id AND products.owner_id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage published pins for their own products" ON public.published_pins;
CREATE POLICY "Users can manage published pins for their own products" ON public.published_pins FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.campaign_products JOIN public.campaigns ON campaigns.id = campaign_products.campaign_id WHERE campaign_products.id = published_pins.product_id AND campaigns.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.campaign_products JOIN public.campaigns ON campaigns.id = campaign_products.campaign_id WHERE campaign_products.id = published_pins.product_id AND campaigns.owner_id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage pinterest posts for their own products" ON public.pinterest_posts;
CREATE POLICY "Users can manage pinterest posts for their own products" ON public.pinterest_posts FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.products WHERE products.id = pinterest_posts.product_id AND products.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.products WHERE products.id = pinterest_posts.product_id AND products.owner_id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage their own pinterest accounts" ON public.pinterest_accounts;
CREATE POLICY "Users can manage their own pinterest accounts" ON public.pinterest_accounts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own board cache" ON public.board_cache;
CREATE POLICY "Users can manage their own board cache" ON public.board_cache FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own pin jobs" ON public.pin_jobs;
CREATE POLICY "Users can manage their own pin jobs" ON public.pin_jobs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view automation logs for their own products" ON public.automation_logs;
CREATE POLICY "Users can view automation logs for their own products" ON public.automation_logs FOR SELECT TO authenticated USING (product_id IS NULL OR EXISTS (SELECT 1 FROM public.products WHERE products.id = automation_logs.product_id AND products.owner_id = auth.uid()));

-- ============================================================================
-- STORAGE BUCKETS
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('pin-images', 'pin-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Read Pin Images" ON storage.objects;
CREATE POLICY "Public Read Pin Images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'pin-images');

DROP POLICY IF EXISTS "Authenticated Upload Pin Images" ON storage.objects;
CREATE POLICY "Authenticated Upload Pin Images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'pin-images');
