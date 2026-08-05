import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  importProductsFromGoogleSheets,
  exportCampaignToGoogleSheets,
  exportAnalyticsToGoogleSheets,
  validateSpreadsheetStructure,
  retryFailedSheetImport,
} from "./google-sheets.server";

// ─── Input Schemas ────────────────────────────────────────────────────────────

const ImportFromSheetsInput = z.object({
  campaignId: z.string().uuid().optional(),
  sourceSheetName: z.string().optional(),
  customSpreadsheetId: z.string().optional(),
  range: z.string().optional(),
});

const ExportCampaignInput = z.object({
  campaignId: z.string().uuid(),
  targetSheetName: z.string().optional(),
  customSpreadsheetId: z.string().optional(),
});

const ValidateSheetsInput = z.object({
  customSpreadsheetId: z.string().optional(),
  sourceSheetName: z.string().optional(),
});

const RetryImportInput = z.object({
  productId: z.string().uuid(),
});

const AnalyticsItemSchema = z.object({
  productName: z.string().min(1),
  pinId: z.string().optional(),
  pinUrl: z.string().optional(),
  status: z.string().default("published"),
  impressions: z.number().default(0),
  saves: z.number().default(0),
  clicks: z.number().default(0),
  outboundClicks: z.number().default(0),
});

const ExportAnalyticsInput = z.object({
  campaignId: z.string().uuid(),
  analyticsData: z.array(AnalyticsItemSchema),
  targetSheetName: z.string().optional(),
  customSpreadsheetId: z.string().optional(),
});

// ─── Server Functions ─────────────────────────────────────────────────────────

export const importFromSheetsServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ImportFromSheetsInput.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    return importProductsFromGoogleSheets({
      ownerId: userId,
      campaignId: data.campaignId,
      sourceSheetName: data.sourceSheetName,
      customSpreadsheetId: data.customSpreadsheetId,
      range: data.range,
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
      targetSheetName: data.targetSheetName,
      customSpreadsheetId: data.customSpreadsheetId,
    });
  });

export const validateSheetsServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ValidateSheetsInput.parse(input))
  .handler(async ({ data }) => {
    return validateSpreadsheetStructure(
      data.customSpreadsheetId,
      data.sourceSheetName || "Products",
    );
  });

export const retrySheetImportServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => RetryImportInput.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    return retryFailedSheetImport({
      ownerId: userId,
      productId: data.productId,
    });
  });

export const exportAnalyticsToSheetsServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ExportAnalyticsInput.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    return exportAnalyticsToGoogleSheets({
      ownerId: userId,
      campaignId: data.campaignId,
      analyticsData: data.analyticsData,
      targetSheetName: data.targetSheetName,
      customSpreadsheetId: data.customSpreadsheetId,
    });
  });
