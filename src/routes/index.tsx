import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Pin,
  TrendingUp,
  Image as ImageIcon,
  Crown,
  ArrowRight,
  FileText,
  Link as LinkIcon,
  FolderKanban,
  BarChart3,
} from "lucide-react";

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
      {/* Hero Banner Image */}
      <section className="mx-auto max-w-5xl px-4 pt-12">
        <div className="relative w-full rounded-2xl overflow-hidden border border-[#C8A96A]/30 shadow-lg group">
          <img
            src="/brand/hero-banner.jpg"
            alt="DAILY VERSE - Skincare That Works"
            className="w-full h-auto object-cover transition-transform duration-700 ease-out group-hover:scale-[1.01]"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1E4734]/15 to-transparent pointer-events-none" />
        </div>
      </section>

      {/* Hero Content Section */}
      <section className="mx-auto max-w-4xl px-4 py-16 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1E4734]/10 border border-[#C8A96A]/40 text-[#1E4734] text-xs font-semibold uppercase tracking-widest shadow-xs">
          <Crown className="h-3.5 w-3.5 text-[#C8A96A]" /> Premium Beauty Curation
        </div>

        <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-[#1E4734] leading-tight max-w-3xl mx-auto">
          Automate Your Premium Skincare Affiliate Pipeline
        </h1>

        <p className="mx-auto max-w-2xl text-sm sm:text-base text-[#666666] leading-relaxed">
          DailyVerse AI transforms botanical beauty trends into editorial Pinterest pin copy,
          high-converting product prompts, Google Sheets exports, and automated Pinterest uploads.
        </p>

        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <Link to="/auth">
            <Button
              size="lg"
              className="bg-[#1E4734] hover:bg-[#355E4D] text-white font-medium shadow-md h-12 px-8 text-sm cursor-pointer"
            >
              Launch Suite <ArrowRight className="ml-2 h-4 w-4 text-[#C8A96A]" />
            </Button>
          </Link>
          <Link to="/auth">
            <Button
              size="lg"
              variant="outline"
              className="border-[#E7E2D9] text-[#1E4734] hover:bg-[#F3EFE8] font-medium h-12 px-8 text-sm cursor-pointer"
            >
              Instant Demo Access
            </Button>
          </Link>
        </div>
      </section>

      {/* Brand Story Section */}
      <section className="bg-[#FFFFFF]/40 border-y border-[#E7E2D9] py-16 px-4">
        <div className="mx-auto max-w-4xl space-y-6 text-center">
          <span className="text-xs uppercase tracking-widest text-[#C8A96A] font-semibold">
            Our Editorial Vision
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1E4734] tracking-tight">
            Bridging Luxury Skincare & Intelligent Automation
          </h2>
          <p className="mx-auto max-w-2xl text-xs sm:text-sm text-[#555555] leading-relaxed">
            DailyVerse AI was conceived to elevate the beauty affiliate marketing landscape. By
            blending editorial brand curation with AI technology, we help creators build aesthetic
            Pinterest showcases that highlight clean formulas, science-backed ingredients, and
            trusted reviews.
          </p>
          <div className="grid gap-6 sm:grid-cols-3 pt-6 text-left max-w-3xl mx-auto">
            <div className="space-y-1.5 p-4 rounded-xl bg-white/50 border border-[#E7E2D9]/60">
              <h4 className="font-serif text-sm font-bold text-[#1E4734]">Scientific Curation</h4>
              <p className="text-[11px] text-[#666666] leading-normal">
                Highlighting high-performance botanical actives, niacinamide, and peptides.
              </p>
            </div>
            <div className="space-y-1.5 p-4 rounded-xl bg-white/50 border border-[#E7E2D9]/60">
              <h4 className="font-serif text-sm font-bold text-[#1E4734]">Affiliate Automation</h4>
              <p className="text-[11px] text-[#666666] leading-normal">
                Streamlined templates that map product trends to high-converting affiliate systems.
              </p>
            </div>
            <div className="space-y-1.5 p-4 rounded-xl bg-white/50 border border-[#E7E2D9]/60">
              <h4 className="font-serif text-sm font-bold text-[#1E4734]">Aesthetic Design</h4>
              <p className="text-[11px] text-[#666666] leading-normal">
                Minimalist editorial Pinterest pins that feel comparable to top luxury skincare
                brands.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Generated Pinterest Pins Showcase */}
      <section className="mx-auto max-w-5xl px-4 py-16 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs uppercase tracking-widest text-[#C8A96A] font-semibold">
            Pinterest Automation Showcase
          </span>
          <h2 className="font-serif text-3xl font-bold text-[#1E4734]">
            Generated Editorial Pinterest Pins
          </h2>
          <p className="mx-auto max-w-xl text-xs text-[#666666]">
            High-converting visual assets generated by the DailyVerse copy & image engines.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 max-w-3xl mx-auto">
          <div className="glass-panel rounded-2xl p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:border-[#C8A96A] group">
            <div className="relative overflow-hidden rounded-xl aspect-[2/3]">
              <img
                src="/brand/pinterest-1.jpg"
                alt="Best Peptide Serums Pin"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute top-3 left-3 bg-[#1E4734] text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md shadow-xs">
                AI Generated Pin
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <h3 className="font-serif text-sm font-bold text-[#222222]">
                Best Peptide Serums Pin
              </h3>
              <p className="text-[11px] text-[#666666]">
                Optimized for Amazon Beauty Finds niche marketing.
              </p>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:border-[#C8A96A] group">
            <div className="relative overflow-hidden rounded-xl aspect-[2/3]">
              <img
                src="/brand/pinterest-2.jpg"
                alt="Green Tomato Pore Lifting Pin"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute top-3 left-3 bg-[#1E4734] text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md shadow-xs">
                AI Generated Pin
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <h3 className="font-serif text-sm font-bold text-[#222222]">
                Green Tomato Pore Lifting Ampoule
              </h3>
              <p className="text-[11px] text-[#666666]">
                Formulated with clean beauty & botanical identifiers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="mx-auto max-w-5xl px-4 py-16 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs uppercase tracking-widest text-[#C8A96A] font-semibold">
            Feature Highlights
          </span>
          <h2 className="font-serif text-3xl font-bold text-[#1E4734]">
            Everything You Need to Scale
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<FileText className="h-5 w-5 text-[#1E4734]" />}
            title="AI Copy Generation"
            description="Auto-write high-CTR titles, Pinterest descriptions, and botanical copywriting details."
          />
          <FeatureCard
            icon={<Pin className="h-5 w-5 text-[#C8A96A]" />}
            title="Pinterest Automation"
            description="Schedule pins directly through Pinterest API and queue background jobs securely."
          />
          <FeatureCard
            icon={<ImageIcon className="h-5 w-5 text-[#355E4D]" />}
            title="Image Generation"
            description="Produce 2:3 vertical product prompts and rendered imagery for aesthetic boards."
          />
          <FeatureCard
            icon={<LinkIcon className="h-5 w-5 text-[#1E4734]" />}
            title="Affiliate Links"
            description="Create clean, customized affiliate redirects and templates mapping trends."
          />
          <FeatureCard
            icon={<FolderKanban className="h-5 w-5 text-[#C8A96A]" />}
            title="Campaign Management"
            description="Organize beauty products into campaigns based on search volume."
          />
          <FeatureCard
            icon={<BarChart3 className="h-5 w-5 text-[#355E4D]" />}
            title="Analytics"
            description="Track Pinterest impressions, saves, and clicks to measure conversions."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E7E2D9] bg-[#FFFFFF]/60 py-10 text-center text-xs text-[#666666]">
        <div className="mx-auto max-w-5xl px-4 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2.5">
            <img
              src="/brand/logo.jpg"
              alt="DAILY VERSE logo"
              className="h-8 w-8 rounded-full object-cover border border-[#C8A96A]/30"
              loading="lazy"
            />
            <span className="font-serif text-sm font-bold text-[#1E4734]">DAILY VERSE</span>
          </div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
            Skincare That Works
          </p>
          <p className="text-[11px] text-[#888888] pt-2">
            © {new Date().getFullYear()} DAILY VERSE. Luxury Skincare Content Automation Suite.
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
      <h3 className="font-serif text-base font-bold text-[#222222]">{title}</h3>
      <p className="text-xs text-[#666666] leading-relaxed">{description}</p>
    </div>
  );
}
