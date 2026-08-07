import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageLayout } from "@/components/layout/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Pin,
  ExternalLink,
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Sparkles,
  Calendar,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  getPinterestStatusServer,
  listPublishedPinsServer,
  publishPinNowServer,
  retryFailedPublishServer,
} from "@/lib/pinterest.functions";

interface PublishedPinItem {
  id: string;
  product_id: string;
  pinterest_pin_id: string | null;
  pin_url: string | null;
  board_id?: string | null;
  board_name?: string | null;
  scheduled_at?: string | null;
  published_at?: string | null;
  status: string;
  error_message?: string | null;
  campaign_products?: {
    product_name?: string;
    campaign_id?: string;
    campaigns?: {
      name?: string;
      owner_id?: string;
    };
  } | null;
}

export const Route = createFileRoute("/_authenticated/pins")({
  head: () => ({
    meta: [
      { title: "Published Pins — DailyVerse AI" },
      { name: "description", content: "Manage your Pinterest publish queue and history." },
    ],
  }),
  component: PublishedPinsPage,
});

function PublishedPinsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const getStatusFn = useServerFn(getPinterestStatusServer);
  const listPinsFn = useServerFn(listPublishedPinsServer);
  const publishNowFn = useServerFn(publishPinNowServer);
  const retryFn = useServerFn(retryFailedPublishServer);

  const { data: status } = useQuery({
    queryKey: ["pinterest-status"],
    queryFn: () => getStatusFn(),
    retry: 2,
  });

  const {
    data: pins = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["published-pins"],
    queryFn: () => listPinsFn(),
    retry: 2,
  });

  const handlePublishNow = async (productId: string) => {
    setActionInProgress(productId);
    try {
      await publishNowFn({ data: { productId } });
      toast.success("Pin published to Pinterest successfully!");
      void queryClient.invalidateQueries({ queryKey: ["published-pins"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to publish pin");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRetry = async (productId: string) => {
    setActionInProgress(productId);
    try {
      await retryFn({ data: { productId } });
      toast.success("Retry succeeded! Pin published.");
      void queryClient.invalidateQueries({ queryKey: ["published-pins"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Retry failed");
    } finally {
      setActionInProgress(null);
    }
  };

  const typedPins = pins as unknown as PublishedPinItem[];

  const filteredPins = typedPins.filter((pin) => {
    const productName = pin.campaign_products?.product_name || "";
    const campaignName = pin.campaign_products?.campaigns?.name || "";
    const term = search.toLowerCase();
    return productName.toLowerCase().includes(term) || campaignName.toLowerCase().includes(term);
  });

  const scheduledQueue = filteredPins.filter(
    (p) => p.status === "scheduled" || p.status === "queued",
  );
  const publishedHistory = filteredPins.filter((p) => p.status === "published");
  const failedQueue = filteredPins.filter((p) => p.status === "failed");

  return (
    <PageLayout contentClassName="max-w-6xl p-6 md:p-8 space-y-6 bg-[#F8F6F2]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-[#E7E2D9] shadow-xs">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-[#222222]">
            Pinterest Publishing Suite
          </h1>
          <p className="text-xs text-[#666666] mt-0.5">
            Queue, schedule, and view published luxury skincare pins.
          </p>
        </div>

        {status && (
          <div className="flex items-center gap-2 rounded-xl border border-[#E7E2D9] bg-[#F8F6F2] px-3.5 py-2 text-xs">
            <Pin className="h-4 w-4 text-[#C8A96A]" />
            <span className="font-medium text-[#222222]">Pinterest Mode:</span>
            <Badge
              variant={status.mode === "live" ? "default" : "outline"}
              className="border-[#1E4734] text-[#1E4734] font-medium text-[10px]"
            >
              {status.mode === "live" ? "Connected (Live API)" : "Sandbox / Demo Mode"}
            </Badge>
          </div>
        )}
      </div>

      {/* Filter and Search */}
      <div className="mb-6 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#666666]" />
          <Input
            placeholder="Search pins by skincare product or campaign..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white border-[#E7E2D9] focus-visible:ring-[#1E4734] text-xs h-9"
          />
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="bg-white border border-[#E7E2D9] p-1">
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-[#1E4734] data-[state=active]:text-white text-xs"
          >
            All Pins ({filteredPins.length})
          </TabsTrigger>
          <TabsTrigger
            value="queue"
            className="data-[state=active]:bg-[#1E4734] data-[state=active]:text-white text-xs"
          >
            Queue ({scheduledQueue.length})
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="data-[state=active]:bg-[#1E4734] data-[state=active]:text-white text-xs"
          >
            History ({publishedHistory.length})
          </TabsTrigger>
          <TabsTrigger
            value="failed"
            className="data-[state=active]:bg-[#1E4734] data-[state=active]:text-white text-xs"
          >
            Failed ({failedQueue.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <PinListGrid
            pins={filteredPins}
            isLoading={isLoading}
            actionInProgress={actionInProgress}
            onPublishNow={handlePublishNow}
            onRetry={handleRetry}
          />
        </TabsContent>

        <TabsContent value="queue" className="space-y-4">
          <PinListGrid
            pins={scheduledQueue}
            isLoading={isLoading}
            actionInProgress={actionInProgress}
            onPublishNow={handlePublishNow}
            onRetry={handleRetry}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <PinListGrid
            pins={publishedHistory}
            isLoading={isLoading}
            actionInProgress={actionInProgress}
            onPublishNow={handlePublishNow}
            onRetry={handleRetry}
          />
        </TabsContent>

        <TabsContent value="failed" className="space-y-4">
          <PinListGrid
            pins={failedQueue}
            isLoading={isLoading}
            actionInProgress={actionInProgress}
            onPublishNow={handlePublishNow}
            onRetry={handleRetry}
          />
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}

function PinListGrid({
  pins,
  isLoading,
  actionInProgress,
  onPublishNow,
  onRetry,
}: {
  pins: PublishedPinItem[];
  isLoading: boolean;
  actionInProgress: string | null;
  onPublishNow: (id: string) => void;
  onRetry: (id: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex py-12 justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (pins.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Pin className="mx-auto mb-3 h-8 w-8 opacity-40" />
          <p className="font-medium text-foreground">No pins found</p>
          <p className="text-sm">Create a campaign and publish pins to see them here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {pins.map((pin) => {
        const isBusy = actionInProgress === pin.product_id;
        const productName = pin.campaign_products?.product_name || "Product Pin";
        const campaignName = pin.campaign_products?.campaigns?.name || "Campaign";

        return (
          <Card key={pin.id} className="flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-semibold">{productName}</CardTitle>
                  <p className="text-xs text-muted-foreground">Campaign: {campaignName}</p>
                </div>
                <div>
                  {pin.status === "published" && (
                    <Badge variant="default" className="bg-emerald-600">
                      <CheckCircle2 className="mr-1 h-3 w-3" /> Published
                    </Badge>
                  )}
                  {pin.status === "scheduled" && (
                    <Badge variant="secondary">
                      <Clock className="mr-1 h-3 w-3" /> Scheduled
                    </Badge>
                  )}
                  {pin.status === "failed" && (
                    <Badge variant="destructive">
                      <AlertCircle className="mr-1 h-3 w-3" /> Failed
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {pin.board_name && (
                <div className="text-xs text-muted-foreground">Board: {pin.board_name}</div>
              )}

              {pin.scheduled_at && (
                <div className="flex items-center text-xs text-muted-foreground">
                  <Calendar className="mr-1 h-3.5 w-3.5" />
                  Scheduled for: {new Date(pin.scheduled_at).toLocaleString()}
                </div>
              )}

              {pin.error_message && (
                <div className="rounded bg-destructive/10 p-2 text-xs text-destructive">
                  {pin.error_message}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t">
                {pin.pin_url ? (
                  <a
                    href={pin.pin_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center text-xs text-primary hover:underline"
                  >
                    View on Pinterest <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">Not published yet</span>
                )}

                <div className="flex gap-2">
                  {pin.status === "failed" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isBusy}
                      onClick={() => onRetry(pin.product_id)}
                    >
                      {isBusy ? (
                        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="mr-1 h-3.5 w-3.5" />
                      )}
                      Retry
                    </Button>
                  ) : pin.status !== "published" ? (
                    <Button
                      size="sm"
                      disabled={isBusy}
                      onClick={() => onPublishNow(pin.product_id)}
                    >
                      {isBusy ? (
                        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="mr-1 h-3.5 w-3.5" />
                      )}
                      Publish Now
                    </Button>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
