import { createFileRoute } from "@tanstack/react-router";
import { verifyN8nApiKey } from "@/lib/api-key.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/n8n/logs")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = verifyN8nApiKey(request);
        if (!auth.authorized) {
          return new Response(JSON.stringify({ error: auth.reason }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const { data, error } = await supabaseAdmin
            .from("automation_logs")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(50);

          if (error) {
            throw new Error(error.message);
          }

          return new Response(
            JSON.stringify({
              success: true,
              count: data?.length || 0,
              logs: data || [],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to fetch automation logs";
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
