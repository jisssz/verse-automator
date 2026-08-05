import { createFileRoute } from "@tanstack/react-router";
import { verifyN8nApiKey } from "@/lib/api-key.server";

export const Route = createFileRoute("/api/n8n/test")({
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
        return new Response(
          JSON.stringify({
            status: "ok",
            message: "n8n Webhook connection test successful",
            timestamp: new Date().toISOString(),
            authenticated: true,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      },
      POST: async ({ request }) => {
        const auth = verifyN8nApiKey(request);
        if (!auth.authorized) {
          return new Response(JSON.stringify({ error: auth.reason }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }
        const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
        return new Response(
          JSON.stringify({
            status: "ok",
            message: "n8n POST Webhook test successful",
            receivedData: body,
            timestamp: new Date().toISOString(),
            authenticated: true,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      },
    },
  },
});
