/**
 * GET /api/pinterest/boards
 *
 * Returns Pinterest boards for the authenticated user.
 * Cache-first (30 min TTL), falls back to live API, then demo boards.
 *
 * Query parameters:
 *   refresh  boolean  (optional — force live refresh, bypasses cache)
 *
 * Response: { boards: BoardItem[], source: "cache" | "live" | "demo" }
 */
import { createFileRoute } from "@tanstack/react-router";
import { getBoardsWithCacheFallback, fetchAndCacheBoards } from "@/lib/pinterest-boards.server";
import { getValidAccessToken } from "@/lib/pinterest-account.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function resolveUserId(request: Request): Promise<string | null> {
  const userIdHeader = request.headers.get("x-user-id");
  if (userIdHeader) return userIdHeader;

  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  if (token === "demo-token") return "00000000-0000-0000-0000-000000000000";

  const { data } = await supabaseAdmin.auth.getUser(token);
  return data.user?.id ?? null;
}

export const Route = createFileRoute("/api/pinterest/boards")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const userId = await resolveUserId(request);
        if (!userId) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const url = new URL(request.url);
          const forceRefresh = url.searchParams.get("refresh") === "true";
          const accessToken = await getValidAccessToken(userId);

          let boards;
          let source: "cache" | "live" | "demo";

          if (forceRefresh && accessToken) {
            boards = await fetchAndCacheBoards(userId, accessToken);
            source = "live";
          } else {
            const result = await getBoardsWithCacheFallback(userId, accessToken);
            boards = result.boards;
            source = result.source;
          }

          return new Response(
            JSON.stringify({ success: true, boards, source, count: boards.length }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to fetch boards";
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
