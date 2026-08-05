/**
 * DELETE /api/pinterest/pin
 *
 * Deletes a pin from Pinterest by Pinterest pin ID.
 * Optionally marks the published_pins row as deleted.
 *
 * Request body:
 *   pinId           string   (required — Pinterest pin ID)
 *   publishedPinId  string   (optional — local published_pins.id UUID)
 *
 * Response: { success: boolean, error?: string }
 */
import { createFileRoute } from "@tanstack/react-router";
import { deletePinFromPinterest } from "@/lib/pinterest.server";
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

export const Route = createFileRoute("/api/pinterest/pin")({
  server: {
    handlers: {
      DELETE: async ({ request }) => {
        const userId = await resolveUserId(request);
        if (!userId) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const body = (await request.json()) as {
            pinId?: string;
            publishedPinId?: string;
          };

          if (!body.pinId?.trim()) {
            return new Response(JSON.stringify({ error: "Missing required parameter 'pinId'" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const result = await deletePinFromPinterest(body.pinId, userId);

          if (result.success && body.publishedPinId) {
            await supabaseAdmin
              .from("published_pins")
              .update({ status: "deleted", updated_at: new Date().toISOString() } as never)
              .eq("id", body.publishedPinId);
          }

          await supabaseAdmin.from("automation_logs").insert({
            source_system: "pinterest_api",
            event_type: result.success ? "pin_deleted" : "pin_delete_failed",
            level: result.success ? "info" : "warn",
            message: result.success
              ? `Pin ${body.pinId} deleted from Pinterest`
              : `Failed to delete pin ${body.pinId}: ${result.error}`,
            details: {
              pinId: body.pinId,
              publishedPinId: body.publishedPinId ?? null,
              userId,
            },
          });

          return new Response(JSON.stringify(result), {
            status: result.success ? 200 : 422,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to delete pin";
          return new Response(JSON.stringify({ success: false, error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
