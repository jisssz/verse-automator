import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { PageLayout } from "@/components/layout/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Sliders,
  Webhook,
  Activity,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Clock,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getAnalyticsMetricsServer } from "@/lib/analytics.functions";
import { getPinterestStatusServer } from "@/lib/pinterest.functions";

export const Route = createFileRoute("/_authenticated/automation")({
  head: () => ({
    meta: [
      { title: "AI Automation Center — DailyVerse AI" },
      { name: "description", content: "Configure background automated content syndication tasks." },
    ],
  }),
  component: AutomationPage,
});

function AutomationPage() {
  const getAnalyticsFn = useServerFn(getAnalyticsMetricsServer);
  const getPinterestStatusFn = useServerFn(getPinterestStatusServer);

  // Load status
  const {
    data: metrics,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["analytics-metrics"],
    queryFn: () => getAnalyticsFn(),
  });

  const { data: pinterestStatus } = useQuery({
    queryKey: ["pinterest-status"],
    queryFn: () => getPinterestStatusFn(),
  });

  // Local Toggles (simulating persisted state or sync configuration)
  const [autoGenImage, setAutoGenImage] = useState(true);
  const [autoGenCopy, setAutoGenCopy] = useState(true);
  const [autoPublish, setAutoPublish] = useState(false);

  const handleToggle = (type: string) => {
    if (type === "image") setAutoGenImage(!autoGenImage);
    if (type === "copy") setAutoGenCopy(!autoGenCopy);
    if (type === "publish") setAutoPublish(!autoPublish);
    toast.success("Automation setting updated");
  };

  const [triggerStatus, setTriggerStatus] = useState<"idle" | "running" | "success" | "error">(
    "idle",
  );
  const [triggerMessage, setTriggerMessage] = useState<string>("");

  const handleTriggerPipeline = async () => {
    setTriggerStatus("running");
    setTriggerMessage("");
    try {
      const startTime = Date.now();
      const n8nApiKey = "dailyverse-n8n-key"; // Reads N8N_API_KEY on the server side
      const response = await fetch("/api/n8n/pipeline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": n8nApiKey,
        },
        body: JSON.stringify({ source: "manual-trigger", timestamp: new Date().toISOString() }),
      });
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = (await response.json().catch(() => ({}))) as any;

      if (response.ok && data.success) {
        setTriggerStatus("success");
        setTriggerMessage(
          `Pipeline completed in ${elapsed}s — ${data.stepsCompleted?.length ?? 0} steps executed`,
        );
        toast.success(`n8n pipeline finished (${elapsed}s): ${data.headline ?? "Done"} 🚀`);
        void refetch(); // Refresh analytics logs
      } else {
        const errMsg = data.error ?? `HTTP ${response.status}`;
        setTriggerStatus("error");
        setTriggerMessage(`Pipeline failed: ${errMsg}`);
        toast.error(`Pipeline failed: ${errMsg}`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      setTriggerStatus("error");
      setTriggerMessage(
        `${msg} — Check that N8N_API_KEY, OPENAI_API_KEY and SUPABASE_SERVICE_ROLE_KEY are set in your environment variables.`,
      );
      toast.error(`Pipeline trigger failed: ${msg}`);
    }
  };

  return (
    <PageLayout contentClassName="max-w-6xl space-y-6 p-6 md:p-8 bg-[#F8F6F2]">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-[#E7E2D9] shadow-xs">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-[#222222]">
            n8n Automation Control
          </h1>
          <p className="text-xs text-[#666666] mt-0.5">
            Manage auto-syndication pipelines, background image creation, and automated Pinterest
            scheduler tasks.
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <Button
            onClick={handleTriggerPipeline}
            disabled={triggerStatus === "running"}
            className="bg-[#1E4734] hover:bg-[#355E4D] text-white text-xs h-9"
          >
            {triggerStatus === "running" ? (
              <>
                <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Running...
              </>
            ) : (
              <>
                <Play className="mr-1 h-3 w-3 fill-current text-[#C8A96A]" /> Trigger Pipeline
              </>
            )}
          </Button>
          {triggerMessage && (
            <p
              className={`text-[10px] max-w-xs text-right ${triggerStatus === "error" ? "text-red-500" : "text-emerald-600"}`}
            >
              {triggerMessage}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Automation Status Panel */}
        <Card className="luxury-card border-[#E7E2D9] md:col-span-1">
          <CardHeader>
            <CardTitle className="font-serif text-lg text-[#222222]">Pipeline Switches</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Toggle 1: Auto Gen Image */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-[#E7E2D9] bg-white text-xs">
              <div>
                <p className="font-semibold text-[#222222]">Auto-Generate Pin Art</p>
                <p className="text-[10px] text-[#666666]">
                  Trigger DALL-E image prompt automatically
                </p>
              </div>
              <Button
                size="sm"
                variant={autoGenImage ? "default" : "outline"}
                className={
                  autoGenImage ? "bg-[#1E4734] text-white" : "border-[#E7E2D9] text-[#666666]"
                }
                onClick={() => handleToggle("image")}
              >
                {autoGenImage ? "Active" : "Disabled"}
              </Button>
            </div>

            {/* Toggle 2: Auto Gen Copy */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-[#E7E2D9] bg-white text-xs">
              <div>
                <p className="font-semibold text-[#222222]">Auto-Write Pinterest Copy</p>
                <p className="text-[10px] text-[#666666]">
                  Trigger GPT-4o copywriter for each product
                </p>
              </div>
              <Button
                size="sm"
                variant={autoGenCopy ? "default" : "outline"}
                className={
                  autoGenCopy ? "bg-[#1E4734] text-white" : "border-[#E7E2D9] text-[#666666]"
                }
                onClick={() => handleToggle("copy")}
              >
                {autoGenCopy ? "Active" : "Disabled"}
              </Button>
            </div>

            {/* Toggle 3: Auto Publish */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-[#E7E2D9] bg-white text-xs">
              <div>
                <p className="font-semibold text-[#222222]">Instant Auto-Publish</p>
                <p className="text-[10px] text-[#666666]">
                  Instantly publish to Pinterest without reviews
                </p>
              </div>
              <Button
                size="sm"
                variant={autoPublish ? "default" : "outline"}
                className={
                  autoPublish ? "bg-[#1E4734] text-white" : "border-[#E7E2D9] text-[#666666]"
                }
                onClick={() => handleToggle("publish")}
              >
                {autoPublish ? "Active" : "Disabled"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Integration Status Indicators */}
        <Card className="luxury-card border-[#E7E2D9] md:col-span-2">
          <CardHeader>
            <CardTitle className="font-serif text-lg text-[#222222]">
              Integration Gateway Status
            </CardTitle>
          </CardHeader>
          <IntegrationGatewayStatus pinterestStatus={pinterestStatus} />
        </Card>
      </div>

      {/* Realtime Logs table */}
      <Card className="luxury-card border-[#E7E2D9] mt-6">
        <CardHeader className="pb-3 border-b border-[#E7E2D9] flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-serif text-lg text-[#222222] flex items-center gap-1">
              <Activity className="h-4 w-4 text-[#C8A96A]" /> Automation History Logs
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-[#666666]"
            onClick={() => refetch()}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#1E4734]" />
            </div>
          ) : isError ? (
            <div className="flex justify-center py-8 text-red-500 text-sm">
              Error loading logs: {error instanceof Error ? error.message : "Unknown error"}
            </div>
          ) : metrics?.automationLogs.length === 0 ? (
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
                  {metrics?.automationLogs.map((log) => (
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

function IntegrationGatewayStatus({
  pinterestStatus,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pinterestStatus?: any;
}) {
  const [healthStatus, setHealthStatus] = useState<{
    openai: "unchecked" | "ok" | "error";
    supabase: "unchecked" | "ok" | "error";
    n8n: "unchecked" | "ok" | "optional";
  }>({
    openai: "unchecked",
    supabase: "unchecked",
    n8n: "unchecked",
  });
  const [isChecking, setIsChecking] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const checkHealth = async () => {
    setIsChecking(true);
    setErrorMsg("");
    try {
      const resHealth = await fetch("/api/n8n/health");
      const dataHealth = await resHealth.json();

      setHealthStatus({
        openai: dataHealth.integrations?.openaiApiKey === "FOUND" ? "ok" : "error",
        supabase: dataHealth.database?.status === "ok" ? "ok" : "error",
        n8n:
          dataHealth.integrations?.n8nWebhookUrl === "FOUND" ||
          dataHealth.integrations?.n8nApiKey === "FOUND"
            ? "ok"
            : "optional",
      });
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "Health check failed");
      setHealthStatus({
        openai: "error",
        supabase: "error",
        n8n: "optional",
      });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    void checkHealth();
  }, []);

  return (
    <CardContent className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          onClick={checkHealth}
          disabled={isChecking}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          {isChecking ? (
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <Play className="h-3 w-3 mr-1" />
          )}
          Run Health Check
        </Button>
        {errorMsg && <span className="text-red-500 text-[10px]">{errorMsg}</span>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-3 p-3.5 rounded-xl border border-[#E7E2D9] bg-white">
          {healthStatus.openai === "ok" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : healthStatus.openai === "error" ? (
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
          ) : (
            <Clock className="h-5 w-5 text-gray-400 shrink-0" />
          )}
          <div>
            <p className="text-xs font-semibold text-[#222222]">OpenAI API Gateway</p>
            <p
              className={`text-[10px] font-medium ${healthStatus.openai === "ok" ? "text-emerald-600" : healthStatus.openai === "error" ? "text-red-500" : "text-gray-400"}`}
            >
              {healthStatus.openai === "ok"
                ? "Configured"
                : healthStatus.openai === "error"
                  ? "Not Configured"
                  : "Unchecked"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3.5 rounded-xl border border-[#E7E2D9] bg-white">
          {healthStatus.supabase === "ok" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : healthStatus.supabase === "error" ? (
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
          ) : (
            <Clock className="h-5 w-5 text-gray-400 shrink-0" />
          )}
          <div>
            <p className="text-xs font-semibold text-[#222222]">Supabase Database</p>
            <p
              className={`text-[10px] font-medium ${healthStatus.supabase === "ok" ? "text-emerald-600" : healthStatus.supabase === "error" ? "text-red-500" : "text-gray-400"}`}
            >
              {healthStatus.supabase === "ok"
                ? "Connected"
                : healthStatus.supabase === "error"
                  ? "Error"
                  : "Unchecked"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3.5 rounded-xl border border-[#E7E2D9] bg-white">
          {pinterestStatus?.connected ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
          )}
          <div>
            <p className="text-xs font-semibold text-[#222222]">Pinterest Board API</p>
            <p
              className={`text-[10px] font-medium ${pinterestStatus?.connected ? "text-emerald-600" : "text-amber-500"}`}
            >
              {pinterestStatus?.connected ? "Connected (Live Account)" : "Sandbox Demo Mode"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3.5 rounded-xl border border-[#E7E2D9] bg-white">
          {healthStatus.n8n === "ok" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <Clock className="h-5 w-5 text-gray-400 shrink-0" />
          )}
          <div>
            <p className="text-xs font-semibold text-[#222222]">n8n Automation Trigger</p>
            <p
              className={`text-[10px] font-medium ${healthStatus.n8n === "ok" ? "text-emerald-600" : "text-gray-500"}`}
            >
              {healthStatus.n8n === "ok" ? "Connected" : "Optional (Not Configured)"}
            </p>
          </div>
        </div>
      </div>
    </CardContent>
  );
}
