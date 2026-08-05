/**
 * POST /api/n8n/start
 *
 * Kicks off the full automation pipeline for a campaign.
 * n8n calls this once to trigger all product processing:
 * content generation → image prompt → image generation → publish.
 *
 * Request body:
 *   campaignId   string   (required)
 *   maxProducts  number   (optional, default 10, max 50)
 *
 * Response:
 *   { success: boolean, campaignId, productsQueued, products: [{ id, productName }] }
 */
import { createFileRoute } from "@tanstack/react-router";
import { verifyN8nApiKey } from "@/lib/api-key.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/n8n/start")({
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
            maxProducts?: number;
          };

          if (!body.campaignId?.trim()) {
            return new Response(
              JSON.stringify({ error: "Missing required parameter 'campaignId'" }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
          }

          const maxProducts = Math.min(body.maxProducts ?? 10, 50);

          // Fetch the campaign
          const { data: campaign, error: campaignError } = await supabaseAdmin
            .from("campaigns")
            .select("id, name, niche, status, owner_id")
            .eq("id", body.campaignId)
            .single();

          if (campaignError || !campaign) {
            return new Response(JSON.stringify({ error: "Campaign not found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }

          // Fetch products without generated content, limited to maxProducts
          const { data: products, error: productsError } = await supabaseAdmin
            .from("campaign_products")
            .select("id, product_name, trend_note, generated_content(id)")
            .eq("campaign_id", body.campaignId)
            .order("position", { ascending: true })
            .limit(maxProducts);

          if (productsError) {
            throw new Error(productsError.message);
          }

          const productsToProcess = (products || []).filter((p) => {
            const content = Array.isArray(p.generated_content)
              ? p.generated_content
              : p.generated_content
                ? [p.generated_content]
                : [];
            return content.length === 0;
          });

          // Update campaign status to processing
          await supabaseAdmin
            .from("campaigns")
            .update({ status: "processing" })
            .eq("id", body.campaignId);

          // Log the pipeline kick-off
          await supabaseAdmin.from("automation_logs").insert({
            source_system: "n8n_webhook",
            event_type: "n8n_pipeline_start",
            level: "info",
            message: `n8n pipeline started for campaign '${campaign.name}' — ${productsToProcess.length} products queued`,
            details: {
              campaignId: body.campaignId,
              campaignName: campaign.name,
              productsQueued: productsToProcess.length,
              maxProducts,
            },
          });

          return new Response(
            JSON.stringify({
              success: true,
              campaignId: body.campaignId,
              campaignName: campaign.name,
              niche: campaign.niche,
              productsQueued: productsToProcess.length,
              products: productsToProcess.map((p) => ({
                id: p.id,
                productName: p.product_name,
                trendNote: p.trend_note,
              })),
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to start pipeline";
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
