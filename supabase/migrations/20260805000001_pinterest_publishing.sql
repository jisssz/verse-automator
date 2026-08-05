-- Migration to add full board, schedule, and error payload fields to published_pins
ALTER TABLE public.published_pins
  ADD COLUMN IF NOT EXISTS board_id text,
  ADD COLUMN IF NOT EXISTS board_name text,
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS error_message text,
  ADD COLUMN IF NOT EXISTS request_payload jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS response_payload jsonb DEFAULT '{}'::jsonb;

-- Ensure campaign_product_id relationship on pinterest_posts if present
ALTER TABLE public.pinterest_posts
  ADD COLUMN IF NOT EXISTS campaign_product_id uuid REFERENCES public.campaign_products(id) ON DELETE CASCADE;
