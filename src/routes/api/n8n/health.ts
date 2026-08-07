/**
 * GET /api/n8n/health
 *
 * Public Server & Integration Health Check Endpoint.
 * Returns system status, environment configuration audit (FOUND / MISSING),
 * and active database connection state with latency metrics.
 */
import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/n8n/health")({
  server: {
    handlers: {
      GET: async () => {
        const startTime = Date.now();
        let dbStatus = "ok";
        let dbError: string | null = null;
        let dbLatencyMs = 0;

        try {
          const { error } = await supabaseAdmin.from("products").select("id").limit(1);
          dbLatencyMs = Date.now() - startTime;
          if (error) {
            dbStatus = "degraded";
            dbError = error.message;
          }
        } catch (err) {
          dbStatus = "error";
          dbError = err instanceof Error ? err.message : "Database connection error";
        }

        const envChecks = {
          supabaseUrl:
            process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"] ? "FOUND" : "MISSING",
          supabaseServiceRoleKey: process.env["SUPABASE_SERVICE_ROLE_KEY"] ? "FOUND" : "MISSING",
          supabaseAnonKey:
            process.env["SUPABASE_ANON_KEY"] ||
            process.env["SUPABASE_PUBLISHABLE_KEY"] ||
            process.env["VITE_SUPABASE_ANON_KEY"] ||
            process.env["VITE_SUPABASE_PUBLISHABLE_KEY"]
              ? "FOUND"
              : "MISSING",
          openaiApiKey: process.env["OPENAI_API_KEY"] ? "FOUND" : "MISSING",
          n8nWebhookUrl: process.env["N8N_WEBHOOK_URL"] ? "FOUND" : "MISSING",
          n8nApiKey: process.env["N8N_API_KEY"] ? "FOUND" : "MISSING",
          pinterestClientId: process.env["PINTEREST_CLIENT_ID"] ? "FOUND" : "MISSING",
          pinterestClientSecret: process.env["PINTEREST_CLIENT_SECRET"] ? "FOUND" : "MISSING",
        };

        const isHealthy =
          dbStatus === "ok" &&
          envChecks.supabaseUrl === "FOUND" &&
          envChecks.supabaseServiceRoleKey === "FOUND";

        return new Response(
          JSON.stringify({
            status: isHealthy ? "healthy" : "degraded",
            timestamp: new Date().toISOString(),
            uptimeSeconds: Math.round(process.uptime()),
            database: {
              status: dbStatus,
              latencyMs: dbLatencyMs,
              error: dbError,
            },
            integrations: envChecks,
            webhookUrl: process.env["N8N_WEBHOOK_URL"] || null,
            hasApiKey: envChecks.n8nApiKey === "FOUND",
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store, max-age=0",
            },
          },
        );
      },
    },
  },
});
