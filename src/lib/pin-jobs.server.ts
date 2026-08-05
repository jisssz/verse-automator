/**
 * pin-jobs.server.ts
 *
 * Server-only Pinterest pin job queue.
 * Manages `pin_jobs` table: create, process, retry, and status queries.
 *
 * Job lifecycle:
 *   queued → processing → published | failed
 *   scheduled → (when scheduled_at passes) queued → processing → published | failed
 *   failed (< max_attempts) → queued (via retry)
 *
 * Public API:
 *   createPinJob(userId, options)
 *   processPinJob(jobId)
 *   processPendingJobs(userId?)
 *   retryFailedJob(jobId)
 *   getPinJobStatus(jobId)
 *   listPinJobs(userId, filters)
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getValidAccessToken } from "./pinterest-account.server";

const PINTEREST_API_BASE = "https://api.pinterest.com/v5";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreatePinJobOptions {
  productId: string;
  boardId?: string | undefined;
  boardName?: string | undefined;
  title: string;
  description: string;
  imageUrl: string;
  link?: string | undefined;
  scheduledAt?: string | undefined;
  maxAttempts?: number | undefined;
}

export interface PinJobRow {
  id: string;
  user_id: string;
  product_id: string;
  board_id: string | null;
  board_name: string | null;
  title: string | null;
  description: string | null;
  image_url: string | null;
  link: string | null;
  status: string;
  scheduled_at: string | null;
  attempted_at: string | null;
  completed_at: string | null;
  attempt_count: number;
  max_attempts: number;
  last_error: string | null;
  pinterest_pin_id: string | null;
  pin_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProcessJobResult {
  jobId: string;
  status: "published" | "failed" | "skipped";
  pinId?: string | undefined;
  pinUrl?: string | undefined;
  error?: string | undefined;
}

// ─── Core Functions ───────────────────────────────────────────────────────────

/**
 * Create a new pin job in the queue.
 * If scheduledAt is in the future, status = "scheduled", otherwise "queued".
 */
export async function createPinJob(
  userId: string,
  options: CreatePinJobOptions,
): Promise<PinJobRow> {
  const isScheduled = options.scheduledAt && new Date(options.scheduledAt).getTime() > Date.now();
  const status = isScheduled ? "scheduled" : "queued";

  const { data, error } = await supabaseAdmin
    .from("pin_jobs")
    .insert({
      user_id: userId,
      product_id: options.productId,
      board_id: options.boardId ?? null,
      board_name: options.boardName ?? null,
      title: options.title,
      description: options.description,
      image_url: options.imageUrl,
      link: options.link ?? null,
      status,
      scheduled_at: options.scheduledAt ?? null,
      max_attempts: options.maxAttempts ?? 3,
      attempt_count: 0,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create pin job: ${error?.message ?? "Unknown error"}`);
  }

  await supabaseAdmin.from("automation_logs").insert({
    source_system: "pin_jobs",
    event_type: "pin_job_created",
    level: "info",
    message: `Pin job created for product ${options.productId} — status: ${status}`,
    details: {
      jobId: data.id,
      userId,
      productId: options.productId,
      boardId: options.boardId ?? null,
      scheduledAt: options.scheduledAt ?? null,
    },
  });

  return data as PinJobRow;
}

/**
 * Process a single pin job: publish to Pinterest, update job row, upsert published_pins.
 * Returns the result — never throws (errors are captured in the job row).
 */
export async function processPinJob(jobId: string): Promise<ProcessJobResult> {
  // Fetch the job
  const { data: job, error: fetchError } = await supabaseAdmin
    .from("pin_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (fetchError || !job) {
    return { jobId, status: "failed", error: "Job not found" };
  }

  const typedJob = job as PinJobRow;

  // Skip if already completed or max attempts reached
  if (typedJob.status === "published") {
    return { jobId, status: "skipped" };
  }
  if (typedJob.attempt_count >= typedJob.max_attempts) {
    return {
      jobId,
      status: "failed",
      error: `Max attempts (${typedJob.max_attempts}) reached`,
    };
  }

  // Skip if scheduled in the future
  if (typedJob.scheduled_at && new Date(typedJob.scheduled_at).getTime() > Date.now()) {
    return { jobId, status: "skipped" };
  }

  // Mark as processing
  await supabaseAdmin
    .from("pin_jobs")
    .update({
      status: "processing",
      attempted_at: new Date().toISOString(),
      attempt_count: typedJob.attempt_count + 1,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", jobId);

  // Get access token for the job owner
  const accessToken = await getValidAccessToken(typedJob.user_id);

  try {
    let pinId: string;
    let pinUrl: string;

    if (!accessToken) {
      // Demo mode — simulate a published pin
      pinId = `demo_pin_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      pinUrl = `https://pinterest.com/pin/${pinId}/`;
    } else {
      const boardId = typedJob.board_id ?? undefined;
      const requestPayload: Record<string, unknown> = {
        title: typedJob.title,
        description: typedJob.description,
        board_id: boardId,
        media_source: {
          source_type: "image_url",
          url: typedJob.image_url,
        },
      };
      if (typedJob.link) requestPayload["link"] = typedJob.link;

      const response = await fetch(`${PINTEREST_API_BASE}/pins`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Pinterest API (${response.status}): ${errText}`);
      }

      const payload = (await response.json()) as { id: string; url?: string };
      pinId = payload.id;
      pinUrl = payload.url ?? `https://pinterest.com/pin/${payload.id}/`;
    }

    // Mark job as published
    await supabaseAdmin
      .from("pin_jobs")
      .update({
        status: "published",
        completed_at: new Date().toISOString(),
        pinterest_pin_id: pinId,
        pin_url: pinUrl,
        last_error: null,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", jobId);

    // Upsert published_pins
    await supabaseAdmin.from("published_pins").upsert(
      {
        product_id: typedJob.product_id,
        pinterest_pin_id: pinId,
        pin_url: pinUrl,
        published_at: new Date().toISOString(),
        status: "published",
        board_id: typedJob.board_id,
        board_name: typedJob.board_name ?? "Pinterest Board",
        request_payload: { jobId } as never,
        response_payload: { pinId, pinUrl } as never,
        error_message: null,
      },
      { onConflict: "product_id" },
    );

    await supabaseAdmin.from("automation_logs").insert({
      source_system: "pin_jobs",
      event_type: "pin_job_published",
      level: "info",
      message: `Pin published successfully — jobId: ${jobId}, pinId: ${pinId}`,
      details: {
        jobId,
        productId: typedJob.product_id,
        pinId,
        pinUrl,
        boardId: typedJob.board_id,
      },
    });

    return { jobId, status: "published", pinId, pinUrl };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown publish error";

    // Mark job as failed
    await supabaseAdmin
      .from("pin_jobs")
      .update({
        status: typedJob.attempt_count + 1 >= typedJob.max_attempts ? "failed" : "queued",
        last_error: errorMsg,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", jobId);

    // Upsert failed status in published_pins
    await supabaseAdmin.from("published_pins").upsert(
      {
        product_id: typedJob.product_id,
        status: "failed",
        error_message: errorMsg,
        board_id: typedJob.board_id,
        board_name: typedJob.board_name ?? null,
        request_payload: { jobId } as never,
        response_payload: {} as never,
      },
      { onConflict: "product_id" },
    );

    await supabaseAdmin.from("automation_logs").insert({
      source_system: "pin_jobs",
      event_type: "pin_job_failed",
      level: "error",
      message: `Pin job failed — jobId: ${jobId}: ${errorMsg}`,
      details: {
        jobId,
        productId: typedJob.product_id,
        error: errorMsg,
        attemptCount: typedJob.attempt_count + 1,
      },
    });

    return { jobId, status: "failed", error: errorMsg };
  }
}

/**
 * Process all pending jobs (status=queued AND scheduled_at <= now, or null).
 * Optionally scoped to a specific userId.
 * Returns a summary of processed jobs.
 */
export async function processPendingJobs(userId?: string): Promise<{
  processed: number;
  published: number;
  failed: number;
  skipped: number;
  results: ProcessJobResult[];
}> {
  const now = new Date().toISOString();

  let query = supabaseAdmin
    .from("pin_jobs")
    .select("id")
    .in("status", ["queued", "scheduled"])
    .or(`scheduled_at.is.null,scheduled_at.lte.${now}`)
    .order("created_at", { ascending: true })
    .limit(50);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data: jobs, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch pending jobs: ${error.message}`);
  }

  const results: ProcessJobResult[] = [];
  let published = 0;
  let failed = 0;
  let skipped = 0;

  for (const job of jobs ?? []) {
    const result = await processPinJob(job.id);
    results.push(result);
    if (result.status === "published") published++;
    else if (result.status === "failed") failed++;
    else skipped++;
  }

  return {
    processed: (jobs ?? []).length,
    published,
    failed,
    skipped,
    results,
  };
}

/**
 * Reset a failed job to retry (resets to status=queued, increments max_attempts by 1).
 */
export async function retryFailedJob(jobId: string): Promise<PinJobRow> {
  const { data: job, error: fetchError } = await supabaseAdmin
    .from("pin_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (fetchError || !job) {
    throw new Error("Job not found");
  }

  const typedJob = job as PinJobRow;

  const { data, error } = await supabaseAdmin
    .from("pin_jobs")
    .update({
      status: "queued",
      last_error: null,
      max_attempts: typedJob.max_attempts + 1,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", jobId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to retry job: ${error?.message ?? "Unknown error"}`);
  }

  await supabaseAdmin.from("automation_logs").insert({
    source_system: "pin_jobs",
    event_type: "pin_job_retry_queued",
    level: "info",
    message: `Pin job ${jobId} queued for retry`,
    details: { jobId },
  });

  return data as PinJobRow;
}

/**
 * Get the current status of a single pin job.
 */
export async function getPinJobStatus(jobId: string): Promise<PinJobRow | null> {
  const { data, error } = await supabaseAdmin
    .from("pin_jobs")
    .select("*")
    .eq("id", jobId)
    .maybeSingle();

  if (error) {
    console.warn("[pin-jobs] getPinJobStatus error:", error.message);
    return null;
  }

  return (data as PinJobRow) ?? null;
}

/**
 * List pin jobs for a user with optional status filter.
 */
export async function listPinJobs(
  userId: string,
  filters?: {
    status?: string | undefined;
    productId?: string | undefined;
    limit?: number | undefined;
  },
): Promise<PinJobRow[]> {
  let query = supabaseAdmin
    .from("pin_jobs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(filters?.limit ?? 100);

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.productId) {
    query = query.eq("product_id", filters.productId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list pin jobs: ${error.message}`);
  }

  return (data ?? []) as PinJobRow[];
}
