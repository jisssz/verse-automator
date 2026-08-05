import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sparkles, Pin, TrendingUp, Image as ImageIcon, Crown, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DailyVerse AI — Luxury Skincare AI Automation" },
      {
        name: "description",
        content:
          "Generate trending skincare product ideas, editorial Pinterest pin copy, and images. Export to Google Sheets and post to Pinterest automatically.",
      },
      {
        property: "og:title",
        content: "DailyVerse AI — Luxury Skincare AI Automation",
      },
      {
        property: "og:description",
        content:
          "Generate trending skincare product ideas, editorial Pinterest pin copy, and images. Export to Google Sheets and post to Pinterest automatically.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="bg-[#F8F6F2] text-[#222222] min-h-screen flex flex-col justify-between">
      {/* Hero Section */}
      <section className="mx-auto max-w-5xl px-4 py-24 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1E4734]/10 border border-[#C8A96A]/40 text-[#1E4734] text-xs font-semibold uppercase tracking-widest shadow-xs">
          <Crown className="h-3.5 w-3.5 text-[#C8A96A]" /> Luxury Skincare & Beauty AI Suite
        </div>

        <h1 className="font-serif text-5xl sm:text-6xl font-bold tracking-tight text-[#222222] leading-tight">
          Automate Your Luxury Beauty & Skincare Affiliate Pipeline
        </h1>

        <p className="mx-auto max-w-2xl text-base sm:text-lg text-[#666666] leading-relaxed">
          DailyVerse AI transforms skincare trends into editorial Pinterest pin copy,
          high-converting product prompts, Google Sheets exports, and automated Pinterest uploads.
        </p>

        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <Link to="/auth">
            <Button
              size="lg"
              className="bg-[#1E4734] hover:bg-[#355E4D] text-white font-medium shadow-md h-12 px-8 text-sm"
            >
              Launch Suite <ArrowRight className="ml-2 h-4 w-4 text-[#C8A96A]" />
            </Button>
          </Link>
          <Link to="/auth">
            <Button
              size="lg"
              variant="outline"
              className="border-[#E7E2D9] text-[#1E4734] hover:bg-[#F3EFE8] font-medium h-12 px-8 text-sm"
            >
              Instant Demo Access
            </Button>
          </Link>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={<TrendingUp className="h-6 w-6 text-[#1E4734]" />}
            title="Beauty Trend Intelligence"
            description="Generate 15 trending skincare & botanical product ideas tailored to high-converting Pinterest niches."
          />
          <FeatureCard
            icon={<Sparkles className="h-6 w-6 text-[#C8A96A]" />}
            title="Editorial Copywriting"
            description="Auto-write high-CTR titles, Pinterest descriptions, and affiliate link templates effortlessly."
          />
          <FeatureCard
            icon={<ImageIcon className="h-6 w-6 text-[#355E4D]" />}
            title="Luxury Pin Prompting"
            description="Produce 2:3 vertical product prompts and rendered imagery for aesthetic Pinterest boards."
          />
          <FeatureCard
            icon={<Pin className="h-6 w-6 text-[#1E4734]" />}
            title="Automated Publishing"
            description="Export to Google Sheets and schedule pins directly via Pinterest API and n8n webhooks."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E7E2D9] bg-[#FFFFFF]/60 py-8 text-center text-xs text-[#666666]">
        <div className="mx-auto max-w-6xl px-4">
          <p>
            © {new Date().getFullYear()} DailyVerse AI. Luxury Skincare Content Automation Suite.
          </p>
        </div>
      </footer>
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
    <div className="luxury-card rounded-2xl p-6 space-y-3">
      <div className="p-3 rounded-xl bg-[#F8F6F2] border border-[#E7E2D9] w-fit">{icon}</div>
      <h3 className="font-serif text-lg font-bold text-[#222222]">{title}</h3>
      <p className="text-xs text-[#666666] leading-relaxed">{description}</p>
    </div>
  );
}
