import { createFileRoute } from "@tanstack/react-router";
import { verifyN8nApiKey } from "@/lib/api-key.server";
import { generateImagePrompt } from "@/lib/openai.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/n8n/generate-image")({
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
            headline?: string;
            productId?: string;
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

          const promptResult = await generateImagePrompt({
            productName: body.productName,
            ...(body.niche ? { niche: body.niche } : {}),
            ...(body.trendNote ? { trendNote: body.trendNote } : {}),
            ...(body.headline ? { headline: body.headline } : {}),
          });

          if (body.productId) {
            await supabaseAdmin.from("generated_content").upsert(
              {
                campaign_product_id: body.productId,
                product_id: body.productId,
                image_prompt: promptResult.imagePrompt,
              },
              { onConflict: "product_id" },
            );
          }

          await supabaseAdmin.from("automation_logs").insert({
            source_system: "n8n_webhook",
            event_type: "n8n_generate_image_prompt",
            level: "info",
            message: `n8n webhook generated image prompt for '${body.productName}'`,
            details: {
              productName: body.productName,
              productId: body.productId || null,
            },
          });

          return new Response(
            JSON.stringify({
              success: true,
              imagePrompt: promptResult.imagePrompt,
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to generate image prompt";
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
