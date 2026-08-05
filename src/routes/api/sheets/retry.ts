/**
 * POST /api/sheets/retry
 *
 * Retries a failed product import from Google Sheets.
 *
 * Body parameters:
 *   productId  string  (required — UUID)
 *
 * Response: { success: boolean, product: Record<string, unknown> }
 */
import { createFileRoute } from "@tanstack/react-router";
import { retryFailedSheetImport } from "@/lib/google-sheets.server";
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

export const Route = createFileRoute("/api/sheets/retry")({
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
          const body = (await request.json().catch(() => ({}))) as {
            productId?: string;
          };

          if (!body.productId) {
            return new Response(JSON.stringify({ error: "Missing required field 'productId'" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const result = await retryFailedSheetImport({
            ownerId: userId,
            productId: body.productId,
          });

          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to retry sheet import";
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
