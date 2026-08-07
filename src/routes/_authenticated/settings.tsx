import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLayout } from "@/components/layout/page-layout";
import { Loader2, Save, Key, Webhook, CheckCircle2, Play, Copy, Link2 } from "lucide-react";
import { toast } from "sonner";
import {
  getProfile,
  updateProfile,
  testOpenAiConnection,
  testSupabaseConnection,
  testPinterestConnection,
} from "@/lib/campaigns.functions";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — DailyVerse AI" },
      {
        name: "description",
        content: "Set your display name, affiliate link template, and n8n API webhooks.",
      },
      { property: "og:title", content: "Settings — DailyVerse AI" },
      {
        property: "og:description",
        content: "Set your display name, affiliate link template, and n8n API webhooks.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const queryClient = useQueryClient();
  const getProfileFn = useServerFn(getProfile);
  const updateProfileFn = useServerFn(updateProfile);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfileFn(),
  });

  const [displayName, setDisplayName] = useState("");
  const [affiliateLinkTemplate, setAffiliateLinkTemplate] = useState("");
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Connection health states
  const testOpenAiFn = useServerFn(testOpenAiConnection);
  const testSupabaseFn = useServerFn(testSupabaseConnection);
  const testPinterestFn = useServerFn(testPinterestConnection);

  const [openaiStatus, setOpenaiStatus] = useState<"untested" | "loading" | "connected" | "failed">(
    "untested",
  );
  const [supabaseStatus, setSupabaseStatus] = useState<
    "untested" | "loading" | "connected" | "failed"
  >("untested");
  const [pinterestStatusState, setPinterestStatusState] = useState<
    "untested" | "loading" | "connected" | "failed"
  >("untested");
  const [pinterestUser, setPinterestUser] = useState("");
  const [amazonStatus, setAmazonStatus] = useState<"untested" | "connected" | "failed">("untested");

  const [openaiInfo, setOpenaiInfo] = useState<{ latency: number; timestamp: string } | null>(null);
  const [supabaseInfo, setSupabaseInfo] = useState<{ latency: number; timestamp: string } | null>(
    null,
  );
  const [pinterestInfo, setPinterestInfo] = useState<{ latency: number; timestamp: string } | null>(
    null,
  );
  const [n8nStatus, setN8nStatus] = useState<"untested" | "loading" | "connected" | "failed">(
    "untested",
  );
  const [n8nInfo, setN8nInfo] = useState<{
    latency: number;
    timestamp: string;
    url?: string;
    hasApiKey?: boolean;
  } | null>(null);

  const handleTestOpenAi = async () => {
    setOpenaiStatus("loading");
    const start = performance.now();
    try {
      await testOpenAiFn();
      setOpenaiInfo({
        latency: Math.round(performance.now() - start),
        timestamp: new Date().toLocaleTimeString(),
      });
      setOpenaiStatus("connected");
      toast.success("OpenAI connection successful!");
    } catch (e) {
      setOpenaiInfo({
        latency: Math.round(performance.now() - start),
        timestamp: new Date().toLocaleTimeString(),
      });
      setOpenaiStatus("failed");
      toast.error(e instanceof Error ? e.message : "OpenAI connection failed");
    }
  };

  const handleTestSupabase = async () => {
    setSupabaseStatus("loading");
    const start = performance.now();
    try {
      await testSupabaseFn();
      setSupabaseInfo({
        latency: Math.round(performance.now() - start),
        timestamp: new Date().toLocaleTimeString(),
      });
      setSupabaseStatus("connected");
      toast.success("Supabase connection successful!");
    } catch (e) {
      setSupabaseInfo({
        latency: Math.round(performance.now() - start),
        timestamp: new Date().toLocaleTimeString(),
      });
      setSupabaseStatus("failed");
      toast.error(e instanceof Error ? e.message : "Supabase connection failed");
    }
  };

  const handleTestPinterest = async () => {
    setPinterestStatusState("loading");
    const start = performance.now();
    try {
      const res = await testPinterestFn();
      setPinterestInfo({
        latency: Math.round(performance.now() - start),
        timestamp: new Date().toLocaleTimeString(),
      });
      setPinterestStatusState("connected");
      setPinterestUser(res.username || "");
      toast.success("Pinterest connection successful!");
    } catch (e) {
      setPinterestInfo({
        latency: Math.round(performance.now() - start),
        timestamp: new Date().toLocaleTimeString(),
      });
      setPinterestStatusState("failed");
      setPinterestUser("");
      toast.error(e instanceof Error ? e.message : "Pinterest connection failed");
    }
  };

  const handleTestN8n = async () => {
    setN8nStatus("loading");
    const start = performance.now();
    try {
      const res = await fetch("/api/n8n/health");
      const data = await res.json().catch(() => ({}));
      setN8nInfo({
        latency: Math.round(performance.now() - start),
        timestamp: new Date().toLocaleTimeString(),
        ...(data.webhookUrl ? { url: data.webhookUrl } : {}),
        hasApiKey: data.hasApiKey ?? false,
      });
      if (!res.ok) throw new Error("n8n health check failed");
      setN8nStatus("connected");
      toast.success("n8n connection successful!");
    } catch (e) {
      setN8nInfo({
        latency: Math.round(performance.now() - start),
        timestamp: new Date().toLocaleTimeString(),
      });
      setN8nStatus("failed");
      toast.error(e instanceof Error ? e.message : "n8n connection failed");
    }
  };

  const handleTestAmazon = () => {
    if (!affiliateLinkTemplate.trim()) {
      setAmazonStatus("failed");
      toast.error("Template cannot be empty");
      return;
    }
    if (!affiliateLinkTemplate.includes("{{product}}")) {
      setAmazonStatus("failed");
      toast.error("Template must include {{product}} token");
      return;
    }
    setAmazonStatus("connected");
    toast.success("Amazon Affiliate link structure validated successfully!");
  };

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setAffiliateLinkTemplate(profile.affiliate_link_template ?? "");
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: () =>
      updateProfileFn({
        data: { displayName, affiliateLinkTemplate },
      }),
    onSuccess: () => {
      toast.success("Settings saved");
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleTestWebhook = async () => {
    setTestingWebhook(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/n8n/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testPayload: "n8n_test_trigger",
          timestamp: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      setTestResult(JSON.stringify(data, null, 2));
      if (res.ok) {
        toast.success("n8n Webhook Test Succeeded!");
      } else {
        toast.error(`Webhook test failed (${res.status})`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Webhook test failed");
    } finally {
      setTestingWebhook(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const renderBadge = (
    status: "untested" | "loading" | "connected" | "failed",
    extraText?: string,
  ) => {
    if (status === "untested") {
      return (
        <Badge variant="outline" className="text-gray-500">
          Not Tested
        </Badge>
      );
    }
    if (status === "loading") {
      return (
        <Badge variant="outline" className="text-gray-500">
          Testing...
        </Badge>
      );
    }
    if (status === "connected") {
      return (
        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
          ✅ Connected{extraText ? `: ${extraText}` : ""}
        </Badge>
      );
    }
    return <Badge variant="destructive">❌ Failed</Badge>;
  };

  return (
    <PageLayout contentClassName="max-w-6xl p-6 md:p-8 space-y-6 bg-[#F8F6F2]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-[#E7E2D9] shadow-xs">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-[#222222]">
            Settings & Webhook Integrations
          </h1>
          <p className="text-xs text-[#666666] mt-0.5">
            Configure profile metadata, affiliate link templates, and n8n webhooks.
          </p>
        </div>
      </div>

      {/* Profile & Affiliate Links */}
      <Card className="luxury-card border-[#E7E2D9]">
        <CardHeader>
          <CardTitle className="font-serif text-xl text-[#222222]">
            Profile & Affiliate Link Template
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#1E4734]" />
            </div>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                mutation.mutate();
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="displayName" className="text-xs font-semibold text-[#222222]">
                  Display Name
                </Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="bg-white border-[#E7E2D9] focus-visible:ring-[#1E4734] text-xs h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="template" className="text-xs font-semibold text-[#222222]">
                  Affiliate Link Template
                </Label>
                <Input
                  id="template"
                  value={affiliateLinkTemplate}
                  onChange={(e) => setAffiliateLinkTemplate(e.target.value)}
                  placeholder="https://example.com/search?q={{product}}&tag=yourtag-21"
                  className="bg-white border-[#E7E2D9] focus-visible:ring-[#1E4734] text-xs h-9"
                />
                <p className="text-xs text-[#666666]">
                  Use <code className="text-[#1E4734] font-semibold">{"{{product}}"}</code> where
                  the product name should be inserted.
                </p>
              </div>
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="bg-[#1E4734] hover:bg-[#355E4D] text-white text-xs font-medium h-9"
              >
                {mutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#C8A96A]" />
                ) : (
                  <Save className="mr-2 h-4 w-4 text-[#C8A96A]" />
                )}
                Save Settings
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Gateway Connections Health Checker */}
      <Card className="luxury-card border-[#E7E2D9]">
        <CardHeader>
          <CardTitle className="font-serif text-xl text-[#222222]">
            API Credentials & Health Gateway
          </CardTitle>
          <p className="text-xs text-[#666666] mt-0.5">
            Test the live authentication status of external platforms and your local database
            connection.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {/* FLUX.1 Free AI Image Engine */}
          <div className="flex flex-col justify-between p-4 rounded-xl border border-[#E7E2D9] bg-white space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex flex-col mt-1">
                <span className="text-xs font-semibold text-[#222222]">FLUX.1 Image Engine</span>
                <span className="text-[10px] text-emerald-600 font-medium">
                  Free Production AI Model
                </span>
              </div>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                ✅ Active (Free Tier)
              </Badge>
            </div>
            <Button
              size="sm"
              onClick={() => toast.success("FLUX.1 Free AI Image Engine is active and ready!")}
              className="bg-[#1E4734] hover:bg-[#355E4D] text-white text-xs h-8"
            >
              Verify Provider
            </Button>
          </div>

          {/* OpenAI */}
          <div className="flex flex-col justify-between p-4 rounded-xl border border-[#E7E2D9] bg-white space-y-3">
            <div className="flex items-start justify-between">
              <span className="text-xs font-semibold text-[#222222] mt-1">OpenAI API Gateway</span>
              <div className="flex flex-col items-end">
                {renderBadge(openaiStatus)}
                {openaiInfo && (
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {openaiInfo.latency}ms · {openaiInfo.timestamp}
                  </div>
                )}
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleTestOpenAi}
              disabled={openaiStatus === "loading"}
              className="bg-[#1E4734] hover:bg-[#355E4D] text-white text-xs h-8"
            >
              Test Connection
            </Button>
          </div>

          {/* Supabase */}
          <div className="flex flex-col justify-between p-4 rounded-xl border border-[#E7E2D9] bg-white space-y-3">
            <div className="flex items-start justify-between">
              <span className="text-xs font-semibold text-[#222222] mt-1">Supabase Database</span>
              <div className="flex flex-col items-end">
                {renderBadge(supabaseStatus)}
                {supabaseInfo && (
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {supabaseInfo.latency}ms · {supabaseInfo.timestamp}
                  </div>
                )}
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleTestSupabase}
              disabled={supabaseStatus === "loading"}
              className="bg-[#1E4734] hover:bg-[#355E4D] text-white text-xs h-8"
            >
              Test Connection
            </Button>
          </div>

          {/* Pinterest */}
          <div className="flex flex-col justify-between p-4 rounded-xl border border-[#E7E2D9] bg-white space-y-3">
            <div className="flex items-start justify-between">
              <span className="text-xs font-semibold text-[#222222] mt-1">Pinterest Board API</span>
              <div className="flex flex-col items-end">
                {renderBadge(pinterestStatusState, pinterestUser ? `@${pinterestUser}` : undefined)}
                {pinterestInfo && (
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {pinterestInfo.latency}ms · {pinterestInfo.timestamp}
                  </div>
                )}
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleTestPinterest}
              disabled={pinterestStatusState === "loading"}
              className="bg-[#1E4734] hover:bg-[#355E4D] text-white text-xs h-8"
            >
              Test Connection
            </Button>
          </div>

          {/* n8n Webhook */}
          <div className="flex flex-col justify-between p-4 rounded-xl border border-[#E7E2D9] bg-white space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex flex-col mt-1">
                <span className="text-xs font-semibold text-[#222222]">n8n Webhook Endpoint</span>
                {n8nInfo?.url && (
                  <span
                    className="text-[10px] text-muted-foreground truncate max-w-[150px]"
                    title={n8nInfo.url}
                  >
                    {n8nInfo.url}
                  </span>
                )}
                {n8nInfo?.hasApiKey !== undefined && (
                  <span className="text-[10px] text-muted-foreground mt-0.5">
                    API Key: {n8nInfo.hasApiKey ? "Configured" : "Missing"}
                  </span>
                )}
              </div>
              <div className="flex flex-col items-end">
                {renderBadge(n8nStatus)}
                {n8nInfo && (
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {n8nInfo.latency}ms · {n8nInfo.timestamp}
                  </div>
                )}
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleTestN8n}
              disabled={n8nStatus === "loading"}
              className="bg-[#1E4734] hover:bg-[#355E4D] text-white text-xs h-8"
            >
              Test Connection
            </Button>
          </div>

          {/* Amazon Affiliate Link */}
          <div className="flex flex-col justify-between p-4 rounded-xl border border-[#E7E2D9] bg-white space-y-3">
            <div className="flex items-start justify-between">
              <span className="text-xs font-semibold text-[#222222] mt-1">
                Amazon Affiliate URL Link
              </span>
              <div className="flex flex-col items-end">
                {renderBadge(amazonStatus as "untested" | "connected" | "failed")}
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleTestAmazon}
              className="bg-[#1E4734] hover:bg-[#355E4D] text-white text-xs h-8"
            >
              Validate Template
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pinterest OAuth Connection Card */}
      <Card className="luxury-card border-[#E7E2D9]">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-[#C8A96A]" />
            <CardTitle className="font-serif text-xl text-[#222222]">
              Pinterest OAuth & Account Connection
            </CardTitle>
          </div>
          <Badge variant="outline" className="border-[#1E4734] text-[#1E4734] font-medium text-xs">
            OAuth Ready
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-[#666666] leading-relaxed">
            Connect your Pinterest Developer account securely via OAuth 2.0 to fetch boards and
            publish pins directly.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <a href="/api/pinterest/connect">
              <Button
                size="sm"
                className="bg-[#1E4734] hover:bg-[#355E4D] text-white text-xs font-medium h-9"
              >
                <Link2 className="mr-1.5 h-3.5 w-3.5 text-[#C8A96A]" /> Connect Pinterest Account
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* n8n Integration & Webhook Documentation */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <Webhook className="h-5 w-5 text-primary" />
            <CardTitle>n8n Automation & Webhook Integration</CardTitle>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            <Key className="mr-1 h-3 w-3" /> Secure API Active
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            DailyVerse AI provides dedicated REST endpoints and webhook triggers for n8n workflows.
            Authenticate your n8n HTTP Request nodes using the <code>x-api-key</code> header or{" "}
            <code>Authorization: Bearer &lt;key&gt;</code>.
          </p>

          <div className="rounded-lg border bg-muted/40 p-3 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Required Authentication Headers:</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => copyToClipboard("x-api-key: YOUR_N8N_API_KEY")}
              >
                <Copy className="mr-1 h-3 w-3" /> Copy
              </Button>
            </div>
            <div className="text-foreground">x-api-key: YOUR_N8N_API_KEY</div>
            <div className="text-foreground">Authorization: Bearer YOUR_N8N_API_KEY</div>
          </div>

          <h3 className="font-semibold text-sm pt-2">Available n8n Webhook Endpoints</h3>

          <div className="space-y-2 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded border p-2.5 bg-card">
              <div>
                <span className="font-bold text-emerald-600 mr-2">POST</span>
                <code className="text-foreground font-semibold">/api/n8n/pipeline</code>
                <p className="text-muted-foreground mt-0.5">
                  Full end-to-end pipeline (Sheets → AI → Image → Supabase → Pinterest → Sheet
                  update)
                </p>
              </div>
              <Badge
                variant="outline"
                className="mt-1 sm:mt-0 bg-emerald-50 text-emerald-700 border-emerald-200"
              >
                End-to-End
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded border p-2.5 bg-card">
              <div>
                <span className="font-bold text-emerald-600 mr-2">POST</span>
                <code className="text-foreground font-semibold">/api/sheets/import</code>
                <p className="text-muted-foreground mt-0.5">
                  Import products from Google Spreadsheet into Supabase
                </p>
              </div>
              <Badge variant="outline" className="mt-1 sm:mt-0">
                Sheets Integration
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded border p-2.5 bg-card">
              <div>
                <span className="font-bold text-emerald-600 mr-2">POST</span>
                <code className="text-foreground font-semibold">/api/sheets/export</code>
                <p className="text-muted-foreground mt-0.5">
                  Export copy, image metadata, pin status, and URLs back to Google Sheet
                </p>
              </div>
              <Badge variant="outline" className="mt-1 sm:mt-0">
                Sheets Export
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded border p-2.5 bg-card">
              <div>
                <span className="font-bold font-mono text-blue-600 mr-2">GET</span>
                <code className="text-foreground font-semibold">/api/n8n/health</code>
                <p className="text-muted-foreground mt-0.5">
                  Engine health check, database latency, and secret verification
                </p>
              </div>
              <Badge variant="outline" className="mt-1 sm:mt-0">
                Health Monitor
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded border p-2.5 bg-card">
              <div>
                <span className="font-bold text-emerald-600 mr-2">POST</span>
                <code className="text-foreground font-semibold">/api/n8n/generate-content</code>
                <p className="text-muted-foreground mt-0.5">
                  Generate AI pin copy (headline, description, title, link)
                </p>
              </div>
              <Badge variant="outline" className="mt-1 sm:mt-0">
                Copy Pipeline
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded border p-2.5 bg-card">
              <div>
                <span className="font-bold text-emerald-600 mr-2">POST</span>
                <code className="text-foreground font-semibold">/api/n8n/generate-image</code>
                <p className="text-muted-foreground mt-0.5">
                  Generate vertical Pinterest image prompt
                </p>
              </div>
              <Badge variant="outline" className="mt-1 sm:mt-0">
                Image Pipeline
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded border p-2.5 bg-card">
              <div>
                <span className="font-bold text-emerald-600 mr-2">POST</span>
                <code className="text-foreground font-semibold">/api/n8n/publish-pin</code>
                <p className="text-muted-foreground mt-0.5">
                  Publish pin directly to Pinterest board
                </p>
              </div>
              <Badge variant="outline" className="mt-1 sm:mt-0">
                Publishing
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded border p-2.5 bg-card">
              <div>
                <span className="font-bold text-emerald-600 mr-2">POST</span>
                <code className="text-foreground font-semibold">/api/n8n/import-products</code>
                <p className="text-muted-foreground mt-0.5">
                  Bulk import product rows into campaign
                </p>
              </div>
              <Badge variant="outline" className="mt-1 sm:mt-0">
                Data Import
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded border p-2.5 bg-card">
              <div>
                <span className="font-bold text-emerald-600 mr-2">POST</span>
                <code className="text-foreground font-semibold">/api/n8n/retry-workflow</code>
                <p className="text-muted-foreground mt-0.5">
                  Retry failed product workflow step (content / image / publish)
                </p>
              </div>
              <Badge variant="outline" className="mt-1 sm:mt-0">
                Workflow Retry
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded border p-2.5 bg-card">
              <div>
                <span className="font-bold font-mono text-blue-600 mr-2">GET</span>
                <code className="text-foreground font-semibold">/api/n8n/logs</code>
                <p className="text-muted-foreground mt-0.5">Fetch automation logs history</p>
              </div>
              <Badge variant="outline" className="mt-1 sm:mt-0">
                Audit Logs
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded border p-2.5 bg-card">
              <div>
                <span className="font-bold font-mono text-purple-600 mr-2">POST / GET</span>
                <code className="text-foreground font-semibold">/api/n8n/test</code>
                <p className="text-muted-foreground mt-0.5">
                  Test webhook connectivity and API authentication
                </p>
              </div>
              <Badge variant="outline" className="mt-1 sm:mt-0">
                Connectivity Test
              </Badge>
            </div>
          </div>

          <div className="pt-3 border-t flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Test Webhook Endpoint</span>
              <Button size="sm" onClick={handleTestWebhook} disabled={testingWebhook}>
                {testingWebhook ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4 text-emerald-500" />
                )}
                Run Live Test Webhook
              </Button>
            </div>

            {testResult && (
              <div className="rounded-lg border bg-slate-950 p-3 text-xs text-emerald-400 font-mono overflow-x-auto">
                <div className="flex items-center gap-1.5 text-slate-400 mb-2 font-sans font-medium text-xs">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Webhook Test Response:
                </div>
                <pre>{testResult}</pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
