-- Migration to harmonize generated_content with campaign_products and products pipelines
ALTER TABLE public.generated_content
  ALTER COLUMN product_id DROP NOT NULL;

ALTER TABLE public.generated_content
  ADD COLUMN IF NOT EXISTS campaign_product_id uuid REFERENCES public.campaign_products(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS generated_content_campaign_product_id_idx
  ON public.generated_content (campaign_product_id)
  WHERE campaign_product_id IS NOT NULL;

CREATE POLICY "Users can manage generated content for their own campaign products"
ON public.generated_content FOR ALL
TO authenticated
USING (
  campaign_product_id IS NULL OR EXISTS (
    SELECT 1
    FROM public.campaign_products
    JOIN public.campaigns ON campaigns.id = campaign_products.campaign_id
    WHERE campaign_products.id = generated_content.campaign_product_id
      AND campaigns.owner_id = auth.uid()
  )
)
WITH CHECK (
  campaign_product_id IS NULL OR EXISTS (
    SELECT 1
    FROM public.campaign_products
    JOIN public.campaigns ON campaigns.id = campaign_products.campaign_id
    WHERE campaign_products.id = generated_content.campaign_product_id
      AND campaigns.owner_id = auth.uid()
  )
);
