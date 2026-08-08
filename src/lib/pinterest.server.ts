/**
 * pinterest.server.ts
 *
 * Server-only Pinterest REST API v5 integration.
 * Thin orchestration layer — delegates account/token management to
 * pinterest-account.server.ts and board caching to pinterest-boards.server.ts.
 *
 * Maintains full backwards compatibility with all existing callers:
 *   getStoredPinterestTokens()
 *   savePinterestTokensServer()
 *   refreshPinterestAccessToken()
 *   fetchPinterestStatus()
 *   publishPinToPinterest()
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  getPinterestAccount,
  savePinterestAccount,
  refreshAndSaveToken,
  getValidAccessToken,
} from "./pinterest-account.server";
import { getBoardsWithCacheFallback, getDemoBoards } from "./pinterest-boards.server";

const PINTEREST_API_BASE = "https://api.pinterest.com/v5";

/** The demo user ID used by the auth middleware when no real session exists. */
const DEMO_USER_ID = "00000000-0000-0000-0000-000000000000";

// ─── Exported Types ───────────────────────────────────────────────────────────

export interface PinterestBoard {
  id: string;
  name: string;
  description?: string | null;
}

export interface PublishPinOptions {
  title: string;
  description: string;
  link?: string | undefined;
  imageUrl: string;
  boardId?: string | undefined;
}

export interface PublishPinResult {
  pinId: string;
  pinUrl: string;
  boardId: string;
  requestPayload: Record<string, unknown>;
  responsePayload: Record<string, unknown>;
}

/** @deprecated Use pinterest-account.server.ts directly for new code. */
export interface StoredPinterestTokens {
  accessToken: string;
  refreshToken?: string | undefined;
  expiresAt?: string | undefined;
}

// ─── Backwards-Compatible Token Helpers ──────────────────────────────────────

/**
 * @deprecated Prefer getValidAccessToken(userId) from pinterest-account.server.ts.
 * Kept for backwards compatibility with existing callers (n8n routes, retry-workflow, etc.)
 *
 * Reads from pinterest_accounts (new table) first, then falls back to
 * PINTEREST_ACCESS_TOKEN env var.
 */
export async function getStoredPinterestTokens(): Promise<StoredPinterestTokens | null> {
  // Try the new table first (using DEMO_USER_ID as the global fallback user)
  const account = await getPinterestAccount(DEMO_USER_ID);
  if (account) {
    return {
      accessToken: account.access_token,
      refreshToken: account.refresh_token ?? undefined,
      expiresAt: account.expires_at ?? undefined,
    };
  }

  // Legacy fallback: automation_logs store
  const { data } = await supabaseAdmin
    .from("automation_logs")
    .select("details")
    .eq("event_type", "pinterest_oauth_token")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (data?.details && typeof data.details === "object" && "accessToken" in data.details) {
    const details = data.details as Record<string, string>;
    return {
      accessToken: details["accessToken"] ?? "",
      refreshToken: details["refreshToken"],
      expiresAt: details["expiresAt"],
    };
  }

  // Env var fallback (dev/demo)
  const envToken = process.env["PINTEREST_ACCESS_TOKEN"]?.trim();
  if (envToken) {
    return {
      accessToken: envToken,
      refreshToken: process.env["PINTEREST_REFRESH_TOKEN"]?.trim(),
    };
  }

  return null;
}

/**
 * @deprecated Prefer savePinterestAccount(userId, options) from pinterest-account.server.ts.
 * Kept for backwards compatibility with existing OAuth callback code.
 */
export async function savePinterestTokensServer(params: {
  accessToken: string;
  refreshToken?: string | undefined;
  expiresIn?: number | undefined;
}): Promise<void> {
  // Save to both the new table (under DEMO_USER_ID) and the legacy log
  await savePinterestAccount(DEMO_USER_ID, {
    accessToken: params.accessToken,
    refreshToken: params.refreshToken,
    expiresIn: params.expiresIn,
  });
}

/**
 * @deprecated Prefer refreshAndSaveToken(userId) from pinterest-account.server.ts.
 * Kept for backwards compatibility.
 */
export async function refreshPinterestAccessToken(): Promise<string | null> {
  return refreshAndSaveToken(DEMO_USER_ID);
}

// ─── Status & Boards ─────────────────────────────────────────────────────────

/**
 * Returns Pinterest connection status and available boards.
 * Used by the UI (getPinterestStatusServer server function).
 */
export async function fetchPinterestStatus(userId = DEMO_USER_ID): Promise<{
  connected: boolean;
  mode: "live" | "demo";
  boards: PinterestBoard[];
  username?: string | undefined;
  configured: boolean;
  trialPending: boolean;
  statusMessage: string;
}> {
  const clientId = process.env["PINTEREST_CLIENT_ID"]?.trim();
  const clientSecret = process.env["PINTEREST_CLIENT_SECRET"]?.trim();
  const configured = Boolean(clientId && clientSecret);
  const accessToken = await getValidAccessToken(userId);

  if (!accessToken) {
    return {
      connected: false,
      mode: "demo",
      boards: getDemoBoards(),
      configured,
      trialPending: !configured,
      statusMessage: configured
        ? "Account Disconnected — OAuth Ready"
        : "Waiting for Pinterest Trial Approval",
    };
  }

  const { boards, source } = await getBoardsWithCacheFallback(userId, accessToken);

  // Verify connection is still live by checking if we got real boards
  if (source === "demo" && !accessToken) {
    return {
      connected: false,
      mode: "demo",
      boards,
      configured,
      trialPending: !configured,
      statusMessage: configured
        ? "Account Disconnected — OAuth Ready"
        : "Waiting for Pinterest Trial Approval",
    };
  }

  // Try to get username for display
  let username: string | undefined;
  const account = await getPinterestAccount(userId);
  if (account?.username) username = account.username;

  return {
    connected: true,
    mode: source === "demo" ? "demo" : "live",
    boards,
    configured,
    trialPending: false,
    statusMessage: "Connected & Active",
    ...(username ? { username } : {}),
  };
}

// ─── Pin Publishing ───────────────────────────────────────────────────────────

/**
 * Publish a pin to Pinterest.
 * Falls back to demo simulation when no access token is available.
 *
 * Automatically refreshes expired tokens before publishing.
 */
export async function publishPinToPinterest(
  options: PublishPinOptions,
  userId = DEMO_USER_ID,
): Promise<PublishPinResult> {
  const boardId = options.boardId ?? "demo-board-1";

  const requestPayload: Record<string, unknown> = {
    title: options.title,
    description: options.description,
    board_id: boardId,
    media_source: {
      source_type: "image_url",
      url: options.imageUrl,
    },
  };
  if (options.link) requestPayload["link"] = options.link;

  const accessToken = await getValidAccessToken(userId);

  if (!accessToken) {
    // Demo Mode — simulate a published pin
    const simulatedPinId = `pin_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const simulatedPinUrl = `https://pinterest.com/pin/${simulatedPinId}/`;

    return {
      pinId: simulatedPinId,
      pinUrl: simulatedPinUrl,
      boardId,
      requestPayload,
      responsePayload: {
        id: simulatedPinId,
        board_id: boardId,
        title: options.title,
        created_at: new Date().toISOString(),
        simulated: true,
      },
    };
  }

  // Attempt publish (with one automatic 401 retry after token refresh)
  const attemptPublish = async (token: string): Promise<Response> =>
    fetch(`${PINTEREST_API_BASE}/pins`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
    });

  let response = await attemptPublish(accessToken);

  if (response.status === 401) {
    const refreshed = await refreshAndSaveToken(userId);
    if (refreshed) {
      response = await attemptPublish(refreshed);
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Pinterest API publishing failed (${response.status}): ${errorText}`);
  }

  const payload = (await response.json()) as { id: string; url?: string };
  const pinId = payload.id;
  const pinUrl = payload.url ?? `https://pinterest.com/pin/${pinId}/`;

  return {
    pinId,
    pinUrl,
    boardId,
    requestPayload,
    responsePayload: payload as Record<string, unknown>,
  };
}

// ─── Pin Analytics ────────────────────────────────────────────────────────────

export interface PinAnalytics {
  pinId: string;
  impressions: number;
  saves: number;
  clicks: number;
  outboundClicks: number;
  period: string;
}

/**
 * Fetch pin analytics from Pinterest API v5.
 * Requires the pin to have been live for at least 24 hours.
 */
export async function fetchPinAnalytics(
  pinId: string,
  userId = DEMO_USER_ID,
): Promise<PinAnalytics | null> {
  const accessToken = await getValidAccessToken(userId);
  if (!accessToken) return null;

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const params = new URLSearchParams({
    start_date: startDate.toISOString().split("T")[0]!,
    end_date: endDate.toISOString().split("T")[0]!,
    metric_types: "IMPRESSION,SAVE,PIN_CLICK,OUTBOUND_CLICK",
    app_types: "ALL",
    split_field: "NO_SPLIT",
  });

  try {
    const response = await fetch(
      `${PINTEREST_API_BASE}/pins/${pinId}/analytics?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      console.warn("[pinterest] fetchPinAnalytics non-OK:", response.status);
      return null;
    }

    const data = (await response.json()) as {
      all?: {
        daily_metrics?: Array<{
          data_status: string;
          date: string;
          metrics: Record<string, number>;
        }>;
        lifetime_metrics?: Record<string, number>;
        summary_metrics?: Record<string, number>;
      };
    };

    const summary = data.all?.summary_metrics ?? {};

    return {
      pinId,
      impressions: summary["IMPRESSION"] ?? 0,
      saves: summary["SAVE"] ?? 0,
      clicks: summary["PIN_CLICK"] ?? 0,
      outboundClicks: summary["OUTBOUND_CLICK"] ?? 0,
      period: "30d",
    };
  } catch (err) {
    console.warn("[pinterest] fetchPinAnalytics exception:", err);
    return null;
  }
}

// ─── Delete Pin ───────────────────────────────────────────────────────────────

/**
 * Delete a pin from Pinterest by Pinterest pin ID.
 * Returns true on success, false if not found or no credentials.
 */
export async function deletePinFromPinterest(
  pinId: string,
  userId = DEMO_USER_ID,
): Promise<{ success: boolean; error?: string }> {
  const accessToken = await getValidAccessToken(userId);
  if (!accessToken) {
    return { success: false, error: "No Pinterest access token available" };
  }

  try {
    const response = await fetch(`${PINTEREST_API_BASE}/pins/${pinId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 404) {
      return { success: false, error: "Pin not found on Pinterest" };
    }

    if (!response.ok) {
      const errText = await response.text();
      return { success: false, error: `Pinterest API error (${response.status}): ${errText}` };
    }

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}
