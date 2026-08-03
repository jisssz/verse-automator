ALTER TABLE public.generated_content
  ADD COLUMN IF NOT EXISTS headline text,
  ADD COLUMN IF NOT EXISTS pin_description text,
  ADD COLUMN IF NOT EXISTS affiliate_link text;

COMMENT ON COLUMN public.generated_content.headline IS 'Short catchy headline for the product.';
COMMENT ON COLUMN public.generated_content.pin_description IS 'Longer Pinterest description with keywords.';
COMMENT ON COLUMN public.generated_content.affiliate_link IS 'Affiliate link for the product.';
