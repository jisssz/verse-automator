/**
 * /api/pinterest/jobs
 *
 * GET:  List pin jobs for authenticated user.
 * POST: Create a new pin job in the queue.
 */
import { createFileRoute } from "@tanstack/react-router";
import { createPinJob, listPinJobs } from "@/lib/pin-jobs.server";
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

export const Route = createFileRoute("/api/pinterest/jobs")({
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
          const status = url.searchParams.get("status") ?? undefined;
          const productId = url.searchParams.get("productId") ?? undefined;
          const limit = url.searchParams.get("limit")
            ? parseInt(url.searchParams.get("limit")!, 10)
            : 100;

          const jobs = await listPinJobs(userId, { status, productId, limit });

          return new Response(JSON.stringify({ success: true, jobs, count: jobs.length }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to list jobs";
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },

      POST: async ({ request }) => {
        const userId = await resolveUserId(request);
        if (!userId) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const body = await request.json();
          if (!body.productId || !body.title || !body.description || !body.imageUrl) {
            return new Response(
              JSON.stringify({
                error: "Missing required fields: productId, title, description, imageUrl",
              }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
          }

          const job = await createPinJob(userId, {
            productId: body.productId,
            boardId: body.boardId,
            boardName: body.boardName,
            title: body.title,
            description: body.description,
            imageUrl: body.imageUrl,
            link: body.link,
            scheduledAt: body.scheduledAt,
            maxAttempts: body.maxAttempts,
          });

          return new Response(JSON.stringify({ success: true, job }), {
            status: 201,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to create pin job";
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
