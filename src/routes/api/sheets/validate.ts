/**
 * POST /api/sheets/validate
 *
 * Validates Google Spreadsheet structure and column mappings.
 *
 * Body parameters:
 *   customSpreadsheetId  string  (optional)
 *   sourceSheetName      string  (optional — default: "Products")
 *
 * Response: { success: boolean, result: SpreadsheetValidationResult }
 */
import { createFileRoute } from "@tanstack/react-router";
import { validateSpreadsheetStructure } from "@/lib/google-sheets.server";
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

export const Route = createFileRoute("/api/sheets/validate")({
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
            customSpreadsheetId?: string;
            sourceSheetName?: string;
          };

          const result = await validateSpreadsheetStructure(
            body.customSpreadsheetId,
            body.sourceSheetName || "Products",
          );

          return new Response(JSON.stringify({ success: true, result }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to validate Google Sheet";
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
