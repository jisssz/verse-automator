import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLayout } from "@/components/layout/page-layout";
import {
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Folder,
  Package,
  Pin,
  AlertCircle,
  TrendingUp,
  Activity,
  RefreshCw,
  Crown,
  FileSpreadsheet,
  Layers,
  ArrowRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { listCampaigns, createCampaign, deleteCampaign } from "@/lib/campaigns.functions";
import { generateTrendIdeas } from "@/lib/ai.functions";
import { syncProductsFromGoogleSheets } from "@/lib/products.functions";
import { getAnalyticsMetricsServer } from "@/lib/analytics.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Luxury Skincare AI Dashboard — DailyVerse AI" },
      {
        name: "description",
        content:
          "Manage your luxury affiliate content campaigns and view Pinterest automation analytics.",
      },
      { property: "og:title", content: "Luxury Skincare AI Dashboard — DailyVerse AI" },
      {
        property: "og:description",
        content:
          "Manage your luxury affiliate content campaigns and view Pinterest automation analytics.",
      },
    ],
  }),
  component: DashboardPage,
});

const LUXURY_CHART_COLORS = ["#1E4734", "#355E4D", "#C8A96A", "#2E7D32"];

function DashboardPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [niche, setNiche] = useState("Luxury Skincare & Botanical Serums");
  const [importMode, setImportMode] = useState<"trends" | "manual" | "sheets">("trends");
  const [manualProductsText, setManualProductsText] = useState("");
  const [sheetName, setSheetName] = useState("Products");

  const listCampaignsFn = useServerFn(listCampaigns);
  const createCampaignFn = useServerFn(createCampaign);
  const generateTrendsFn = useServerFn(generateTrendIdeas);
  const deleteCampaignFn = useServerFn(deleteCampaign);
  const syncSheetsFn = useServerFn(syncProductsFromGoogleSheets);
  const getAnalyticsFn = useServerFn(getAnalyticsMetricsServer);

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => listCampaignsFn(),
  });

  const {
    data: metrics,
    isLoading: metricsLoading,
    refetch: refetchMetrics,
  } = useQuery({
    queryKey: ["analytics-metrics"],
    queryFn: () => getAnalyticsFn(),
  });

  // Setup Supabase Realtime updates listener for live analytics
  useEffect(() => {
    const channel = supabase
      .channel("analytics-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "automation_logs" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["analytics-metrics"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "published_pins" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["analytics-metrics"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "campaign_products" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["analytics-metrics"] });
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: async () => {
      let products: { productName: string; trendNote?: string }[] = [];

      if (importMode === "trends") {
        const trends = await generateTrendsFn({ data: { niche, count: 15 } });
        products = trends.ideas.map((idea: { productName: string; trendNote: string }) => ({
          productName: idea.productName,
          trendNote: idea.trendNote,
        }));
      } else if (importMode === "manual") {
        const names = manualProductsText
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);
        products = names.map((pName) => ({ productName: pName }));
      }

      const res = await createCampaignFn({
        data: {
          name: name.trim(),
          niche: niche.trim(),
          products: products.length ? products : [{ productName: name.trim() }],
        },
      });

      if (importMode === "sheets") {
        try {
          await syncSheetsFn({ data: { campaignId: res.campaignId, sourceSheetName: sheetName } });
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Google Sheets sync failed");
        }
      }

      return res;
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      void queryClient.invalidateQueries({ queryKey: ["analytics-metrics"] });
      toast.success("Luxury Campaign Created Successfully ✨");
      void navigate({ to: "/campaigns/$id", params: { id: result.campaignId } });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => deleteCampaignFn({ data: { id } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      void queryClient.invalidateQueries({ queryKey: ["analytics-metrics"] });
      toast.success("Campaign deleted");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !niche.trim()) return;
    createMutation.mutate();
  };

  return (
    <PageLayout contentClassName="max-w-7xl space-y-8 p-6 md:p-8 bg-[#F8F6F2]">
      {/* Top Luxury Bento Hero & Quick Launchpad */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#132E22] via-[#1E4734] to-[#28543E] p-8 text-[#F8F6F2] shadow-xl border border-[#C8A96A]/40 flex flex-col justify-between">
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C8A96A]/20 border border-[#C8A96A]/40 text-[#C8A96A] text-xs font-semibold uppercase tracking-wider shadow-xs">
              <Crown className="h-3.5 w-3.5" /> Luxury Skincare AI Suite
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#FFFFFF]">
              Welcome back, Creator ✨
            </h1>
            <p className="text-xs sm:text-sm text-[#F8F6F2]/80 leading-relaxed max-w-xl">
              Automate your luxury skincare affiliate pipeline, generate editorial Pinterest pin
              copy, and trigger FLUX.1 AI visual renderings seamlessly.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-[#FFFFFF]/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs relative z-10">
            <div className="space-y-0.5">
              <span className="text-[#C8A96A] uppercase font-semibold tracking-wider text-[10px]">
                Today&apos;s AI Copy
              </span>
              <p className="text-base font-bold text-white">28 Generated</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[#C8A96A] uppercase font-semibold tracking-wider text-[10px]">
                Pinterest Pins
              </span>
              <p className="text-base font-bold text-white">14 Scheduled</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[#C8A96A] uppercase font-semibold tracking-wider text-[10px]">
                FLUX.1 Engine
              </span>
              <p className="text-base font-bold text-emerald-400">Ready</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[#C8A96A] uppercase font-semibold tracking-wider text-[10px]">
                Pipeline Health
              </span>
              <p className="text-base font-bold text-white">
                {metricsLoading ? "..." : `${metrics?.successRate}%`}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Launchpad Card */}
        <div className="lg:col-span-4 luxury-card rounded-2xl p-6 bg-white border-[#E7E2D9] shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-[#E7E2D9] pb-3">
              <h3 className="font-serif text-lg font-bold text-[#1E4734]">Quick Launchpad</h3>
              <Sparkles className="h-4 w-4 text-[#C8A96A]" />
            </div>
            <p className="text-xs text-[#666666]">
              Instant access to core AI generators & workflows.
            </p>
          </div>

          <div className="space-y-2.5">
            <Button
              onClick={() => void navigate({ to: "/content-generator" })}
              className="w-full justify-between bg-[#F8F6F2] hover:bg-[#1E4734] text-[#1E4734] hover:text-white border border-[#E7E2D9] h-10 text-xs font-medium cursor-pointer group transition-all"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-[#C8A96A]" /> Content Generator
              </span>
              <ArrowRight className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
            </Button>

            <Button
              onClick={() => void navigate({ to: "/image-generator" })}
              className="w-full justify-between bg-[#F8F6F2] hover:bg-[#1E4734] text-[#1E4734] hover:text-white border border-[#E7E2D9] h-10 text-xs font-medium cursor-pointer group transition-all"
            >
              <span className="flex items-center gap-2">
                <Package className="h-3.5 w-3.5 text-[#C8A96A]" /> FLUX.1 Image Engine
              </span>
              <ArrowRight className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
            </Button>

            <Button
              onClick={() => void navigate({ to: "/automation" })}
              className="w-full justify-between bg-[#F8F6F2] hover:bg-[#1E4734] text-[#1E4734] hover:text-white border border-[#E7E2D9] h-10 text-xs font-medium cursor-pointer group transition-all"
            >
              <span className="flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-[#C8A96A]" /> n8n Workflow Trigger
              </span>
              <ArrowRight className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
            </Button>
          </div>

          <Button
            onClick={() => void refetchMetrics()}
            variant="outline"
            size="sm"
            className="w-full border-[#E7E2D9] text-[#666666] hover:text-[#1E4734] text-xs h-9"
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Sync Live Realtime Data
          </Button>
        </div>
      </div>

      {/* Bento KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="luxury-card border-[#E7E2D9]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#666666] uppercase tracking-wider">
              Campaigns
            </CardTitle>
            <div className="p-2 rounded-lg bg-[#1E4734]/10 text-[#1E4734]">
              <Folder className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-serif text-3xl font-bold text-[#222222]">
              {metricsLoading ? "-" : metrics?.campaignsCount}
            </div>
            <p className="text-xs text-[#666666] mt-1">Active beauty campaigns</p>
          </CardContent>
        </Card>

        <Card className="luxury-card border-[#E7E2D9]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#666666] uppercase tracking-wider">
              Products
            </CardTitle>
            <div className="p-2 rounded-lg bg-[#355E4D]/10 text-[#355E4D]">
              <Package className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-serif text-3xl font-bold text-[#222222]">
              {metricsLoading ? "-" : metrics?.productsCount}
            </div>
            <p className="text-xs text-[#666666] mt-1">Products in pipeline</p>
          </CardContent>
        </Card>

        <Card className="luxury-card border-[#E7E2D9]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#666666] uppercase tracking-wider">
              Generated Copy
            </CardTitle>
            <div className="p-2 rounded-lg bg-[#C8A96A]/10 text-[#C8A96A]">
              <Sparkles className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-serif text-3xl font-bold text-[#222222]">
              {metricsLoading ? "-" : metrics?.generatedCount}
            </div>
            <p className="text-xs text-[#666666] mt-1">AI copy & image prompts</p>
          </CardContent>
        </Card>

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
              {metricsLoading ? "-" : metrics?.publishedCount}
            </div>
            <p className="text-xs text-[#666666] mt-1">Live on Pinterest</p>
          </CardContent>
        </Card>

        <Card className="luxury-card border-[#E7E2D9]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#666666] uppercase tracking-wider">
              Automation Errors
            </CardTitle>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
              <AlertCircle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-serif text-3xl font-bold text-[#222222]">
              {metricsLoading ? "-" : metrics?.errorsCount}
            </div>
            <p className="text-xs text-[#666666] mt-1">Logged workflow errors</p>
          </CardContent>
        </Card>

        <Card className="luxury-card border-[#E7E2D9]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#666666] uppercase tracking-wider">
              Success Rate
            </CardTitle>
            <div className="p-2 rounded-lg bg-[#C8A96A]/20 text-[#1E4734]">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-serif text-3xl font-bold text-[#1E4734]">
              {metricsLoading ? "-" : `${metrics?.successRate}%`}
            </div>
            <p className="text-xs text-[#666666] mt-1">Automated execution rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Chart & Realtime Logs Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="luxury-card lg:col-span-2 border-[#E7E2D9]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="font-serif text-xl text-[#222222]">
                Activity Distribution
              </CardTitle>
              <Badge
                variant="outline"
                className="border-[#C8A96A] text-[#1E4734] font-medium text-xs bg-[#F8F6F2]"
              >
                Realtime Metrics
              </Badge>
            </div>
            <p className="text-xs text-[#666666]">
              Overview of campaigns, products, copy, and published pins.
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full pt-4">
              {metricsLoading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-[#1E4734]" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: "Campaigns", count: metrics?.campaignsCount || 0 },
                      { name: "Products", count: metrics?.productsCount || 0 },
                      { name: "Generated", count: metrics?.generatedCount || 0 },
                      { name: "Published", count: metrics?.publishedCount || 0 },
                    ]}
                  >
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
                      {LUXURY_CHART_COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Realtime Automation Logs Feed */}
        <Card className="luxury-card border-[#E7E2D9]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="font-serif text-xl text-[#222222]">Automation Logs</CardTitle>
              <Activity className="h-4 w-4 text-[#C8A96A]" />
            </div>
            <p className="text-xs text-[#666666]">Live execution feed from Supabase Realtime.</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
              {metricsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-[#1E4734]" />
                </div>
              ) : !metrics?.automationLogs || metrics.automationLogs.length === 0 ? (
                <p className="text-center py-8 text-xs text-[#666666]">No recent logs.</p>
              ) : (
                metrics.automationLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start justify-between p-2.5 rounded-lg border border-[#E7E2D9] bg-[#F8F6F2] text-xs"
                  >
                    <div className="space-y-0.5">
                      <p className="font-medium text-[#222222] line-clamp-1">{log.event_type}</p>
                      <p className="text-[10px] text-[#666666]">
                        {new Date(log.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <Badge
                      variant={log.level === "error" ? "destructive" : "secondary"}
                      className="text-[10px] h-5 px-1.5"
                    >
                      {log.level || "info"}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Creation Card */}
      <Card className="luxury-card border-[#E7E2D9] p-2">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#C8A96A]" />
            <CardTitle className="font-serif text-2xl text-[#222222]">
              Create Beauty Campaign
            </CardTitle>
          </div>
          <p className="text-xs text-[#666666]">
            Import luxury products using AI Beauty Trends, Manual List, or Google Sheets sync.
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-semibold text-[#222222]">
                  Campaign Name
                </Label>
                <Input
                  id="name"
                  placeholder="e.g. Summer Radiance Serums"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-[#E7E2D9] focus-visible:ring-[#1E4734] text-xs h-9 bg-white"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="niche" className="text-xs font-semibold text-[#222222]">
                  Beauty Niche
                </Label>
                <Input
                  id="niche"
                  placeholder="e.g. Luxury Botanical Skincare"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="border-[#E7E2D9] focus-visible:ring-[#1E4734] text-xs h-9 bg-white"
                  required
                />
              </div>
            </div>

            {/* Import Mode Selector */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#222222]">Product Source Mode</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={importMode === "trends" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setImportMode("trends")}
                  className={
                    importMode === "trends"
                      ? "bg-[#1E4734] text-white cursor-pointer"
                      : "border-[#E7E2D9] text-[#222222] cursor-pointer"
                  }
                >
                  <Sparkles className="mr-1.5 h-3.5 w-3.5 text-[#C8A96A]" /> AI Trends
                </Button>
                <Button
                  type="button"
                  variant={importMode === "manual" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setImportMode("manual")}
                  className={
                    importMode === "manual"
                      ? "bg-[#1E4734] text-white cursor-pointer"
                      : "border-[#E7E2D9] text-[#222222] cursor-pointer"
                  }
                >
                  <Layers className="mr-1.5 h-3.5 w-3.5 text-[#C8A96A]" /> Manual
                </Button>
                <Button
                  type="button"
                  variant={importMode === "sheets" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setImportMode("sheets")}
                  className={
                    importMode === "sheets"
                      ? "bg-[#1E4734] text-white cursor-pointer"
                      : "border-[#E7E2D9] text-[#222222] cursor-pointer"
                  }
                >
                  <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5 text-[#C8A96A]" /> Sheets
                </Button>
              </div>
            </div>

            {importMode === "manual" && (
              <div className="space-y-1.5">
                <Label htmlFor="manualText" className="text-xs font-semibold text-[#222222]">
                  Product Names (one per line)
                </Label>
                <textarea
                  id="manualText"
                  rows={3}
                  placeholder="Vitamin C Brightening Serum&#10;Hydrating Hyaluronic Gel&#10;Rosehip Oil Treatment"
                  value={manualProductsText}
                  onChange={(e) => setManualProductsText(e.target.value)}
                  className="w-full rounded-md border border-[#E7E2D9] bg-white p-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1E4734]"
                />
              </div>
            )}

            {importMode === "sheets" && (
              <div className="space-y-1.5">
                <Label htmlFor="sheetName" className="text-xs font-semibold text-[#222222]">
                  Source Sheet Tab Name
                </Label>
                <Input
                  id="sheetName"
                  value={sheetName}
                  onChange={(e) => setSheetName(e.target.value)}
                  className="border-[#E7E2D9] focus-visible:ring-[#1E4734] text-xs h-9 bg-white"
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={createMutation.isPending}
              size="lg"
              className="w-full bg-[#1E4734] hover:bg-[#355E4D] text-white font-medium shadow-sm h-10 cursor-pointer"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#C8A96A]" />
                  Generating Luxury Campaign…
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4 text-[#C8A96A]" /> Create Campaign & Launch Pipeline
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Campaigns Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl font-bold text-[#222222]">Your Campaigns</h2>
          <Badge
            variant="outline"
            className="border-[#C8A96A] text-[#1E4734] font-medium text-xs bg-[#F8F6F2]"
          >
            {campaigns.length} Active
          </Badge>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#1E4734]" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#E7E2D9] p-12 text-center bg-white space-y-3">
            <Sparkles className="mx-auto h-8 w-8 text-[#C8A96A]" />
            <p className="text-sm font-medium text-[#222222]">No campaigns created yet.</p>
            <p className="text-xs text-[#666666]">
              Use the form above to generate your first luxury skincare campaign.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((campaign: { id: string; name: string; niche?: string | null }) => (
              <Card
                key={campaign.id}
                className="luxury-card border-[#E7E2D9] flex flex-col justify-between"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="font-serif text-lg text-[#222222] line-clamp-1">
                      {campaign.name}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className="border-[#E7E2D9] text-[#1E4734] text-[10px] shrink-0"
                    >
                      Active
                    </Badge>
                  </div>
                  <p className="text-xs text-[#666666] line-clamp-1">
                    {campaign.niche || "Skincare & Beauty"}
                  </p>
                </CardHeader>

                <CardContent className="pt-0 flex items-center justify-between border-t border-[#E7E2D9] mt-4 pt-3">
                  <Link to="/campaigns/$id" params={{ id: campaign.id }}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[#1E4734] text-[#1E4734] hover:bg-[#1E4734] hover:text-white text-xs h-8 cursor-pointer"
                    >
                      Open Campaign <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10 h-8 w-8 cursor-pointer"
                    onClick={() => deleteMutation.mutate({ id: campaign.id })}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
