/**
 * GET /api/n8n/health
 *
 * Health check endpoint for n8n automation engine and external integrations.
 * Returns system status, environment configuration checks, and active database connection state.
 */
import { createFileRoute } from "@tanstack/react-router";
import { verifyN8nApiKey } from "@/lib/api-key.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/n8n/health")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = verifyN8nApiKey(request);
        if (!auth.authorized) {
          return new Response(JSON.stringify({ status: "unauthorized", error: auth.reason }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Test Supabase connection
        let dbStatus = "ok";
        let dbLatencyMs = 0;
        const startTime = Date.now();

        try {
          const { error } = await supabaseAdmin.from("automation_logs").select("id").limit(1);

          dbLatencyMs = Date.now() - startTime;
          if (error) dbStatus = `degraded: ${error.message}`;
        } catch (err) {
          dbStatus = `error: ${err instanceof Error ? err.message : "Unknown error"}`;
        }

        const envChecks = {
          supabaseUrl: !!process.env["VITE_SUPABASE_URL"] || !!process.env["SUPABASE_URL"],
          supabaseServiceRoleKey: !!process.env["SUPABASE_SERVICE_ROLE_KEY"],
          openaiApiKey: !!process.env["OPENAI_API_KEY"],
          pinterestClientId: !!process.env["PINTEREST_CLIENT_ID"],
          pinterestClientSecret: !!process.env["PINTEREST_CLIENT_SECRET"],
          googleSheetsClientEmail: !!process.env["GOOGLE_SHEETS_CLIENT_EMAIL"],
          googleSheetsPrivateKey: !!process.env["GOOGLE_SHEETS_PRIVATE_KEY"],
          n8nApiKey: !!process.env["N8N_API_KEY"],
        };

        const overallStatus = dbStatus === "ok" && envChecks.openaiApiKey ? "healthy" : "degraded";

        return new Response(
          JSON.stringify({
            status: overallStatus,
            timestamp: new Date().toISOString(),
            uptimeSeconds: process.uptime(),
            database: {
              status: dbStatus,
              latencyMs: dbLatencyMs,
            },
            integrations: envChecks,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
