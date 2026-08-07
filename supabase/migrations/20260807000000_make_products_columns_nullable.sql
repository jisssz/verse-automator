-- Relax constraints on products table to allow manual UI product entries
ALTER TABLE public.products 
  ALTER COLUMN source_spreadsheet_id DROP NOT NULL,
  ALTER COLUMN source_sheet_name DROP NOT NULL,
  ALTER COLUMN source_row_number DROP NOT NULL,
  ALTER COLUMN source_hash DROP NOT NULL;

-- Add description, tags and affiliate links columns if missing
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS affiliate_link text,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS image_url text;

-- Create unique index on product_id for standalone generated_content upserts
CREATE UNIQUE INDEX IF NOT EXISTS generated_content_product_id_idx ON public.generated_content (product_id) WHERE product_id IS NOT NULL;
