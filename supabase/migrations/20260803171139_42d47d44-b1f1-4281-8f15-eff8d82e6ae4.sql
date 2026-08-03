CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  affiliate_link_template text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  niche text,
  status text NOT NULL DEFAULT 'draft',
  scheduled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.campaign_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  source_url text,
  trend_note text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.generated_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.campaign_products(id) ON DELETE CASCADE,
  pinterest_title text,
  description text,
  hashtags text[],
  image_prompt text,
  image_url text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id)
);

CREATE TABLE public.published_pins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.campaign_products(id) ON DELETE CASCADE,
  pinterest_pin_id text,
  pin_url text,
  published_at timestamptz,
  status text NOT NULL DEFAULT 'scheduled',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;
GRANT ALL ON public.campaigns TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_products TO authenticated;
GRANT ALL ON public.campaign_products TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.generated_content TO authenticated;
GRANT ALL ON public.generated_content TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.published_pins TO authenticated;
GRANT ALL ON public.published_pins TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.published_pins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own profile"
ON public.profiles FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own campaigns"
ON public.campaigns FOR ALL
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can manage products in their own campaigns"
ON public.campaign_products FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns
    WHERE campaigns.id = campaign_products.campaign_id
    AND campaigns.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.campaigns
    WHERE campaigns.id = campaign_products.campaign_id
    AND campaigns.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can manage generated content for their own products"
ON public.generated_content FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.campaign_products
    JOIN public.campaigns ON campaigns.id = campaign_products.campaign_id
    WHERE campaign_products.id = generated_content.product_id
    AND campaigns.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.campaign_products
    JOIN public.campaigns ON campaigns.id = campaign_products.campaign_id
    WHERE campaign_products.id = generated_content.product_id
    AND campaigns.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can manage published pins for their own products"
ON public.published_pins FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.campaign_products
    JOIN public.campaigns ON campaigns.id = campaign_products.campaign_id
    WHERE campaign_products.id = published_pins.product_id
    AND campaigns.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.campaign_products
    JOIN public.campaigns ON campaigns.id = campaign_products.campaign_id
    WHERE campaign_products.id = published_pins.product_id
    AND campaigns.owner_id = auth.uid()
  )
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();