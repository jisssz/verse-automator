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
import {
  Loader2,
  Sparkles,
  Image as ImageIcon,
  Pin,
  Download,
  ArrowLeft,
  Save,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { getCampaignWithProducts, getProfile } from "@/lib/campaigns.functions";
import { generatePinContent, generateImagePrompt, saveGeneratedContent } from "@/lib/ai.functions";
import { streamImage } from "@/lib/streamImage";

export const Route = createFileRoute("/_authenticated/campaigns/$id")({
  head: ({ params }) => ({
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
  const [bulkRunning, setBulkRunning] = useState(false);

  const getCampaignFn = useServerFn(getCampaignWithProducts);
  const getProfileFn = useServerFn(getProfile);
  const generateContentFn = useServerFn(generatePinContent);
  const generateImagePromptFn = useServerFn(generateImagePrompt);
  const saveContentFn = useServerFn(saveGeneratedContent);

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
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground">Campaign not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            It may have been deleted or you don't have access.
          </p>
          <Link to="/dashboard" className="mt-4 inline-block">
            <Button variant="outline">Back to dashboard</Button>
          </Link>
        </div>
      </div>
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
  const affiliateTemplate = profile?.affiliate_link_template ?? "";

  async function handleGenerateAll() {
    setBulkRunning(true);
    let ok = 0;
    for (const product of products) {
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
        await saveContentFn({
          data: {
            productId: product.id,
            headline: result.headline,
            description: result.description || result.headline,
            pinTitle: result.pinTitle,
            pinDescription: result.pinDescription || result.headline,
            ...(result.affiliateLink ? { affiliateLink: result.affiliateLink } : {}),
          },
        });
        ok += 1;
      } catch (e) {
        console.error(e);
      }
    }
    setBulkRunning(false);
    toast.success(`Generated copy for ${ok} of ${products.length} products`);
    void queryClient.invalidateQueries({ queryKey: ["campaign", id] });
  }

  function handleExportCsv() {
    const rows = [
      ["Product", "Trend note", "Headline", "Description", "Pin title", "Pin description", "Affiliate link", "Image URL"],
      ...products.map((p: any) => {
        const c = p.generated_content?.[0] ?? {};
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
    toast.success("CSV exported — import it into Google Sheets");
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{campaign.name}</h1>
            <p className="text-muted-foreground">Niche: {campaign.niche || "General"}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleGenerateAll} disabled={bulkRunning}>
              {bulkRunning ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Generate all copy
            </Button>
            <Button variant="outline" onClick={handleExportCsv}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <Badge variant="outline">{products.length} products</Badge>
          <Badge variant="outline">Status: {campaign.status || "draft"}</Badge>
          {!affiliateTemplate && (
            <Badge variant="secondary">
              No affiliate template — set one in Settings
            </Badge>
          )}
        </div>

        <div className="space-y-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              campaign={campaign}
              affiliateTemplate={affiliateTemplate}
              generateContentFn={generateContentFn}
              generateImagePromptFn={generateImagePromptFn}
              saveContentFn={saveContentFn}
              onSaved={() => {
                void queryClient.invalidateQueries({ queryKey: ["campaign", id] });
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
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
  product: any;
  campaign: any;
  affiliateTemplate: string;
  generateContentFn: ReturnType<typeof useServerFn<typeof generatePinContent>>;
  generateImagePromptFn: ReturnType<typeof useServerFn<typeof generateImagePrompt>>;
  saveContentFn: ReturnType<typeof useServerFn<typeof saveGeneratedContent>>;
  onSaved: () => void;
}) {
  const [content, setContent] = useState(product.generated_content?.[0] || null);
  const [generating, setGenerating] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(product.generated_content?.[0]?.image_url || null);
  const [saving, setSaving] = useState(false);

  const existingContent = content || {
    headline: "",
    description: "",
    pinterest_title: "",
    pin_description: "",
    affiliate_link: "",
    image_prompt: "",
  };

  const handleGenerateContent = async () => {
    setGenerating(true);
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
      setContent({
        ...existingContent,
        headline: result.headline,
        description: result.description,
        pinterest_title: result.pinTitle,
        pin_description: result.pinDescription,
        affiliate_link: result.affiliateLink,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateImage = async () => {
    setGeneratingImage(true);
    try {
      const promptResult = await generateImagePromptFn({
        data: {
          productName: product.product_name,
          ...(product.trend_note ? { trendNote: product.trend_note } : {}),
          ...(campaign.niche ? { niche: campaign.niche } : {}),
          ...(existingContent.headline ? { headline: existingContent.headline } : {}),
        },
      });
      const prompt = promptResult.imagePrompt;
      setContent({ ...existingContent, image_prompt: prompt });

      await streamImage("/api/generate-image", prompt, (url, final) => {
        if (url) setImageUrl(url);
        if (final) setGeneratingImage(false);
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Image generation failed");
      setGeneratingImage(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveContentFn({
        data: {
          productId: product.id,
          headline: existingContent.headline,
          description: existingContent.description,
          pinTitle: existingContent.pinterest_title,
          pinDescription: existingContent.pin_description,
          affiliateLink: existingContent.affiliate_link || undefined,
          imagePrompt: existingContent.image_prompt || undefined,
          imageUrl: imageUrl || undefined,
        },
      });
      onSaved();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{product.product_name}</CardTitle>
        <p className="text-sm text-muted-foreground">{product.trend_note}</p>
      </CardHeader>
      <CardContent>
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
                  value={existingContent.headline}
                  onChange={(e) => setContent({ ...existingContent, headline: e.target.value })}
                  placeholder="Generated headline"
                />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea
                  value={existingContent.description}
                  onChange={(e) => setContent({ ...existingContent, description: e.target.value })}
                  placeholder="Generated description"
                  rows={2}
                />
              </div>
              <div className="space-y-1">
                <Label>Pinterest Title</Label>
                <Input
                  value={existingContent.pinterest_title}
                  onChange={(e) => setContent({ ...existingContent, pinterest_title: e.target.value })}
                  placeholder="Pinterest title"
                />
              </div>
              <div className="space-y-1">
                <Label>Pinterest Description</Label>
                <Textarea
                  value={existingContent.pin_description}
                  onChange={(e) => setContent({ ...existingContent, pin_description: e.target.value })}
                  placeholder="Pinterest description"
                  rows={3}
                />
              </div>
              <div className="space-y-1">
                <Label>Affiliate Link</Label>
                <Input
                  value={existingContent.affiliate_link}
                  onChange={(e) => setContent({ ...existingContent, affiliate_link: e.target.value })}
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
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="image" className="space-y-3">
            <div className="space-y-1">
              <Label>Image Prompt</Label>
              <Textarea
                value={existingContent.image_prompt || ""}
                onChange={(e) => setContent({ ...existingContent, image_prompt: e.target.value })}
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
                  <Image className="mr-2 h-4 w-4" />
                )}
                Generate image
              </Button>
              <Button onClick={handleSave} disabled={saving} size="sm" variant="outline">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save image
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="publish" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Publish this pin to Pinterest or export to Google Sheets. Connect your accounts in settings first.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button disabled size="sm" variant="outline">
                <Pin className="mr-2 h-4 w-4" />
                Post to Pinterest
              </Button>
              <Button disabled size="sm" variant="outline">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export to Sheets
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
