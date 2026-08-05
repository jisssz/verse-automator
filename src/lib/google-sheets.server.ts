/**
 * google-sheets.server.ts
 *
 * Server-only Google Sheets Integration layer using Google Service Account (JWT RS256)
 * or OAuth access tokens to interact with Google Sheets API v4.
 *
 * Features:
 *  - Structure validation
 *  - Auto-detection of column headers
 *  - Batch product import with deduplication and error recovery
 *  - Export generated content, publish status, Pinterest URL, and analytics
 *  - Failed import retry mechanism
 *  - Comprehensive audit logging via `automation_logs`
 */

import crypto from "node:crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// ─── Types & Interfaces ───────────────────────────────────────────────────────

export interface GoogleSheetsCredentials {
  clientEmail: string;
  privateKey: string;
  spreadsheetId: string;
}

export interface ColumnMapping {
  productNameIndex: number;
  categoryIndex: number;
  urlIndex: number;
  noteIndex: number;
  rawHeaders: string[];
}

export interface ImportSummary {
  totalRows: number;
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: string[];
}

export interface ExportSummary {
  exportedCount: number;
  targetSheet: string;
}

export interface SpreadsheetValidationResult {
  valid: boolean;
  spreadsheetId: string;
  sheetName: string;
  rowCount: number;
  columnCount: number;
  detectedHeaders: string[];
  missingRequiredColumns: string[];
  error?: string | undefined;
}

type GoogleAccessTokenCache = {
  token: string;
  expiresAt: number;
} | null;

let googleAccessTokenCache: GoogleAccessTokenCache = null;

// ─── Core Helpers ─────────────────────────────────────────────────────────────

function base64Url(input: Buffer | string): string {
  const buffer = typeof input === "string" ? Buffer.from(input) : input;
  return buffer.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export function getGoogleSheetsCredentials(): GoogleSheetsCredentials {
  const clientEmail = process.env["GOOGLE_SHEETS_CLIENT_EMAIL"]?.trim();
  const privateKey = process.env["GOOGLE_SHEETS_PRIVATE_KEY"]?.replace(/\\n/g, "\n").trim();
  const spreadsheetId = process.env["GOOGLE_SHEETS_SPREADSHEET_ID"]?.trim();

  if (!clientEmail || !privateKey || !spreadsheetId) {
    throw new Error(
      "Google Sheets credentials not configured. Please set GOOGLE_SHEETS_CLIENT_EMAIL, GOOGLE_SHEETS_PRIVATE_KEY, and GOOGLE_SHEETS_SPREADSHEET_ID in environment variables.",
    );
  }

  return { clientEmail, privateKey, spreadsheetId };
}

function signJwtAssertion(clientEmail: string, privateKey: string): string {
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const claimSet = base64Url(
    JSON.stringify({
      iss: clientEmail,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    }),
  );
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(`${header}.${claimSet}`);
  signer.end();
  const signature = base64Url(signer.sign(privateKey));
  return `${header}.${claimSet}.${signature}`;
}

export async function getGoogleAccessToken(): Promise<string> {
  if (googleAccessTokenCache && googleAccessTokenCache.expiresAt - Date.now() > 60_000) {
    return googleAccessTokenCache.token;
  }

  const { clientEmail, privateKey } = getGoogleSheetsCredentials();
  const assertion = signJwtAssertion(clientEmail, privateKey);

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to authenticate with Google Sheets (${response.status}): ${errorText}`);
  }

  const payload = (await response.json()) as { access_token: string; expires_in: number };
  googleAccessTokenCache = {
    token: payload.access_token,
    expiresAt: Date.now() + payload.expires_in * 1000,
  };

  return payload.access_token;
}

export async function readGoogleSheetValues(
  range: string,
  customSpreadsheetId?: string,
): Promise<string[][]> {
  const spreadsheetId = customSpreadsheetId || getGoogleSheetsCredentials().spreadsheetId;
  const accessToken = await getGoogleAccessToken();
  const url = new URL(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
  );

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to read Google Sheet (${response.status}): ${errorText}`);
  }

  const payload = (await response.json()) as { values?: string[][] };
  return payload.values || [];
}

export async function writeGoogleSheetValues(
  range: string,
  values: string[][],
  customSpreadsheetId?: string,
): Promise<unknown> {
  const spreadsheetId = customSpreadsheetId || getGoogleSheetsCredentials().spreadsheetId;
  const accessToken = await getGoogleAccessToken();
  const url = new URL(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
  );

  const response = await fetch(url.toString(), {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      majorDimension: "ROWS",
      values,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to write to Google Sheet (${response.status}): ${text}`);
  }

  return response.json();
}

export async function appendGoogleSheetValues(
  range: string,
  values: string[][],
  customSpreadsheetId?: string,
): Promise<unknown> {
  const spreadsheetId = customSpreadsheetId || getGoogleSheetsCredentials().spreadsheetId;
  const accessToken = await getGoogleAccessToken();
  const url = new URL(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`,
  );

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      majorDimension: "ROWS",
      values,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to append to Google Sheet (${response.status}): ${text}`);
  }

  return response.json();
}

// ─── Column Mapping & Normalization ──────────────────────────────────────────

function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_");
}

export function detectColumnMapping(headers: string[]): ColumnMapping {
  const normalized = headers.map(normalizeHeader);

  const findIndex = (aliases: string[]) => normalized.findIndex((h) => aliases.includes(h));

  const productNameIndex = findIndex([
    "product_name",
    "product",
    "name",
    "title",
    "item_name",
    "item",
  ]);
  const categoryIndex = findIndex(["product_category", "category", "type", "niche", "group"]);
  const urlIndex = findIndex([
    "source_url",
    "url",
    "link",
    "product_url",
    "affiliate_link",
    "website",
  ]);
  const noteIndex = findIndex([
    "trend_note",
    "note",
    "notes",
    "description",
    "details",
    "trend",
    "comment",
  ]);

  return {
    productNameIndex: productNameIndex >= 0 ? productNameIndex : 0,
    categoryIndex,
    urlIndex,
    noteIndex,
    rawHeaders: headers,
  };
}

function hashProductSource(input: {
  ownerId: string;
  spreadsheetId: string;
  sheetName: string;
  rowNumber: number;
  productName: string;
  productCategory: string;
  sourceUrl?: string | undefined;
}): string {
  return crypto
    .createHash("sha256")
    .update(
      [
        input.ownerId,
        input.spreadsheetId,
        input.sheetName,
        input.rowNumber,
        input.productName.trim().toLowerCase(),
        input.productCategory.trim().toLowerCase(),
        (input.sourceUrl || "").trim().toLowerCase(),
      ].join("|"),
    )
    .digest("hex");
}

// ─── Structure Validation ─────────────────────────────────────────────────────

export async function validateSpreadsheetStructure(
  customSpreadsheetId?: string,
  sourceSheetName = "Products",
): Promise<SpreadsheetValidationResult> {
  const spreadsheetId = customSpreadsheetId || getGoogleSheetsCredentials().spreadsheetId;
  const range = `${sourceSheetName}!A1:Z5`;

  try {
    const rows = await readGoogleSheetValues(range, spreadsheetId);

    if (rows.length === 0 || !rows[0]) {
      return {
        valid: false,
        spreadsheetId,
        sheetName: sourceSheetName,
        rowCount: 0,
        columnCount: 0,
        detectedHeaders: [],
        missingRequiredColumns: ["product_name"],
        error: "Spreadsheet is empty or sheet name not found",
      };
    }

    const rawHeaders = rows[0];
    const mapping = detectColumnMapping(rawHeaders);

    const missing: string[] = [];
    if (mapping.productNameIndex === -1 && rawHeaders.length > 0) {
      missing.push("product_name (or name / title)");
    }

    return {
      valid: missing.length === 0,
      spreadsheetId,
      sheetName: sourceSheetName,
      rowCount: rows.length - 1,
      columnCount: rawHeaders.length,
      detectedHeaders: rawHeaders,
      missingRequiredColumns: missing,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error validating spreadsheet";
    return {
      valid: false,
      spreadsheetId,
      sheetName: sourceSheetName,
      rowCount: 0,
      columnCount: 0,
      detectedHeaders: [],
      missingRequiredColumns: ["product_name"],
      error: message,
    };
  }
}

// ─── Import Functions ─────────────────────────────────────────────────────────

export async function importProductsFromGoogleSheets(options: {
  ownerId: string;
  campaignId?: string | undefined;
  range?: string | undefined;
  sourceSheetName?: string | undefined;
  customSpreadsheetId?: string | undefined;
}): Promise<ImportSummary> {
  const spreadsheetId = options.customSpreadsheetId || getGoogleSheetsCredentials().spreadsheetId;
  const sheetName = options.sourceSheetName || "Products";
  const range = options.range || `${sheetName}!A:Z`;

  const rows = await readGoogleSheetValues(range, spreadsheetId);

  if (rows.length < 2 || !rows[0]) {
    return {
      totalRows: 0,
      inserted: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: ["Spreadsheet has no data rows"],
    };
  }

  const rawHeaders = rows[0];
  const mapping = detectColumnMapping(rawHeaders);
  const dataRows = rows.slice(1);

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;
  const errors: string[] = [];

  const supabase = supabaseAdmin;

  for (const [index, row] of dataRows.entries()) {
    const rowNum = index + 2;

    const productName = (row[mapping.productNameIndex] || "").trim();
    if (!productName) {
      skipped += 1;
      continue;
    }

    const productCategory =
      mapping.categoryIndex >= 0 && row[mapping.categoryIndex]
        ? row[mapping.categoryIndex]!.trim()
        : "General";
    const sourceUrl =
      mapping.urlIndex >= 0 && row[mapping.urlIndex] ? row[mapping.urlIndex]!.trim() : null;
    const trendNote =
      mapping.noteIndex >= 0 && row[mapping.noteIndex] ? row[mapping.noteIndex]!.trim() : null;

    const sourceHash = hashProductSource({
      ownerId: options.ownerId,
      spreadsheetId,
      sheetName,
      rowNumber: rowNum,
      productName,
      productCategory,
      sourceUrl: sourceUrl || undefined,
    });

    try {
      const { data, error } = await supabase
        .from("products")
        .upsert(
          {
            owner_id: options.ownerId,
            campaign_id: options.campaignId || null,
            source_system: "google_sheets",
            source_spreadsheet_id: spreadsheetId,
            source_sheet_name: sheetName,
            source_row_number: rowNum,
            source_hash: sourceHash,
            product_name: productName,
            product_category: productCategory,
            source_url: sourceUrl,
            trend_note: trendNote,
            status: "pending",
            last_error: null,
          },
          { onConflict: "owner_id,source_system,source_hash" },
        )
        .select("id, status, created_at, updated_at");

      if (error) {
        failed += 1;
        errors.push(`Row ${rowNum} (${productName}): ${error.message}`);

        await supabase.from("automation_logs").insert({
          source_system: "google_sheets",
          event_type: "product_import_failed",
          level: "error",
          message: `Failed to import product '${productName}' at row ${rowNum}: ${error.message}`,
          details: { rowNum, productName, error: error.message },
        });

        continue;
      }

      if (options.campaignId) {
        await supabase.from("campaign_products").insert({
          campaign_id: options.campaignId,
          product_name: productName,
          trend_note: trendNote,
          source_url: sourceUrl,
        });
      }

      if (data && data[0]) {
        const firstRow = data[0];
        const created = firstRow.created_at === firstRow.updated_at;
        if (created) inserted += 1;
        else updated += 1;

        await supabase.from("automation_logs").insert({
          product_id: firstRow.id,
          source_system: "google_sheets",
          event_type: created ? "product_imported" : "product_updated",
          level: "info",
          message: `${productName} synced from Google Sheets (row ${rowNum})`,
          details: {
            spreadsheetId,
            sheetName,
            rowNumber: rowNum,
            sourceHash,
          },
        });
      }
    } catch (err) {
      failed += 1;
      const msg = err instanceof Error ? err.message : "Unknown error";
      errors.push(`Row ${rowNum} (${productName}): ${msg}`);
    }
  }

  return {
    totalRows: dataRows.length,
    inserted,
    updated,
    skipped,
    failed,
    errors,
  };
}

// ─── Export Functions ─────────────────────────────────────────────────────────

export async function exportCampaignToGoogleSheets(options: {
  ownerId: string;
  campaignId: string;
  targetSheetName?: string | undefined;
  customSpreadsheetId?: string | undefined;
}): Promise<ExportSummary> {
  const targetSheet = options.targetSheetName || "Campaign Export";
  const supabase = supabaseAdmin;

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("*, campaign_products(*, generated_content(*), published_pins(*))")
    .eq("id", options.campaignId)
    .eq("owner_id", options.ownerId)
    .single();

  if (campaignError || !campaign) {
    throw new Error(campaignError?.message || "Campaign not found");
  }

  const products = campaign.campaign_products || [];
  const rows: string[][] = [
    [
      "Product Name",
      "Trend Note",
      "Headline",
      "Description",
      "Pinterest Title",
      "Pinterest Description",
      "Affiliate Link",
      "Image Prompt",
      "Image URL",
      "Publish Status",
      "Pinterest Pin URL",
      "Exported At",
    ],
  ];

  for (const p of products) {
    const c = Array.isArray(p.generated_content) ? p.generated_content[0] : p.generated_content;
    const pub = Array.isArray(p.published_pins) ? p.published_pins[0] : p.published_pins;

    rows.push([
      p.product_name || "",
      p.trend_note || "",
      c?.headline || "",
      c?.description || "",
      c?.pinterest_title || "",
      c?.pin_description || "",
      c?.affiliate_link || "",
      c?.image_prompt || "",
      c?.image_url || "",
      pub?.status || "pending",
      pub?.pin_url || "",
      new Date().toISOString(),
    ]);
  }

  const range = `${targetSheet}!A1`;
  await writeGoogleSheetValues(range, rows, options.customSpreadsheetId);

  await supabase.from("automation_logs").insert({
    source_system: "google_sheets",
    event_type: "campaign_exported_google_sheets",
    level: "info",
    message: `Exported ${products.length} products from campaign '${campaign.name}' to Google Sheets`,
    details: {
      campaignId: options.campaignId,
      exportedCount: products.length,
      targetSheet,
    },
  });

  return { exportedCount: products.length, targetSheet };
}

export async function exportCopyFromCampaignToGoogleSheets(options: {
  ownerId: string;
  campaignId: string;
  targetSheetName?: string | undefined;
  customSpreadsheetId?: string | undefined;
}): Promise<ExportSummary> {
  const targetSheet = options.targetSheetName || "Generated Copy Export";
  const supabase = supabaseAdmin;

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("*, campaign_products(*, generated_content(*))")
    .eq("id", options.campaignId)
    .eq("owner_id", options.ownerId)
    .single();

  if (campaignError || !campaign) {
    throw new Error(campaignError?.message || "Campaign not found");
  }

  const products = campaign.campaign_products || [];
  const rows: string[][] = [
    [
      "Product Name",
      "Headline",
      "Description",
      "Pinterest Title",
      "Pinterest Description",
      "Affiliate Link",
      "Exported At",
    ],
  ];

  for (const p of products) {
    const c = Array.isArray(p.generated_content) ? p.generated_content[0] : p.generated_content;
    rows.push([
      p.product_name || "",
      c?.headline || "",
      c?.description || "",
      c?.pinterest_title || "",
      c?.pin_description || "",
      c?.affiliate_link || "",
      new Date().toISOString(),
    ]);
  }

  const range = `${targetSheet}!A1`;
  await writeGoogleSheetValues(range, rows, options.customSpreadsheetId);
  return { exportedCount: products.length, targetSheet };
}

export async function exportImagesMetadataFromCampaignToGoogleSheets(options: {
  ownerId: string;
  campaignId: string;
  targetSheetName?: string | undefined;
  customSpreadsheetId?: string | undefined;
}): Promise<ExportSummary> {
  const targetSheet = options.targetSheetName || "Images Metadata Export";
  const supabase = supabaseAdmin;

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("*, campaign_products(*, generated_content(*))")
    .eq("id", options.campaignId)
    .eq("owner_id", options.ownerId)
    .single();

  if (campaignError || !campaign) {
    throw new Error(campaignError?.message || "Campaign not found");
  }

  const products = campaign.campaign_products || [];
  const rows: string[][] = [["Product Name", "Image Prompt", "Image URL", "Created At"]];

  for (const p of products) {
    const c = Array.isArray(p.generated_content) ? p.generated_content[0] : p.generated_content;
    rows.push([
      p.product_name || "",
      c?.image_prompt || "",
      c?.image_url || "",
      c?.created_at || new Date().toISOString(),
    ]);
  }

  const range = `${targetSheet}!A1`;
  await writeGoogleSheetValues(range, rows, options.customSpreadsheetId);
  return { exportedCount: products.length, targetSheet };
}

export async function exportAnalyticsToGoogleSheets(options: {
  ownerId: string;
  campaignId: string;
  analyticsData: Array<{
    productName: string;
    pinId?: string | undefined;
    pinUrl?: string | undefined;
    status: string;
    impressions: number;
    saves: number;
    clicks: number;
    outboundClicks: number;
  }>;
  targetSheetName?: string | undefined;
  customSpreadsheetId?: string | undefined;
}): Promise<ExportSummary> {
  const targetSheet = options.targetSheetName || "Analytics Export";
  const supabase = supabaseAdmin;

  const rows: string[][] = [
    [
      "Product Name",
      "Pinterest Pin ID",
      "Pinterest Pin URL",
      "Publish Status",
      "Impressions",
      "Saves",
      "Pin Clicks",
      "Outbound Clicks",
      "Updated At",
    ],
  ];

  for (const item of options.analyticsData) {
    rows.push([
      item.productName,
      item.pinId || "",
      item.pinUrl || "",
      item.status,
      String(item.impressions),
      String(item.saves),
      String(item.clicks),
      String(item.outboundClicks),
      new Date().toISOString(),
    ]);
  }

  const range = `${targetSheet}!A1`;
  await writeGoogleSheetValues(range, rows, options.customSpreadsheetId);

  await supabase.from("automation_logs").insert({
    source_system: "google_sheets",
    event_type: "analytics_exported_google_sheets",
    level: "info",
    message: `Exported analytics for ${options.analyticsData.length} products to Google Sheets`,
    details: {
      campaignId: options.campaignId,
      exportedCount: options.analyticsData.length,
      targetSheet,
    },
  });

  return { exportedCount: options.analyticsData.length, targetSheet };
}

// ─── Retry Failed Imports ─────────────────────────────────────────────────────

import type { Json } from "@/integrations/supabase/types";

export async function retryFailedSheetImport(options: {
  ownerId: string;
  productId: string;
}): Promise<{ success: boolean; product: Json | null }> {
  const supabase = supabaseAdmin;

  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("*")
    .eq("id", options.productId)
    .eq("owner_id", options.ownerId)
    .single();

  if (fetchError || !product) {
    throw new Error(`Product not found: ${fetchError?.message || "Invalid ID"}`);
  }

  // Reset status to pending and clear error
  const { data: updatedProduct, error: updateError } = await supabase
    .from("products")
    .update({
      status: "pending",
      last_error: null,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", options.productId)
    .select("*")
    .single();

  if (updateError) {
    throw new Error(`Failed to retry import: ${updateError.message}`);
  }

  await supabase.from("automation_logs").insert({
    product_id: options.productId,
    source_system: "google_sheets",
    event_type: "product_import_retry_queued",
    level: "info",
    message: `Retried import for product '${product.product_name}'`,
    details: { productId: options.productId },
  });

  return { success: true, product: updatedProduct };
}
