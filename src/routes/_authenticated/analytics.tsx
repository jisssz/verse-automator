import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { PageLayout } from "@/components/layout/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, Activity, Pin, Sparkles, DollarSign, Crown } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { getAnalyticsMetricsServer } from "@/lib/analytics.functions";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Affiliate & AI Analytics — DailyVerse AI" },
      {
        name: "description",
        content: "Review OpenAI costs, Pinterest activity, and campaign conversion rates.",
      },
    ],
  }),
  component: AnalyticsPage,
});

const LUXURY_COLORS = ["#1E4734", "#C8A96A", "#355E4D", "#D4AF37", "#666666"];

function AnalyticsPage() {
  const getAnalyticsFn = useServerFn(getAnalyticsMetricsServer);

  const { data: metrics, isLoading } = useQuery({
    queryKey: ["analytics-metrics"],
    queryFn: () => getAnalyticsFn(),
  });

  if (isLoading || !metrics) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F6F2]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1E4734]" />
      </div>
    );
  }

  // Calculate estimated OpenAI usage cost
  const openAiTextCost = metrics.generatedCount * 0.0015; // GPT-4o approx cost per copy
  const openAiImageCost = metrics.generatedCount * 0.03; // DALL-E 3 standard cost per image
  const totalOpenAiCost = openAiTextCost + openAiImageCost;

  // Pie chart data for costs
  const costBreakdownData = [
    { name: "GPT Copywriter", value: Number(openAiTextCost.toFixed(4)) },
    { name: "DALL-E 3 Image", value: Number(openAiImageCost.toFixed(4)) },
  ];

  // Bar chart data for activity distribution
  const activityData = [
    { name: "Campaigns", count: metrics.campaignsCount },
    { name: "Products", count: metrics.productsCount },
    { name: "AI Content", count: metrics.generatedCount },
    { name: "Published Pins", count: metrics.publishedCount },
  ];

  return (
    <PageLayout contentClassName="max-w-6xl space-y-6 p-6 md:p-8 bg-[#F8F6F2]">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-[#E7E2D9] shadow-xs">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-[#222222]">
            Affiliate Analytics & Usage
          </h1>
          <p className="text-xs text-[#666666] mt-0.5">
            Monitor Pinterest publish rates, active campaigns, and estimated OpenAI API expenses.
          </p>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Campaigns Count */}
        <Card className="luxury-card border-[#E7E2D9]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#666666] uppercase tracking-wider">
              Total Campaigns
            </CardTitle>
            <div className="p-2 rounded-lg bg-[#1E4734]/10 text-[#1E4734]">
              <Crown className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-serif text-3xl font-bold text-[#222222]">
              {metrics.campaignsCount}
            </div>
            <p className="text-xs text-[#666666] mt-1">Active beauty theme campaigns</p>
          </CardContent>
        </Card>

        {/* AI Generations */}
        <Card className="luxury-card border-[#E7E2D9]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#666666] uppercase tracking-wider">
              AI Generations
            </CardTitle>
            <div className="p-2 rounded-lg bg-[#C8A96A]/10 text-[#C8A96A]">
              <Sparkles className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-serif text-3xl font-bold text-[#222222]">
              {metrics.generatedCount}
            </div>
            <p className="text-xs text-[#666666] mt-1">Copy and image renders</p>
          </CardContent>
        </Card>

        {/* Published Pins */}
        <Card className="luxury-card border-[#E7E2D9]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#666666] uppercase tracking-wider">
              Published Pins
            </CardTitle>
            <div className="p-2 rounded-lg bg-[#2E7D32]/10 text-[#2E7D32]">
              <Pin className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-serif text-3xl font-bold text-[#222222]">
              {metrics.publishedCount}
            </div>
            <p className="text-xs text-[#666666] mt-1">Active on Pinterest boards</p>
          </CardContent>
        </Card>

        {/* API Cost Tracker */}
        <Card className="luxury-card border-[#E7E2D9]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#666666] uppercase tracking-wider">
              OpenAI API Cost
            </CardTitle>
            <div className="p-2 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37]">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-serif text-3xl font-bold text-[#1E4734]">
              ${totalOpenAiCost.toFixed(2)}
            </div>
            <p className="text-xs text-[#666666] mt-1">Estimated token & DALL-E expense</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Activity Distribution */}
        <Card className="luxury-card border-[#E7E2D9]">
          <CardHeader>
            <CardTitle className="font-serif text-lg text-[#222222]">
              Distribution Breakdown
            </CardTitle>
            <p className="text-xs text-[#666666]">
              Overview of pipeline stages across all campaigns.
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityData}>
                  <XAxis dataKey="name" stroke="#666666" fontSize={11} tickLine={false} />
                  <YAxis stroke="#666666" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#E7E2D9",
                      borderRadius: "8px",
                    }}
                    itemStyle={{ color: "#222222", fontSize: "12px" }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {LUXURY_COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* OpenAI Cost Breakdown */}
        <Card className="luxury-card border-[#E7E2D9]">
          <CardHeader>
            <CardTitle className="font-serif text-lg text-[#222222]">OpenAI Cost Shares</CardTitle>
            <p className="text-xs text-[#666666]">
              Proportional costs split between text generation and DALL-E 3 image rendering.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <div className="h-60 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={costBreakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {costBreakdownData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={LUXURY_COLORS[index % LUXURY_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `$${Number(value).toFixed(4)}`}
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#E7E2D9",
                      borderRadius: "8px",
                    }}
                    itemStyle={{ color: "#222222", fontSize: "12px" }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{ fontSize: "11px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Realtime logs */}
      <Card className="luxury-card border-[#E7E2D9]">
        <CardHeader className="pb-3 border-b border-[#E7E2D9] flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-serif text-lg text-[#222222]">Recent System Logs</CardTitle>
            <p className="text-xs text-[#666666]">
              Automation events and execution logs from Google Sheets, OpenAI, and Pinterest.
            </p>
          </div>
          <Activity className="h-4 w-4 text-[#C8A96A]" />
        </CardHeader>
        <CardContent className="pt-4">
          {metrics.automationLogs.length === 0 ? (
            <p className="text-xs text-center text-[#666666]/60 py-6">
              No recent automation logs found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-[#222222]">
                <thead className="text-[10px] text-[#666666] uppercase bg-[#E7E2D9]/30">
                  <tr>
                    <th className="px-4 py-2">Timestamp</th>
                    <th className="px-4 py-2">System</th>
                    <th className="px-4 py-2">Event</th>
                    <th className="px-4 py-2">Message</th>
                    <th className="px-4 py-2">Level</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.automationLogs.map((log) => (
                    <tr key={log.id} className="border-b border-[#E7E2D9]/40 hover:bg-[#E7E2D9]/10">
                      <td className="px-4 py-2.5 whitespace-nowrap text-[10px] text-[#666666]">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 font-medium">{log.source_system || "system"}</td>
                      <td className="px-4 py-2.5">{log.event_type}</td>
                      <td className="px-4 py-2.5 max-w-xs truncate">{log.message}</td>
                      <td className="px-4 py-2.5">
                        <Badge
                          variant={log.level === "error" ? "destructive" : "secondary"}
                          className="text-[9px] px-1 py-0 h-4"
                        >
                          {log.level}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
}
