import { createFileRoute } from "@tanstack/react-router";
import { verifyN8nApiKey } from "@/lib/api-key.server";
import { publishPinToPinterest } from "@/lib/pinterest.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Json } from "@/integrations/supabase/types";

export const Route = createFileRoute("/api/n8n/publish-pin")({
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
            boardId?: string;
            boardName?: string;
            title?: string;
            description?: string;
            imageUrl?: string;
            link?: string;
          };

          let title = body.title;
          let description = body.description;
          let imageUrl = body.imageUrl;
          let link = body.link;

          if (body.productId && (!title || !imageUrl)) {
            const { data: product } = await supabaseAdmin
              .from("campaign_products")
              .select("product_name, generated_content(*)")
              .eq("id", body.productId)
              .single();

            if (product) {
              const content = Array.isArray(product.generated_content)
                ? product.generated_content[0]
                : product.generated_content;
              if (content) {
                title =
                  title || content.pinterest_title || content.headline || product.product_name;
                description =
                  description || content.pin_description || content.description || title;
                imageUrl = imageUrl || content.image_url || undefined;
                link = link || content.affiliate_link || undefined;
              }
            }
          }

          if (!title || !imageUrl) {
            return new Response(
              JSON.stringify({ error: "Missing required fields 'title' or 'imageUrl'" }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
          }

          const publishResult = await publishPinToPinterest({
            title,
            description: description || title,
            ...(link ? { link } : {}),
            imageUrl,
            ...(body.boardId ? { boardId: body.boardId } : {}),
          });

          if (body.productId) {
            await supabaseAdmin.from("published_pins").upsert(
              {
                product_id: body.productId,
                pinterest_pin_id: publishResult.pinId,
                pin_url: publishResult.pinUrl,
                published_at: new Date().toISOString(),
                status: "published",
                board_id: publishResult.boardId,
                board_name: body.boardName || "Pinterest Board",
                request_payload: publishResult.requestPayload as unknown as Json,
                response_payload: publishResult.responsePayload as unknown as Json,
                error_message: null,
              },
              { onConflict: "product_id" },
            );
          }

          await supabaseAdmin.from("automation_logs").insert({
            source_system: "n8n_webhook",
            event_type: "n8n_publish_pin",
            level: "info",
            message: `n8n webhook published pin '${title}'`,
            details: {
              pinId: publishResult.pinId,
              pinUrl: publishResult.pinUrl,
              productId: body.productId || null,
            },
          });

          return new Response(
            JSON.stringify({
              success: true,
              pinId: publishResult.pinId,
              pinUrl: publishResult.pinUrl,
              publishedAt: new Date().toISOString(),
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : "Publishing pin failed";
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
