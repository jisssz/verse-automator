import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";
import {
  fetchPinterestStatus,
  publishPinToPinterest,
  fetchPinAnalytics,
  deletePinFromPinterest,
} from "./pinterest.server";
import { disconnectPinterestAccount } from "./pinterest-account.server";
import { getBoardsWithCacheFallback, invalidateBoardCache } from "./pinterest-boards.server";
import { getValidAccessToken } from "./pinterest-account.server";
import {
  createPinJob,
  processPendingJobs,
  retryFailedJob,
  listPinJobs,
  getPinJobStatus,
} from "./pin-jobs.server";

// ─── Input Schemas ────────────────────────────────────────────────────────────

const PublishNowInput = z.object({
  productId: z.string().uuid(),
  boardId: z.string().optional(),
  boardName: z.string().optional(),
});

const SchedulePinInput = z.object({
  productId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  boardId: z.string().optional(),
  boardName: z.string().optional(),
});

const RetryPublishInput = z.object({
  productId: z.string().uuid(),
});

const PinAnalyticsInput = z.object({
  pinId: z.string().min(1),
});

const DeletePinInput = z.object({
  pinId: z.string().min(1),
  publishedPinId: z.string().uuid().optional(),
});

const CreatePinJobInput = z.object({
  productId: z.string().uuid(),
  boardId: z.string().optional(),
  boardName: z.string().optional(),
  title: z.string().min(1),
  description: z.string().min(1),
  imageUrl: z.string().url(),
  link: z.string().url().optional(),
  scheduledAt: z.string().datetime().optional(),
  maxAttempts: z.number().min(1).max(10).default(3),
});

const ListPinJobsInput = z.object({
  status: z.string().optional(),
  productId: z.string().uuid().optional(),
  limit: z.number().min(1).max(200).default(100),
});

const RetryJobInput = z.object({
  jobId: z.string().uuid(),
});

const GetJobInput = z.object({
  jobId: z.string().uuid(),
});

// ─── Existing Server Functions (kept for backwards compatibility) ──────────────

export const getPinterestStatusServer = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    return fetchPinterestStatus(userId);
  });

export const publishPinNowServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => PublishNowInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Fetch product details & generated content
    const { data: product, error: productError } = await supabase
      .from("campaign_products")
      .select("id, product_name, campaign_id, generated_content(*), campaigns!inner(owner_id)")
      .eq("id", data.productId)
      .eq("campaigns.owner_id", userId)
      .single();

    if (productError || !product) {
      throw new Error(productError?.message || "Product not found or access denied");
    }

    const content = Array.isArray(product.generated_content)
      ? product.generated_content[0]
      : product.generated_content;

    if (!content || !content.image_url) {
      throw new Error(
        "Product missing generated content or image URL. Generate content before publishing.",
      );
    }

    const title = content.pinterest_title || content.headline || product.product_name;
    const description = content.pin_description || content.description || title;
    const link = content.affiliate_link || undefined;

    let publishResult;
    try {
      publishResult = await publishPinToPinterest(
        {
          title,
          description,
          ...(link ? { link } : {}),
          imageUrl: content.image_url,
          ...(data.boardId ? { boardId: data.boardId } : {}),
        },
        userId,
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Publishing failed";
      await supabase.from("published_pins").upsert(
        {
          product_id: data.productId,
          status: "failed",
          error_message: errorMsg,
          ...(data.boardId ? { board_id: data.boardId } : {}),
          ...(data.boardName ? { board_name: data.boardName } : {}),
          request_payload: {} as Json,
          response_payload: {} as Json,
        },
        { onConflict: "product_id" },
      );
      throw new Error(errorMsg);
    }

    // Save success in published_pins
    const { error: saveError } = await supabase.from("published_pins").upsert(
      {
        product_id: data.productId,
        pinterest_pin_id: publishResult.pinId,
        pin_url: publishResult.pinUrl,
        published_at: new Date().toISOString(),
        status: "published",
        board_id: publishResult.boardId,
        board_name: data.boardName || "Pinterest Board",
        request_payload: publishResult.requestPayload as unknown as Json,
        response_payload: publishResult.responsePayload as unknown as Json,
        error_message: null,
      },
      { onConflict: "product_id" },
    );

    if (saveError) {
      console.error("Error saving published pin record:", saveError);
    }

    return {
      pinId: publishResult.pinId,
      pinUrl: publishResult.pinUrl,
      publishedAt: new Date().toISOString(),
    };
  });

export const schedulePinServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SchedulePinInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Verify product ownership
    const { data: product, error: productError } = await supabase
      .from("campaign_products")
      .select("id, campaign_id, campaigns!inner(owner_id)")
      .eq("id", data.productId)
      .eq("campaigns.owner_id", userId)
      .single();

    if (productError || !product) {
      throw new Error(productError?.message || "Product not found or access denied");
    }

    const { error } = await supabase.from("published_pins").upsert(
      {
        product_id: data.productId,
        scheduled_at: data.scheduledAt,
        status: "scheduled",
        ...(data.boardId ? { board_id: data.boardId } : {}),
        ...(data.boardName ? { board_name: data.boardName } : {}),
        error_message: null,
        request_payload: {} as Json,
        response_payload: {} as Json,
      },
      { onConflict: "product_id" },
    );

    if (error) throw new Error(error.message);
    return { ok: true, scheduledAt: data.scheduledAt };
  });

export const retryFailedPublishServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => RetryPublishInput.parse(input))
  .handler(async ({ data }) => {
    return publishPinNowServer({ data: { productId: data.productId } });
  });

export const listPublishedPinsServer = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data, error } = await supabase
      .from("published_pins")
      .select(
        "*, campaign_products!inner(product_name, campaign_id, campaigns!inner(name, owner_id))",
      )
      .eq("campaign_products.campaigns.owner_id", userId)
      .order("updated_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  });

// ─── New Server Functions ─────────────────────────────────────────────────────

/**
 * Disconnect the authenticated user's Pinterest account.
 * Also invalidates board cache.
 */
export const disconnectPinterestServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    await disconnectPinterestAccount(userId);
    await invalidateBoardCache(userId);
    return { ok: true };
  });

/**
 * Fetch boards for the authenticated user (cache-first, live fallback).
 */
export const getBoardsServer = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const accessToken = await getValidAccessToken(userId);
    const { boards, source } = await getBoardsWithCacheFallback(userId, accessToken);
    return { boards, source };
  });

/**
 * Fetch Pinterest analytics for a specific pin.
 */
export const getPinAnalyticsServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => PinAnalyticsInput.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const analytics = await fetchPinAnalytics(data.pinId, userId);
    if (!analytics) {
      throw new Error("Unable to fetch analytics. Ensure the pin has been live for at least 24h.");
    }
    return analytics;
  });

/**
 * Delete a pin from Pinterest and optionally mark the published_pins row as deleted.
 */
export const deletePinServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => DeletePinInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const result = await deletePinFromPinterest(data.pinId, userId);

    if (result.success && data.publishedPinId) {
      await supabase
        .from("published_pins")
        .update({
          status: "deleted",
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", data.publishedPinId);
    }

    return result;
  });

/**
 * Create a pin job in the queue (immediate or scheduled).
 */
export const createPinJobServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CreatePinJobInput.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    return createPinJob(userId, {
      productId: data.productId,
      boardId: data.boardId,
      boardName: data.boardName,
      title: data.title,
      description: data.description,
      imageUrl: data.imageUrl,
      link: data.link,
      scheduledAt: data.scheduledAt,
      maxAttempts: data.maxAttempts,
    });
  });

/**
 * Process all pending pin jobs for the authenticated user.
 */
export const processPinJobsServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    return processPendingJobs(userId);
  });

/**
 * Retry a specific failed pin job.
 */
export const retryPinJobServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => RetryJobInput.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    // Verify job belongs to user
    const job = await getPinJobStatus(data.jobId);
    if (!job || job.user_id !== userId) {
      throw new Error("Job not found or access denied");
    }

    return retryFailedJob(data.jobId);
  });

/**
 * List pin jobs for the authenticated user.
 */
export const listPinJobsServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ListPinJobsInput.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    return listPinJobs(userId, {
      status: data.status,
      productId: data.productId,
      limit: data.limit,
    });
  });

/**
 * Get the status of a single pin job.
 */
export const getPinJobStatusServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GetJobInput.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const job = await getPinJobStatus(data.jobId);
    if (!job || job.user_id !== userId) {
      throw new Error("Job not found or access denied");
    }
    return job;
  });
