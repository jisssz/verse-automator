/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
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
  Search,
  Edit,
  Trash2,
  ExternalLink,
  Layers,
  Tag,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/lib/products.functions";
import { listCampaigns } from "@/lib/campaigns.functions";

export const Route = createFileRoute("/_authenticated/products")({
  head: () => ({
    meta: [
      { title: "Affiliate Products Directory — DailyVerse AI" },
      {
        name: "description",
        content: "Manage your luxury botanical and skincare affiliate product inventory.",
      },
    ],
  }),
  component: ProductsPage,
});

const SKINCARE_CATEGORIES = [
  "Botanical Serums",
  "Facial Oils",
  "Hydrating Creams",
  "Pore Cleansers",
  "Toners & Mists",
  "Eye Care",
  "Sun Protection",
  "Other Skincare",
];

function ProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Dialog States
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);

  // Form Field States
  const [name, setName] = useState("");
  const [category, setCategory] = useState(SKINCARE_CATEGORIES[0]);
  const [sourceUrl, setSourceUrl] = useState("");
  const [description, setDescription] = useState("");
  const [affiliateLink, setAffiliateLink] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [trendNote, setTrendNote] = useState("");
  const [campaignId, setCampaignId] = useState("");

  const listProductsFn = useServerFn(listProducts);
  const listCampaignsFn = useServerFn(listCampaigns);
  const createProductFn = useServerFn(createProduct);
  const updateProductFn = useServerFn(updateProduct);
  const deleteProductFn = useServerFn(deleteProduct);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => listProductsFn({}),
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => listCampaignsFn(),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      await createProductFn({
        data: {
          productName: name.trim(),
          productCategory: category,
          sourceUrl: sourceUrl.trim() || null,
          description: description.trim() || null,
          affiliateLink: affiliateLink.trim() || null,
          trendNote: trendNote.trim() || null,
          tags,
          campaignId: campaignId || null,
        },
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Skincare Product Added Successfully ✨");
      resetForm();
      setCreateDialogOpen(false);
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : "Failed to add product");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      await updateProductFn({
        data: {
          productId: editProduct.id,
          productName: name.trim(),
          productCategory: category,
          sourceUrl: sourceUrl.trim() || null,
          description: description.trim() || null,
          affiliateLink: affiliateLink.trim() || null,
          trendNote: trendNote.trim() || null,
          tags,
          campaignId: campaignId || null,
        },
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product Updated Successfully");
      resetForm();
      setEditProduct(null);
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : "Failed to update product");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      await deleteProductFn({ data: { productId } });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted successfully");
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : "Failed to delete product");
    },
  });

  const resetForm = () => {
    setName("");
    setCategory(SKINCARE_CATEGORIES[0]);
    setSourceUrl("");
    setDescription("");
    setAffiliateLink("");
    setTagsInput("");
    setTrendNote("");
    setCampaignId("");
  };

  const handleEditClick = (product: any) => {
    setEditProduct(product);
    setName(product.product_name);
    setCategory(product.product_category);
    setSourceUrl(product.source_url || "");
    setDescription(product.description || "");
    setAffiliateLink(product.affiliate_link || "");
    setTagsInput((product.tags || []).join(", "));
    setTrendNote(product.trend_note || "");
    setCampaignId(product.campaign_id || "");
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate();
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    updateMutation.mutate();
  };

  const filteredProducts = products.filter((product: any) => {
    const term = search.toLowerCase();
    const matchesSearch =
      product.product_name.toLowerCase().includes(term) ||
      (product.description || "").toLowerCase().includes(term) ||
      (product.tags || []).some((t: string) => t.toLowerCase().includes(term));
    const matchesCategory = categoryFilter === "All" || product.product_category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <PageLayout contentClassName="max-w-6xl space-y-6 p-6 md:p-8 bg-[#F8F6F2]">
      {/* Premium Header Card */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-[#E7E2D9] shadow-xs">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-[#222222]">
            Skincare Product Inventory
          </h1>
          <p className="text-xs text-[#666666] mt-0.5">
            Add manual Amazon items, configure affiliate links, and prepare descriptions for AI
            marketing generation.
          </p>
        </div>

        {/* Add Product Modal Button */}
        <Dialog
          open={createDialogOpen}
          onOpenChange={(open) => {
            setCreateDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-[#1E4734] hover:bg-[#355E4D] text-white text-xs h-9">
              <Plus className="mr-1.5 h-4 w-4 text-[#C8A96A]" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg bg-[#F8F6F2] border-[#E7E2D9]">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl text-[#222222]">
                Add Luxury Skincare Product
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="name" className="text-xs font-semibold">
                    Product Name *
                  </Label>
                  <Input
                    id="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white border-[#E7E2D9]"
                    placeholder="e.g. Advanced Retinol Youth Serum"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="category" className="text-xs font-semibold">
                    Category *
                  </Label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-[#E7E2D9] bg-white text-xs"
                  >
                    {SKINCARE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="campaign" className="text-xs font-semibold">
                    Associate Campaign
                  </Label>
                  <select
                    id="campaign"
                    value={campaignId}
                    onChange={(e) => setCampaignId(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-[#E7E2D9] bg-white text-xs"
                  >
                    <option value="">None</option>
                    {campaigns.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sourceUrl" className="text-xs font-semibold">
                  Amazon / Source URL
                </Label>
                <Input
                  id="sourceUrl"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  className="bg-white border-[#E7E2D9]"
                  placeholder="https://amazon.com/..."
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="affiliateLink" className="text-xs font-semibold">
                  Affiliate Link
                </Label>
                <Input
                  id="affiliateLink"
                  value={affiliateLink}
                  onChange={(e) => setAffiliateLink(e.target.value)}
                  className="bg-white border-[#E7E2D9]"
                  placeholder="https://amzn.to/..."
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs font-semibold">
                  Product Description
                </Label>
                <textarea
                  id="description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-md border border-[#E7E2D9] bg-white text-xs focus:outline-none"
                  placeholder="Enter luxurious botanical details or benefits..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="tags" className="text-xs font-semibold">
                    Tags (comma separated)
                  </Label>
                  <Input
                    id="tags"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="bg-white border-[#E7E2D9]"
                    placeholder="organic, anti-aging, vegan"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="trendNote" className="text-xs font-semibold">
                    AI Trend Note
                  </Label>
                  <Input
                    id="trendNote"
                    value={trendNote}
                    onChange={(e) => setTrendNote(e.target.value)}
                    className="bg-white border-[#E7E2D9]"
                    placeholder="e.g. Glowing skin morning routine"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full bg-[#1E4734] hover:bg-[#355E4D] text-white"
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#C8A96A]" />
                ) : (
                  "Save Product ✨"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters & Search section */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#666666]" />
          <Input
            placeholder="Search products by title, tag, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white border-[#E7E2D9] focus-visible:ring-[#1E4734] text-xs h-9"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-9 px-3 rounded-md border border-[#E7E2D9] bg-white text-xs w-full sm:w-48"
        >
          <option value="All">All Categories</option>
          {SKINCARE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Edit Product Modal */}
      <Dialog
        open={editProduct !== null}
        onOpenChange={(open) => {
          if (!open) setEditProduct(null);
        }}
      >
        <DialogContent className="max-w-lg bg-[#F8F6F2] border-[#E7E2D9]">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-[#222222]">
              Edit Skincare Product
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="editName" className="text-xs font-semibold">
                  Product Name *
                </Label>
                <Input
                  id="editName"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white border-[#E7E2D9]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="editCategory" className="text-xs font-semibold">
                  Category *
                </Label>
                <select
                  id="editCategory"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-[#E7E2D9] bg-white text-xs"
                >
                  {SKINCARE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="editCampaign" className="text-xs font-semibold">
                  Associate Campaign
                </Label>
                <select
                  id="editCampaign"
                  value={campaignId}
                  onChange={(e) => setCampaignId(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-[#E7E2D9] bg-white text-xs"
                >
                  <option value="">None</option>
                  {campaigns.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editSourceUrl" className="text-xs font-semibold">
                Amazon / Source URL
              </Label>
              <Input
                id="editSourceUrl"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                className="bg-white border-[#E7E2D9]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editAffiliateLink" className="text-xs font-semibold">
                Affiliate Link
              </Label>
              <Input
                id="editAffiliateLink"
                value={affiliateLink}
                onChange={(e) => setAffiliateLink(e.target.value)}
                className="bg-white border-[#E7E2D9]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editDescription" className="text-xs font-semibold">
                Product Description
              </Label>
              <textarea
                id="editDescription"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2.5 rounded-md border border-[#E7E2D9] bg-white text-xs focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="editTags" className="text-xs font-semibold">
                  Tags (comma separated)
                </Label>
                <Input
                  id="editTags"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="bg-white border-[#E7E2D9]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="editTrendNote" className="text-xs font-semibold">
                  AI Trend Note
                </Label>
                <Input
                  id="editTrendNote"
                  value={trendNote}
                  onChange={(e) => setTrendNote(e.target.value)}
                  className="bg-white border-[#E7E2D9]"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="w-full bg-[#1E4734] hover:bg-[#355E4D] text-white"
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#C8A96A]" />
              ) : (
                "Save Changes"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Product List Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#1E4734]" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card className="border-[#E7E2D9] p-12 text-center bg-white space-y-3">
          <Layers className="mx-auto h-8 w-8 text-[#C8A96A]" />
          <p className="text-sm font-medium text-[#222222]">
            No products matching filter criteria.
          </p>
          <p className="text-xs text-[#666666]">
            Add a product from the top-right button to start building your luxury brand collection.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product: any) => (
            <Card
              key={product.id}
              className="luxury-card border-[#E7E2D9] flex flex-col justify-between"
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <Badge
                      variant="secondary"
                      className="bg-[#1E4734]/10 text-[#1E4734] text-[10px] font-medium mb-1"
                    >
                      {product.product_category}
                    </Badge>
                    <CardTitle className="font-serif text-base text-[#222222] line-clamp-1">
                      {product.product_name}
                    </CardTitle>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-[#666666] hover:bg-[#1E4734]/10 hover:text-[#1E4734]"
                      onClick={() => handleEditClick(product)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:bg-destructive/10"
                      onClick={() => deleteMutation.mutate(product.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-2 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  {product.description && (
                    <p className="text-xs text-[#666666] line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  )}

                  {product.tags && product.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {product.tags.map((t: string) => (
                        <Badge
                          key={t}
                          variant="outline"
                          className="border-[#C8A96A]/30 text-[#C8A96A] text-[9px] px-1 py-0 h-4"
                        >
                          <Tag className="h-2 w-2 mr-0.5 shrink-0" /> {t}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {product.trend_note && (
                    <div className="rounded-lg bg-[#C8A96A]/10 border border-[#C8A96A]/20 p-2 text-[10px] text-[#1E4734] flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-[#C8A96A]" />
                      <span className="line-clamp-1 font-medium">{product.trend_note}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-[#E7E2D9] pt-3 mt-4 flex items-center justify-between gap-2 text-xs">
                  {product.affiliate_link ? (
                    <a
                      href={product.affiliate_link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#1E4734] hover:underline font-semibold flex items-center gap-1"
                    >
                      Affiliate URL <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-[#666666]/60 italic text-[11px]">No affiliate link</span>
                  )}

                  {product.source_url && (
                    <a
                      href={product.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#666666] hover:underline text-[11px] flex items-center gap-0.5"
                    >
                      Amazon Page <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageLayout>
  );
}
