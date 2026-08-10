import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Pin,
  Image as ImageIcon,
  Crown,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Layers,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DailyVerse AI — Luxury Skincare Marketing Automation" },
      {
        name: "description",
        content:
          "Generate trending skincare product ideas, editorial Pinterest pin copy, and FLUX.1 AI images. Automated Pinterest syndication & n8n workflow pipeline.",
      },
      {
        property: "og:title",
        content: "DailyVerse AI — Luxury Skincare Marketing Automation",
      },
      {
        property: "og:description",
        content:
          "Generate trending skincare product ideas, editorial Pinterest pin copy, and FLUX.1 AI images. Automated Pinterest syndication & n8n workflow pipeline.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const workflowSteps = [
    {
      number: "01",
      title: "Botanical Product Curation",
      subtitle: "Discover high-yield skincare trends & peptide formulas",
      desc: "Import products directly from Amazon Beauty or Google Sheets. Extract active ingredient highlights, price points, and target affiliate links.",
      icon: Layers,
    },
    {
      number: "02",
      title: "AI Editorial Copy Generator",
      subtitle: "Generate high-CTR Pinterest titles & SEO descriptions",
      desc: "GPT-4 powered copywriter crafts botanical descriptions, Pinterest keyword hashtags, and embedded affiliate link redirects instantly.",
      icon: Sparkles,
    },
    {
      number: "03",
      title: "FLUX.1 AI Visual Engine",
      subtitle: "Render 9:16 vertical aesthetic product pins",
      desc: "Generate studio-grade skincare imagery optimized for Pinterest algorithms using the FLUX.1-dev model with fallback capabilities.",
      icon: ImageIcon,
    },
    {
      number: "04",
      title: "Automated Syndication & n8n",
      subtitle: "Scheduled Pinterest board publishing & analytics",
      desc: "Automatically push pins to active Pinterest boards, queue background jobs (`pin_jobs`), and monitor click-through conversions in real time.",
      icon: Pin,
    },
  ];

  const faqs = [
    {
      q: "How does DailyVerse AI automate Pinterest syndication?",
      a: "DailyVerse AI connects directly to the official Pinterest REST API v5. It generates pin titles, descriptions, and FLUX.1 AI images, then automatically publishes them to your target Pinterest boards or schedules them via our secure background job runner.",
    },
    {
      q: "Does it require paid OpenAI image generation API keys?",
      a: "No! DailyVerse AI features native integration with Hugging Face's FLUX.1-dev free tier model, allowing high-resolution 9:16 Pinterest image generation out of the box with optional OpenAI DALL-E 3 fallback.",
    },
    {
      q: "Can I connect custom n8n workflows?",
      a: "Yes. DailyVerse AI includes a dedicated `/api/n8n/pipeline` endpoint and exported workflow JSON templates for seamless n8n automation triggers.",
    },
    {
      q: "How do affiliate link templates work?",
      a: "You can define global affiliate link structures in Settings (e.g. `https://amazon.com/dp/{{product}}?tag=yourtag-20`). The system automatically substitutes product identifiers during copy generation.",
    },
  ];

  return (
    <div className="bg-[#F8F6F2] text-[#222222] min-h-screen flex flex-col justify-between selection:bg-[#C8A96A]/30">
      {/* Hero Section — Cinematic Mesh Radial Lighting */}
      <section className="relative overflow-hidden pt-16 pb-24 px-4 bg-mesh-dark text-white border-b border-[#C8A96A]/30">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none animate-pulse-glow" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#C8A96A]/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="mx-auto max-w-6xl space-y-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C8A96A]/20 border border-[#C8A96A]/50 text-[#C8A96A] text-xs font-semibold uppercase tracking-widest shadow-lg animate-float">
            <Crown className="h-3.5 w-3.5" /> Luxury Skincare AI Automation
          </div>

          <h1 className="font-serif text-5xl sm:text-7xl font-extrabold tracking-tight text-white leading-[1.08] max-w-5xl mx-auto drop-shadow-sm">
            Automate Beauty Content & Syndication
          </h1>

          <p className="mx-auto max-w-2xl text-sm sm:text-base text-[#F8F6F2]/80 leading-relaxed font-light">
            DailyVerse AI transforms botanical skincare formulas into editorial Pinterest pins, FLUX.1 visual renderings, and automated affiliate growth pipelines.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link to="/auth">
              <Button
                size="lg"
                className="bg-[#C8A96A] hover:bg-[#D4AF37] text-[#132E22] font-bold shadow-xl h-12 px-8 text-sm cursor-pointer hover-lift rounded-full"
              >
                Launch Automation Suite <ArrowRight className="ml-2 h-4 w-4 text-[#132E22]" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button
                size="lg"
                variant="outline"
                className="border-[#C8A96A]/40 text-white bg-white/5 hover:bg-white/10 font-medium h-12 px-8 text-sm cursor-pointer rounded-full backdrop-blur-md"
              >
                Explore Demo Workspace
              </Button>
            </Link>
          </div>

          {/* Hero Overlapping Glass Composition */}
          <div className="pt-10 mx-auto max-w-5xl relative">
            <div className="relative rounded-2xl overflow-hidden border border-[#C8A96A]/50 shadow-2xl group glass-panel-dark p-2 text-left">
              <img
                src="/brand/hero-banner.jpg"
                alt="DAILY VERSE - Skincare That Works"
                className="w-full h-auto rounded-xl object-cover transition-transform duration-700 ease-out group-hover:scale-[1.01]"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#132E22]/80 via-transparent to-transparent pointer-events-none" />

              {/* Floating Glass Badges */}
              <div className="absolute bottom-6 left-6 hidden sm:flex items-center gap-3 bg-[#132E22]/90 backdrop-blur-xl px-4 py-2.5 rounded-xl border border-[#C8A96A]/40 shadow-2xl">
                <div className="p-2 rounded-lg bg-[#C8A96A]/20 text-[#C8A96A]">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-white">FLUX.1 AI Engine</p>
                  <p className="text-[10px] text-[#C8A96A]">9:16 Studio Visual Rendering</p>
                </div>
              </div>

              <div className="absolute bottom-6 right-6 hidden sm:flex items-center gap-3 bg-[#132E22]/90 backdrop-blur-xl px-4 py-2.5 rounded-xl border border-[#C8A96A]/40 shadow-2xl">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-white">Pinterest API v5</p>
                  <p className="text-[10px] text-emerald-400 font-medium">Automatic Pin Syndication</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Counter Section */}
      <section className="bg-[#132E22] text-[#F8F6F2] py-14 border-b border-[#C8A96A]/20">
        <div className="mx-auto max-w-6xl px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="space-y-1">
            <p className="font-serif text-4xl sm:text-5xl font-extrabold text-[#C8A96A]">1.4M+</p>
            <p className="text-[11px] text-[#F8F6F2]/70 uppercase tracking-widest font-medium">Pins Syndicated</p>
          </div>
          <div className="space-y-1">
            <p className="font-serif text-4xl sm:text-5xl font-extrabold text-[#C8A96A]">99.4%</p>
            <p className="text-[11px] text-[#F8F6F2]/70 uppercase tracking-widest font-medium">Automation Health</p>
          </div>
          <div className="space-y-1">
            <p className="font-serif text-4xl sm:text-5xl font-extrabold text-[#C8A96A]">&lt; 1.2s</p>
            <p className="text-[11px] text-[#F8F6F2]/70 uppercase tracking-widest font-medium">FLUX.1 Generation</p>
          </div>
          <div className="space-y-1">
            <p className="font-serif text-4xl sm:text-5xl font-extrabold text-[#C8A96A]">100%</p>
            <p className="text-[11px] text-[#F8F6F2]/70 uppercase tracking-widest font-medium">Supabase RLS Protected</p>
          </div>
        </div>
      </section>

      {/* Interactive AI Automation Stepper */}
      <section className="mx-auto max-w-5xl px-4 py-20 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs uppercase tracking-widest text-[#C8A96A] font-semibold">
            Seamless Workflow Architecture
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1E4734]">
            How DailyVerse AI Operates
          </h2>
          <p className="mx-auto max-w-xl text-xs sm:text-sm text-[#666666]">
            From botanical product discovery to live Pinterest syndication in four automated steps.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-12 items-center">
          {/* Step Selector List */}
          <div className="lg:col-span-5 space-y-3">
            {workflowSteps.map((step, idx) => {
              const Icon = step.icon;
              const isSelected = activeStep === idx;
              return (
                <button
                  key={step.number}
                  onClick={() => setActiveStep(idx)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                    isSelected
                      ? "bg-[#1E4734] text-white border-[#C8A96A] shadow-md"
                      : "bg-white text-[#222222] border-[#E7E2D9] hover:border-[#C8A96A]"
                  }`}
                >
                  <div
                    className={`p-2.5 rounded-xl text-xs font-bold shrink-0 ${
                      isSelected
                        ? "bg-[#C8A96A] text-[#132E22]"
                        : "bg-[#F8F6F2] text-[#1E4734] border border-[#E7E2D9]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono tracking-wider opacity-80 uppercase">
                      Step {step.number}
                    </span>
                    <h3 className="font-serif text-sm font-bold leading-tight">{step.title}</h3>
                    <p className={`text-[11px] mt-1 line-clamp-1 ${isSelected ? "text-white/80" : "text-[#666666]"}`}>
                      {step.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Step Detail Preview Card */}
          {(() => {
            const currentStep = workflowSteps[activeStep] || workflowSteps[0] || {
              number: "01",
              title: "Botanical Product Curation",
              subtitle: "Discover high-yield skincare trends & peptide formulas",
              desc: "Import products directly from Amazon Beauty or Google Sheets.",
              icon: Layers,
            };
            return (
              <div className="lg:col-span-7">
                <div className="luxury-card rounded-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden bg-white border-[#E7E2D9] shadow-xl">
                  <div className="flex items-center justify-between border-b border-[#E7E2D9] pb-4">
                    <Badge variant="outline" className="border-[#C8A96A] text-[#1E4734] font-semibold text-xs bg-[#F8F6F2]">
                      Active Step {currentStep.number}
                    </Badge>
                    <span className="text-xs text-[#666666] font-mono">DailyVerse Engine v2.0</span>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-serif text-2xl font-bold text-[#1E4734]">
                      {currentStep.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#555555] leading-relaxed">
                      {currentStep.desc}
                    </p>
                  </div>

                  {/* Mock Engine Interface */}
                  <div className="p-4 rounded-xl bg-[#F8F6F2] border border-[#E7E2D9] font-mono text-[11px] space-y-2 text-[#222222]">
                    <div className="flex items-center justify-between text-[#1E4734] font-bold">
                      <span>STATUS: READY</span>
                      <span className="text-emerald-700">● LIVE</span>
                    </div>
                    <p className="text-[#666666] truncate">&gt; Initializing {currentStep.title}...</p>
                    <p className="text-[#1E4734] font-semibold">&gt; Payload validated. Executing Supabase RLS transaction.</p>
                  </div>

                  <div className="pt-2">
                    <Link to="/auth">
                      <Button className="w-full bg-[#1E4734] hover:bg-[#355E4D] text-white font-medium text-xs h-10 cursor-pointer">
                        Try {currentStep.title} <ArrowRight className="ml-2 h-3.5 w-3.5 text-[#C8A96A]" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* Generated Pinterest Showcase Grid */}
      <section className="mx-auto max-w-5xl px-4 py-16 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs uppercase tracking-widest text-[#C8A96A] font-semibold">
            Pinterest Asset Generator
          </span>
          <h2 className="font-serif text-3xl font-bold text-[#1E4734]">
            FLUX.1 Rendered Skincare Pins
          </h2>
          <p className="mx-auto max-w-xl text-xs text-[#666666]">
            Editorial 9:16 visuals produced automatically by the DailyVerse visual renderer.
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
                FLUX.1 Rendered Pin
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <h3 className="font-serif text-sm font-bold text-[#222222]">
                Peptide Infused Hydrating Serum
              </h3>
              <p className="text-[11px] text-[#666666]">
                Optimized for luxury beauty Pinterest niche boards.
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
                FLUX.1 Rendered Pin
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <h3 className="font-serif text-sm font-bold text-[#222222]">
                Green Tomato Pore Lifting Ampoule
              </h3>
              <p className="text-[11px] text-[#666666]">
                Botanic extraction & peptide collagen restoration highlights.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards Section */}
      <section className="bg-[#FFFFFF]/60 border-y border-[#E7E2D9] py-20 px-4">
        <div className="mx-auto max-w-5xl space-y-12 text-center">
          <div className="space-y-3">
            <span className="text-xs uppercase tracking-widest text-[#C8A96A] font-semibold">
              Flexible Pricing Tiers
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1E4734]">
              Elevate Your Affiliate Automation
            </h2>
            <p className="mx-auto max-w-xl text-xs sm:text-sm text-[#666666]">
              Choose the right tier to scale your skincare Pinterest syndication.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-3 pt-4">
              <span className={`text-xs font-semibold ${billingCycle === "monthly" ? "text-[#1E4734]" : "text-[#666666]"}`}>
                Monthly Billing
              </span>
              <button
                onClick={() => setBillingCycle(billingCycle === "monthly" ? "annual" : "monthly")}
                className="relative h-6 w-11 rounded-full bg-[#1E4734] p-0.5 transition-colors cursor-pointer"
              >
                <div
                  className={`h-5 w-5 rounded-full bg-[#C8A96A] transition-transform ${
                    billingCycle === "annual" ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <span className={`text-xs font-semibold ${billingCycle === "annual" ? "text-[#1E4734]" : "text-[#666666]"}`}>
                Annual Billing <Badge variant="secondary" className="bg-[#C8A96A]/20 text-[#1E4734] text-[10px] ml-1">Save 20%</Badge>
              </span>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-3 text-left">
            {/* Starter Tier */}
            <div className="luxury-card rounded-2xl p-6 sm:p-8 space-y-6 flex flex-col justify-between border-[#E7E2D9]">
              <div className="space-y-4">
                <h3 className="font-serif text-xl font-bold text-[#1E4734]">Starter</h3>
                <p className="text-xs text-[#666666]">For individual beauty affiliate creators starting out.</p>
                <div className="flex items-baseline gap-1">
                  <span className="font-serif text-4xl font-bold text-[#1E4734]">
                    ${billingCycle === "annual" ? "29" : "39"}
                  </span>
                  <span className="text-xs text-[#666666]">/ month</span>
                </div>
                <div className="space-y-2.5 pt-4 text-xs text-[#555555]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#C8A96A]" /> 100 AI Pin Generations / mo
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#C8A96A]" /> FLUX.1 Engine Integration
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#C8A96A]" /> 1 Pinterest Account Sync
                  </div>
                </div>
              </div>
              <Link to="/auth" className="pt-6">
                <Button variant="outline" className="w-full border-[#E7E2D9] text-[#1E4734] hover:bg-[#F8F6F2] font-medium text-xs h-11 cursor-pointer">
                  Get Started
                </Button>
              </Link>
            </div>

            {/* Professional Tier (Popular) */}
            <div className="luxury-card rounded-2xl p-6 sm:p-8 space-y-6 flex flex-col justify-between border-[#C8A96A] bg-[#132E22] text-white shadow-2xl relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#C8A96A] text-[#132E22] text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full shadow-xs">
                Most Popular
              </div>
              <div className="space-y-4">
                <h3 className="font-serif text-xl font-bold text-[#C8A96A]">Professional</h3>
                <p className="text-xs text-white/80">For growing affiliate agencies & multi-board curation.</p>
                <div className="flex items-baseline gap-1">
                  <span className="font-serif text-4xl font-bold text-white">
                    ${billingCycle === "annual" ? "79" : "99"}
                  </span>
                  <span className="text-xs text-white/70">/ month</span>
                </div>
                <div className="space-y-2.5 pt-4 text-xs text-white/90">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#C8A96A]" /> Unlimited AI Pin Copy & Images
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#C8A96A]" /> n8n Automated Pipeline Route
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#C8A96A]" /> 5 Pinterest Accounts Sync
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#C8A96A]" /> Real-Time Conversion Analytics
                  </div>
                </div>
              </div>
              <Link to="/auth" className="pt-6">
                <Button className="w-full bg-[#C8A96A] hover:bg-[#b59556] text-[#132E22] font-bold text-xs h-11 cursor-pointer">
                  Launch Professional
                </Button>
              </Link>
            </div>

            {/* Enterprise Tier */}
            <div className="luxury-card rounded-2xl p-6 sm:p-8 space-y-6 flex flex-col justify-between border-[#E7E2D9]">
              <div className="space-y-4">
                <h3 className="font-serif text-xl font-bold text-[#1E4734]">Enterprise</h3>
                <p className="text-xs text-[#666666]">Custom syndication for beauty brands & networks.</p>
                <div className="flex items-baseline gap-1">
                  <span className="font-serif text-4xl font-bold text-[#1E4734]">
                    ${billingCycle === "annual" ? "199" : "249"}
                  </span>
                  <span className="text-xs text-[#666666]">/ month</span>
                </div>
                <div className="space-y-2.5 pt-4 text-xs text-[#555555]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#C8A96A]" /> Custom Webhook Infrastructure
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#C8A96A]" /> Dedicated Supabase RLS Project
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#C8A96A]" /> Priority FLUX.1 Render Queue
                  </div>
                </div>
              </div>
              <Link to="/auth" className="pt-6">
                <Button variant="outline" className="w-full border-[#E7E2D9] text-[#1E4734] hover:bg-[#F8F6F2] font-medium text-xs h-11 cursor-pointer">
                  Contact Enterprise
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="mx-auto max-w-3xl px-4 py-20 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs uppercase tracking-widest text-[#C8A96A] font-semibold">
            Frequently Asked Questions
          </span>
          <h2 className="font-serif text-3xl font-bold text-[#1E4734]">
            Everything You Need to Know
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={faq.q}
              className="luxury-card rounded-2xl p-5 border-[#E7E2D9] transition-all"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between text-left font-serif text-base font-bold text-[#1E4734] cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`h-4 w-4 text-[#C8A96A] transition-transform ${openFaq === idx ? "rotate-180" : ""}`} />
              </button>
              {openFaq === idx && (
                <p className="text-xs text-[#666666] leading-relaxed pt-3 border-t border-[#E7E2D9]/60 mt-3">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E7E2D9] bg-[#FFFFFF]/60 py-10 text-center text-xs text-[#666666]">
        <div className="mx-auto max-w-5xl px-4 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2.5">
            <img
              src="/brand/logo.jpg"
              alt="DAILY VERSE logo"
              className="h-8 w-8 rounded-full object-cover border border-[#C8A96A]/30 shadow-xs"
              loading="lazy"
            />
            <span className="font-serif text-sm font-bold text-[#1E4734]">DAILY VERSE AI</span>
          </div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
            Luxury Skincare Automation Platform
          </p>
          <p className="text-[11px] text-[#888888] pt-2">
            © {new Date().getFullYear()} DAILY VERSE AI. Built with Supabase, TanStack Start & FLUX.1.
          </p>
        </div>
      </footer>
    </div>
  );
}
