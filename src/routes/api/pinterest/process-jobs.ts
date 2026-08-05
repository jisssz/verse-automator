/**
 * POST /api/pinterest/process-jobs
 *
 * Processes queued / scheduled pin jobs.
 * Callable by background cron jobs or n8n workflows.
 *
 * Query / body parameters:
 *   userId  string  (optional — limit processing to a specific user)
 *
 * Response: { success: boolean, summary: { processed, published, failed, skipped }, results }
 */
import { createFileRoute } from "@tanstack/react-router";
import { processPendingJobs } from "@/lib/pin-jobs.server";
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

export const Route = createFileRoute("/api/pinterest/process-jobs")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const url = new URL(request.url);
          let userId = url.searchParams.get("userId") ?? undefined;

          if (!userId) {
            userId = (await resolveUserId(request)) ?? undefined;
          }

          const summary = await processPendingJobs(userId);

          return new Response(JSON.stringify({ success: true, ...summary }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to process pin jobs";
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
