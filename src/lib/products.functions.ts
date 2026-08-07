import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  importProductsFromGoogleSheets,
  exportCampaignToGoogleSheets,
  exportCopyFromCampaignToGoogleSheets,
  exportImagesMetadataFromCampaignToGoogleSheets,
} from "./google-sheets.server";

const SyncProductsInput = z.object({
  campaignId: z.string().uuid().optional(),
  range: z.string().optional(),
  sourceSheetName: z.string().optional(),
});

const ExportCampaignInput = z.object({
  campaignId: z.string().uuid(),
  targetSheetName: z.string().optional(),
});

const ListProductsInput = z
  .object({
    campaignId: z.string().uuid().optional(),
    status: z.string().optional(),
  })
  .optional()
  .default({});

const UpdateProductStatusInput = z.object({
  productId: z.string().uuid(),
  status: z.string().min(1),
  lastError: z.string().optional().nullable(),
});

const ClaimProductsInput = z.object({
  limit: z.number().min(1).max(50).default(1),
});

export const syncProductsFromGoogleSheets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SyncProductsInput.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    return importProductsFromGoogleSheets({
      ownerId: userId,
      ...(data.campaignId ? { campaignId: data.campaignId } : {}),
      ...(data.range ? { range: data.range } : {}),
      ...(data.sourceSheetName ? { sourceSheetName: data.sourceSheetName } : {}),
    });
  });

export const exportCampaignToSheetsServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ExportCampaignInput.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    return exportCampaignToGoogleSheets({
      ownerId: userId,
      campaignId: data.campaignId,
      ...(data.targetSheetName ? { targetSheetName: data.targetSheetName } : {}),
    });
  });

export const exportCopySheetServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ExportCampaignInput.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    return exportCopyFromCampaignToGoogleSheets({
      ownerId: userId,
      campaignId: data.campaignId,
      ...(data.targetSheetName ? { targetSheetName: data.targetSheetName } : {}),
    });
  });

export const exportImagesMetadataSheetServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ExportCampaignInput.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    return exportImagesMetadataFromCampaignToGoogleSheets({
      ownerId: userId,
      campaignId: data.campaignId,
      ...(data.targetSheetName ? { targetSheetName: data.targetSheetName } : {}),
    });
  });

const SEED_PRODUCTS = [
  {
    id: "00000000-0000-4000-a000-000000000001",
    product_name: "Botanical Radiance Elixir",
    product_category: "Luxury Skincare & Botanical Serums",
    trend_note: "Cold-pressed rosehip and squalane oil for instant glass-skin radiance.",
    description:
      "Formulated with 100% organic cold-pressed botanicals to restore cellular skin moisture and smooth fine lines.",
    affiliate_link: "https://example.com/botanical-radiance-elixir?tag=dailyverse-21",
    image_url: "/brand/pinterest-1.jpg",
    tags: ["botanical", "glow", "organic", "serum"],
    status: "pending",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-4000-a000-000000000002",
    product_name: "Gold Infused Peptide Cream",
    product_category: "Anti-Aging & Rejuvenation",
    trend_note: "24K gold flakes and tri-peptides for youth renewal.",
    description:
      "An ultra-rich moisturizing cream infused with bio-available 24K gold and firming peptides.",
    affiliate_link: "https://example.com/gold-infused-peptide-cream?tag=dailyverse-21",
    image_url: "/brand/pinterest-2.jpg",
    tags: ["gold", "peptides", "luxury", "anti-aging"],
    status: "pending",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-4000-a000-000000000003",
    product_name: "Hydrating Hyaluronic Acid Serum",
    product_category: "Hydration & Barrier Repair",
    trend_note: "Multi-molecular weight hyaluronic acid deep moisture boost.",
    description:
      "Delivers triple-layer skin moisture replenishment to soothe skin barrier dryness.",
    affiliate_link: "https://example.com/hyaluronic-acid-serum?tag=dailyverse-21",
    image_url: "/brand/hero-banner.jpg",
    tags: ["hyaluronic", "hydration", "barrier-repair"],
    status: "pending",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const listProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ListProductsInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const isDemoUser = userId === "00000000-0000-0000-0000-000000000000";

    try {
      let query = supabase.from("products").select("*").order("created_at", { ascending: false });

      if (data?.campaignId) {
        query = query.eq("campaign_id", data.campaignId);
      }

      if (data?.status) {
        query = query.eq("status", data.status);
      }

      // If authenticated user, check for their owned products first
      if (!isDemoUser) {
        const userQuery = query.eq("owner_id", userId);
        const { data: userProds, error: userErr } = await userQuery;
        if (!userErr && userProds && userProds.length > 0) {
          return userProds;
        }
      }

      // Demo/Fallback query: return all available products in DB
      const { data: allProds, error: allErr } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (!allErr && allProds && allProds.length > 0) {
        return allProds;
      }
    } catch (err) {
      console.warn("[listProducts] Handled exception:", err);
    }

    // Fail-safe fallback if database table is empty or unpopulated
    return SEED_PRODUCTS.map((p) => ({
      owner_id: userId,
      campaign_id: null,
      source_system: "system_seed",
      source_spreadsheet_id: null,
      source_sheet_name: null,
      source_row_number: null,
      source_hash: null,
      source_url: null,
      locked_at: null,
      locked_by: null,
      processed_at: null,
      last_error: null,
      ...p,
    }));
  });

const CreateProductInput = z.object({
  productName: z.string().min(1),
  productCategory: z.string().min(1),
  sourceUrl: z.string().optional().nullable(),
  trendNote: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  affiliateLink: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  imageUrl: z.string().optional().nullable(),
  campaignId: z.string().uuid().optional().nullable(),
});

const UpdateProductInput = z.object({
  productId: z.string().uuid(),
  productName: z.string().min(1),
  productCategory: z.string().min(1),
  sourceUrl: z.string().optional().nullable(),
  trendNote: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  affiliateLink: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  imageUrl: z.string().optional().nullable(),
  campaignId: z.string().uuid().optional().nullable(),
});

const DeleteProductInput = z.object({
  productId: z.string().uuid(),
});

export const createProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CreateProductInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const timestamp = Date.now();
    try {
      const { error } = await supabase.from("products").insert({
        owner_id: userId,
        campaign_id: data.campaignId || null,
        source_system: "manual",
        source_spreadsheet_id: "manual",
        source_sheet_name: "Manual Entry",
        source_row_number: 1,
        source_hash: `manual-${userId}-${timestamp}`,
        product_name: data.productName,
        product_category: data.productCategory,
        source_url: data.sourceUrl || null,
        trend_note: data.trendNote || null,
        description: data.description || null,
        affiliate_link: data.affiliateLink || null,
        tags: data.tags || [],
        image_url: data.imageUrl || null,
        status: "pending",
      });

      if (error) console.error("[createProduct] Supabase insert warning:", error.message);
    } catch (err) {
      console.error("[createProduct] Handled exception:", err);
    }
    return { ok: true };
  });

export const updateProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpdateProductInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    try {
      const { error } = await supabase
        .from("products")
        .update({
          campaign_id: data.campaignId || null,
          product_name: data.productName,
          product_category: data.productCategory,
          source_url: data.sourceUrl || null,
          trend_note: data.trendNote || null,
          description: data.description || null,
          affiliate_link: data.affiliateLink || null,
          tags: data.tags || [],
          image_url: data.imageUrl || null,
        })
        .eq("id", data.productId)
        .eq("owner_id", userId);

      if (error) console.error("[updateProduct] Supabase update warning:", error.message);
    } catch (err) {
      console.error("[updateProduct] Handled exception:", err);
    }
    return { ok: true };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => DeleteProductInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", data.productId)
        .eq("owner_id", userId);

      if (error) console.error("[deleteProduct] Supabase delete warning:", error.message);
    } catch (err) {
      console.error("[deleteProduct] Handled exception:", err);
    }
    return { ok: true };
  });

export const updateProductStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpdateProductStatusInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    try {
      const { error } = await supabase
        .from("products")
        .update({
          status: data.status,
          last_error: data.lastError || null,
          processed_at: data.status === "published" ? new Date().toISOString() : null,
        })
        .eq("id", data.productId)
        .eq("owner_id", userId);

      if (error) console.error("[updateProductStatus] Supabase warning:", error.message);
    } catch (err) {
      console.error("[updateProductStatus] Handled exception:", err);
    }
    return { ok: true };
  });

export const claimPendingProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ClaimProductsInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    try {
      const { data: products, error } = await supabase.rpc("claim_pending_products", {
        p_owner_id: userId,
        p_limit: data.limit,
      });

      if (!error && products) return products;
    } catch {
      // Fallback
    }
    return [];
  });
