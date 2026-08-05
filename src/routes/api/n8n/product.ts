/**
 * POST /api/n8n/product
 *
 * Returns a single campaign product's full data including any generated content
 * and published pin. Used by n8n to inspect a product's current state before
 * deciding which pipeline steps to run.
 *
 * Request body:
 *   productId  string  (required)
 *
 * Response:
 *   { success, product: { id, productName, trendNote, generatedContent, publishedPin } }
 */
import { createFileRoute } from "@tanstack/react-router";
import { verifyN8nApiKey } from "@/lib/api-key.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/n8n/product")({
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
            productId?: string;
          };

          if (!body.productId?.trim()) {
            return new Response(
              JSON.stringify({ error: "Missing required parameter 'productId'" }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
          }

          const { data: product, error } = await supabaseAdmin
            .from("campaign_products")
            .select(
              "id, product_name, trend_note, source_url, position, campaign_id, generated_content(*), published_pins(*), campaigns(id, name, niche, owner_id, status)",
            )
            .eq("id", body.productId)
            .single();

          if (error || !product) {
            return new Response(JSON.stringify({ error: "Product not found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }

          const generatedContent = Array.isArray(product.generated_content)
            ? product.generated_content[0]
            : product.generated_content;

          const publishedPin = Array.isArray(product.published_pins)
            ? product.published_pins[0]
            : product.published_pins;

          const campaign = Array.isArray(product.campaigns)
            ? product.campaigns[0]
            : product.campaigns;

          // Determine which steps still need to run
          const needsContent = !generatedContent?.headline;
          const needsImagePrompt = !generatedContent?.image_prompt;
          const needsImage = !generatedContent?.image_url;
          const needsPublish = !publishedPin?.pinterest_pin_id;

          return new Response(
            JSON.stringify({
              success: true,
              product: {
                id: product.id,
                productName: product.product_name,
                trendNote: product.trend_note,
                sourceUrl: product.source_url,
                position: product.position,
                campaignId: product.campaign_id,
                campaign: campaign
                  ? {
                      id: campaign.id,
                      name: campaign.name,
                      niche: campaign.niche,
                      status: campaign.status,
                    }
                  : null,
              },
              generatedContent: generatedContent ?? null,
              publishedPin: publishedPin ?? null,
              pipelineStatus: {
                needsContent,
                needsImagePrompt,
                needsImage,
                needsPublish,
                isComplete: !needsContent && !needsImagePrompt && !needsImage && !needsPublish,
              },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to fetch product";
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
