import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

type CampaignsUpdate = Database["public"]["Tables"]["campaigns"]["Update"];
type ProfilesUpdate = Database["public"]["Tables"]["profiles"]["Update"];

const CreateCampaignInput = z.object({
  name: z.string().min(1),
  niche: z.string().optional(),
  products: z
    .array(
      z.object({
        productName: z.string().min(1),
        sourceUrl: z.string().optional(),
        trendNote: z.string().optional(),
      }),
    )
    .min(1),
});

export const createCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CreateCampaignInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .insert({
        owner_id: userId,
        name: data.name,
        niche: data.niche ?? null,
      })
      .select("id")
      .single();

    if (campaignError || !campaign) {
      throw new Error(campaignError?.message || "Failed to create campaign");
    }

    const productsToInsert = data.products.map((p, index) => ({
      campaign_id: campaign.id,
      product_name: p.productName,
      source_url: p.sourceUrl || null,
      trend_note: p.trendNote || null,
      position: index,
    }));

    const { error: productsError } = await supabase
      .from("campaign_products")
      .insert(productsToInsert);

    if (productsError) {
      throw new Error(productsError.message);
    }

    return { campaignId: campaign.id };
  });

export const listCampaigns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  });

export const getCampaignWithProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", data.id)
      .eq("owner_id", userId)
      .single();

    if (campaignError || !campaign) {
      throw new Error(campaignError?.message || "Campaign not found");
    }

    const { data: products, error: productsError } = await supabase
      .from("campaign_products")
      .select("*, generated_content(*), published_pins(*)")
      .eq("campaign_id", data.id)
      .order("position", { ascending: true });

    if (productsError) throw new Error(productsError.message);

    return { campaign, products: products || [] };
  });

export const updateCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        niche: z.string().optional(),
        status: z.string().optional(),
        scheduledAt: z.string().datetime().optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const update: Partial<CampaignsUpdate> = {
      ...(data.name !== undefined ? { name: data.name } : {}),
      niche: data.niche ?? null,
      ...(data.status !== undefined ? { status: data.status } : {}),
      scheduled_at: data.scheduledAt ?? null,
    };

    const { error } = await supabase
      .from("campaigns")
      .update(update)
      .eq("id", data.id)
      .eq("owner_id", userId);

    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("campaigns")
      .delete()
      .eq("id", data.id)
      .eq("owner_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) throw new Error(error.message);
    return data;
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        displayName: z.string().optional(),
        affiliateLinkTemplate: z.string().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const update: Partial<ProfilesUpdate> = {
      display_name: data.displayName ?? null,
      affiliate_link_template: data.affiliateLinkTemplate ?? null,
    };
    const { error } = await supabase.from("profiles").update(update).eq("user_id", userId);

    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addProductsToCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        campaignId: z.string().uuid(),
        products: z
          .array(
            z.object({
              productName: z.string().min(1),
              sourceUrl: z.string().optional(),
              trendNote: z.string().optional(),
            }),
          )
          .min(1),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("id")
      .eq("id", data.campaignId)
      .eq("owner_id", userId)
      .single();

    if (campaignError || !campaign) {
      throw new Error(campaignError?.message || "Campaign not found");
    }

    const { data: existing } = await supabase
      .from("campaign_products")
      .select("position")
      .eq("campaign_id", data.campaignId)
      .order("position", { ascending: false })
      .limit(1);

    const startPos =
      existing && existing.length > 0 && existing[0]?.position !== undefined
        ? existing[0].position + 1
        : 0;

    const productsToInsert = data.products.map((p, index) => ({
      campaign_id: data.campaignId,
      product_name: p.productName,
      source_url: p.sourceUrl || null,
      trend_note: p.trendNote || null,
      position: startPos + index,
    }));

    const { error: insertError } = await supabase
      .from("campaign_products")
      .insert(productsToInsert);

    if (insertError) throw new Error(insertError.message);
    return { ok: true, count: productsToInsert.length };
  });

export const testOpenAiConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const apiKey = process.env["OPENAI_API_KEY"];
    if (!apiKey) throw new Error("Missing OpenAI API Key");

    try {
      const res = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `OpenAI returned status ${res.status}`);
      }
      return { ok: true };
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "OpenAI connection failed");
    }
  });

export const testSupabaseConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const testPinterestConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("pinterest_accounts")
      .select("id, username")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new Error("No connected Pinterest account found. Please connect in settings.");
    return { ok: true, username: data.username };
  });
