/**
 * POST /api/pinterest/disconnect
 *
 * Disconnects the Pinterest account for the authenticated user.
 * Marks the account as inactive in pinterest_accounts and clears board_cache.
 *
 * Authentication: Bearer token or demo-token (via X-User-Id header).
 *
 * Response: { success: boolean, message: string }
 */
import { createFileRoute } from "@tanstack/react-router";
import { disconnectPinterestAccount } from "@/lib/pinterest-account.server";
import { invalidateBoardCache } from "@/lib/pinterest-boards.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Extract user ID from Authorization or X-User-Id header. */
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

export const Route = createFileRoute("/api/pinterest/disconnect")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const userId = await resolveUserId(request);
        if (!userId) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          await disconnectPinterestAccount(userId);
          await invalidateBoardCache(userId);

          return new Response(
            JSON.stringify({
              success: true,
              message: "Pinterest account disconnected successfully",
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to disconnect Pinterest account";
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
