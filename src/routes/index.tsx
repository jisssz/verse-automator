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
  Youtube,
  ExternalLink,
  TrendingUp,
  Heart,
  Play,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DailyVerse AI — Luxury Skincare Automation & Pinterest Growth" },
      {
        name: "description",
        content:
          "Scale your beauty affiliate income & Pinterest traffic automatically. Generate luxury skincare copy, studio-grade aesthetic pin graphics, and scheduled board syndication.",
      },
      {
        property: "og:title",
        content: "DailyVerse AI — Luxury Skincare Automation & Pinterest Growth",
      },
      {
        property: "og:description",
        content:
          "Scale your beauty affiliate income & Pinterest traffic automatically. Generate luxury skincare copy, studio-grade aesthetic pin graphics, and scheduled board syndication.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const consumerSteps = [
    {
      number: "01",
      title: "Choose Skincare Product",
      subtitle: "Import trending botanical serums & formulas",
      desc: "Select high-converting skincare formulas from Amazon Beauty or curated product lists. DailyVerse highlights key ingredients and affiliate links automatically.",
      icon: Layers,
    },
    {
      number: "02",
      title: "Generate Editorial Content",
      subtitle: "Craft high-CTR Pinterest titles & SEO descriptions",
      desc: "Our AI copywriter generates elegant botanical descriptions, high-traffic Pinterest search hashtags, and affiliate link redirects instantly.",
      icon: Sparkles,
    },
    {
      number: "03",
      title: "Create Luxury Skincare Images",
      subtitle: "Render 9:16 vertical aesthetic pin graphics",
      desc: "Produce studio-grade skincare visual assets optimized for Pinterest's visual algorithm with soft lighting and organic botanicals.",
      icon: ImageIcon,
    },
    {
      number: "04",
      title: "Publish to Pinterest",
      subtitle: "Automated board syndication & traffic analytics",
      desc: "Schedule and auto-publish pins directly to your targeted Pinterest boards while tracking audience engagement and affiliate clicks.",
      icon: Pin,
    },
  ];

  const faqs = [
    {
      q: "How does DailyVerse AI help grow Pinterest affiliate revenue?",
      a: "DailyVerse AI automates your entire Pinterest workflow—from discovering trending skincare products to writing high-CTR titles and generating studio-grade 9:16 visual pin graphics. By consistently publishing aesthetic, SEO-optimized pins to targeted boards, you build organic traffic and maximize affiliate click-throughs.",
    },
    {
      q: "Can I use DailyVerse AI for my own skincare or beauty brand?",
      a: "Absolutely. DailyVerse AI is designed for beauty creators, affiliate marketers, and luxury skincare brands alike. You can easily connect your own product links, brand logos, and custom Pinterest boards.",
    },
    {
      q: "Do I need graphic design or copywriting skills?",
      a: "Not at all. DailyVerse AI handles all visual rendering and copywriting for you. Simply select or paste a skincare product link, and our AI produces publication-ready Pinterest assets in seconds.",
    },
    {
      q: "Where can I see live DailyVerse content and video walkthroughs?",
      a: "Check out our official YouTube channel @DailyVerse-skincare for live tutorials, and follow our Pinterest profile @DailyVerse07 to see our aesthetic pin collection in real time!",
    },
  ];

  return (
    <div className="bg-[#F8F6F2] text-[#222222] min-h-screen flex flex-col justify-between selection:bg-[#C8A96A]/30">
      {/* SECTION 1: Luxury Hero */}
      <section className="relative overflow-hidden pt-16 pb-24 px-4 bg-mesh-dark aurora-bg-animate text-white border-b border-[#C8A96A]/30">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none animate-pulse-glow" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#C8A96A]/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="mx-auto max-w-6xl space-y-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C8A96A]/20 border border-[#C8A96A]/50 text-[#C8A96A] text-xs font-semibold uppercase tracking-widest shadow-lg animate-float-slow backdrop-blur-md">
            <Crown className="h-3.5 w-3.5" /> Luxury Skincare AI Automation
          </div>

          <h1 className="font-serif text-5xl sm:text-7xl font-extrabold tracking-tight text-white leading-[1.08] max-w-5xl mx-auto drop-shadow-sm">
            Scale Skincare Traffic & Affiliate Revenue on Pinterest
          </h1>

          <p className="mx-auto max-w-2xl text-sm sm:text-base text-[#F8F6F2]/80 leading-relaxed font-light">
            DailyVerse AI transforms botanical beauty formulas into editorial pin copy, studio-grade visual graphics, and automated growth pipelines.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link to="/auth">
              <Button
                size="lg"
                className="bg-[#C8A96A] hover:bg-[#D4AF37] text-[#132E22] font-bold shadow-xl h-12 px-8 text-sm cursor-pointer magnetic-hover rounded-full beam-light-effect"
              >
                Launch Creator Suite <ArrowRight className="ml-2 h-4 w-4 text-[#132E22]" />
              </Button>
            </Link>
            <a
              href="https://www.youtube.com/@DailyVerse-skincare"
              target="_blank"
              rel="noreferrer"
            >
              <Button
                size="lg"
                variant="outline"
                className="border-[#C8A96A]/40 text-white bg-white/5 hover:bg-white/10 font-medium h-12 px-8 text-sm cursor-pointer rounded-full backdrop-blur-md magnetic-hover"
              >
                <Youtube className="mr-2 h-4 w-4 text-red-400" /> Watch on YouTube
              </Button>
            </a>
          </div>

          {/* Hero Overlapping Glass Visual Showcase */}
          <div className="pt-10 mx-auto max-w-5xl relative">
            <div className="relative rounded-2xl overflow-hidden border border-[#C8A96A]/50 shadow-2xl group glass-panel-dark p-2 text-left card-3d-tilt beam-light-effect">
              <img
                src="/brand/hero-banner.jpg"
                alt="DAILY VERSE - Skincare That Works"
                className="w-full h-auto rounded-xl object-cover transition-transform duration-700 ease-out group-hover:scale-[1.015]"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#132E22]/80 via-transparent to-transparent pointer-events-none" />

              {/* Floating Glass Badges */}
              <div className="absolute bottom-6 left-6 hidden sm:flex items-center gap-3 bg-[#132E22]/90 backdrop-blur-xl px-4 py-2.5 rounded-xl border border-[#C8A96A]/40 shadow-2xl">
                <div className="p-2 rounded-lg bg-[#C8A96A]/20 text-[#C8A96A]">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-white">Aesthetic Visual Studio</p>
                  <p className="text-[10px] text-[#C8A96A]">9:16 Studio Skincare Pins</p>
                </div>
              </div>

              <div className="absolute bottom-6 right-6 hidden sm:flex items-center gap-3 bg-[#132E22]/90 backdrop-blur-xl px-4 py-2.5 rounded-xl border border-[#C8A96A]/40 shadow-2xl">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-white">Pinterest Syndication</p>
                  <p className="text-[10px] text-emerald-400 font-medium">Automated Board Publishing</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: Trusted by Creators & Live Statistics */}
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
            <p className="font-serif text-4xl sm:text-5xl font-extrabold text-[#C8A96A]">4.8 / 5</p>
            <p className="text-[11px] text-[#F8F6F2]/70 uppercase tracking-widest font-medium">Creator Satisfaction</p>
          </div>
          <div className="space-y-1">
            <p className="font-serif text-4xl sm:text-5xl font-extrabold text-[#C8A96A]">100%</p>
            <p className="text-[11px] text-[#F8F6F2]/70 uppercase tracking-widest font-medium">Automated Scheduling</p>
          </div>
        </div>
      </section>

      {/* SECTION 3: What DailyVerse Does */}
      <section className="bg-white py-20 border-b border-[#E7E2D9]">
        <div className="mx-auto max-w-6xl px-4 space-y-12">
          <div className="text-center space-y-3">
            <Badge variant="outline" className="border-[#C8A96A] text-[#1E4734] font-semibold text-xs bg-[#F8F6F2]">
              All-In-One Beauty Platform
            </Badge>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1E4734]">
              Everything You Need for Pinterest Growth
            </h2>
            <p className="mx-auto max-w-xl text-xs sm:text-sm text-[#666666]">
              Replace manual design and copywriting with one continuous luxury content engine.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="luxury-card rounded-2xl p-6 sm:p-8 space-y-4 border-[#E7E2D9] hover:border-[#C8A96A]">
              <div className="p-3 rounded-xl bg-[#1E4734] text-[#C8A96A] w-fit">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#1E4734]">AI Pinterest Copywriting</h3>
              <p className="text-xs text-[#666666] leading-relaxed">
                Generate high-CTR titles, editorial botanical descriptions, and SEO-optimized hashtags embedded with your affiliate links.
              </p>
            </div>

            <div className="luxury-card rounded-2xl p-6 sm:p-8 space-y-4 border-[#E7E2D9] hover:border-[#C8A96A]">
              <div className="p-3 rounded-xl bg-[#1E4734] text-[#C8A96A] w-fit">
                <ImageIcon className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#1E4734]">Luxury Visual Generation</h3>
              <p className="text-xs text-[#666666] leading-relaxed">
                Render studio-grade 9:16 vertical skincare photography featuring botanical textures, soft lighting, and luxury aesthetics.
              </p>
            </div>

            <div className="luxury-card rounded-2xl p-6 sm:p-8 space-y-4 border-[#E7E2D9] hover:border-[#C8A96A]">
              <div className="p-3 rounded-xl bg-[#1E4734] text-[#C8A96A] w-fit">
                <Pin className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#1E4734]">Automatic Board Syndication</h3>
              <p className="text-xs text-[#666666] leading-relaxed">
                Schedule and publish directly to targeted Pinterest boards automatically to maintain consistent organic growth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: How It Works Timeline */}
      <section className="mx-auto max-w-5xl px-4 py-20 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs uppercase tracking-widest text-[#C8A96A] font-semibold">
            Simple 4-Step Journey
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1E4734]">
            How DailyVerse AI Operates
          </h2>
          <p className="mx-auto max-w-xl text-xs sm:text-sm text-[#666666]">
            From skincare formula discovery to live Pinterest syndication in four simple steps.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-12 items-center">
          <div className="lg:col-span-5 space-y-3">
            {consumerSteps.map((step, idx) => {
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

          <div className="lg:col-span-7">
            {(() => {
              const currentStep = consumerSteps[activeStep] || {
                number: "01",
                title: "Choose Skincare Product",
                subtitle: "Import trending botanical serums & formulas",
                desc: "Select high-converting skincare formulas from Amazon Beauty or curated product lists. DailyVerse highlights key ingredients and affiliate links automatically.",
                icon: Layers,
              };
              return (
                <div className="luxury-card rounded-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden bg-white border-[#E7E2D9] shadow-xl">
                  <div className="flex items-center justify-between border-b border-[#E7E2D9] pb-4">
                    <Badge variant="outline" className="border-[#C8A96A] text-[#1E4734] font-semibold text-xs bg-[#F8F6F2]">
                      Step {currentStep.number} of 04
                    </Badge>
                    <span className="text-xs text-[#666666] font-mono">DailyVerse AI Studio</span>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-serif text-2xl font-bold text-[#1E4734]">
                      {currentStep.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#555555] leading-relaxed">
                      {currentStep.desc}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F8F6F2] border border-[#E7E2D9] font-mono text-[11px] space-y-2 text-[#222222]">
                    <div className="flex items-center justify-between text-[#1E4734] font-bold">
                      <span>STATUS: AUTOMATED</span>
                      <span className="text-emerald-700">● LIVE</span>
                    </div>
                    <p className="text-[#666666] truncate">&gt; Executing {currentStep.title}...</p>
                    <p className="text-[#1E4734] font-semibold">&gt; Studio output generated and ready for syndication.</p>
                  </div>

                  <div className="pt-2">
                    <Link to="/auth">
                      <Button className="w-full bg-[#1E4734] hover:bg-[#355E4D] text-white font-medium text-xs h-10 cursor-pointer">
                        Try {currentStep.title} <ArrowRight className="ml-2 h-3.5 w-3.5 text-[#C8A96A]" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </section>

      {/* SECTION 5: Showcase Gallery */}
      <section className="mx-auto max-w-5xl px-4 py-16 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs uppercase tracking-widest text-[#C8A96A] font-semibold">
            Pinterest Pin Gallery
          </span>
          <h2 className="font-serif text-3xl font-bold text-[#1E4734]">
            Generated Skincare Visuals
          </h2>
          <p className="mx-auto max-w-xl text-xs text-[#666666]">
            Editorial 9:16 graphics created automatically by DailyVerse AI.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 max-w-3xl mx-auto">
          <div className="glass-panel rounded-2xl p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:border-[#C8A96A] group">
            <div className="relative overflow-hidden rounded-xl aspect-[2/3]">
              <img
                src="/brand/pinterest-1.jpg"
                alt="Peptide Hydrating Serum Pin"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute top-3 left-3 bg-[#1E4734] text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md shadow-xs">
                Generated Pin Graphic
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
                Generated Pin Graphic
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

      {/* SECTION 6: Creator Benefits */}
      <section className="bg-white py-20 border-b border-[#E7E2D9]">
        <div className="mx-auto max-w-6xl px-4 space-y-12">
          <div className="text-center space-y-3">
            <Badge variant="outline" className="border-[#C8A96A] text-[#1E4734] font-semibold text-xs bg-[#F8F6F2]">
              Why Creators Choose DailyVerse
            </Badge>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1E4734]">
              Built for Skincare Affiliate Growth
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="luxury-card rounded-2xl p-6 space-y-3 border-[#E7E2D9]">
              <TrendingUp className="h-6 w-6 text-[#C8A96A]" />
              <h3 className="font-serif text-lg font-bold text-[#1E4734]">Higher Affiliate Traffic</h3>
              <p className="text-xs text-[#666666] leading-relaxed">
                Publish high-ranking Pinterest pins consistently to drive targeted organic visitors to your Amazon & brand affiliate links.
              </p>
            </div>

            <div className="luxury-card rounded-2xl p-6 space-y-3 border-[#E7E2D9]">
              <Heart className="h-6 w-6 text-[#C8A96A]" />
              <h3 className="font-serif text-lg font-bold text-[#1E4734]">Save 15+ Hours Weekly</h3>
              <p className="text-xs text-[#666666] leading-relaxed">
                Automate pin creation, copywriting, and scheduling in one place so you can focus on building your brand.
              </p>
            </div>

            <div className="luxury-card rounded-2xl p-6 space-y-3 border-[#E7E2D9]">
              <Crown className="h-6 w-6 text-[#C8A96A]" />
              <h3 className="font-serif text-lg font-bold text-[#1E4734]">Luxury Aesthetic Quality</h3>
              <p className="text-xs text-[#666666] leading-relaxed">
                Ensure every graphic matches luxury skincare standards with botanical aesthetics and clean editorial typography.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7: Creator Testimonials */}
      <section className="py-20 px-4 max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs uppercase tracking-widest text-[#C8A96A] font-semibold">
            Creator Feedback
          </span>
          <h2 className="font-serif text-3xl font-bold text-[#1E4734]">
            Loved by Beauty Creators & Marketers
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="luxury-card rounded-2xl p-6 space-y-4 border-[#E7E2D9] bg-white">
            <p className="text-xs text-[#444444] italic leading-relaxed">
              "DailyVerse AI turned my skincare blog into a steady affiliate traffic engine. The 9:16 visual renders look like professional studio photography!"
            </p>
            <div className="flex items-center gap-3 pt-2">
              <div className="w-10 h-10 rounded-full bg-[#1E4734] text-[#C8A96A] font-bold flex items-center justify-center text-sm font-serif">
                EA
              </div>
              <div>
                <p className="text-xs font-bold text-[#1E4734]">Elena Adams</p>
                <p className="text-[10px] text-[#666666]">Beauty & Skincare Creator</p>
              </div>
            </div>
          </div>

          <div className="luxury-card rounded-2xl p-6 space-y-4 border-[#E7E2D9] bg-white">
            <p className="text-xs text-[#444444] italic leading-relaxed">
              "I used to spend hours designing pins in Canva. Now DailyVerse generates high-ranking pin titles, tags, and graphics automatically!"
            </p>
            <div className="flex items-center gap-3 pt-2">
              <div className="w-10 h-10 rounded-full bg-[#C8A96A] text-[#132E22] font-bold flex items-center justify-center text-sm font-serif">
                SC
              </div>
              <div>
                <p className="text-xs font-bold text-[#1E4734]">Sophia Chen</p>
                <p className="text-[10px] text-[#666666]">Affiliate Strategist</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8: Watch DailyVerse in Action (YouTube Integration) */}
      <section className="bg-[#132E22] text-white py-20 px-4 border-y border-[#C8A96A]/30">
        <div className="max-w-5xl mx-auto space-y-10 text-center">
          <div className="space-y-3">
            <Badge variant="outline" className="border-[#C8A96A] text-[#C8A96A] font-semibold text-xs bg-white/5">
              Official YouTube Channel
            </Badge>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white">
              Watch DailyVerse AI in Action
            </h2>
            <p className="text-xs sm:text-sm text-white/80 max-w-lg mx-auto">
              Subscribe to our official channel @DailyVerse-skincare for live tutorials, skincare breakdowns, and automation guides.
            </p>
          </div>

          <div className="max-w-3xl mx-auto rounded-2xl overflow-hidden border border-[#C8A96A]/40 bg-[#1E4734] shadow-2xl relative group p-8 space-y-6 text-left">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-red-600 text-white shadow-lg">
                  <Youtube className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-white">DailyVerse Skincare</h3>
                  <p className="text-xs text-[#C8A96A]">@DailyVerse-skincare · YouTube Channel</p>
                </div>
              </div>
              <a
                href="https://www.youtube.com/@DailyVerse-skincare"
                target="_blank"
                rel="noreferrer"
              >
                <Button className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-full px-6 h-10 cursor-pointer">
                  Subscribe Channel <ExternalLink className="ml-2 h-3.5 w-3.5" />
                </Button>
              </a>
            </div>

            <div className="relative rounded-xl overflow-hidden aspect-video bg-black/40 border border-white/10 flex items-center justify-center group/play cursor-pointer">
              <img
                src="/brand/hero-banner.jpg"
                alt="DailyVerse YouTube Channel Preview"
                className="w-full h-full object-cover opacity-60 transition-transform duration-500 group-hover/play:scale-105"
              />
              <a
                href="https://www.youtube.com/@DailyVerse-skincare"
                target="_blank"
                rel="noreferrer"
                className="absolute p-5 rounded-full bg-red-600 text-white shadow-2xl transition-transform duration-300 group-hover/play:scale-110 flex items-center justify-center"
              >
                <Play className="h-8 w-8 fill-current ml-1" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 9: Pinterest Community */}
      <section className="py-20 px-4 max-w-5xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <Badge variant="outline" className="border-[#C8A96A] text-[#1E4734] font-semibold text-xs bg-[#F8F6F2]">
            Official Pinterest Profile
          </Badge>
          <h2 className="font-serif text-3xl font-bold text-[#1E4734]">
            Explore Our Pinterest Community
          </h2>
          <p className="text-xs text-[#666666] max-w-md mx-auto">
            Follow @DailyVerse07 on Pinterest to browse our latest skincare pin collection.
          </p>
        </div>

        <div className="max-w-2xl mx-auto luxury-card rounded-2xl p-8 border-[#E7E2D9] text-center space-y-6 bg-white shadow-xl">
          <div className="w-16 h-16 rounded-full bg-[#1E4734] text-[#C8A96A] font-bold flex items-center justify-center mx-auto text-2xl font-serif border-2 border-[#C8A96A]">
            DV
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-xl font-bold text-[#1E4734]">DailyVerse Skincare</h3>
            <p className="text-xs text-[#666666]">@DailyVerse07 · Official Pinterest Niche Board</p>
          </div>
          <p className="text-xs text-[#555555] max-w-md mx-auto leading-relaxed">
            Discover curated peptide formulas, botanical morning routines, and aesthetic skincare pin inspirations updated daily.
          </p>
          <a
            href="https://in.pinterest.com/DailyVerse07/_created/"
            target="_blank"
            rel="noreferrer"
          >
            <Button className="bg-[#1E4734] hover:bg-[#355E4D] text-white font-bold text-xs rounded-full px-8 h-11 cursor-pointer hover-lift">
              <Pin className="mr-2 h-4 w-4 text-[#C8A96A]" /> Follow on Pinterest <ExternalLink className="ml-2 h-3.5 w-3.5" />
            </Button>
          </a>
        </div>
      </section>

      {/* SECTION 10: FAQ Accordion */}
      <section className="bg-white py-20 border-y border-[#E7E2D9]">
        <div className="mx-auto max-w-3xl px-4 space-y-8">
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
        </div>
      </section>

      {/* SECTION 11: Luxury CTA & Professional Footer */}
      <section className="bg-mesh-dark text-white py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <Badge variant="outline" className="border-[#C8A96A] text-[#C8A96A] text-xs bg-white/5">
            Start Automating Today
          </Badge>
          <h2 className="font-serif text-4xl sm:text-5xl font-extrabold text-white">
            Transform Your Pinterest Skincare Growth
          </h2>
          <p className="text-xs sm:text-sm text-white/80 max-w-xl mx-auto leading-relaxed">
            Join beauty creators and affiliate strategists automating high-converting Pinterest pin creation with DailyVerse AI.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link to="/auth">
              <Button
                size="lg"
                className="bg-[#C8A96A] hover:bg-[#D4AF37] text-[#132E22] font-bold shadow-xl h-12 px-8 text-sm cursor-pointer rounded-full hover-lift"
              >
                Explore Creator Workspace <ArrowRight className="ml-2 h-4 w-4 text-[#132E22]" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Professional Footer */}
      <footer className="border-t border-[#E7E2D9] bg-white py-12 text-center text-xs text-[#666666]">
        <div className="mx-auto max-w-5xl px-4 space-y-6">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2.5">
              <img
                src="/brand/logo.jpg"
                alt="DAILY VERSE logo"
                className="h-8 w-8 rounded-full object-cover border border-[#C8A96A]/30 shadow-xs"
                loading="lazy"
              />
              <span className="font-serif text-base font-bold text-[#1E4734]">DAILY VERSE AI</span>
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
              Luxury Skincare Automation Platform
            </p>
          </div>

          <div className="flex justify-center gap-6 text-xs font-medium text-[#1E4734]">
            <a
              href="https://www.youtube.com/@DailyVerse-skincare"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#C8A96A] flex items-center gap-1"
            >
              <Youtube className="h-3.5 w-3.5 text-red-500" /> YouTube Channel
            </a>
            <a
              href="https://in.pinterest.com/DailyVerse07/_created/"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#C8A96A] flex items-center gap-1"
            >
              <Pin className="h-3.5 w-3.5 text-red-600" /> Pinterest Profile
            </a>
          </div>

          <p className="text-[11px] text-[#888888]">
            © {new Date().getFullYear()} DAILY VERSE AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
