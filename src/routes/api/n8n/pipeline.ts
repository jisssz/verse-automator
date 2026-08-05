/**
 * POST /api/n8n/pipeline
 *
 * Full End-to-End Automation Pipeline endpoint for n8n.
 *
 * Workflow executed sequentially:
 *   1. Import Products from Google Sheets (or process specified product name)
 *   2. Generate AI Content (Headline, Description, Pinterest Title, Pin Description, Affiliate Link)
 *   3. Generate AI Image (Image Prompt & Image URL via OpenAI)
 *   4. Save to Supabase (products, campaign_products, generated_content)
 *   5. Create Pinterest Job in queue
 *   6. Publish Pin (executes pin job)
 *   7. Update Google Sheet with generated copy, publish status, and Pinterest pin URL
 *   8. Log Analytics to automation_logs
 *
 * Headers:
 *   x-api-key or Authorization: Bearer <key>
 *
 * Body parameters:
 *   productName          string  (optional if sourceSheetName provided)
 *   productCategory      string  (optional)
 *   trendNote            string  (optional)
 *   sourceSheetName      string  (optional — default: "Products")
 *   targetSheetName      string  (optional — default: "Pipeline Export")
 *   campaignId           string  (optional)
 *   userId               string  (optional — default: demo user)
 *   boardId              string  (optional)
 */
import crypto from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";
import { verifyN8nApiKey } from "@/lib/api-key.server";
import {
  importProductsFromGoogleSheets,
  appendGoogleSheetValues,
} from "@/lib/google-sheets.server";
import { generatePinCopy, generateImagePrompt, generateImageFromPrompt } from "@/lib/openai.server";
import { createPinJob, processPinJob } from "@/lib/pin-jobs.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const DEMO_USER_ID = "00000000-0000-0000-0000-000000000000";

export const Route = createFileRoute("/api/n8n/pipeline")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = verifyN8nApiKey(request);
        if (!auth.authorized) {
          return new Response(JSON.stringify({ status: "unauthorized", error: auth.reason }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const body = (await request.json().catch(() => ({}))) as {
          productName?: string;
          productCategory?: string;
          trendNote?: string;
          sourceSheetName?: string;
          targetSheetName?: string;
          campaignId?: string;
          userId?: string;
          boardId?: string;
        };

        const userId = body.userId || DEMO_USER_ID;
        const pipelineId = `pipe_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const stepsCompleted: string[] = [];

        try {
          // STEP 1: Import / Read Product
          let productName = body.productName;
          const productCategory = body.productCategory || "Skincare & Beauty";
          const trendNote = body.trendNote || "Luxury skincare trend";

          if (!productName && body.sourceSheetName) {
            const importRes = await importProductsFromGoogleSheets({
              ownerId: userId,
              campaignId: body.campaignId,
              sourceSheetName: body.sourceSheetName,
            });
            stepsCompleted.push(
              `Imported ${importRes.inserted} products from Google Sheet '${body.sourceSheetName}'`,
            );
          }

          if (!productName) {
            // Default product if none specified
            productName = "Hydrating Hyaluronic Acid Serum";
          }
          stepsCompleted.push(`Product Selected: ${productName}`);

          // STEP 2: Generate AI Text Content
          const pinCopy = await generatePinCopy({
            productName,
            trendNote,
            niche: productCategory,
          });
          stepsCompleted.push("Generated AI Copy (Headline, Pin Title, Pin Description)");

          // STEP 3: Generate AI Image
          const imagePromptRes = await generateImagePrompt({
            productName,
            trendNote,
            niche: productCategory,
            headline: pinCopy.headline,
          });

          const imageUrl = await generateImageFromPrompt({
            prompt: imagePromptRes.imagePrompt,
            quality: "standard",
            aspectRatio: "2:3",
          });
          stepsCompleted.push("Generated AI Image via OpenAI DALL-E");

          // STEP 4: Save to Supabase
          const sourceHash = crypto
            .createHash("sha256")
            .update(`${userId}|n8n_pipeline|${productName}|${Date.now()}`)
            .digest("hex");

          const { data: productRow } = await supabaseAdmin
            .from("products")
            .upsert(
              {
                owner_id: userId,
                campaign_id: body.campaignId || null,
                source_system: "n8n_pipeline",
                source_spreadsheet_id: "n8n_pipeline",
                source_sheet_name: body.sourceSheetName || "Pipeline",
                source_row_number: 1,
                source_hash: sourceHash,
                product_name: productName,
                product_category: productCategory,
                trend_note: trendNote,
                status: "completed",
              },
              { onConflict: "owner_id,source_system,source_hash" },
            )
            .select("id")
            .single();

          const productId = productRow?.id || crypto.randomUUID();

          let campaignProductId = productId;
          if (body.campaignId) {
            const { data: cpRow } = await supabaseAdmin
              .from("campaign_products")
              .insert({
                campaign_id: body.campaignId,
                product_name: productName,
                trend_note: trendNote,
              })
              .select("id")
              .single();
            if (cpRow) campaignProductId = cpRow.id;
          }

          await supabaseAdmin.from("generated_content").insert({
            product_id: campaignProductId,
            headline: pinCopy.headline,
            description: pinCopy.description,
            pinterest_title: pinCopy.pinTitle,
            pin_description: pinCopy.pinDescription,
            affiliate_link: pinCopy.affiliateLink,
            image_prompt: imagePromptRes.imagePrompt,
            image_url: imageUrl,
          });
          stepsCompleted.push("Saved product & generated assets to Supabase");

          // STEP 5: Create Pinterest Job
          const job = await createPinJob(userId, {
            productId,
            boardId: body.boardId,
            title: pinCopy.pinTitle,
            description: pinCopy.pinDescription,
            imageUrl,
            link: pinCopy.affiliateLink || undefined,
          });
          stepsCompleted.push(`Created Pinterest job #${job.id}`);

          // STEP 6: Publish Pin
          const publishRes = await processPinJob(job.id);
          stepsCompleted.push(
            `Published Pin — Status: ${publishRes.status}, Pin URL: ${publishRes.pinUrl || "N/A"}`,
          );

          // STEP 7: Update Google Sheet
          const targetSheet = body.targetSheetName || "Pipeline Export";
          try {
            await appendGoogleSheetValues(`${targetSheet}!A1`, [
              [
                productName,
                pinCopy.headline,
                pinCopy.pinTitle,
                pinCopy.pinDescription,
                imageUrl,
                publishRes.status,
                publishRes.pinUrl || "",
                new Date().toISOString(),
              ],
            ]);
            stepsCompleted.push(`Updated Google Sheet '${targetSheet}' with published pin URL`);
          } catch (sheetErr) {
            stepsCompleted.push(
              `Google Sheet update skipped: ${sheetErr instanceof Error ? sheetErr.message : "Not configured"}`,
            );
          }

          // STEP 8: Log Analytics & Audit Event
          await supabaseAdmin.from("automation_logs").insert({
            product_id: productId,
            source_system: "n8n_pipeline",
            event_type: "n8n_pipeline_completed",
            level: "info",
            message: `n8n pipeline '${pipelineId}' completed end-to-end for '${productName}'`,
            details: {
              pipelineId,
              productId,
              jobId: job.id,
              publishStatus: publishRes.status,
              pinUrl: publishRes.pinUrl || null,
              stepsCompleted,
            },
          });

          return new Response(
            JSON.stringify({
              success: true,
              pipelineId,
              productName,
              headline: pinCopy.headline,
              pinTitle: pinCopy.pinTitle,
              pinDescription: pinCopy.pinDescription,
              imageUrl,
              jobId: job.id,
              publishStatus: publishRes.status,
              pinUrl: publishRes.pinUrl || null,
              stepsCompleted,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : "Pipeline execution failed";

          await supabaseAdmin.from("automation_logs").insert({
            source_system: "n8n_pipeline",
            event_type: "n8n_pipeline_failed",
            level: "error",
            message: `n8n pipeline '${pipelineId}' failed: ${message}`,
            details: { pipelineId, error: message, stepsCompleted },
          });

          return new Response(
            JSON.stringify({
              success: false,
              pipelineId,
              error: message,
              stepsCompleted,
            }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
