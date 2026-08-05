import { createFileRoute } from "@tanstack/react-router";
import { verifyN8nApiKey } from "@/lib/api-key.server";
import {
  generatePinCopy,
  generateProductResearch,
  generateSeoKeywords,
  generateHashtags,
  generateBlogOutline,
  generateVideoScript,
  generateProductSummary,
  generateComparisonTable,
  generateReview,
} from "@/lib/openai.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type SupportedContentType =
  | "pin_copy"
  | "product_research"
  | "seo_keywords"
  | "hashtags"
  | "blog_outline"
  | "video_script"
  | "product_summary"
  | "comparison_table"
  | "review";

export const Route = createFileRoute("/api/n8n/generate-content")({
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
            productName?: string;
            niche?: string;
            trendNote?: string;
            productId?: string;
            affiliateLinkTemplate?: string;
            competitorName?: string;
            targetKeyword?: string;
            durationSeconds?: number;
            keyBenefits?: string[];
            platform?: "pinterest" | "instagram" | "tiktok";
            contentType?: SupportedContentType;
          };

          if (!body.productName?.trim()) {
            return new Response(
              JSON.stringify({ error: "Missing required parameter 'productName'" }),
              {
                status: 400,
                headers: { "Content-Type": "application/json" },
              },
            );
          }

          const contentType: SupportedContentType = body.contentType ?? "pin_copy";
          let result: Record<string, unknown>;

          switch (contentType) {
            case "pin_copy": {
              const res = await generatePinCopy({
                productName: body.productName,
                ...(body.niche ? { niche: body.niche } : {}),
                ...(body.trendNote ? { trendNote: body.trendNote } : {}),
                ...(body.affiliateLinkTemplate
                  ? { affiliateLinkTemplate: body.affiliateLinkTemplate }
                  : {}),
              });
              result = res;

              if (body.productId) {
                await supabaseAdmin.from("generated_content").upsert(
                  {
                    campaign_product_id: body.productId,
                    product_id: body.productId,
                    headline: res.headline,
                    description: res.description,
                    pinterest_title: res.pinTitle,
                    pin_description: res.pinDescription,
                    affiliate_link: res.affiliateLink || null,
                  },
                  { onConflict: "product_id" },
                );
              }
              break;
            }

            case "product_research": {
              const res = await generateProductResearch({
                productName: body.productName,
                ...(body.niche ? { niche: body.niche } : {}),
                ...(body.trendNote ? { trendNote: body.trendNote } : {}),
              });
              result = res;
              break;
            }

            case "seo_keywords": {
              const res = await generateSeoKeywords({
                productName: body.productName,
                ...(body.niche ? { niche: body.niche } : {}),
              });
              result = res;
              break;
            }

            case "hashtags": {
              const res = await generateHashtags({
                productName: body.productName,
                ...(body.niche ? { niche: body.niche } : {}),
                ...(body.platform ? { platform: body.platform } : {}),
              });
              result = res;
              break;
            }

            case "blog_outline": {
              const res = await generateBlogOutline({
                productName: body.productName,
                ...(body.niche ? { niche: body.niche } : {}),
                ...(body.trendNote ? { trendNote: body.trendNote } : {}),
                ...(body.targetKeyword ? { targetKeyword: body.targetKeyword } : {}),
              });
              result = res;
              break;
            }

            case "video_script": {
              const res = await generateVideoScript({
                productName: body.productName,
                ...(body.niche ? { niche: body.niche } : {}),
                ...(body.trendNote ? { trendNote: body.trendNote } : {}),
                ...(body.durationSeconds ? { durationSeconds: body.durationSeconds } : {}),
              });
              result = res;
              break;
            }

            case "product_summary": {
              const res = await generateProductSummary({
                productName: body.productName,
                ...(body.niche ? { niche: body.niche } : {}),
                ...(body.keyBenefits ? { keyBenefits: body.keyBenefits } : {}),
              });
              result = res;
              break;
            }

            case "comparison_table": {
              const res = await generateComparisonTable({
                productName: body.productName,
                ...(body.niche ? { niche: body.niche } : {}),
                ...(body.competitorName ? { competitorName: body.competitorName } : {}),
              });
              result = res;
              break;
            }

            case "review": {
              const res = await generateReview({
                productName: body.productName,
                ...(body.niche ? { niche: body.niche } : {}),
                ...(body.trendNote ? { trendNote: body.trendNote } : {}),
              });
              result = res;
              break;
            }

            default: {
              const exhaustiveCheck: never = contentType;
              return new Response(
                JSON.stringify({ error: `Unsupported contentType: ${exhaustiveCheck}` }),
                { status: 400, headers: { "Content-Type": "application/json" } },
              );
            }
          }

          await supabaseAdmin.from("automation_logs").insert({
            source_system: "n8n_webhook",
            event_type: "n8n_generate_content",
            level: "info",
            message: `n8n webhook generated '${contentType}' for '${body.productName}'`,
            details: {
              productName: body.productName,
              productId: body.productId || null,
              contentType,
            },
          });

          return new Response(
            JSON.stringify({
              success: true,
              contentType,
              ...result,
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to generate content";
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
