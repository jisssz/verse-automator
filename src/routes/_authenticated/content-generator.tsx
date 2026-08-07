/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageLayout } from "@/components/layout/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Sparkles,
  Copy,
  Save,
  RefreshCw,
  Search,
  Tag,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { listProducts } from "@/lib/products.functions";
import {
  generatePinContent,
  generateSeoKeywords,
  generateHashtags,
  saveGeneratedContent,
} from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/content-generator")({
  head: () => ({
    meta: [
      { title: "AI Luxury Content Generator — DailyVerse AI" },
      {
        name: "description",
        content: "Generate editorial high-end Pinterest title & descriptions optimized for SEO.",
      },
    ],
  }),
  component: ContentGeneratorPage,
});

function ContentGeneratorPage() {
  const queryClient = useQueryClient();
  const [selectedProductId, setSelectedProductId] = useState("");
  const [promptOverride, setPromptOverride] = useState("");
  const [keywordList, setKeywordList] = useState<string[]>([]);
  const [hashtagList, setHashtagList] = useState<string[]>([]);

  // Generated Outputs
  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [pinTitle, setPinTitle] = useState("");
  const [pinDescription, setPinDescription] = useState("");
  const [cta, setCta] = useState("Shop Luxury Skincare");

  const listProductsFn = useServerFn(listProducts);
  const generatePinFn = useServerFn(generatePinContent);
  const generateKeywordsFn = useServerFn(generateSeoKeywords);
  const generateHashtagsFn = useServerFn(generateHashtags);
  const saveContentFn = useServerFn(saveGeneratedContent);

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => listProductsFn({}),
  });

  const selectedProduct = products.find((p: any) => p.id === selectedProductId);

  // Auto-fill prompt when product changes
  useEffect(() => {
    if (selectedProduct) {
      setPromptOverride(
        selectedProduct.trend_note ? `Focus on theme: ${selectedProduct.trend_note}` : "",
      );
    }
  }, [selectedProductId, products]);

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProduct) throw new Error("Select a product first");

      const [copyRes, keywordsRes, hashtagsRes] = await Promise.all([
        generatePinFn({
          data: {
            productId: selectedProduct.id,
            productName: selectedProduct.product_name,
            campaignId: selectedProduct.campaign_id || "00000000-0000-0000-0000-000000000000",
            trendNote: promptOverride || selectedProduct.trend_note || undefined,
            niche: selectedProduct.product_category || undefined,
          },
        }),
        generateKeywordsFn({
          data: {
            productName: selectedProduct.product_name,
            niche: selectedProduct.product_category || undefined,
          },
        }),
        generateHashtagsFn({
          data: {
            productName: selectedProduct.product_name,
            niche: selectedProduct.product_category || undefined,
            platform: "pinterest",
          },
        }),
      ]);

      return {
        copy: copyRes,
        keywords: keywordsRes.keywords || [],
        hashtags: hashtagsRes.hashtags || [],
      };
    },
    onSuccess: (result) => {
      setHeadline(result.copy.headline || "");
      setDescription(result.copy.description || "");
      setPinTitle(result.copy.pinterest_title || "");
      setPinDescription(result.copy.pin_description || "");
      setKeywordList(result.keywords);
      setHashtagList(result.hashtags);
      toast.success("Luxury Copy generated successfully! ✨");
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProduct) throw new Error("Select a product first");
      await saveContentFn({
        data: {
          productId: selectedProduct.id,
          headline,
          description,
          pinTitle,
          pinDescription,
          imageUrl: selectedProduct.image_url || undefined,
          affiliateLink: selectedProduct.affiliate_link || selectedProduct.source_url || undefined,
        },
      });
    },
    onSuccess: () => {
      toast.success("Content saved to product database!");
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : "Failed to save content");
    },
  });

  const handleCopy = (text: string, type: string) => {
    if (!text) return;
    void navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard!`);
  };

  const handleKeywordsStr = () => keywordList.join(", ");
  const handleHashtagsStr = () => hashtagList.join(" ");

  return (
    <PageLayout contentClassName="max-w-6xl space-y-6 p-6 md:p-8 bg-[#F8F6F2]">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-[#E7E2D9] shadow-xs">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-[#222222]">
            AI Copywriter Studio
          </h1>
          <p className="text-xs text-[#666666] mt-0.5">
            Optimize titles, descriptions, and hashtags with luxury editorial tone matching the
            DailyVerse identity.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Input Configuration Panel */}
        <Card className="luxury-card border-[#E7E2D9] lg:col-span-1">
          <CardHeader>
            <CardTitle className="font-serif text-lg text-[#222222]">Generation Config</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Product Selector */}
            <div className="space-y-1.5">
              <Label htmlFor="productSelect" className="text-xs font-semibold">
                Select Skincare Product
              </Label>
              {productsLoading ? (
                <div className="flex h-9 items-center px-3 border border-[#E7E2D9] rounded bg-white">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
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
                      [{p.product_category}] {p.product_name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Custom Prompt Context */}
            <div className="space-y-1.5">
              <Label htmlFor="promptOverride" className="text-xs font-semibold">
                AI Creative Prompt Context
              </Label>
              <textarea
                id="promptOverride"
                rows={4}
                value={promptOverride}
                onChange={(e) => setPromptOverride(e.target.value)}
                className="w-full p-2.5 rounded-md border border-[#E7E2D9] bg-white text-xs focus:outline-none"
                placeholder="e.g. Elegant evening serum routine, highlight hyaluronic benefits and organic jasmine oil..."
              />
            </div>

            {/* CTA Option */}
            <div className="space-y-1.5">
              <Label htmlFor="ctaInput" className="text-xs font-semibold">
                Call-To-Action (CTA)
              </Label>
              <Input
                id="ctaInput"
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                className="bg-white border-[#E7E2D9] text-xs h-9"
              />
            </div>

            <Button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending || !selectedProductId}
              className="w-full bg-[#1E4734] hover:bg-[#355E4D] text-white text-xs h-10"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin text-[#C8A96A]" /> Generating
                  Copy...
                </>
              ) : (
                <>
                  <Sparkles className="mr-1.5 h-4 w-4 text-[#C8A96A]" /> Generate Luxury Copy
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Generated Copy Output Studio */}
        <Card className="luxury-card border-[#E7E2D9] lg:col-span-2">
          <CardHeader className="border-b border-[#E7E2D9] pb-3 flex flex-row items-center justify-between">
            <CardTitle className="font-serif text-lg text-[#222222]">AI Creative Output</CardTitle>
            {selectedProduct && (
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !pinTitle}
                className="bg-[#1E4734] hover:bg-[#355E4D] text-white text-xs h-8"
              >
                <Save className="mr-1 h-3.5 w-3.5 text-[#C8A96A]" /> Save to Product
              </Button>
            )}
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {!pinTitle && !generateMutation.isPending ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-[#666666]/60">
                <Sparkles className="h-10 w-10 text-[#C8A96A]/60 mb-2" />
                <p className="text-sm font-semibold">Copywriter studio is empty</p>
                <p className="text-xs">
                  Select a product and configure prompts to generate luxury marketing pin copy.
                </p>
              </div>
            ) : generateMutation.isPending ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-[#1E4734]">
                <Loader2 className="h-10 w-10 animate-spin text-[#C8A96A] mb-3" />
                <p className="text-sm font-semibold">Generating Luxury Copywriter Copy...</p>
                <p className="text-xs text-muted-foreground">
                  OpenAI is creating editorial Pinterest listings matching DailyVerse parameters.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Pinterest Pin Title */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-semibold text-[#222222]">
                      Pinterest Pin Title
                    </Label>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-[#666666]"
                      onClick={() => handleCopy(pinTitle, "Pin Title")}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Input
                    value={pinTitle}
                    onChange={(e) => setPinTitle(e.target.value)}
                    className="bg-white border-[#E7E2D9] text-xs h-9 font-serif font-semibold"
                  />
                </div>

                {/* Pinterest Pin Description */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-semibold text-[#222222]">
                      Pinterest Pin Description
                    </Label>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-[#666666]"
                      onClick={() => handleCopy(pinDescription, "Pin Description")}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <textarea
                    rows={5}
                    value={pinDescription}
                    onChange={(e) => setPinDescription(e.target.value)}
                    className="w-full p-2.5 rounded-md border border-[#E7E2D9] bg-white text-xs focus:outline-none leading-relaxed"
                  />
                </div>

                {/* SEO Keywords Badges */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-semibold text-[#222222] flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5 text-[#C8A96A]" /> SEO Keyword Strategy
                    </Label>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-[#666666]"
                      onClick={() => handleCopy(handleKeywordsStr(), "Keywords")}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {keywordList.map((k) => (
                      <Badge
                        key={k}
                        variant="outline"
                        className="border-[#C8A96A]/20 bg-[#C8A96A]/5 text-[#1E4734] text-[10px] px-2 py-0.5"
                      >
                        {k}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Suggested Hashtags */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-semibold text-[#222222] flex items-center gap-1">
                      <Tag className="h-3.5 w-3.5 text-[#C8A96A]" /> Pinterest Tag/Hashtags
                    </Label>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-[#666666]"
                      onClick={() => handleCopy(handleHashtagsStr(), "Hashtags")}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {hashtagList.map((h) => (
                      <Badge
                        key={h}
                        variant="secondary"
                        className="bg-[#1E4734]/15 text-[#1E4734] text-[10px] px-2 py-0.5"
                      >
                        {h}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
