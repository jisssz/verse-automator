import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { listCampaigns, createCampaign, deleteCampaign } from "@/lib/campaigns.functions";
import { generateTrendIdeas } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — DailyVerse AI" },
      { name: "description", content: "Manage your affiliate content campaigns." },
      { property: "og:title", content: "Dashboard — DailyVerse AI" },
      { property: "og:description", content: "Manage your affiliate content campaigns." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [niche, setNiche] = useState("");

  const listCampaignsFn = useServerFn(listCampaigns);
  const createCampaignFn = useServerFn(createCampaign);
  const generateTrendsFn = useServerFn(generateTrendIdeas);
  const deleteCampaignFn = useServerFn(deleteCampaign);

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => listCampaignsFn(),
  });

  const createMutation = useMutation({
    mutationFn: async ({ name, niche }: { name: string; niche: string }) => {
      const trends = await generateTrendsFn({ data: { niche, count: 15 } });
      const products = trends.ideas.map((idea) => ({
        productName: idea.productName,
        trendNote: idea.trendNote,
      }));
      return createCampaignFn({ data: { name, niche, products } });
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      void navigate({ to: "/campaigns/$id", params: { id: result.campaignId } });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => deleteCampaignFn({ data: { id } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !niche.trim()) return;
    createMutation.mutate({ name: name.trim(), niche: niche.trim() });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Campaigns</h1>
            <p className="mt-1 text-muted-foreground">
              Create a campaign from a niche. AI generates 15 trending products, pin copy, and images.
            </p>
          </div>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              New Campaign
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="name">Campaign name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Summer Kitchen Gadgets"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="niche">Niche / topic</Label>
                <Input
                  id="niche"
                  placeholder="e.g., kitchen gadgets, home decor, beauty"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  required
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="w-full"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating trends…
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Generate Campaign
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <h2 className="mb-4 text-xl font-semibold text-foreground">Your campaigns</h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-12 text-center">
            <p className="text-muted-foreground">No campaigns yet. Create one above.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((campaign) => (
              <Card key={campaign.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="line-clamp-1 text-lg">{campaign.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{campaign.niche || "No niche"}</p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-end">
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      to="/campaigns/$id"
                      params={{ id: campaign.id }}
                    >
                      <Button variant="outline" size="sm">
                        Open
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => deleteMutation.mutate({ id: campaign.id })}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
