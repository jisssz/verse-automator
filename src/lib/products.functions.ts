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

const ListProductsInput = z.object({
  campaignId: z.string().uuid().optional(),
  status: z.string().optional(),
});

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

export const listProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ListProductsInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let query = supabase
      .from("products")
      .select("*")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });

    if (data.campaignId) {
      query = query.eq("campaign_id", data.campaignId);
    }

    if (data.status) {
      query = query.eq("status", data.status);
    }

    const { data: products, error } = await query;
    if (error) throw new Error(error.message);
    return products || [];
  });

export const updateProductStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpdateProductStatusInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("products")
      .update({
        status: data.status,
        last_error: data.lastError || null,
        processed_at: data.status === "published" ? new Date().toISOString() : null,
      })
      .eq("id", data.productId)
      .eq("owner_id", userId);

    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const claimPendingProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ClaimProductsInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: products, error } = await supabase.rpc("claim_pending_products", {
      p_owner_id: userId,
      p_limit: data.limit,
    });

    if (error) throw new Error(error.message);
    return products || [];
  });
