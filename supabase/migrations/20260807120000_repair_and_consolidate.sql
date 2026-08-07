-- ============================================================================
-- DailyVerse AI — Consolidated Repair Migration
-- Run this in Supabase SQL Editor if you encounter "null value in column" errors
-- when creating products manually from the UI.
-- ============================================================================

-- 1. Make source tracking columns nullable (allows manual product creation without Google Sheets)
ALTER TABLE public.products
  ALTER COLUMN source_spreadsheet_id DROP NOT NULL,
  ALTER COLUMN source_sheet_name DROP NOT NULL,
  ALTER COLUMN source_row_number DROP NOT NULL,
  ALTER COLUMN source_hash DROP NOT NULL;

-- 2. Add columns that may be missing in older deployments
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS affiliate_link text,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS image_url text;

-- 3. Ensure generated_content has unique constraints for upserts
CREATE UNIQUE INDEX IF NOT EXISTS generated_content_campaign_product_id_idx
  ON public.generated_content (campaign_product_id)
  WHERE campaign_product_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS generated_content_product_id_idx
  ON public.generated_content (product_id)
  WHERE product_id IS NOT NULL;

-- 4. Ensure generated_images table exists (in case it was missed)
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

-- 5. Add RLS for generated_images if not already present
ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage generated images for their own products" ON public.generated_images;
CREATE POLICY "Users can manage generated images for their own products"
  ON public.generated_images FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.products
    WHERE products.id = generated_images.product_id
      AND products.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.products
    WHERE products.id = generated_images.product_id
      AND products.owner_id = auth.uid()
  ));

-- 6. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.generated_images TO authenticated;
GRANT ALL ON public.generated_images TO service_role;

-- 7. Automation logs — ensure table exists and RLS allows reading
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

ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view automation logs for their own products" ON public.automation_logs;
CREATE POLICY "Users can view automation logs for their own products"
  ON public.automation_logs FOR SELECT TO authenticated
  USING (
    product_id IS NULL OR EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = automation_logs.product_id
        AND products.owner_id = auth.uid()
    )
  );

-- Allow insert from authenticated users (so the app can write logs)
DROP POLICY IF EXISTS "Authenticated users can insert automation logs" ON public.automation_logs;
CREATE POLICY "Authenticated users can insert automation logs"
  ON public.automation_logs FOR INSERT TO authenticated
  WITH CHECK (true);

GRANT SELECT, INSERT ON public.automation_logs TO authenticated;
GRANT ALL ON public.automation_logs TO service_role;
