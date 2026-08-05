CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE,
  source_system text NOT NULL DEFAULT 'google_sheets',
  source_spreadsheet_id text NOT NULL,
  source_sheet_name text NOT NULL,
  source_row_number integer NOT NULL,
  source_hash text NOT NULL,
  product_name text NOT NULL,
  product_category text NOT NULL,
  source_url text,
  trend_note text,
  status text NOT NULL DEFAULT 'pending',
  locked_at timestamptz,
  locked_by uuid,
  processed_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, source_system, source_hash)
);

CREATE INDEX products_owner_status_idx ON public.products (owner_id, status, created_at DESC);
CREATE INDEX products_campaign_idx ON public.products (campaign_id, created_at DESC);
CREATE INDEX products_source_lookup_idx ON public.products (source_system, source_spreadsheet_id, source_sheet_name);

CREATE TABLE public.generated_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  pinterest_title text,
  pinterest_description text,
  seo_keywords text[] NOT NULL DEFAULT '{}'::text[],
  hashtags text[] NOT NULL DEFAULT '{}'::text[],
  image_prompt text,
  alt_text text,
  affiliate_cta text,
  model_name text,
  prompt_version text,
  prompt_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  response_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id)
);

CREATE INDEX generated_content_status_idx ON public.generated_content (status, created_at DESC);

CREATE TABLE public.generated_images (
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

CREATE UNIQUE INDEX generated_images_primary_idx
  ON public.generated_images (product_id)
  WHERE is_primary;

CREATE INDEX generated_images_status_idx ON public.generated_images (status, created_at DESC);

CREATE TABLE public.pinterest_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
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
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id)
);

CREATE INDEX pinterest_posts_status_idx ON public.pinterest_posts (status, created_at DESC);

CREATE TABLE public.automation_logs (
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

CREATE INDEX automation_logs_run_idx ON public.automation_logs (run_id, created_at DESC);
CREATE INDEX automation_logs_product_idx ON public.automation_logs (product_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER products_touch_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER generated_content_touch_updated_at
BEFORE UPDATE ON public.generated_content
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER generated_images_touch_updated_at
BEFORE UPDATE ON public.generated_images
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER pinterest_posts_touch_updated_at
BEFORE UPDATE ON public.pinterest_posts
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.generated_content TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.generated_images TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pinterest_posts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.automation_logs TO authenticated;

GRANT ALL ON public.products TO service_role;
GRANT ALL ON public.generated_content TO service_role;
GRANT ALL ON public.generated_images TO service_role;
GRANT ALL ON public.pinterest_posts TO service_role;
GRANT ALL ON public.automation_logs TO service_role;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pinterest_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own products"
ON public.products FOR ALL
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can manage generated content for their own products"
ON public.generated_content FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.products
    WHERE products.id = generated_content.product_id
      AND products.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.products
    WHERE products.id = generated_content.product_id
      AND products.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can manage generated images for their own products"
ON public.generated_images FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.products
    WHERE products.id = generated_images.product_id
      AND products.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.products
    WHERE products.id = generated_images.product_id
      AND products.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can manage pinterest posts for their own products"
ON public.pinterest_posts FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.products
    WHERE products.id = pinterest_posts.product_id
      AND products.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.products
    WHERE products.id = pinterest_posts.product_id
      AND products.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can view automation logs for their own products"
ON public.automation_logs FOR SELECT
TO authenticated
USING (
  product_id IS NULL OR EXISTS (
    SELECT 1
    FROM public.products
    WHERE products.id = automation_logs.product_id
      AND products.owner_id = auth.uid()
  )
);

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

REVOKE EXECUTE ON FUNCTION public.claim_pending_products(uuid, integer) FROM public;
REVOKE EXECUTE ON FUNCTION public.claim_pending_products(uuid, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.claim_pending_products(uuid, integer) FROM authenticated;
