import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { getProfile, updateProfile } from "@/lib/campaigns.functions";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — DailyVerse AI" },
      { name: "description", content: "Set your display name and affiliate link template." },
      { property: "og:title", content: "Settings — DailyVerse AI" },
      { property: "og:description", content: "Set your display name and affiliate link template." },
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
  const [template, setTemplate] = useState("");

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setTemplate(profile.affiliate_link_template ?? "");
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: () =>
      updateProfileFn({
        data: { displayName, affiliateLinkTemplate: template },
      }),
    onSuccess: () => {
      toast.success("Settings saved");
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-3xl font-bold tracking-tight text-foreground">Settings</h1>

        <Card>
          <CardHeader>
            <CardTitle>Profile & affiliate links</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  mutation.mutate();
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template">Affiliate link template</Label>
                  <Input
                    id="template"
                    value={template}
                    onChange={(e) => setTemplate(e.target.value)}
                    placeholder="https://example.com/search?q={{product}}&tag=yourtag-21"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use <code>{"{{product}}"}</code> where the product name should be inserted. Generated
                    pins will use this link automatically.
                  </p>
                </div>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save settings
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
