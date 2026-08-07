/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageLayout } from "@/components/layout/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Loader2,
  Plus,
  Trash2,
  ArrowRight,
  FolderKanban,
  Sparkles,
  Layers,
  FileSpreadsheet,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { listCampaigns, createCampaign, deleteCampaign } from "@/lib/campaigns.functions";
import { generateTrendIdeas } from "@/lib/ai.functions";
import { syncProductsFromGoogleSheets } from "@/lib/products.functions";

export const Route = createFileRoute("/_authenticated/campaigns")({
  head: () => ({
    meta: [
      { title: "Campaigns Directory — DailyVerse AI" },
      {
        name: "description",
        content: "Manage your luxury botanical and skincare affiliate marketing campaigns.",
      },
    ],
  }),
  component: CampaignsIndexPage,
});

function CampaignsIndexPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Create Form states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [niche, setNiche] = useState("Luxury Skincare & Botanical Serums");
  const [importMode, setImportMode] = useState<"trends" | "manual" | "sheets">("trends");
  const [manualProductsText, setManualProductsText] = useState("");
  const [sheetName, setSheetName] = useState("Products");

  const listCampaignsFn = useServerFn(listCampaigns);
  const createCampaignFn = useServerFn(createCampaign);
  const deleteCampaignFn = useServerFn(deleteCampaign);
  const generateTrendsFn = useServerFn(generateTrendIdeas);
  const syncSheetsFn = useServerFn(syncProductsFromGoogleSheets);

  const {
    data: campaigns = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => listCampaignsFn(),
    retry: 2,
  });

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
      toast.success("Campaign Created Successfully ✨");
      resetForm();
      setCreateDialogOpen(false);
      void navigate({ to: "/campaigns/$id", params: { id: result.campaignId } });
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : "Failed to create campaign");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => deleteCampaignFn({ data: { id } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campaign deleted");
    },
  });

  const resetForm = () => {
    setName("");
    setNiche("Luxury Skincare & Botanical Serums");
    setImportMode("trends");
    setManualProductsText("");
    setSheetName("Products");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !niche.trim()) return;
    createMutation.mutate();
  };

  return (
    <PageLayout contentClassName="max-w-6xl space-y-6 p-6 md:p-8 bg-[#F8F6F2]">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-[#E7E2D9] shadow-xs">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-[#222222]">
            Marketing Campaigns
          </h1>
          <p className="text-xs text-[#666666] mt-0.5">
            Organize products into editorial thematic campaigns and automate their social pin
            distribution pipeline.
          </p>
        </div>

        {/* Add Campaign Modal Button */}
        <Dialog
          open={createDialogOpen}
          onOpenChange={(open) => {
            setCreateDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-[#1E4734] hover:bg-[#355E4D] text-white text-xs h-9">
              <Plus className="mr-1.5 h-4 w-4 text-[#C8A96A]" /> Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg bg-[#F8F6F2] border-[#E7E2D9]">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl text-[#222222]">
                Create Luxury Skincare Campaign
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="name" className="text-xs font-semibold">
                    Campaign Name *
                  </Label>
                  <Input
                    id="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white border-[#E7E2D9]"
                    placeholder="e.g. Summer Glow Collection"
                  />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="niche" className="text-xs font-semibold">
                    Beauty Niche *
                  </Label>
                  <Input
                    id="niche"
                    required
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    className="bg-white border-[#E7E2D9]"
                    placeholder="e.g. Luxury Botanical Skincare"
                  />
                </div>
              </div>

              {/* Import Mode Selector */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-[#222222]">Product Import Mode</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={importMode === "trends" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setImportMode("trends")}
                    className={
                      importMode === "trends"
                        ? "bg-[#1E4734] text-white"
                        : "border-[#E7E2D9] text-[#222222] bg-white"
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
                        ? "bg-[#1E4734] text-white"
                        : "border-[#E7E2D9] text-[#222222] bg-white"
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
                        ? "bg-[#1E4734] text-white"
                        : "border-[#E7E2D9] text-[#222222] bg-white"
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
                className="w-full bg-[#1E4734] hover:bg-[#355E4D] text-white font-medium shadow-sm h-10 mt-2"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#C8A96A]" />
                    Generating Campaign…
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4 text-[#C8A96A]" /> Create Campaign & Launch
                    Pipeline
                  </>
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Campaigns Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#1E4734]" />
        </div>
      ) : isError ? (
        <Card className="border-red-200 p-8 text-center bg-red-50 space-y-3">
          <FolderKanban className="mx-auto h-8 w-8 text-red-500" />
          <p className="text-sm font-semibold text-red-700">Failed to load campaigns</p>
          <p className="text-xs text-red-600 font-mono">
            {error instanceof Error ? error.message : "Unknown database error"}
          </p>
        </Card>
      ) : campaigns.length === 0 ? (
        <Card className="border-[#E7E2D9] p-12 text-center bg-white space-y-3">
          <FolderKanban className="mx-auto h-8 w-8 text-[#C8A96A]" />
          <p className="text-sm font-medium text-[#222222]">No campaigns created yet.</p>
          <p className="text-xs text-[#666666]">
            Create your first skincare marketing campaign using the button above.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign: any) => (
            <Card
              key={campaign.id}
              className="luxury-card border-[#E7E2D9] flex flex-col justify-between"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="font-serif text-lg text-[#222222] line-clamp-1">
                      {campaign.name}
                    </CardTitle>
                    <p className="text-xs text-[#666666] mt-0.5 line-clamp-1">
                      {campaign.niche || "Skincare & Beauty"}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-[#E7E2D9] text-[#1E4734] text-[10px] shrink-0"
                  >
                    Active
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-0 flex items-center justify-between border-t border-[#E7E2D9] mt-4 pt-3">
                <Link to="/campaigns/$id" params={{ id: campaign.id }}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[#1E4734] text-[#1E4734] hover:bg-[#1E4734] hover:text-white text-xs h-8"
                  >
                    Open Details <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10 h-8 w-8"
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
    </PageLayout>
  );
}
