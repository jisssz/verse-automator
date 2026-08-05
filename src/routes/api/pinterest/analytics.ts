/**
 * GET /api/pinterest/analytics
 *
 * Fetches analytics for a specific Pinterest pin.
 *
 * Query parameters:
 *   pinId  string  (required)
 *
 * Response: { success: boolean, analytics: PinAnalytics | null }
 */
import { createFileRoute } from "@tanstack/react-router";
import { fetchPinAnalytics } from "@/lib/pinterest.server";
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

export const Route = createFileRoute("/api/pinterest/analytics")({
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
          const pinId = url.searchParams.get("pinId");

          if (!pinId?.trim()) {
            return new Response(JSON.stringify({ error: "Missing required parameter 'pinId'" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const analytics = await fetchPinAnalytics(pinId, userId);

          return new Response(JSON.stringify({ success: true, analytics }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to fetch pin analytics";
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
