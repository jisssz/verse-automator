/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageLayout } from "@/components/layout/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Image as ImageIcon,
  Sparkles,
  Download,
  RotateCcw,
  Search,
  ExternalLink,
  History,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { listProducts } from "@/lib/products.functions";
import {
  generateImagePrompt,
  generateAndStoreImage,
  listGeneratedImagesServer,
} from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/image-generator")({
  head: () => ({
    meta: [
      { title: "AI Luxury Image Generator — DailyVerse AI" },
      {
        name: "description",
        content: "Create editorial luxury Pinterest graphics using OpenAI DALL-E 3.",
      },
    ],
  }),
  component: ImageGeneratorPage,
});

const STYLE_PRESETS = [
  {
    name: "Editorial Botanical Photography",
    promptSuffix:
      "luxury organic botanical photography, soft natural studio lighting, shadows of tropical leaves, premium high-end skincare publication aesthetic",
  },
  {
    name: "Minimalist Jar Mockup",
    promptSuffix:
      "minimalist glass amber cosmetic jar product mockup, cream-colored neutral background, warm beige tones, soft shadows, high-end design studio",
  },
  {
    name: "Active Ingredients & Water Droplets",
    promptSuffix:
      "macro shot of clear gel serum texture, fresh water droplets, green botanical stems, bright natural light, crisp premium clean details",
  },
  {
    name: "Gold Accents Luxury Aesthetic",
    promptSuffix:
      "premium skincare product next to raw white marble piece, gold foil veins accent, warm desert light, ultra-luxury high fashion presentation",
  },
];

function ImageGeneratorPage() {
  const queryClient = useQueryClient();
  const [selectedProductId, setSelectedProductId] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [stylePreset, setStylePreset] = useState(STYLE_PRESETS[0]!.name);
  const [aspectRatio, setAspectRatio] = useState<"1024x1024" | "1024x1792" | "1792x1024">(
    "1024x1792",
  );

  // Output states
  const [generatedImageUrl, setGeneratedImageUrl] = useState("");
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);

  const listProductsFn = useServerFn(listProducts);
  const generatePromptFn = useServerFn(generateImagePrompt);
  const generateImageFn = useServerFn(generateAndStoreImage);
  const listImagesFn = useServerFn(listGeneratedImagesServer);

  const {
    data: products = [],
    isLoading: productsLoading,
    isError: productsError,
  } = useQuery({
    queryKey: ["products"],
    queryFn: () => listProductsFn({}),
    retry: 2,
  });

  const selectedProduct = products.find((p: any) => p.id === selectedProductId);

  // Fetch image history
  const {
    data: historyImages = [],
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ["generated-images", selectedProductId],
    queryFn: () => listImagesFn({ data: { productId: selectedProductId || undefined } }),
  });

  // Suggest prompt when product or style changes
  const handleSuggestPrompt = async () => {
    if (!selectedProduct) {
      toast.error("Please select a product first");
      return;
    }
    setIsGeneratingPrompt(true);
    try {
      const res = await generatePromptFn({
        data: {
          productName: selectedProduct.product_name,
          trendNote: selectedProduct.trend_note || undefined,
          niche: selectedProduct.product_category || undefined,
        },
      });
      // Combine with style suffix
      const suffix = STYLE_PRESETS.find((s) => s.name === stylePreset)?.promptSuffix || "";
      setCustomPrompt(`${res.prompt}. ${suffix}`);
      toast.success("AI suggested prompt generated!");
    } catch (e) {
      toast.error("Failed to suggest prompt");
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProduct) throw new Error("Select a product first");
      if (!customPrompt.trim()) throw new Error("Enter an image prompt first");

      const res = await generateImageFn({
        data: {
          prompt: customPrompt.trim(),
          productId: selectedProduct.id,
          size: aspectRatio,
        },
      });
      return res;
    },
    onSuccess: (result) => {
      setGeneratedImageUrl(result.imageUrl);
      void queryClient.invalidateQueries({ queryKey: ["generated-images", selectedProductId] });
      void refetchHistory();
      toast.success("Skincare pin graphic generated successfully! ✨");
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : "Image generation failed");
    },
  });

  const handleDownload = () => {
    if (!generatedImageUrl) return;
    window.open(generatedImageUrl, "_blank");
  };

  const handleRetryHistory = (img: any) => {
    setCustomPrompt(img.image_prompt);
    if (img.width === 1024 && img.height === 1792) setAspectRatio("1024x1792");
    else if (img.width === 1792 && img.height === 1024) setAspectRatio("1792x1024");
    else setAspectRatio("1024x1024");
    toast.success("Loaded history prompt into builder!");
  };

  return (
    <PageLayout contentClassName="max-w-6xl space-y-6 p-6 md:p-8 bg-[#F8F6F2]">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-[#E7E2D9] shadow-xs">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-[#222222]">
            AI Skincare Image Studio
          </h1>
          <p className="text-xs text-[#666666] mt-0.5">
            Design stunning Pinterest product pins using OpenAI DALL-E 3 with botanical lux
            aesthetics.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Control Column */}
        <Card className="luxury-card border-[#E7E2D9] lg:col-span-1">
          <CardHeader>
            <CardTitle className="font-serif text-lg text-[#222222]">Image Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Product Selector */}
            <div className="space-y-1.5">
              <Label htmlFor="productSelect" className="text-xs font-semibold">
                Select Target Product *
              </Label>
              {productsLoading ? (
                <div className="flex h-9 items-center px-3 border border-[#E7E2D9] rounded bg-white">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : productsError ? (
                <div className="flex h-9 items-center px-3 border border-red-200 rounded bg-red-50 text-xs text-red-600">
                  DB error — check Settings → Connection Tests
                </div>
              ) : (
                <select
                  id="productSelect"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-[#E7E2D9] bg-white text-xs"
                >
                  <option value="">-- Choose Product --</option>
                  {products.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.product_name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Style Selector */}
            <div className="space-y-1.5">
              <Label htmlFor="styleSelect" className="text-xs font-semibold">
                Editorial Art Style
              </Label>
              <select
                id="styleSelect"
                value={stylePreset}
                onChange={(e) => setStylePreset(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-[#E7E2D9] bg-white text-xs"
              >
                {STYLE_PRESETS.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Aspect Ratio */}
            <div className="space-y-1.5">
              <Label htmlFor="aspectSelect" className="text-xs font-semibold">
                Size (Pinterest friendly)
              </Label>
              <select
                id="aspectSelect"
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as any)}
                className="w-full h-9 px-3 rounded-md border border-[#E7E2D9] bg-white text-xs"
              >
                <option value="1024x1792">9:16 Tall (Pinterest Recommended)</option>
                <option value="1024x1024">1:1 Square</option>
                <option value="1792x1024">16:9 Wide</option>
              </select>
            </div>

            {/* Custom Prompt Box */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="promptInput" className="text-xs font-semibold">
                  Detailed Image Prompt *
                </Label>
                {selectedProductId && (
                  <Button
                    variant="link"
                    size="sm"
                    disabled={isGeneratingPrompt}
                    onClick={handleSuggestPrompt}
                    className="text-[#1E4734] font-semibold h-auto p-0 flex items-center gap-0.5"
                  >
                    {isGeneratingPrompt ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3 text-[#C8A96A]" /> Suggest Prompt
                      </>
                    )}
                  </Button>
                )}
              </div>
              <textarea
                id="promptInput"
                rows={5}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="w-full p-2.5 rounded-md border border-[#E7E2D9] bg-white text-xs focus:outline-none"
                placeholder="Enter description of what the AI should draw..."
              />
            </div>

            <Button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending || !selectedProductId || !customPrompt.trim()}
              className="w-full bg-[#1E4734] hover:bg-[#355E4D] text-white text-xs h-10"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin text-[#C8A96A]" /> Generating
                  Image...
                </>
              ) : (
                <>
                  <ImageIcon className="mr-1.5 h-4 w-4 text-[#C8A96A]" /> Draw Skincare Pin
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Right Output Column */}
        <Card className="luxury-card border-[#E7E2D9] lg:col-span-2">
          <CardHeader className="border-b border-[#E7E2D9] pb-3 flex flex-row items-center justify-between">
            <CardTitle className="font-serif text-lg text-[#222222]">
              Studio Render Output
            </CardTitle>
            {generatedImageUrl && (
              <Button
                onClick={handleDownload}
                className="bg-[#1E4734] hover:bg-[#355E4D] text-white text-xs h-8"
              >
                <Download className="mr-1.5 h-3.5 w-3.5 text-[#C8A96A]" /> Download / View Original
              </Button>
            )}
          </CardHeader>
          <CardContent className="pt-4 flex flex-col items-center justify-center">
            {generateMutation.isPending ? (
              <div className="py-20 text-center space-y-3">
                <Loader2 className="h-10 w-10 animate-spin text-[#C8A96A] mx-auto" />
                <p className="text-sm font-semibold text-[#1E4734]">
                  DALL-E 3 is painting your skincare serum...
                </p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Generating premium textures, shadows, and natural botanicals. This takes roughly
                  5-10 seconds.
                </p>
              </div>
            ) : generatedImageUrl ? (
              <div className="relative rounded-lg overflow-hidden border border-[#E7E2D9] max-h-[500px] bg-white flex items-center justify-center p-2 shadow-xs">
                <img
                  src={generatedImageUrl}
                  alt="Generated luxury asset"
                  className="max-h-[460px] object-contain rounded"
                />
              </div>
            ) : (
              <div className="py-24 text-center text-[#666666]/60">
                <ImageIcon className="h-12 w-12 text-[#C8A96A]/60 mx-auto mb-2" />
                <p className="text-sm font-semibold">Render studio is offline</p>
                <p className="text-xs max-w-sm mx-auto">
                  Configure products and style parameters in the left panel to launch DALL-E image
                  prompt graphics.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* History panel */}
      {selectedProductId && (
        <Card className="luxury-card border-[#E7E2D9] mt-6">
          <CardHeader className="pb-3 border-b border-[#E7E2D9]">
            <CardTitle className="font-serif text-lg text-[#222222] flex items-center gap-1.5">
              <History className="h-4 w-4 text-[#C8A96A]" /> Image Generation History
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {historyLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-[#1E4734]" />
              </div>
            ) : historyImages.length === 0 ? (
              <p className="text-xs text-center text-[#666666]/60 py-6">
                No previous generated images for this product.
              </p>
            ) : (
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 lg:grid-cols-5">
                {historyImages.map((img: any) => (
                  <div
                    key={img.id}
                    className="group relative rounded-lg border border-[#E7E2D9] overflow-hidden bg-white p-1 shadow-xs hover:border-[#1E4734] transition-all"
                  >
                    <img
                      src={img.image_url}
                      alt="History pin preview"
                      className="h-32 w-full object-cover rounded"
                    />
                    <div className="absolute inset-0 bg-[#132E22]/80 opacity-0 group-hover:opacity-100 flex flex-col justify-center items-center gap-2 transition-opacity p-2 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[#C8A96A] text-[#C8A96A] bg-[#1E4734] hover:bg-[#C8A96A] hover:text-[#132E22] text-[10px] h-7 px-2"
                        onClick={() => handleRetryHistory(img)}
                      >
                        <RotateCcw className="h-3 w-3 mr-0.5" /> Reload
                      </Button>
                      <a
                        href={img.image_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-white hover:underline flex items-center gap-0.5"
                      >
                        Original <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </PageLayout>
  );
}
