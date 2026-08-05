/**
 * pinterest-boards.server.ts
 *
 * Server-only Pinterest board fetching and caching layer.
 * Boards are cached in the `board_cache` table with a configurable TTL.
 *
 * Public API:
 *   fetchAndCacheBoards(userId, accessToken)
 *   getCachedBoards(userId)
 *   getBoardsWithCacheFallback(userId, accessToken)
 *   invalidateBoardCache(userId)
 *   getDemoBoards()
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";

const PINTEREST_API_BASE = "https://api.pinterest.com/v5";

/** Board cache TTL in milliseconds (30 minutes). */
const BOARD_CACHE_TTL_MS = 30 * 60 * 1000;

/** Maximum boards to fetch per page from Pinterest API. */
const BOARDS_PAGE_SIZE = 100;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BoardItem {
  id: string;
  name: string;
  description: string | null;
  pinCount: number;
  cachedAt?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isCacheStale(cachedAt: string): boolean {
  return Date.now() - new Date(cachedAt).getTime() > BOARD_CACHE_TTL_MS;
}

// ─── Core Functions ───────────────────────────────────────────────────────────

/**
 * Returns demo boards when Pinterest is not configured.
 */
export function getDemoBoards(): BoardItem[] {
  return [
    {
      id: "demo-board-1",
      name: "Affiliate Products & Must-Haves",
      description: "Curated affiliate products for skincare enthusiasts",
      pinCount: 0,
    },
    {
      id: "demo-board-2",
      name: "DailyVerse AI Curated Pins",
      description: "AI-generated luxury skincare pins",
      pinCount: 0,
    },
    {
      id: "demo-board-3",
      name: "Trending Beauty & Skincare Serums",
      description: "Top trending serums and beauty products",
      pinCount: 0,
    },
  ];
}

/**
 * Fetch boards directly from Pinterest API v5.
 * Handles pagination, returns all boards for the authenticated user.
 */
export async function fetchBoardsFromPinterest(accessToken: string): Promise<BoardItem[]> {
  const boards: BoardItem[] = [];
  let bookmark: string | undefined;

  do {
    const url = new URL(`${PINTEREST_API_BASE}/boards`);
    url.searchParams.set("page_size", String(BOARDS_PAGE_SIZE));
    if (bookmark) url.searchParams.set("bookmark", bookmark);

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Pinterest boards API error (${response.status}): ${errText}`);
    }

    const data = (await response.json()) as {
      items?: Array<{
        id: string;
        name: string;
        description?: string | null;
        pin_count?: number;
      }>;
      bookmark?: string;
    };

    for (const item of data.items ?? []) {
      boards.push({
        id: item.id,
        name: item.name,
        description: item.description ?? null,
        pinCount: item.pin_count ?? 0,
      });
    }

    bookmark = data.bookmark;
  } while (bookmark);

  return boards;
}

/**
 * Fetch boards from Pinterest API and upsert into `board_cache`.
 * Returns the freshly fetched list.
 */
export async function fetchAndCacheBoards(
  userId: string,
  accessToken: string,
): Promise<BoardItem[]> {
  const boards = await fetchBoardsFromPinterest(accessToken);

  if (boards.length === 0) return boards;

  const now = new Date().toISOString();
  const rows = boards.map((b) => ({
    user_id: userId,
    board_id: b.id,
    board_name: b.name,
    board_description: b.description,
    pin_count: b.pinCount,
    cached_at: now,
  }));

  // Delete stale cache for this user, then bulk insert
  await supabaseAdmin.from("board_cache").delete().eq("user_id", userId);

  const { error } = await supabaseAdmin.from("board_cache").insert(rows);
  if (error) {
    console.warn("[pinterest-boards] board_cache upsert failed:", error.message);
    // Non-fatal — still return the live data
  }

  return boards.map((b) => ({ ...b, cachedAt: now }));
}

/**
 * Read boards from `board_cache` for a given user.
 * Returns empty array if cache is empty or table doesn't exist yet.
 */
export async function getCachedBoards(userId: string): Promise<BoardItem[]> {
  const { data, error } = await supabaseAdmin
    .from("board_cache")
    .select("board_id, board_name, board_description, pin_count, cached_at")
    .eq("user_id", userId)
    .order("board_name", { ascending: true });

  if (error) {
    console.warn("[pinterest-boards] getCachedBoards error:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.board_id,
    name: row.board_name,
    description: row.board_description,
    pinCount: row.pin_count,
    cachedAt: row.cached_at,
  }));
}

/**
 * Returns cached boards if fresh, otherwise fetches from Pinterest API and
 * re-caches. Falls back to demo boards if no access token or API error.
 */
export async function getBoardsWithCacheFallback(
  userId: string,
  accessToken: string | null,
): Promise<{ boards: BoardItem[]; source: "cache" | "live" | "demo" }> {
  if (!accessToken) {
    return { boards: getDemoBoards(), source: "demo" };
  }

  // Try cache first
  const cached = await getCachedBoards(userId);
  if (cached.length > 0 && cached[0]?.cachedAt && !isCacheStale(cached[0].cachedAt)) {
    return { boards: cached, source: "cache" };
  }

  // Cache miss or stale — fetch live
  try {
    const live = await fetchAndCacheBoards(userId, accessToken);
    return { boards: live, source: "live" };
  } catch (err) {
    console.warn("[pinterest-boards] Live fetch failed, using cache/demo:", err);

    // Return stale cache if available, otherwise demo boards
    if (cached.length > 0) return { boards: cached, source: "cache" };
    return { boards: getDemoBoards(), source: "demo" };
  }
}

/**
 * Delete all board_cache rows for a user (e.g. on disconnect).
 */
export async function invalidateBoardCache(userId: string): Promise<void> {
  const { error } = await supabaseAdmin.from("board_cache").delete().eq("user_id", userId);

  if (error) {
    console.warn("[pinterest-boards] invalidateBoardCache error:", error.message);
  }
}
