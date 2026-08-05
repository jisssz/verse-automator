/**
 * GET /api/n8n/analytics
 *
 * Returns aggregated analytics across all campaigns or a specific campaign.
 * Used by n8n reporting workflows and the analytics dashboard.
 *
 * Query parameters:
 *   campaignId  string   (optional — filter to one campaign)
 *   days        number   (optional — lookback window, default 30, max 365)
 *
 * Response:
 *   {
 *     success,
 *     period: { from, to, days },
 *     summary: { totalCampaigns, totalProducts, totalContentGenerated, totalImagesGenerated, totalPublished },
 *     campaigns: [{ id, name, status, productCount, contentCount, publishedCount }],
 *     recentLogs: [{ event_type, level, message, created_at }]
 *   }
 */
import { createFileRoute } from "@tanstack/react-router";
import { verifyN8nApiKey } from "@/lib/api-key.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/n8n/analytics")({
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
          const rawDays = parseInt(url.searchParams.get("days") ?? "30", 10);
          const days = Math.min(Math.max(rawDays, 1), 365);

          const fromDate = new Date();
          fromDate.setDate(fromDate.getDate() - days);
          const fromISO = fromDate.toISOString();
          const toISO = new Date().toISOString();

          // ── Campaigns ───────────────────────────────────────────────────
          let campaignsQuery = supabaseAdmin
            .from("campaigns")
            .select("id, name, status, created_at, owner_id")
            .gte("created_at", fromISO)
            .order("created_at", { ascending: false });

          if (campaignId) {
            campaignsQuery = campaignsQuery.eq("id", campaignId);
          }

          const { data: campaigns } = await campaignsQuery;

          // ── Products per campaign ────────────────────────────────────────
          const campaignIds = (campaigns ?? []).map((c) => c.id);

          const { data: products } = campaignIds.length
            ? await supabaseAdmin
                .from("campaign_products")
                .select(
                  "id, campaign_id, generated_content(id, image_url), published_pins(id, status)",
                )
                .in("campaign_id", campaignIds)
            : { data: [] };

          // ── Aggregate per-campaign stats ─────────────────────────────────
          const campaignStats = (campaigns ?? []).map((campaign) => {
            const campaignProducts = (products ?? []).filter((p) => p.campaign_id === campaign.id);

            const contentCount = campaignProducts.filter((p) => {
              const c = Array.isArray(p.generated_content)
                ? p.generated_content
                : p.generated_content
                  ? [p.generated_content]
                  : [];
              return c.length > 0;
            }).length;

            const imageCount = campaignProducts.filter((p) => {
              const c = Array.isArray(p.generated_content)
                ? p.generated_content[0]
                : p.generated_content;
              return c && "image_url" in c && c.image_url;
            }).length;

            const publishedCount = campaignProducts.filter((p) => {
              const pin = Array.isArray(p.published_pins) ? p.published_pins[0] : p.published_pins;
              return pin && "status" in pin && pin.status === "published";
            }).length;

            return {
              id: campaign.id,
              name: campaign.name,
              status: campaign.status,
              createdAt: campaign.created_at,
              productCount: campaignProducts.length,
              contentCount,
              imageCount,
              publishedCount,
            };
          });

          // ── Overall summary ──────────────────────────────────────────────
          const totalProducts = (products ?? []).length;
          const totalContentGenerated = (products ?? []).filter((p) => {
            const c = Array.isArray(p.generated_content)
              ? p.generated_content
              : p.generated_content
                ? [p.generated_content]
                : [];
            return c.length > 0;
          }).length;

          const totalImagesGenerated = (products ?? []).filter((p) => {
            const c = Array.isArray(p.generated_content)
              ? p.generated_content[0]
              : p.generated_content;
            return c && "image_url" in c && c.image_url;
          }).length;

          const totalPublished = (products ?? []).filter((p) => {
            const pin = Array.isArray(p.published_pins) ? p.published_pins[0] : p.published_pins;
            return pin && "status" in pin && pin.status === "published";
          }).length;

          // ── Recent automation logs ───────────────────────────────────────
          let logsQuery = supabaseAdmin
            .from("automation_logs")
            .select("id, event_type, level, message, created_at, source_system")
            .gte("created_at", fromISO)
            .order("created_at", { ascending: false })
            .limit(50);

          if (campaignId) {
            // Filter logs by product IDs belonging to this campaign
            const productIds = campaignIds.length
              ? (products ?? []).filter((p) => p.campaign_id === campaignId).map((p) => p.id)
              : [];

            if (productIds.length > 0) {
              logsQuery = logsQuery.in("product_id", productIds);
            }
          }

          const { data: recentLogs } = await logsQuery;

          return new Response(
            JSON.stringify({
              success: true,
              period: {
                from: fromISO,
                to: toISO,
                days,
              },
              summary: {
                totalCampaigns: (campaigns ?? []).length,
                totalProducts,
                totalContentGenerated,
                totalImagesGenerated,
                totalPublished,
                completionRate:
                  totalProducts > 0 ? Math.round((totalPublished / totalProducts) * 100) : 0,
              },
              campaigns: campaignStats,
              recentLogs: (recentLogs ?? []).map((log) => ({
                id: log.id,
                eventType: log.event_type,
                level: log.level,
                message: log.message,
                sourceSystem: log.source_system,
                createdAt: log.created_at,
              })),
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to fetch analytics";
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
