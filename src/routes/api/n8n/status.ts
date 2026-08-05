/**
 * GET /api/n8n/status
 *
 * Returns the current processing status for a campaign or a single product.
 * Used by n8n to poll progress and determine when to stop a loop node.
 *
 * Query parameters:
 *   campaignId  string  (optional — returns campaign-level stats)
 *   productId   string  (optional — returns single product status)
 *
 * Response (campaign):
 *   { success, campaignId, status, counts: { total, withContent, withImage, published, remaining } }
 *
 * Response (product):
 *   { success, productId, pipelineStatus: { needsContent, needsImage, needsPublish, isComplete } }
 */
import { createFileRoute } from "@tanstack/react-router";
import { verifyN8nApiKey } from "@/lib/api-key.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/n8n/status")({
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
          const url = new URL(request.url);
          const campaignId = url.searchParams.get("campaignId");
          const productId = url.searchParams.get("productId");

          if (!campaignId && !productId) {
            return new Response(
              JSON.stringify({
                error: "Provide 'campaignId' or 'productId' as a query parameter",
              }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
          }

          // ── Single product status ────────────────────────────────────────
          if (productId) {
            const { data: product, error } = await supabaseAdmin
              .from("campaign_products")
              .select(
                "id, product_name, generated_content(id, headline, image_url), published_pins(id, pinterest_pin_id, status)",
              )
              .eq("id", productId)
              .single();

            if (error || !product) {
              return new Response(JSON.stringify({ error: "Product not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
              });
            }

            const content = Array.isArray(product.generated_content)
              ? product.generated_content[0]
              : product.generated_content;
            const pin = Array.isArray(product.published_pins)
              ? product.published_pins[0]
              : product.published_pins;

            const needsContent = !content?.headline;
            const needsImage = !content?.image_url;
            const needsPublish = !pin?.pinterest_pin_id;

            return new Response(
              JSON.stringify({
                success: true,
                productId,
                productName: product.product_name,
                pipelineStatus: {
                  needsContent,
                  needsImage,
                  needsPublish,
                  isComplete: !needsContent && !needsImage && !needsPublish,
                },
              }),
              { status: 200, headers: { "Content-Type": "application/json" } },
            );
          }

          // ── Campaign-level status ────────────────────────────────────────
          const { data: campaign, error: campaignError } = await supabaseAdmin
            .from("campaigns")
            .select("id, name, status")
            .eq("id", campaignId!)
            .single();

          if (campaignError || !campaign) {
            return new Response(JSON.stringify({ error: "Campaign not found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }

          // Count all products
          const { count: totalCount } = await supabaseAdmin
            .from("campaign_products")
            .select("*", { count: "exact", head: true })
            .eq("campaign_id", campaignId!);

          // Count products with content
          const { count: withContentCount } = await supabaseAdmin
            .from("campaign_products")
            .select("generated_content!inner(id)", { count: "exact", head: true })
            .eq("campaign_id", campaignId!);

          // Count products with images
          const { count: withImageCount } = await supabaseAdmin
            .from("campaign_products")
            .select("generated_content!inner(image_url)", { count: "exact", head: true })
            .eq("campaign_id", campaignId!)
            .not("generated_content.image_url", "is", null);

          // Count published pins
          const { count: publishedCount } = await supabaseAdmin
            .from("campaign_products")
            .select("published_pins!inner(id)", { count: "exact", head: true })
            .eq("campaign_id", campaignId!);

          const total = totalCount ?? 0;
          const withContent = withContentCount ?? 0;
          const withImage = withImageCount ?? 0;
          const published = publishedCount ?? 0;
          const remaining = total - published;

          // Auto-update campaign status when all products are published
          if (remaining === 0 && total > 0 && campaign.status !== "published") {
            await supabaseAdmin
              .from("campaigns")
              .update({ status: "published" })
              .eq("id", campaignId!);
          }

          return new Response(
            JSON.stringify({
              success: true,
              campaignId,
              campaignName: campaign.name,
              status: remaining === 0 && total > 0 ? "published" : campaign.status,
              isComplete: remaining === 0 && total > 0,
              counts: {
                total,
                withContent,
                withImage,
                published,
                remaining,
              },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to fetch status";
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
