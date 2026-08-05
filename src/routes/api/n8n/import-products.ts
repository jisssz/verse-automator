import { createFileRoute } from "@tanstack/react-router";
import { verifyN8nApiKey } from "@/lib/api-key.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/n8n/import-products")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = verifyN8nApiKey(request);
        if (!auth.authorized) {
          return new Response(JSON.stringify({ error: auth.reason }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const body = (await request.json()) as {
            campaignId?: string;
            products?: Array<{ productName: string; trendNote?: string; sourceUrl?: string }>;
          };

          if (!body.campaignId) {
            return new Response(
              JSON.stringify({ error: "Missing required parameter 'campaignId'" }),
              {
                status: 400,
                headers: { "Content-Type": "application/json" },
              },
            );
          }

          const productItems = body.products || [];
          if (productItems.length === 0) {
            return new Response(
              JSON.stringify({ error: "No products provided in request payload" }),
              {
                status: 400,
                headers: { "Content-Type": "application/json" },
              },
            );
          }

          const rowsToInsert = productItems.map((p) => ({
            campaign_id: body.campaignId!,
            product_name: p.productName,
            trend_note: p.trendNote || null,
            source_url: p.sourceUrl || null,
          }));

          const { data, error } = await supabaseAdmin
            .from("campaign_products")
            .insert(rowsToInsert)
            .select("id, product_name, campaign_id, created_at");

          if (error) {
            throw new Error(error.message);
          }

          await supabaseAdmin.from("automation_logs").insert({
            source_system: "n8n_webhook",
            event_type: "n8n_import_products",
            level: "info",
            message: `n8n webhook imported ${data.length} products into campaign '${body.campaignId}'`,
            details: {
              campaignId: body.campaignId,
              importedCount: data.length,
            },
          });

          return new Response(
            JSON.stringify({
              success: true,
              count: data.length,
              insertedProducts: data,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : "Product import failed";
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
