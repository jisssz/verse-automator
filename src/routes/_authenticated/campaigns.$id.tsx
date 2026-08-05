import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PageLayout } from "@/components/layout/page-layout";
import { CenteredState } from "@/components/layout/centered-state";
import {
  Loader2,
  Sparkles,
  Image as ImageIcon,
  Pin,
  Download,
  ArrowLeft,
  Save,
  RotateCcw,
  Plus,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Calendar,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  getCampaignWithProducts,
  getProfile,
  addProductsToCampaign,
} from "@/lib/campaigns.functions";
import { generatePinContent, generateImagePrompt, saveGeneratedContent } from "@/lib/ai.functions";
import {
  syncProductsFromGoogleSheets,
  exportCampaignToSheetsServer,
  exportCopySheetServer,
  exportImagesMetadataSheetServer,
} from "@/lib/products.functions";
import { streamImage } from "@/lib/streamImage";
import {
  getPinterestStatusServer,
  publishPinNowServer,
  schedulePinServer,
  retryFailedPublishServer,
} from "@/lib/pinterest.functions";

export const Route = createFileRoute("/_authenticated/campaigns/$id")({
  head: () => ({
    meta: [
      { title: `Campaign — DailyVerse AI` },
      { name: "description", content: "Review and generate content for your campaign." },
      { property: "og:title", content: "Campaign — DailyVerse AI" },
      { property: "og:description", content: "Review and generate content for your campaign." },
    ],
  }),
  component: CampaignDetailPage,
});

function CampaignDetailPage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductNote, setNewProductNote] = useState("");
  const [addingProduct, setAddingProduct] = useState(false);

  const [sheetsDialogOpen, setSheetsDialogOpen] = useState(false);
  const [sheetName, setSheetName] = useState("Products");
  const [syncingSheets, setSyncingSheets] = useState(false);
  const [exportingSheets, setExportingSheets] = useState(false);

  const getCampaignFn = useServerFn(getCampaignWithProducts);
  const getProfileFn = useServerFn(getProfile);
  const generateContentFn = useServerFn(generatePinContent);
  const generateImagePromptFn = useServerFn(generateImagePrompt);
  const saveContentFn = useServerFn(saveGeneratedContent);
  const addProductsFn = useServerFn(addProductsToCampaign);
  const syncSheetsFn = useServerFn(syncProductsFromGoogleSheets);
  const exportCampaignFn = useServerFn(exportCampaignToSheetsServer);
  const exportCopyFn = useServerFn(exportCopySheetServer);
  const exportImagesFn = useServerFn(exportImagesMetadataSheetServer);

  const { data, isLoading, error } = useQuery({
    queryKey: ["campaign", id],
    queryFn: () => getCampaignFn({ data: { id } }),
  });

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfileFn(),
  });

  if (error) {
    return (
      <CenteredState>
        <h1 className="text-xl font-semibold text-foreground">Campaign not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          It may have been deleted or you don't have access.
        </p>
        <Link to="/dashboard" className="mt-4 inline-block">
          <Button variant="outline">Back to dashboard</Button>
        </Link>
      </CenteredState>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { campaign, products } = data;
  const affiliateLinkTemplate = profile?.affiliate_link_template ?? "";

  // Compute status stats
  const completedProducts = (products as unknown as CampaignProductRecord[]).filter((p) => {
    const c = getProductContent(p);
    return Boolean((c?.headline || c?.pinterest_title) && c?.image_url);
  });
  const completedCount = completedProducts.length;
  const totalCount = products.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  async function handleBulkGenerate() {
    setIsBulkGenerating(true);
    setBulkProgress({ current: 0, total: products.length });
    let ok = 0;

    for (let i = 0; i < products.length; i++) {
      const product = (products as unknown as CampaignProductRecord[])[i];
      if (!product) continue;
      setBulkProgress({ current: i + 1, total: products.length });
      try {
        // Step 1: Copy generation
        const copyResult = await generateContentFn({
          data: {
            campaignId: campaign.id,
            productId: product.id,
            productName: product.product_name,
            ...(product.trend_note ? { trendNote: product.trend_note } : {}),
            ...(campaign.niche ? { niche: campaign.niche } : {}),
            ...(affiliateLinkTemplate ? { affiliateLinkTemplate } : {}),
          },
        });

        // Step 2: Image prompt generation
        const promptResult = await generateImagePromptFn({
          data: {
            productName: product.product_name,
            ...(product.trend_note ? { trendNote: product.trend_note } : {}),
            ...(campaign.niche ? { niche: campaign.niche } : {}),
            ...(copyResult.headline ? { headline: copyResult.headline } : {}),
          },
        });

        let finalImageUrl: string | null = null;
        await streamImage("/api/generate-image", promptResult.imagePrompt, (url) => {
          if (url) finalImageUrl = url;
        });

        // Step 3: Save generated content & image
        await saveContentFn({
          data: {
            productId: product.id,
            headline: copyResult.headline,
            description: copyResult.description || copyResult.headline,
            pinTitle: copyResult.pinTitle,
            pinDescription: copyResult.pinDescription || copyResult.headline,
            ...(copyResult.affiliateLink ? { affiliateLink: copyResult.affiliateLink } : {}),
            imagePrompt: promptResult.imagePrompt,
            ...(finalImageUrl ? { imageUrl: finalImageUrl } : {}),
          },
        });
        ok += 1;
      } catch (e) {
        console.error(`Error processing ${product.product_name}:`, e);
      }
    }

    setIsBulkGenerating(false);
    toast.success(`Completed pipeline for ${ok} of ${products.length} products`);
    void queryClient.invalidateQueries({ queryKey: ["campaign", id] });
  }

  function handleExportCsv() {
    const rows = [
      [
        "Product",
        "Trend note",
        "Headline",
        "Description",
        "Pin title",
        "Pin description",
        "Affiliate link",
        "Image URL",
      ],
      ...(products as unknown as CampaignProductRecord[]).map((p) => {
        const c = getProductContent(p) ?? {};
        return [
          p.product_name ?? "",
          p.trend_note ?? "",
          c.headline ?? "",
          c.description ?? "",
          c.pinterest_title ?? "",
          c.pin_description ?? "",
          c.affiliate_link ?? "",
          c.image_url ?? "",
        ];
      }),
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${campaign.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-pins.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported successfully");
  }

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!newProductName.trim()) return;
    setAddingProduct(true);
    try {
      await addProductsFn({
        data: {
          campaignId: campaign.id,
          products: [{ productName: newProductName.trim(), trendNote: newProductNote.trim() }],
        },
      });
      toast.success("Product added");
      setNewProductName("");
      setNewProductNote("");
      setAddDialogOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["campaign", id] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add product");
    } finally {
      setAddingProduct(false);
    }
  }

  async function handleSyncSheets(e: React.FormEvent) {
    e.preventDefault();
    setSyncingSheets(true);
    try {
      const res = await syncSheetsFn({
        data: { campaignId: campaign.id, sourceSheetName: sheetName.trim() || "Products" },
      });
      toast.success(`Google Sheets synced: ${res.inserted} inserted, ${res.updated} updated`);
      setSheetsDialogOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["campaign", id] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to sync Google Sheets");
    } finally {
      setSyncingSheets(false);
    }
  }

  const handleExportSheetsFull = async () => {
    setExportingSheets(true);
    try {
      const res = await exportCampaignFn({ data: { campaignId: campaign.id } });
      toast.success(`Exported ${res.exportedCount} products to Google Sheet '${res.targetSheet}'`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export to Google Sheets failed");
    } finally {
      setExportingSheets(false);
    }
  };

  const handleExportSheetsCopy = async () => {
    setExportingSheets(true);
    try {
      const res = await exportCopyFn({ data: { campaignId: campaign.id } });
      toast.success(`Exported copy to Google Sheet '${res.targetSheet}'`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export copy to Google Sheets failed");
    } finally {
      setExportingSheets(false);
    }
  };

  const handleExportSheetsImages = async () => {
    setExportingSheets(true);
    try {
      const res = await exportImagesFn({ data: { campaignId: campaign.id } });
      toast.success(`Exported image metadata to Google Sheet '${res.targetSheet}'`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export images to Google Sheets failed");
    } finally {
      setExportingSheets(false);
    }
  };

  return (
    <PageLayout contentClassName="max-w-6xl p-6 md:p-8 space-y-6 bg-[#F8F6F2]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-[#E7E2D9] shadow-xs">
        <div className="flex items-center gap-3">
          <Link to="/dashboard">
            <Button
              variant="outline"
              size="icon"
              className="border-[#E7E2D9] text-[#1E4734] hover:bg-[#F3EFE8]"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-[#222222]">
                {campaign.name}
              </h1>
              <Badge
                variant="outline"
                className="border-[#C8A96A] text-[#1E4734] text-xs font-medium"
              >
                {campaign.niche || "Luxury Skincare"}
              </Badge>
            </div>
            <p className="text-xs text-[#666666] mt-0.5">Campaign ID: {campaign.id}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Add Product Dialog */}
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-[#E7E2D9] text-[#1E4734] hover:bg-[#F3EFE8] text-xs"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5 text-[#C8A96A]" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-serif text-xl">Add Product to Campaign</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddProduct} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="productName">Product Name</Label>
                  <Input
                    id="productName"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    placeholder="e.g., Vitamin C Glow Serum"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productNote">Trend Note (optional)</Label>
                  <Input
                    id="productNote"
                    value={newProductNote}
                    onChange={(e) => setNewProductNote(e.target.value)}
                    placeholder="e.g., High demand on Pinterest Skincare Trends"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={addingProduct}
                    className="bg-[#1E4734] text-white"
                  >
                    {addingProduct ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Product"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Sync Sheets Dialog */}
          <Dialog open={sheetsDialogOpen} onOpenChange={setSheetsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-[#E7E2D9] text-[#1E4734] hover:bg-[#F3EFE8] text-xs"
              >
                <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5 text-[#C8A96A]" />
                Sync Sheets
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-serif text-xl">Sync from Google Sheets</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSyncSheets} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="sheetNameInput">Sheet Name</Label>
                  <Input
                    id="sheetNameInput"
                    value={sheetName}
                    onChange={(e) => setSheetName(e.target.value)}
                    placeholder="Products"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Syncs rows from your configured Google Spreadsheet into this campaign.
                </p>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSheetsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={syncingSheets}
                    className="bg-[#1E4734] text-white"
                  >
                    {syncingSheets ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start Sync"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Button
            onClick={handleBulkGenerate}
            disabled={isBulkGenerating}
            size="sm"
            className="bg-[#1E4734] hover:bg-[#355E4D] text-white font-medium text-xs"
          >
            {isBulkGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Bulk Generate Pipeline
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportSheetsFull}
            disabled={exportingSheets}
          >
            {exportingSheets ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" />
            )}
            Export to Google Sheets
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportSheetsCopy}
            disabled={exportingSheets}
          >
            Export Copy
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportSheetsImages}
            disabled={exportingSheets}
          >
            Export Images Metadata
          </Button>

          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Pipeline Progress Section */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="mb-2 flex items-center justify-between text-sm font-medium">
            <span>Campaign Pipeline Progress</span>
            <span>
              {completedCount} / {totalCount} Completed ({progressPercent}%)
            </span>
          </div>
          <Progress value={progressPercent} className="h-2.5" />
          {isBulkGenerating && (
            <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
              Processing product {bulkProgress.current} of {bulkProgress.total}...
            </p>
          )}
        </CardContent>
      </Card>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Badge variant="outline">{products.length} Products</Badge>
        <Badge variant="default" className="bg-emerald-600">
          <CheckCircle2 className="mr-1 h-3 w-3" /> {completedCount} Completed
        </Badge>
        <Badge variant="secondary">
          <Clock className="mr-1 h-3 w-3" /> {totalCount - completedCount} Pending
        </Badge>
        {!affiliateLinkTemplate && <Badge variant="destructive">No affiliate template set</Badge>}
      </div>

      <div className="space-y-6">
        {(products as unknown as CampaignProductRecord[]).map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            campaign={campaign}
            affiliateTemplate={affiliateLinkTemplate}
            generateContentFn={generateContentFn}
            generateImagePromptFn={generateImagePromptFn}
            saveContentFn={saveContentFn}
            onSaved={() => {
              void queryClient.invalidateQueries({ queryKey: ["campaign", id] });
            }}
          />
        ))}
      </div>
    </PageLayout>
  );
}

interface GeneratedContentDraft {
  id?: string | undefined;
  headline?: string | null | undefined;
  description?: string | null | undefined;
  pinterest_title?: string | null | undefined;
  pin_description?: string | null | undefined;
  affiliate_link?: string | null | undefined;
  image_prompt?: string | null | undefined;
  image_url?: string | null | undefined;
}

interface PublishedPinRecord {
  id?: string;
  pin_url?: string | null;
  pinterest_pin_id?: string | null;
  board_id?: string | null;
  board_name?: string | null;
  scheduled_at?: string | null;
  published_at?: string | null;
  status?: string;
  error_message?: string | null;
}

interface CampaignProductRecord {
  id: string;
  campaign_id: string;
  product_name: string;
  source_url?: string | null;
  trend_note?: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  generated_content?: GeneratedContentDraft | GeneratedContentDraft[] | null;
  published_pins?: PublishedPinRecord | PublishedPinRecord[] | null;
}

function getProductContent(product: CampaignProductRecord): GeneratedContentDraft | null {
  if (!product.generated_content) return null;
  if (Array.isArray(product.generated_content)) {
    return product.generated_content[0] || null;
  }
  return product.generated_content;
}

interface CampaignRecord {
  id: string;
  name: string;
  niche?: string | null;
  status: string;
  owner_id: string;
  scheduled_at?: string | null;
  created_at: string;
  updated_at: string;
}

function ProductCard({
  product,
  campaign,
  affiliateTemplate,
  generateContentFn,
  generateImagePromptFn,
  saveContentFn,
  onSaved,
}: {
  product: CampaignProductRecord;
  campaign: CampaignRecord;
  affiliateTemplate: string;
  generateContentFn: ReturnType<typeof useServerFn<typeof generatePinContent>>;
  generateImagePromptFn: ReturnType<typeof useServerFn<typeof generateImagePrompt>>;
  saveContentFn: ReturnType<typeof useServerFn<typeof saveGeneratedContent>>;
  onSaved: () => void;
}) {
  const initialContent = getProductContent(product);
  const [draftContent, setDraftContent] = useState<GeneratedContentDraft | null>(initialContent);
  const [publishingNow, setPublishingNow] = useState(false);
  const [schedulingPin, setSchedulingPin] = useState(false);
  const [scheduleTime, setScheduleTime] = useState("");
  const [selectedBoardId, setSelectedBoardId] = useState("demo-board-1");

  const publishNowFn = useServerFn(publishPinNowServer);
  const schedulePinFn = useServerFn(schedulePinServer);
  const retryPublishFn = useServerFn(retryFailedPublishServer);

  const publishedRecord = Array.isArray(product.published_pins)
    ? product.published_pins[0]
    : product.published_pins;

  const handlePublishNowAction = async () => {
    setPublishingNow(true);
    try {
      await publishNowFn({
        data: {
          productId: product.id,
          boardId: selectedBoardId,
        },
      });
      toast.success("Pin published to Pinterest!");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Publishing failed");
    } finally {
      setPublishingNow(false);
    }
  };

  const handleSchedulePinAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleTime) {
      toast.error("Please pick a schedule date & time");
      return;
    }
    setSchedulingPin(true);
    try {
      await schedulePinFn({
        data: {
          productId: product.id,
          scheduledAt: new Date(scheduleTime).toISOString(),
          boardId: selectedBoardId,
        },
      });
      toast.success("Pin scheduled successfully!");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Scheduling failed");
    } finally {
      setSchedulingPin(false);
    }
  };

  const handleRetryPublishAction = async () => {
    setPublishingNow(true);
    try {
      await retryPublishFn({
        data: { productId: product.id },
      });
      toast.success("Retry succeeded! Pin published.");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Retry failed");
    } finally {
      setPublishingNow(false);
    }
  };
  const [generating, setGenerating] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatingFull, setGeneratingFull] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(initialContent?.image_url || null);
  const [saving, setSaving] = useState(false);

  const currentContent: GeneratedContentDraft = draftContent || {
    headline: "",
    description: "",
    pinterest_title: "",
    pin_description: "",
    affiliate_link: "",
    image_prompt: "",
  };

  const isCompleted = Boolean(
    (currentContent.headline || currentContent.pinterest_title) && imageUrl,
  );
  const isGenerating = generating || generatingImage || generatingFull;
  const isFailed = Boolean(errorMsg);

  const statusType = isGenerating
    ? "generating"
    : isFailed
      ? "failed"
      : isCompleted
        ? "completed"
        : "pending";

  const handleGenerateContent = async () => {
    setGenerating(true);
    setErrorMsg(null);
    try {
      const result = await generateContentFn({
        data: {
          campaignId: campaign.id,
          productId: product.id,
          productName: product.product_name,
          ...(product.trend_note ? { trendNote: product.trend_note } : {}),
          ...(campaign.niche ? { niche: campaign.niche } : {}),
          ...(affiliateTemplate ? { affiliateLinkTemplate: affiliateTemplate } : {}),
        },
      });
      const updated: GeneratedContentDraft = {
        ...currentContent,
        headline: result.headline,
        description: result.description,
        pinterest_title: result.pinTitle,
        pin_description: result.pinDescription,
        affiliate_link: result.affiliateLink,
      };
      setDraftContent(updated);
      await saveContentFn({
        data: {
          productId: product.id,
          headline: updated.headline || "",
          description: updated.description || "",
          pinTitle: updated.pinterest_title || "",
          pinDescription: updated.pin_description || "",
          affiliateLink: updated.affiliate_link || undefined,
          imagePrompt: updated.image_prompt || undefined,
          imageUrl: imageUrl || undefined,
        },
      });
      toast.success("Copy generated & saved");
      onSaved();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Copy generation failed";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateImage = async () => {
    setGeneratingImage(true);
    setErrorMsg(null);
    try {
      const promptResult = await generateImagePromptFn({
        data: {
          productName: product.product_name,
          ...(product.trend_note ? { trendNote: product.trend_note } : {}),
          ...(campaign.niche ? { niche: campaign.niche } : {}),
          ...(currentContent.headline ? { headline: currentContent.headline } : {}),
        },
      });
      const prompt = promptResult.imagePrompt;
      setDraftContent({ ...currentContent, image_prompt: prompt });

      let finalUrl: string | null = null;
      await streamImage("/api/generate-image", prompt, (url, final) => {
        if (url) {
          setImageUrl(url);
          finalUrl = url;
        }
        if (final) {
          setGeneratingImage(false);
          if (finalUrl) {
            setSaving(true);
            void saveContentFn({
              data: {
                productId: product.id,
                headline: currentContent.headline || "",
                description: currentContent.description || "",
                pinTitle: currentContent.pinterest_title || "",
                pinDescription: currentContent.pin_description || "",
                affiliateLink: currentContent.affiliate_link || undefined,
                imagePrompt: prompt,
                imageUrl: finalUrl,
              },
            })
              .then(() => {
                toast.success("Image generated & saved");
                onSaved();
              })
              .catch((err) => {
                toast.error(err instanceof Error ? err.message : "Failed to save image");
              })
              .finally(() => {
                setSaving(false);
              });
          }
        }
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Image generation failed";
      setErrorMsg(msg);
      toast.error(msg);
      setGeneratingImage(false);
    }
  };

  const handleFullPipeline = async () => {
    setGeneratingFull(true);
    setErrorMsg(null);
    try {
      const copyResult = await generateContentFn({
        data: {
          campaignId: campaign.id,
          productId: product.id,
          productName: product.product_name,
          ...(product.trend_note ? { trendNote: product.trend_note } : {}),
          ...(campaign.niche ? { niche: campaign.niche } : {}),
          ...(affiliateTemplate ? { affiliateLinkTemplate: affiliateTemplate } : {}),
        },
      });

      const promptResult = await generateImagePromptFn({
        data: {
          productName: product.product_name,
          ...(product.trend_note ? { trendNote: product.trend_note } : {}),
          ...(campaign.niche ? { niche: campaign.niche } : {}),
          ...(copyResult.headline ? { headline: copyResult.headline } : {}),
        },
      });

      let finalUrl: string | null = null;
      await streamImage("/api/generate-image", promptResult.imagePrompt, (url) => {
        if (url) {
          setImageUrl(url);
          finalUrl = url;
        }
      });

      const updated: GeneratedContentDraft = {
        headline: copyResult.headline,
        description: copyResult.description || copyResult.headline,
        pinterest_title: copyResult.pinTitle,
        pin_description: copyResult.pinDescription || copyResult.headline,
        affiliate_link: copyResult.affiliateLink,
        image_prompt: promptResult.imagePrompt,
      };

      setDraftContent(updated);

      await saveContentFn({
        data: {
          productId: product.id,
          headline: updated.headline || "",
          description: updated.description || "",
          pinTitle: updated.pinterest_title || "",
          pinDescription: updated.pin_description || "",
          ...(updated.affiliate_link ? { affiliateLink: updated.affiliate_link } : {}),
          imagePrompt: updated.image_prompt || undefined,
          ...(finalUrl ? { imageUrl: finalUrl } : {}),
        },
      });

      toast.success(`Completed pipeline for ${product.product_name}`);
      onSaved();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Pipeline failed";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setGeneratingFull(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveContentFn({
        data: {
          productId: product.id,
          headline: currentContent.headline || "",
          description: currentContent.description || "",
          pinTitle: currentContent.pinterest_title || "",
          pinDescription: currentContent.pin_description || "",
          affiliateLink: currentContent.affiliate_link || undefined,
          imagePrompt: currentContent.image_prompt || undefined,
          imageUrl: imageUrl || undefined,
        },
      });
      toast.success("Saved");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-3">
        <div>
          <CardTitle className="text-lg">{product.product_name}</CardTitle>
          <p className="text-sm text-muted-foreground">{product.trend_note}</p>
        </div>
        <div className="flex items-center gap-2">
          {statusType === "completed" && (
            <Badge variant="default" className="bg-emerald-600 text-white">
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Completed
            </Badge>
          )}
          {statusType === "generating" && (
            <Badge variant="secondary" className="animate-pulse bg-primary/20 text-primary">
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> Generating...
            </Badge>
          )}
          {statusType === "failed" && (
            <Badge variant="destructive">
              <AlertCircle className="mr-1 h-3.5 w-3.5" /> Failed
            </Badge>
          )}
          {statusType === "pending" && (
            <Badge variant="outline">
              <Clock className="mr-1 h-3.5 w-3.5" /> Pending
            </Badge>
          )}

          {statusType === "failed" ? (
            <Button
              size="sm"
              variant="outline"
              onClick={handleFullPipeline}
              disabled={isGenerating}
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Retry
            </Button>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              onClick={handleFullPipeline}
              disabled={isGenerating}
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5 text-primary" />
              {isCompleted ? "Re-generate All" : "Generate All"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {errorMsg && (
          <div className="mb-4 flex items-center justify-between rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <span>{errorMsg}</span>
            <Button size="sm" variant="ghost" onClick={handleFullPipeline} disabled={isGenerating}>
              <RotateCcw className="mr-1 h-3.5 w-3.5" /> Retry
            </Button>
          </div>
        )}

        <Tabs defaultValue="content" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="content">Copy</TabsTrigger>
            <TabsTrigger value="image">Image</TabsTrigger>
            <TabsTrigger value="publish">Publish</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-3">
            <div className="grid gap-3">
              <div className="space-y-1">
                <Label>Headline</Label>
                <Input
                  value={currentContent.headline || ""}
                  onChange={(e) => setDraftContent({ ...currentContent, headline: e.target.value })}
                  placeholder="Generated headline"
                />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea
                  value={currentContent.description || ""}
                  onChange={(e) =>
                    setDraftContent({ ...currentContent, description: e.target.value })
                  }
                  placeholder="Generated description"
                  rows={2}
                />
              </div>
              <div className="space-y-1">
                <Label>Pinterest Title</Label>
                <Input
                  value={currentContent.pinterest_title || ""}
                  onChange={(e) =>
                    setDraftContent({ ...currentContent, pinterest_title: e.target.value })
                  }
                  placeholder="Pinterest title"
                />
              </div>
              <div className="space-y-1">
                <Label>Pinterest Description</Label>
                <Textarea
                  value={currentContent.pin_description || ""}
                  onChange={(e) =>
                    setDraftContent({ ...currentContent, pin_description: e.target.value })
                  }
                  placeholder="Pinterest description"
                  rows={3}
                />
              </div>
              <div className="space-y-1">
                <Label>Affiliate Link</Label>
                <Input
                  value={currentContent.affiliate_link || ""}
                  onChange={(e) =>
                    setDraftContent({ ...currentContent, affiliate_link: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleGenerateContent} disabled={generating} size="sm">
                {generating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Generate copy
              </Button>
              <Button onClick={handleSave} disabled={saving} size="sm" variant="outline">
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="image" className="space-y-3">
            <div className="space-y-1">
              <Label>Image Prompt</Label>
              <Textarea
                value={currentContent.image_prompt || ""}
                onChange={(e) =>
                  setDraftContent({ ...currentContent, image_prompt: e.target.value })
                }
                placeholder="Describe the image you want to generate"
                rows={3}
              />
            </div>
            {imageUrl && (
              <div className="overflow-hidden rounded-lg border border-border">
                <img src={imageUrl} alt="Generated pin" className="w-full max-w-md object-cover" />
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={handleGenerateImage} disabled={generatingImage} size="sm">
                {generatingImage ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ImageIcon className="mr-2 h-4 w-4" />
                )}
                Generate image
              </Button>
              <Button onClick={handleSave} disabled={saving} size="sm" variant="outline">
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save image
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="publish" className="space-y-4">
            {publishedRecord ? (
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Publish Status</span>
                  {publishedRecord.status === "published" && (
                    <Badge variant="default" className="bg-emerald-600">
                      <CheckCircle2 className="mr-1 h-3 w-3" /> Published
                    </Badge>
                  )}
                  {publishedRecord.status === "scheduled" && (
                    <Badge variant="secondary">
                      <Clock className="mr-1 h-3 w-3" /> Scheduled
                    </Badge>
                  )}
                  {publishedRecord.status === "failed" && (
                    <Badge variant="destructive">
                      <AlertCircle className="mr-1 h-3 w-3" /> Failed
                    </Badge>
                  )}
                </div>

                {publishedRecord.pin_url && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Pinterest Pin URL:</span>
                    <a
                      href={publishedRecord.pin_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center font-medium text-primary hover:underline"
                    >
                      View Pin <ExternalLink className="ml-1 h-3.5 w-3.5" />
                    </a>
                  </div>
                )}

                {publishedRecord.scheduled_at && (
                  <div className="text-xs text-muted-foreground flex items-center">
                    <Calendar className="mr-1 h-3.5 w-3.5" />
                    Scheduled for: {new Date(publishedRecord.scheduled_at).toLocaleString()}
                  </div>
                )}

                {publishedRecord.error_message && (
                  <div className="rounded bg-destructive/10 p-2 text-xs text-destructive">
                    {publishedRecord.error_message}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  {publishedRecord.status === "failed" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRetryPublishAction}
                      disabled={publishingNow}
                    >
                      {publishingNow ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="mr-2 h-4 w-4" />
                      )}
                      Retry Failed Publish
                    </Button>
                  )}

                  {publishedRecord.status !== "published" && (
                    <Button
                      size="sm"
                      onClick={handlePublishNowAction}
                      disabled={publishingNow || !imageUrl}
                    >
                      {publishingNow ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Pin className="mr-2 h-4 w-4" />
                      )}
                      Publish Now
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs font-semibold text-[#222222]">
                      Pinterest Board Selection
                    </Label>
                    <select
                      value={selectedBoardId}
                      onChange={(e) => setSelectedBoardId(e.target.value)}
                      className="w-full rounded-md border border-[#E7E2D9] bg-white p-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1E4734]"
                    >
                      <option value="demo-board-1">
                        Affiliate Products & Must-Haves (demo-board-1)
                      </option>
                      <option value="demo-board-2">
                        DailyVerse AI Curated Pins (demo-board-2)
                      </option>
                      <option value="demo-board-3">
                        Trending Beauty & Skincare Serums (demo-board-3)
                      </option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={handlePublishNowAction}
                    disabled={publishingNow || !imageUrl}
                  >
                    {publishingNow ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Pin className="mr-2 h-4 w-4" />
                    )}
                    Publish Now
                  </Button>
                </div>

                <form onSubmit={handleSchedulePinAction} className="pt-3 border-t space-y-2">
                  <Label className="text-xs font-semibold">Schedule Pin</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="datetime-local"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="max-w-xs"
                    />
                    <Button type="submit" size="sm" variant="outline" disabled={schedulingPin}>
                      {schedulingPin ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Calendar className="mr-2 h-4 w-4" />
                      )}
                      Schedule
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
