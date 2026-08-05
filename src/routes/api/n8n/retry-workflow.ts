import { createFileRoute } from "@tanstack/react-router";
import { verifyN8nApiKey } from "@/lib/api-key.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { generatePinCopy, generateImagePrompt } from "@/lib/openai.server";
import { publishPinToPinterest } from "@/lib/pinterest.server";
import type { Json } from "@/integrations/supabase/types";

export const Route = createFileRoute("/api/n8n/retry-workflow")({
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
            workflowStep?: "content" | "image" | "publish" | "all";
          };

          if (!body.productId) {
            return new Response(
              JSON.stringify({ error: "Missing required parameter 'productId'" }),
              {
                status: 400,
                headers: { "Content-Type": "application/json" },
              },
            );
          }

          const step = body.workflowStep || "all";

          const { data: product, error: productErr } = await supabaseAdmin
            .from("campaign_products")
            .select(
              "id, product_name, trend_note, campaign_id, generated_content(*), campaigns(niche)",
            )
            .eq("id", body.productId)
            .single();

          if (productErr || !product) {
            return new Response(JSON.stringify({ error: "Product not found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }

          const niche = (product.campaigns as { niche?: string } | null)?.niche || undefined;
          let contentObj = Array.isArray(product.generated_content)
            ? product.generated_content[0]
            : product.generated_content;

          // Retry Copy Content Generation
          if (step === "content" || step === "all") {
            const copyRes = await generatePinCopy({
              productName: product.product_name,
              ...(product.trend_note ? { trendNote: product.trend_note } : {}),
              ...(niche ? { niche } : {}),
            });

            await supabaseAdmin.from("generated_content").upsert(
              {
                campaign_product_id: product.id,
                product_id: product.id,
                headline: copyRes.headline,
                description: copyRes.description,
                pinterest_title: copyRes.pinTitle,
                pin_description: copyRes.pinDescription,
                affiliate_link: copyRes.affiliateLink || null,
              },
              { onConflict: "product_id" },
            );
            contentObj = { ...contentObj, ...copyRes };
          }

          // Retry Image Prompt Generation
          if (step === "image" || step === "all") {
            const imgRes = await generateImagePrompt({
              productName: product.product_name,
              ...(product.trend_note ? { trendNote: product.trend_note } : {}),
              ...(niche ? { niche } : {}),
              ...(contentObj?.headline ? { headline: contentObj.headline } : {}),
            });

            await supabaseAdmin.from("generated_content").upsert(
              {
                campaign_product_id: product.id,
                product_id: product.id,
                image_prompt: imgRes.imagePrompt,
              },
              { onConflict: "product_id" },
            );
          }

          // Retry Pinterest Publishing
          if (step === "publish" || step === "all") {
            const title =
              contentObj?.pinterest_title || contentObj?.headline || product.product_name;
            const description = contentObj?.pin_description || contentObj?.description || title;
            const imageUrl =
              contentObj?.image_url ||
              "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800";

            const pubResult = await publishPinToPinterest({
              title,
              description,
              ...(contentObj?.affiliate_link ? { link: contentObj.affiliate_link } : {}),
              imageUrl,
            });

            await supabaseAdmin.from("published_pins").upsert(
              {
                product_id: product.id,
                pinterest_pin_id: pubResult.pinId,
                pin_url: pubResult.pinUrl,
                published_at: new Date().toISOString(),
                status: "published",
                board_id: pubResult.boardId,
                board_name: "Pinterest Board",
                request_payload: pubResult.requestPayload as unknown as Json,
                response_payload: pubResult.responsePayload as unknown as Json,
                error_message: null,
              },
              { onConflict: "product_id" },
            );
          }

          await supabaseAdmin.from("automation_logs").insert({
            source_system: "n8n_webhook",
            event_type: "n8n_retry_workflow",
            level: "info",
            message: `n8n webhook retried step '${step}' for product '${product.product_name}'`,
            details: {
              productId: product.id,
              step,
            },
          });

          return new Response(
            JSON.stringify({
              success: true,
              message: `Successfully retried '${step}' workflow for product '${product.product_name}'`,
              productId: product.id,
              step,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : "Retry workflow failed";
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
