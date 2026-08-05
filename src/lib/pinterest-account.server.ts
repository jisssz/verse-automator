/**
 * pinterest-account.server.ts
 *
 * Server-only Pinterest account management layer.
 * Stores credentials in `pinterest_accounts` table (RLS bypassed via supabaseAdmin).
 * Secrets never leave the server.
 *
 * Public API:
 *   getPinterestAccount(userId)
 *   savePinterestAccount(userId, tokens)
 *   disconnectPinterestAccount(userId)
 *   getValidAccessToken(userId) — auto-refreshes if token expires within 5 min
 *   fetchPinterestUserInfo(accessToken)
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";

const PINTEREST_API_BASE = "https://api.pinterest.com/v5";
/** Refresh when fewer than this many seconds remain. */
const REFRESH_BUFFER_SECONDS = 300;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PinterestAccountRow {
  id: string;
  user_id: string;
  pinterest_user_id: string | null;
  username: string | null;
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
  scope: string | null;
  is_active: boolean;
  connected_at: string;
  updated_at: string;
}

export interface SavePinterestAccountOptions {
  accessToken: string;
  refreshToken?: string | undefined;
  expiresIn?: number | undefined;
  pinterestUserId?: string | undefined;
  username?: string | undefined;
  scope?: string | undefined;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getOAuthCredentials() {
  const clientId = process.env["PINTEREST_CLIENT_ID"]?.trim();
  const clientSecret = process.env["PINTEREST_CLIENT_SECRET"]?.trim();
  const redirectUri = process.env["PINTEREST_REDIRECT_URI"]?.trim();
  return { clientId, clientSecret, redirectUri };
}

function isTokenExpiringSoon(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  const expiryMs = new Date(expiresAt).getTime();
  return expiryMs - Date.now() < REFRESH_BUFFER_SECONDS * 1000;
}

// ─── Core Functions ───────────────────────────────────────────────────────────

/**
 * Fetch the active Pinterest account for a given user_id.
 * Returns null if no active account exists.
 */
export async function getPinterestAccount(userId: string): Promise<PinterestAccountRow | null> {
  const { data, error } = await supabaseAdmin
    .from("pinterest_accounts")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    // Table may not exist yet in dev — return null gracefully
    console.warn("[pinterest-account] getPinterestAccount error:", error.message);
    return null;
  }

  return data ?? null;
}

/**
 * Save or update Pinterest OAuth tokens for a user.
 * Uses upsert on (user_id) after deactivating any previous accounts.
 */
export async function savePinterestAccount(
  userId: string,
  options: SavePinterestAccountOptions,
): Promise<void> {
  const expiresAt = options.expiresIn
    ? new Date(Date.now() + options.expiresIn * 1000).toISOString()
    : null;

  // Deactivate any previous accounts for this user
  await supabaseAdmin
    .from("pinterest_accounts")
    .update({ is_active: false, disconnected_at: new Date().toISOString() } as never)
    .eq("user_id", userId)
    .eq("is_active", true);

  const { error } = await supabaseAdmin.from("pinterest_accounts").insert({
    user_id: userId,
    access_token: options.accessToken,
    refresh_token: options.refreshToken ?? null,
    expires_at: expiresAt,
    pinterest_user_id: options.pinterestUserId ?? null,
    username: options.username ?? null,
    scope: options.scope ?? null,
    is_active: true,
    connected_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("[pinterest-account] savePinterestAccount error:", error.message);
    throw new Error(`Failed to save Pinterest account: ${error.message}`);
  }

  // Also log in automation_logs for audit trail
  await supabaseAdmin.from("automation_logs").insert({
    source_system: "pinterest_oauth",
    event_type: "pinterest_account_connected",
    level: "info",
    message: `Pinterest account connected for user ${userId}`,
    details: {
      userId,
      username: options.username ?? null,
      expiresAt,
      scope: options.scope ?? null,
    },
  });
}

/**
 * Mark the active Pinterest account as disconnected.
 */
export async function disconnectPinterestAccount(userId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("pinterest_accounts")
    .update({
      is_active: false,
      disconnected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as never)
    .eq("user_id", userId)
    .eq("is_active", true);

  if (error) {
    console.error("[pinterest-account] disconnectPinterestAccount error:", error.message);
    throw new Error(`Failed to disconnect Pinterest account: ${error.message}`);
  }

  await supabaseAdmin.from("automation_logs").insert({
    source_system: "pinterest_oauth",
    event_type: "pinterest_account_disconnected",
    level: "info",
    message: `Pinterest account disconnected for user ${userId}`,
    details: { userId },
  });
}

/**
 * Refresh the Pinterest access token using the stored refresh_token.
 * Updates the `pinterest_accounts` row and returns the new access token.
 * Returns null if refresh fails or credentials are missing.
 */
export async function refreshAndSaveToken(userId: string): Promise<string | null> {
  const account = await getPinterestAccount(userId);
  const refreshToken = account?.refresh_token ?? process.env["PINTEREST_REFRESH_TOKEN"]?.trim();
  const { clientId, clientSecret } = getOAuthCredentials();

  if (!refreshToken || !clientId || !clientSecret) {
    console.warn("[pinterest-account] Cannot refresh — missing credentials");
    return null;
  }

  try {
    const authHeader = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
    const response = await fetch("https://api.pinterest.com/v5/oauth/token", {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }).toString(),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn("[pinterest-account] Token refresh failed:", errText);
      return null;
    }

    const payload = (await response.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      scope?: string;
    };

    // Update the account row
    const expiresAt = payload.expires_in
      ? new Date(Date.now() + payload.expires_in * 1000).toISOString()
      : null;

    await supabaseAdmin
      .from("pinterest_accounts")
      .update({
        access_token: payload.access_token,
        refresh_token: payload.refresh_token ?? refreshToken,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("user_id", userId)
      .eq("is_active", true);

    return payload.access_token;
  } catch (err) {
    console.error("[pinterest-account] refreshAndSaveToken exception:", err);
    return null;
  }
}

/**
 * Returns a valid access token for the user, refreshing automatically if needed.
 * Falls back to PINTEREST_ACCESS_TOKEN env var for demo/dev environments.
 * Returns null if no credentials are available.
 */
export async function getValidAccessToken(userId: string): Promise<string | null> {
  const account = await getPinterestAccount(userId);

  if (account) {
    if (isTokenExpiringSoon(account.expires_at)) {
      const refreshed = await refreshAndSaveToken(userId);
      return refreshed ?? account.access_token;
    }
    return account.access_token;
  }

  // Fallback: env variable (dev/demo)
  const envToken = process.env["PINTEREST_ACCESS_TOKEN"]?.trim();
  return envToken ?? null;
}

/**
 * Fetch Pinterest user info using an access token.
 * Returns { id, username } or null on failure.
 */
export async function fetchPinterestUserInfo(
  accessToken: string,
): Promise<{ id: string; username: string; accountType: string } | null> {
  try {
    const response = await fetch(`${PINTEREST_API_BASE}/user_account`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      id?: string;
      username?: string;
      account_type?: string;
    };

    return {
      id: data.id ?? "",
      username: data.username ?? "",
      accountType: data.account_type ?? "PINNER",
    };
  } catch {
    return null;
  }
}

/**
 * Build the Pinterest OAuth 2.0 authorization URL.
 */
export function buildPinterestOAuthUrl(state: string): string | null {
  const { clientId, redirectUri } = getOAuthCredentials();
  if (!clientId || !redirectUri) return null;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: ["boards:read", "boards:write", "pins:read", "pins:write", "user_accounts:read"].join(
      ",",
    ),
    state,
  });

  return `https://www.pinterest.com/oauth/?${params.toString()}`;
}

/**
 * Exchange an authorization code for access + refresh tokens.
 */
export async function exchangeCodeForTokens(code: string): Promise<{
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number | null;
  scope: string | null;
} | null> {
  const { clientId, clientSecret, redirectUri } = getOAuthCredentials();
  if (!clientId || !clientSecret || !redirectUri) {
    console.error("[pinterest-account] Missing OAuth credentials for token exchange");
    return null;
  }

  const authHeader = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;

  try {
    const response = await fetch("https://api.pinterest.com/v5/oauth/token", {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }).toString(),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[pinterest-account] Code exchange failed:", errText);
      return null;
    }

    const payload = (await response.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      scope?: string;
    };

    if (!payload.access_token) return null;

    return {
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token ?? null,
      expiresIn: payload.expires_in ?? null,
      scope: payload.scope ?? null,
    };
  } catch (err) {
    console.error("[pinterest-account] exchangeCodeForTokens exception:", err);
    return null;
  }
}
