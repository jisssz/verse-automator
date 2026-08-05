/**
 * POST /api/n8n/generate
 *
 * Generic content generation endpoint for n8n. Wraps all content types
 * in a single endpoint without database writes (pure generation). Intended
 * for use in n8n nodes that need flexible AI generation before deciding
 * what to save.
 *
 * Request body:
 *   type          SupportedType   (required — see types below)
 *   productName   string          (required)
 *   niche         string          (optional)
 *   trendNote     string          (optional)
 *   [typeSpecificFields]
 *
 * Response:
 *   { success: true, type, result: <generated content> }
 */
import { createFileRoute } from "@tanstack/react-router";
import { verifyN8nApiKey } from "@/lib/api-key.server";
import {
  generatePinCopy,
  generateImagePrompt,
  generateTrendIdeas,
  generateProductResearch,
  generateSeoKeywords,
  generateHashtags,
  generateBlogOutline,
  generateVideoScript,
  generateProductSummary,
  generateComparisonTable,
  generateReview,
} from "@/lib/openai.server";
import { generateDailyVerseContent } from "@/lib/daily-verse-engine";

type SupportedType =
  | "pin_copy"
  | "image_prompt"
  | "trend_ideas"
  | "daily_verse"
  | "product_research"
  | "seo_keywords"
  | "hashtags"
  | "blog_outline"
  | "video_script"
  | "product_summary"
  | "comparison_table"
  | "review";

export const Route = createFileRoute("/api/n8n/generate")({
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
            type?: SupportedType;
            productName?: string;
            niche?: string;
            trendNote?: string;
            headline?: string;
            count?: number;
            productCategory?: string;
            affiliateLinkTemplate?: string;
            competitorName?: string;
            targetKeyword?: string;
            durationSeconds?: number;
            keyBenefits?: string[];
            platform?: "pinterest" | "instagram" | "tiktok";
          };

          if (!body.type) {
            return new Response(
              JSON.stringify({
                error:
                  "Missing required parameter 'type'. Supported: pin_copy, image_prompt, trend_ideas, daily_verse, product_research, seo_keywords, hashtags, blog_outline, video_script, product_summary, comparison_table, review",
              }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
          }

          if (
            body.type !== "trend_ideas" &&
            body.type !== "daily_verse" &&
            !body.productName?.trim()
          ) {
            return new Response(
              JSON.stringify({ error: "Missing required parameter 'productName'" }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
          }

          let result: unknown;

          switch (body.type) {
            case "pin_copy":
              result = await generatePinCopy({
                productName: body.productName!,
                ...(body.niche ? { niche: body.niche } : {}),
                ...(body.trendNote ? { trendNote: body.trendNote } : {}),
                ...(body.affiliateLinkTemplate
                  ? { affiliateLinkTemplate: body.affiliateLinkTemplate }
                  : {}),
              });
              break;

            case "image_prompt":
              result = await generateImagePrompt({
                productName: body.productName!,
                ...(body.niche ? { niche: body.niche } : {}),
                ...(body.trendNote ? { trendNote: body.trendNote } : {}),
                ...(body.headline ? { headline: body.headline } : {}),
              });
              break;

            case "trend_ideas": {
              if (!body.niche?.trim()) {
                return new Response(
                  JSON.stringify({ error: "Missing required parameter 'niche' for trend_ideas" }),
                  { status: 400, headers: { "Content-Type": "application/json" } },
                );
              }
              result = await generateTrendIdeas({
                niche: body.niche,
                count: Math.min(body.count ?? 10, 30),
              });
              break;
            }

            case "daily_verse": {
              if (!body.productName?.trim() || !body.productCategory?.trim()) {
                return new Response(
                  JSON.stringify({
                    error: "Missing 'productName' or 'productCategory' for daily_verse",
                  }),
                  { status: 400, headers: { "Content-Type": "application/json" } },
                );
              }
              result = await generateDailyVerseContent({
                productName: body.productName,
                productCategory: body.productCategory,
              });
              break;
            }

            case "product_research":
              result = await generateProductResearch({
                productName: body.productName!,
                ...(body.niche ? { niche: body.niche } : {}),
                ...(body.trendNote ? { trendNote: body.trendNote } : {}),
              });
              break;

            case "seo_keywords":
              result = await generateSeoKeywords({
                productName: body.productName!,
                ...(body.niche ? { niche: body.niche } : {}),
              });
              break;

            case "hashtags":
              result = await generateHashtags({
                productName: body.productName!,
                ...(body.niche ? { niche: body.niche } : {}),
                ...(body.platform ? { platform: body.platform } : {}),
              });
              break;

            case "blog_outline":
              result = await generateBlogOutline({
                productName: body.productName!,
                ...(body.niche ? { niche: body.niche } : {}),
                ...(body.trendNote ? { trendNote: body.trendNote } : {}),
                ...(body.targetKeyword ? { targetKeyword: body.targetKeyword } : {}),
              });
              break;

            case "video_script":
              result = await generateVideoScript({
                productName: body.productName!,
                ...(body.niche ? { niche: body.niche } : {}),
                ...(body.trendNote ? { trendNote: body.trendNote } : {}),
                ...(body.durationSeconds ? { durationSeconds: body.durationSeconds } : {}),
              });
              break;

            case "product_summary":
              result = await generateProductSummary({
                productName: body.productName!,
                ...(body.niche ? { niche: body.niche } : {}),
                ...(body.keyBenefits ? { keyBenefits: body.keyBenefits } : {}),
              });
              break;

            case "comparison_table":
              result = await generateComparisonTable({
                productName: body.productName!,
                ...(body.niche ? { niche: body.niche } : {}),
                ...(body.competitorName ? { competitorName: body.competitorName } : {}),
              });
              break;

            case "review":
              result = await generateReview({
                productName: body.productName!,
                ...(body.niche ? { niche: body.niche } : {}),
                ...(body.trendNote ? { trendNote: body.trendNote } : {}),
              });
              break;

            default: {
              const exhaustiveCheck: never = body.type;
              return new Response(
                JSON.stringify({ error: `Unsupported type: ${exhaustiveCheck}` }),
                { status: 400, headers: { "Content-Type": "application/json" } },
              );
            }
          }

          return new Response(
            JSON.stringify({
              success: true,
              type: body.type,
              result,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : "Generation failed";
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
