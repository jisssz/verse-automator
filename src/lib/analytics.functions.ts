import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface AnalyticsMetrics {
  campaignsCount: number;
  productsCount: number;
  generatedCount: number;
  publishedCount: number;
  errorsCount: number;
  successRate: number;
  activityBreakdown: Array<{ name: string; count: number }>;
  automationLogs: Array<{
    id: string;
    source_system: string | null;
    event_type: string;
    level: string;
    message: string;
    created_at: string;
  }>;
}

export const getAnalyticsMetricsServer = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AnalyticsMetrics> => {
    const { supabase, userId } = context;

    // 1. Fetch campaigns count
    const { count: campaignsCount } = await supabase
      .from("campaigns")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", userId);

    // 2. Fetch campaign products
    const { data: campaignProducts } = await supabase
      .from("campaign_products")
      .select(
        "id, product_name, created_at, generated_content(*), published_pins(*), campaigns!inner(owner_id)",
      )
      .eq("campaigns.owner_id", userId);

    const products = campaignProducts || [];
    const productsCount = products.length;

    let generatedCount = 0;
    let publishedCount = 0;
    let errorsCount = 0;

    for (const p of products) {
      const content = Array.isArray(p.generated_content)
        ? p.generated_content[0]
        : p.generated_content;
      const pub = Array.isArray(p.published_pins) ? p.published_pins[0] : p.published_pins;

      if (content && (content.headline || content.image_url)) {
        generatedCount += 1;
      }

      if (pub) {
        if (pub.status === "published") publishedCount += 1;
        if (pub.status === "failed") errorsCount += 1;
      }
    }

    const completedOrPublished = generatedCount + publishedCount;
    const successRate =
      productsCount > 0
        ? Math.min(100, Math.round((completedOrPublished / (productsCount * 2 || 1)) * 100))
        : 100;

    const activityBreakdown = [
      { name: "Total Products", count: productsCount },
      { name: "Generated", count: generatedCount },
      { name: "Published", count: publishedCount },
      { name: "Failed", count: errorsCount },
    ];

    // 3. Fetch automation logs
    const { data: logsData } = await supabase
      .from("automation_logs")
      .select("id, source_system, event_type, level, message, created_at")
      .order("created_at", { ascending: false })
      .limit(15);

    return {
      campaignsCount: campaignsCount || 0,
      productsCount,
      generatedCount,
      publishedCount,
      errorsCount,
      successRate,
      activityBreakdown,
      automationLogs: logsData || [],
    };
  });
