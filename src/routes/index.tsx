import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sparkles, Pin, TrendingUp, Image } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DailyVerse AI — Automate Your Pinterest Affiliate Content" },
      { name: "description", content: "Generate trending product ideas, AI-written pins, and images. Export to Google Sheets and post to Pinterest automatically." },
      { property: "og:title", content: "DailyVerse AI — Automate Your Pinterest Affiliate Content" },
      { property: "og:description", content: "Generate trending product ideas, AI-written pins, and images. Export to Google Sheets and post to Pinterest automatically." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="bg-background text-foreground">
      <section className="mx-auto max-w-6xl px-4 py-20 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">
          Automate Your Pinterest Affiliate Content
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          DailyVerse AI turns a single niche into a week of trending product ideas, AI-written pins, ready-to-post images, and scheduled Pinterest uploads.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link to="/auth">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link to="/auth">
            <Button size="lg" variant="outline">
              Sign in
            </Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={<TrendingUp className="h-6 w-6" />}
            title="Trend Collection"
            description="Generate 15 trending product ideas for any niche using AI."
          />
          <FeatureCard
            icon={<Sparkles className="h-6 w-6" />}
            title="AI Copywriting"
            description="Auto-write headlines, descriptions, and Pinterest-optimized titles."
          />
          <FeatureCard
            icon={<Image className="h-6 w-6" />}
            title="Image Generation"
            description="Create vertical 2:3 pin images with AI image models."
          />
          <FeatureCard
            icon={<Pin className="h-6 w-6" />}
            title="Auto Publishing"
            description="Export to Google Sheets and post to Pinterest automatically."
          />
        </div>
      </section>

      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Built as a portfolio project for an AI-powered affiliate marketing workflow.
          </p>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 text-primary">{icon}</div>
      <h3 className="text-lg font-semibold text-card-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
