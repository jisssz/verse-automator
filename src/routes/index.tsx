import { useState, useEffect, useRef, useCallback } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
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
  Star,
  Zap,
  Clock,
  BarChart3,
  Menu,
  X,
} from "lucide-react";

export const Route = createFileRoute("/")(
  {
    head: () => ({
      meta: [
        { title: "DailyVerse AI — Luxury Skincare Automation & Pinterest Growth" },
        {
          name: "description",
          content:
            "Scale your beauty affiliate income & Pinterest traffic automatically. Generate luxury skincare copy, studio-grade aesthetic pin graphics, and automated board syndication.",
        },
        {
          property: "og:title",
          content: "DailyVerse AI — Luxury Skincare Automation & Pinterest Growth",
        },
        {
          property: "og:description",
          content:
            "Scale your beauty affiliate income & Pinterest traffic automatically. Generate luxury skincare copy, studio-grade aesthetic pin graphics, and automated board syndication.",
        },
      ],
    }),
    component: LandingPage,
  }
);

/* ─── Scroll-reveal hook ─── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          el.classList.add("visible");
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}

/* ─── Animated counter ─── */
function AnimatedCounter({
  target,
  suffix = "",
  prefix = "",
  duration = 1800,
}: {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const animate = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased =
              progress < 0.5
                ? 4 * progress ** 3
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            setCount(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ─── FAQ item ─── */
function FaqItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);

  return (
    <div className={`faq-item rounded-2xl overflow-hidden ${isOpen ? "open" : ""}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-5 text-left group cursor-pointer"
        aria-expanded={isOpen}
      >
        <span className="font-serif text-base font-semibold text-[#1a1a1a] pr-4 leading-snug group-hover:text-[#1e4734] transition-colors">
          {question}
        </span>
        <div
          className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
            isOpen
              ? "bg-[#c8a96a] rotate-180"
              : "bg-[#f3efe8] group-hover:bg-[#e7e2d9]"
          }`}
        >
          <ChevronDown
            className={`h-4 w-4 ${isOpen ? "text-[#132e22]" : "text-[#6b7280]"}`}
          />
        </div>
      </button>
      <div
        ref={bodyRef}
        className="overflow-hidden"
        style={{
          maxHeight: isOpen ? (bodyRef.current?.scrollHeight ?? 400) + "px" : "0",
          transition: "max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <p className="px-6 pb-6 text-sm text-[#6b7280] leading-relaxed border-t border-[#f0ece4] pt-4">
          {answer}
        </p>
      </div>
    </div>
  );
}

/* ─── Main component ─── */
function LandingPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);

  /* Nav scroll state */
  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Smooth scroll */
  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileNavOpen(false);
  }, []);

  /* Reveal refs */
  const r1  = useReveal();
  const r2  = useReveal();
  const r3  = useReveal();
  const r4  = useReveal();
  const r5  = useReveal();
  const r6  = useReveal();
  const r7  = useReveal();
  const r8  = useReveal();
  const r9  = useReveal();
  const r10 = useReveal();

  const steps = [
    {
      num: "01",
      label: "Choose Product",
      title: "Discover Trending Skincare",
      body: "Select high-converting botanical serums and formulas from curated beauty lists. DailyVerse surfaces the products most likely to earn affiliate clicks.",
      icon: Layers,
    },
    {
      num: "02",
      label: "Generate Content",
      title: "Craft Editorial Pin Copy",
      body: "Our AI copywriter produces elegant botanical descriptions, high-traffic Pinterest search titles, and SEO-optimised hashtags tuned for your niche.",
      icon: Sparkles,
    },
    {
      num: "03",
      label: "Create Image",
      title: "Render Luxury Visuals",
      body: "Produce studio-grade 9:16 skincare pin graphics with soft botanical lighting, organic textures, and an editorial aesthetic that stops the scroll.",
      icon: ImageIcon,
    },
    {
      num: "04",
      label: "Publish",
      title: "Auto-Post to Pinterest",
      body: "Schedule and syndicate pins directly to your targeted boards while tracking audience engagement, saves, and affiliate click-through rates.",
      icon: Pin,
    },
  ];

  const features = [
    {
      icon: Sparkles,
      title: "AI Pinterest Copywriting",
      body: "Elegant botanical descriptions and high-CTR pin titles generated in seconds — not hours.",
      color: "text-[#c8a96a]",
      bg: "bg-[#1e4734]",
    },
    {
      icon: ImageIcon,
      title: "Luxury Visual Studio",
      body: "Studio-grade 9:16 vertical skincare photography with soft lighting and botanical textures.",
      color: "text-[#c8a96a]",
      bg: "bg-[#1e4734]",
    },
    {
      icon: Pin,
      title: "Pinterest Automation",
      body: "Schedule, syndicate, and track pins across your beauty boards completely on autopilot.",
      color: "text-[#c8a96a]",
      bg: "bg-[#1e4734]",
    },
    {
      icon: BarChart3,
      title: "Growth Analytics",
      body: "Track affiliate clicks, saves, and organic impressions with a clean creator dashboard.",
      color: "text-[#c8a96a]",
      bg: "bg-[#1e4734]",
    },
    {
      icon: Zap,
      title: "One-Click Publishing",
      body: "From product URL to live Pinterest pin in under 60 seconds. No design skills required.",
      color: "text-[#c8a96a]",
      bg: "bg-[#1e4734]",
    },
    {
      icon: Crown,
      title: "Luxury Brand Aesthetic",
      body: "Every output matches premium skincare editorial standards — not generic template designs.",
      color: "text-[#c8a96a]",
      bg: "bg-[#1e4734]",
    },
  ];

  const testimonials = [
    {
      quote:
        "DailyVerse AI turned my skincare blog into a steady affiliate revenue engine. The 9:16 visual renders look like professional studio photography!",
      name: "Elena Adams",
      role: "Beauty & Skincare Creator",
      initials: "EA",
      accent: "#1e4734",
    },
    {
      quote:
        "I used to spend hours in Canva. Now DailyVerse generates high-ranking pin titles, descriptions, and graphics automatically every single day.",
      name: "Sophia Chen",
      role: "Affiliate Strategist",
      initials: "SC",
      accent: "#c8a96a",
    },
    {
      quote:
        "The editorial quality is what sets DailyVerse apart. My pins actually look like they belong on a luxury beauty brand's official boards.",
      name: "Maya Laurent",
      role: "Pinterest Growth Specialist",
      initials: "ML",
      accent: "#355e4d",
    },
  ];

  const faqs = [
    {
      q: "How does DailyVerse AI help grow Pinterest affiliate revenue?",
      a: "DailyVerse AI automates your entire Pinterest workflow — from discovering trending skincare products to writing high-CTR titles and generating studio-grade 9:16 pin graphics. By consistently publishing aesthetic, SEO-optimised pins to targeted boards, you build organic traffic and maximise affiliate click-throughs.",
    },
    {
      q: "Can I use DailyVerse AI for my own skincare or beauty brand?",
      a: "Absolutely. DailyVerse AI is designed for beauty creators, affiliate marketers, and luxury skincare brands alike. You can connect your own product links, brand colours, and custom Pinterest boards.",
    },
    {
      q: "Do I need graphic design or copywriting skills?",
      a: "Not at all. DailyVerse AI handles all visual rendering and copywriting for you. Simply select or paste a skincare product link, and our AI produces publication-ready Pinterest assets in seconds.",
    },
    {
      q: "Where can I see live DailyVerse content and video walkthroughs?",
      a: "Check out our official YouTube channel @DailyVerse-skincare for live tutorials, and follow our Pinterest profile @DailyVerse07 to see our aesthetic pin collection updated daily.",
    },
    {
      q: "How quickly can I expect to see results on Pinterest?",
      a: "Most creators see measurable growth in saves and impressions within the first 30 days of consistent automated publishing. Affiliate click-through rates typically improve as your board gains domain authority.",
    },
  ];

  const navLinks = [
    { label: "Features",  id: "features" },
    { label: "Gallery",   id: "gallery"  },
    { label: "Community", id: "community"},
    { label: "FAQ",       id: "faq"      },
  ];

  return (
    <div
      className="bg-[#f8f6f2] text-[#1a1a1a] min-h-screen flex flex-col selection:bg-[#c8a96a]/25"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      {/* ════════════════════════════
          FLOATING NAVIGATION
      ════════════════════════════ */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          navScrolled ? "glass-nav shadow-xl shadow-black/10" : "bg-transparent"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group cursor-pointer"
          >
            <img
              src="/brand/logo.jpg"
              alt="DailyVerse AI"
              className="h-8 w-8 rounded-full object-cover border border-[#c8a96a]/40 shadow-sm transition-transform duration-300 group-hover:scale-105"
            />
            <span
              className="font-serif text-base font-bold text-white tracking-tight"
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}
            >
              DAILY VERSE AI
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="nav-link text-[13px] font-medium text-white/80 hover:text-white cursor-pointer bg-transparent border-none p-0"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-2.5">
            <a
              href="https://www.youtube.com/@DailyVerse-skincare"
              target="_blank"
              rel="noreferrer"
              title="Official YouTube Channel"
              className="p-2 rounded-lg text-white/70 hover:text-red-400 hover:bg-white/8 transition-all magnetic-hover"
            >
              <Youtube className="h-4 w-4" />
            </a>
            <a
              href="https://in.pinterest.com/DailyVerse07/_created/"
              target="_blank"
              rel="noreferrer"
              title="Official Pinterest Profile"
              className="p-2 rounded-lg text-white/70 hover:text-[#E60023] hover:bg-white/8 transition-all magnetic-hover"
            >
              <Pin className="h-4 w-4" />
            </a>

            <div className="w-px h-4 bg-white/20 mx-1" />

            <Link to="/auth">
              <Button
                size="sm"
                variant="ghost"
                className="text-white/80 hover:text-white text-[13px] font-medium cursor-pointer px-3 h-8"
              >
                Sign In
              </Button>
            </Link>
            <Link to="/auth">
              <Button
                size="sm"
                className="bg-[#c8a96a] hover:bg-[#d4af37] text-[#132e22] font-bold text-[13px] rounded-full px-5 h-8 cursor-pointer cta-primary shadow-md"
              >
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="md:hidden p-2 text-white cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileNavOpen && (
          <div className="md:hidden glass-nav border-t border-white/8 px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="w-full text-left px-3 py-2.5 text-sm font-medium text-white/80 hover:text-white hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
              >
                {link.label}
              </button>
            ))}
            <div className="pt-3 flex flex-col gap-2">
              <Link to="/auth" onClick={() => setMobileNavOpen(false)}>
                <Button
                  size="sm"
                  className="w-full bg-[#c8a96a] hover:bg-[#d4af37] text-[#132e22] font-bold rounded-full cursor-pointer"
                >
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ════════════════════════════
          HERO SECTION
      ════════════════════════════ */}
      <section
        id="hero"
        className="relative overflow-hidden min-h-[100svh] flex flex-col justify-center bg-mesh-dark aurora-bg-animate text-white"
      >
        {/* Animated orb blobs */}
        <div
          className="absolute top-[15%] left-[8%] w-[480px] h-[480px] bg-emerald-600/15 rounded-full blur-[110px] animate-orb pointer-events-none"
          style={{ animationDelay: "0s" }}
        />
        <div
          className="absolute top-[10%] right-[5%] w-[360px] h-[360px] bg-[#c8a96a]/10 rounded-full blur-[100px] animate-orb pointer-events-none"
          style={{ animationDelay: "3s" }}
        />
        <div
          className="absolute bottom-[8%] left-[30%] w-[500px] h-[280px] bg-[#1e4734]/40 rounded-full blur-[130px] animate-orb pointer-events-none"
          style={{ animationDelay: "6s" }}
        />

        <div className="relative z-10 mx-auto max-w-6xl w-full px-4 sm:px-6 pt-28 pb-20">
          <div className="text-center space-y-8">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#c8a96a]/40 text-[#c8a96a] text-[11px] font-semibold uppercase tracking-[0.15em] bg-white/5 backdrop-blur-sm animate-float-slow"
              style={{ animationDelay: "0.2s" }}
            >
              <Crown className="h-3 w-3" />
              Luxury Skincare · AI Automation · Pinterest Growth
            </div>

            {/* Headline */}
            <h1
              className="font-serif font-black tracking-tight leading-[1.05] text-white"
              style={{
                fontSize: "clamp(2.6rem, 7vw, 5.5rem)",
                textShadow: "0 2px 24px rgba(0,0,0,0.4)",
              }}
            >
              Turn Skincare Into
              <br />
              <span className="gold-accent-text italic">Pinterest Revenue.</span>
            </h1>

            {/* Sub */}
            <p
              className="mx-auto max-w-2xl text-[#f8f6f2]/75 leading-relaxed font-light"
              style={{ fontSize: "clamp(1rem, 2vw, 1.15rem)" }}
            >
              DailyVerse AI transforms botanical beauty formulas into editorial
              pin copy, studio-grade luxury visuals, and fully automated board
              syndication — so you earn more while doing less.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <Link to="/auth">
                <Button
                  size="lg"
                  className="bg-[#c8a96a] hover:bg-[#d4af37] text-[#132e22] font-bold h-13 px-9 text-[15px] rounded-full cursor-pointer cta-primary magnetic-hover shadow-2xl shadow-[#c8a96a]/25"
                >
                  Start Creating
                  <ArrowRight className="ml-2 h-4 w-4" />
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
                  className="border-white/20 text-white bg-white/6 hover:bg-white/12 h-13 px-9 text-[15px] rounded-full cursor-pointer magnetic-hover backdrop-blur-sm"
                >
                  <Play className="mr-2 h-4 w-4 text-red-400 fill-red-400" />
                  Watch Demo
                </Button>
              </a>
            </div>

            {/* Social proof inline */}
            <div className="flex flex-wrap justify-center gap-6 pt-4">
              {[
                { v: "1.4M+", label: "Pins Published" },
                { v: "4.8★", label: "Creator Rating" },
                { v: "15 hrs", label: "Saved Per Week" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#c8a96a] animate-pulse-glow" />
                  <span className="text-xs text-white/60">
                    <strong className="text-white font-semibold">{s.v}</strong>{" "}
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Hero image */}
          <div className="mt-16 relative mx-auto max-w-4xl">
            {/* Floating glass badges above image */}
            <div className="absolute -top-5 left-6 z-20 hidden sm:flex items-center gap-2.5 glass-panel-dark px-4 py-2.5 rounded-xl border border-[#c8a96a]/30 shadow-xl animate-float">
              <div className="p-1.5 rounded-lg bg-[#c8a96a]/20">
                <Sparkles className="h-4 w-4 text-[#c8a96a]" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-white">AI Visual Studio</p>
                <p className="text-[10px] text-[#c8a96a]/80">9:16 Studio-grade Pins</p>
              </div>
            </div>

            <div className="absolute -top-5 right-6 z-20 hidden sm:flex items-center gap-2.5 glass-panel-dark px-4 py-2.5 rounded-xl border border-emerald-500/30 shadow-xl animate-float" style={{ animationDelay: "1.5s" }}>
              <div className="p-1.5 rounded-lg bg-emerald-500/15">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-white">Auto-Published</p>
                <p className="text-[10px] text-emerald-400/80">Pinterest Board Syndication</p>
              </div>
            </div>

            {/* Main hero image */}
            <div className="relative rounded-3xl overflow-hidden border border-[#c8a96a]/25 shadow-[0_32px_100px_-20px_rgba(0,0,0,0.6)] card-3d-tilt group">
              <img
                src="/brand/hero-banner.jpg"
                alt="DailyVerse AI — Luxury Skincare Automation Studio"
                className="w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                style={{ maxHeight: "520px" }}
                loading="eager"
                fetchPriority="high"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d1f17]/70 via-transparent to-transparent" />
              <div className="absolute inset-0 vignette-overlay" />
            </div>

            {/* Scroll cue */}
            <div className="mt-12 flex flex-col items-center gap-2 animate-scroll-bounce">
              <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center pt-2">
                <div className="w-1 h-2.5 rounded-full bg-white/40" />
              </div>
              <span className="text-[10px] text-white/40 uppercase tracking-widest font-medium">
                Explore
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════
          STATS BAR
      ════════════════════════════ */}
      <section className="bg-[#0d1f17] border-y border-[#c8a96a]/15">
        <div ref={r1} className="reveal mx-auto max-w-6xl px-4 py-12 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { n: 1400000, s: "+", label: "Pins Automated", p: "" },
            { n: 99,      s: ".4%", label: "Automation Uptime", p: "" },
            { n: 4,       s: ".8 / 5", label: "Creator Rating", p: "" },
            { n: 100,     s: "%", label: "Scheduled Publishing", p: "" },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className={`stat-card rounded-2xl p-6 text-center stagger-${i + 1}`}
            >
              <p className="font-serif text-3xl sm:text-4xl font-black text-[#c8a96a] tabular-nums">
                <AnimatedCounter
                  target={stat.n}
                  suffix={stat.s}
                  prefix={stat.p}
                  duration={1600}
                />
              </p>
              <p className="mt-2 text-[11px] font-medium text-white/50 uppercase tracking-[0.13em]">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════
          PROBLEM → SOLUTION SPLIT
      ════════════════════════════ */}
      <section className="bg-cream-section py-28 border-b border-[#e7e2d9]">
        <div className="mx-auto max-w-6xl px-4">
          <div ref={r2} className="reveal grid lg:grid-cols-2 gap-16 items-center">
            {/* Left copy */}
            <div className="space-y-6">
              <span className="text-[11px] uppercase tracking-[0.18em] text-[#c8a96a] font-semibold">
                The Creator Problem
              </span>
              <h2 className="font-serif font-black text-[#1e4734] leading-tight" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
                Great Skincare Content
                <br />
                Takes Too Long to Create.
              </h2>
              <p className="text-[#6b7280] leading-relaxed text-[15px]">
                The average beauty creator spends <strong className="text-[#1a1a1a]">15+ hours per week</strong> designing
                pins, writing descriptions, and manually scheduling posts to Pinterest — time that
                should be spent growing your brand and maximising affiliate income.
              </p>
              <ul className="space-y-3">
                {[
                  "Manual Canva design for every pin",
                  "Writing titles and descriptions from scratch",
                  "Guessing the right hashtags and keywords",
                  "Scheduling each post manually",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="mt-0.5 w-5 h-5 rounded-full bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                      <X className="h-3 w-3 text-red-400" />
                    </div>
                    <span className="text-sm text-[#6b7280]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right solution */}
            <div className="space-y-4">
              <span className="text-[11px] uppercase tracking-[0.18em] text-[#1e4734] font-semibold">
                The DailyVerse Solution
              </span>
              <h3 className="font-serif font-bold text-[#1e4734] text-2xl leading-snug">
                One platform. Fully automated.
              </h3>
              <ul className="space-y-3">
                {[
                  "Studio-grade 9:16 pin graphics — generated instantly",
                  "Editorial botanical copy and SEO titles — written by AI",
                  "Optimal hashtags and search terms — researched automatically",
                  "Scheduled syndication to your boards — runs 24/7",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    </div>
                    <span className="text-sm text-[#4b5563] font-medium">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-4">
                <Link to="/auth">
                  <Button className="bg-[#1e4734] hover:bg-[#355e4d] text-white font-semibold rounded-full px-7 h-11 cursor-pointer cta-primary magnetic-hover text-sm">
                    Start Automating <ArrowRight className="ml-2 h-4 w-4 text-[#c8a96a]" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════
          FEATURES GRID
      ════════════════════════════ */}
      <section id="features" className="bg-white py-28 border-b border-[#e7e2d9]">
        <div className="mx-auto max-w-6xl px-4">
          <div ref={r3} className="reveal text-center space-y-4 mb-16">
            <span className="text-[11px] uppercase tracking-[0.18em] text-[#c8a96a] font-semibold">
              Platform Capabilities
            </span>
            <h2
              className="font-serif font-black text-[#1e4734]"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
            >
              Everything a Beauty Creator Needs
            </h2>
            <p className="mx-auto max-w-lg text-[#6b7280] text-[15px] leading-relaxed">
              Replace manual design, writing, and scheduling with one continuous luxury content engine.
            </p>
          </div>

          <div ref={r4} className="reveal grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className={`feature-card rounded-3xl p-7 space-y-4 stagger-${i + 1}`}
                >
                  <div className={`${feat.bg} ${feat.color} w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-[#1e4734]">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-[#6b7280] leading-relaxed">{feat.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════
          HOW IT WORKS — TIMELINE
      ════════════════════════════ */}
      <section className="bg-cream-section py-28 border-b border-[#e7e2d9]">
        <div className="mx-auto max-w-6xl px-4">
          <div ref={r5} className="reveal text-center space-y-4 mb-16">
            <span className="text-[11px] uppercase tracking-[0.18em] text-[#c8a96a] font-semibold">
              Simple 4-Step Journey
            </span>
            <h2
              className="font-serif font-black text-[#1e4734]"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
            >
              From Formula to Live Pin in Minutes
            </h2>
          </div>

          <div className="grid lg:grid-cols-12 gap-10 items-start">
            {/* Step selector */}
            <div className="lg:col-span-5 space-y-3">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                const active = activeStep === idx;
                return (
                  <button
                    key={step.num}
                    onClick={() => setActiveStep(idx)}
                    className={`w-full text-left rounded-2xl border p-5 flex items-center gap-4 transition-all duration-300 cursor-pointer ${
                      active
                        ? "bg-[#1e4734] border-[#c8a96a] shadow-lg shadow-[#1e4734]/15"
                        : "bg-white border-[#e7e2d9] hover:border-[#c8a96a]/50 hover:shadow-sm"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                        active
                          ? "bg-[#c8a96a] text-[#132e22]"
                          : "bg-[#f3efe8] text-[#1e4734] border border-[#e7e2d9]"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p
                        className={`text-[10px] uppercase tracking-widest font-semibold font-mono ${
                          active ? "text-[#c8a96a]/70" : "text-[#9ca3af]"
                        }`}
                      >
                        Step {step.num}
                      </p>
                      <h3
                        className={`font-serif text-sm font-bold leading-snug mt-0.5 ${
                          active ? "text-white" : "text-[#1a1a1a]"
                        }`}
                      >
                        {step.title}
                      </h3>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Step detail */}
            <div className="lg:col-span-7">
              {(() => {
                const s = steps[activeStep];
                if (!s) return null;
                const Icon = s.icon;
                return (
                  <div className="luxury-card rounded-3xl p-8 space-y-6 bg-white border-[#e7e2d9]">
                    <div className="flex items-center justify-between border-b border-[#f0ece4] pb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#c8a96a] text-[#132e22] flex items-center justify-center">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest font-mono text-[#9ca3af]">
                            Step {s.num} of 04
                          </p>
                          <h3 className="font-serif text-lg font-bold text-[#1e4734] leading-tight">
                            {s.title}
                          </h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-glow" />
                        <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide">
                          Automated
                        </span>
                      </div>
                    </div>

                    <p className="text-[15px] text-[#4b5563] leading-relaxed">
                      {s.body}
                    </p>

                    <div className="bg-[#0d1f17] rounded-2xl p-5 font-mono text-xs space-y-2">
                      <div className="flex items-center justify-between text-emerald-400">
                        <span>● DailyVerse AI Studio</span>
                        <span className="text-[#c8a96a]">LIVE</span>
                      </div>
                      <p className="text-[#6b7280]">
                        &gt; Running: {s.label.toLowerCase()}...
                      </p>
                      <p className="text-emerald-400">
                        &gt; Output ready. Quality verified. ✓
                      </p>
                    </div>

                    <Link to="/auth">
                      <Button className="w-full bg-[#1e4734] hover:bg-[#355e4d] text-white font-medium rounded-xl h-11 cursor-pointer text-sm">
                        Try {s.title}{" "}
                        <ArrowRight className="ml-2 h-4 w-4 text-[#c8a96a]" />
                      </Button>
                    </Link>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════
          PINTEREST GALLERY (MASONRY)
      ════════════════════════════ */}
      <section id="gallery" className="bg-white py-28 border-b border-[#e7e2d9]">
        <div className="mx-auto max-w-6xl px-4">
          <div ref={r6} className="reveal text-center space-y-4 mb-14">
            <span className="text-[11px] uppercase tracking-[0.18em] text-[#c8a96a] font-semibold">
              Pinterest Pin Gallery
            </span>
            <h2
              className="font-serif font-black text-[#1e4734]"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
            >
              Generated Skincare Visuals
            </h2>
            <p className="mx-auto max-w-lg text-[#6b7280] text-[15px]">
              Studio-grade 9:16 editorial graphics created automatically by DailyVerse AI.
            </p>
          </div>

          {/* Gallery grid */}
          <div ref={r7} className="reveal grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Large card */}
            <div className="col-span-2 row-span-2 pin-card rounded-3xl overflow-hidden border border-[#e7e2d9] shadow-lg group relative">
              <div className="relative overflow-hidden h-full">
                <img
                  src="/brand/hero-banner.jpg"
                  alt="Luxury Skincare Editorial — DailyVerse AI"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  style={{ minHeight: "360px" }}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d1f17]/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end p-6">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-[#c8a96a] font-bold">
                      DailyVerse AI
                    </p>
                    <p className="font-serif text-xl font-bold text-white mt-1 leading-tight">
                      Luxury Editorial
                      <br />
                      Skincare Pin
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Small card 1 */}
            <div className="pin-card rounded-2xl overflow-hidden border border-[#e7e2d9] shadow-md group relative">
              <div className="relative overflow-hidden aspect-[2/3]">
                <img
                  src="/brand/pinterest-1.jpg"
                  alt="Peptide Hydrating Serum Pin — DailyVerse AI"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
                  loading="lazy"
                />
                <div className="absolute top-2.5 left-2.5 bg-[#1e4734] text-[#c8a96a] text-[9px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md">
                  AI Generated
                </div>
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <p className="text-[11px] font-semibold text-white">
                    Peptide Hydrating Serum
                  </p>
                </div>
              </div>
            </div>

            {/* Small card 2 */}
            <div className="pin-card rounded-2xl overflow-hidden border border-[#e7e2d9] shadow-md group relative">
              <div className="relative overflow-hidden aspect-[2/3]">
                <img
                  src="/brand/pinterest-2.jpg"
                  alt="Green Tomato Pore Lifting Ampoule Pin — DailyVerse AI"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
                  loading="lazy"
                />
                <div className="absolute top-2.5 left-2.5 bg-[#1e4734] text-[#c8a96a] text-[9px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md">
                  AI Generated
                </div>
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <p className="text-[11px] font-semibold text-white">
                    Pore Lifting Ampoule
                  </p>
                </div>
              </div>
            </div>

            {/* Wide bottom card */}
            <div className="col-span-2 pin-card rounded-2xl overflow-hidden border border-[#e7e2d9] shadow-md group bg-[#0d1f17] p-6 flex items-center justify-between gap-6">
              <div className="space-y-2">
                <p className="text-[10px] text-[#c8a96a] uppercase tracking-widest font-bold">
                  @DailyVerse07
                </p>
                <p className="font-serif text-lg font-bold text-white leading-tight">
                  Follow our official <br /> Pinterest profile
                </p>
                <p className="text-xs text-white/60">
                  New botanical pins added daily.
                </p>
              </div>
              <a
                href="https://in.pinterest.com/DailyVerse07/_created/"
                target="_blank"
                rel="noreferrer"
              >
                <Button className="bg-[#E60023] hover:bg-[#b8001c] text-white font-bold text-xs rounded-full px-6 h-10 cursor-pointer magnetic-hover shrink-0">
                  <Pin className="mr-1.5 h-3.5 w-3.5" /> Follow Profile
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════
          CREATOR BENEFITS
      ════════════════════════════ */}
      <section className="bg-cream-section py-28 border-b border-[#e7e2d9]">
        <div className="mx-auto max-w-6xl px-4">
          <div ref={r8} className="reveal grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <span className="text-[11px] uppercase tracking-[0.18em] text-[#c8a96a] font-semibold">
                  Why Creators Choose DailyVerse
                </span>
                <h2
                  className="font-serif font-black text-[#1e4734] leading-tight"
                  style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
                >
                  Built for Skincare
                  <br />
                  Affiliate Growth.
                </h2>
              </div>

              {[
                {
                  icon: TrendingUp,
                  title: "Higher Affiliate Traffic",
                  body: "Publish high-ranking pins consistently to drive targeted organic visitors to your Amazon and brand affiliate links.",
                },
                {
                  icon: Clock,
                  title: "Save 15+ Hours Weekly",
                  body: "Automate pin creation, copywriting, and scheduling in one place so you can focus on scaling your brand.",
                },
                {
                  icon: Heart,
                  title: "Luxury Aesthetic Quality",
                  body: "Every graphic matches premium skincare standards with botanical aesthetics and clean editorial typography.",
                },
                {
                  icon: Crown,
                  title: "Built for Pinterest SEO",
                  body: "Our AI researches trending keywords, hashtags, and pin formats to ensure your content ranks on Pinterest search.",
                },
              ].map((b, i) => {
                const Icon = b.icon;
                return (
                  <div key={b.title} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#1e4734] text-[#c8a96a] flex items-center justify-center shrink-0 shadow-md">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#1e4734] text-sm">{b.title}</h3>
                      <p className="text-[13px] text-[#6b7280] leading-relaxed mt-0.5">
                        {b.body}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Testimonials stack */}
            <div className="space-y-4">
              {testimonials.map((t, i) => (
                <div key={t.name} className={`quote-card rounded-2xl p-6 space-y-4 stagger-${i + 1}`}>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, si) => (
                      <Star
                        key={si}
                        className="h-3.5 w-3.5 text-[#c8a96a] fill-[#c8a96a]"
                      />
                    ))}
                  </div>
                  <p className="text-sm text-[#374151] italic leading-relaxed">
                    "{t.quote}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white font-serif"
                      style={{ background: t.accent }}
                    >
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#1e4734]">{t.name}</p>
                      <p className="text-[10px] text-[#9ca3af]">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════
          COMMUNITY — DUAL SOCIAL
      ════════════════════════════ */}
      <section id="community" className="bg-[#0d1f17] py-28 border-y border-[#c8a96a]/15">
        <div className="mx-auto max-w-6xl px-4">
          <div ref={r9} className="reveal text-center space-y-4 mb-16">
            <span className="text-[11px] uppercase tracking-[0.18em] text-[#c8a96a] font-semibold">
              Official Channels
            </span>
            <h2
              className="font-serif font-black text-white"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
            >
              Join the DailyVerse Community
            </h2>
            <p className="mx-auto max-w-lg text-white/60 text-[15px]">
              Follow our official channels for live tutorials, automation guides, and daily aesthetic pin collections.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* YouTube Card */}
            <div className="feature-card rounded-3xl p-7 bg-[#132e22] border-[#c8a96a]/20 space-y-6 group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-red-600 shadow-lg shadow-red-900/30 animate-pulse-glow">
                    <Youtube className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-white">YouTube Channel</h3>
                    <p className="text-xs text-[#c8a96a]">@DailyVerse-skincare</p>
                  </div>
                </div>
                <a
                  href="https://www.youtube.com/@DailyVerse-skincare"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-full px-5 h-9 cursor-pointer magnetic-hover shadow-lg">
                    Subscribe <ExternalLink className="ml-1.5 h-3 w-3" />
                  </Button>
                </a>
              </div>

              {/* Thumbnail preview */}
              <div className="relative rounded-2xl overflow-hidden aspect-video border border-white/8 group/play cursor-pointer">
                <img
                  src="/brand/hero-banner.jpg"
                  alt="DailyVerse YouTube Channel"
                  className="w-full h-full object-cover opacity-55 transition-all duration-500 group-hover/play:opacity-75 group-hover/play:scale-105"
                  loading="lazy"
                />
                <a
                  href="https://www.youtube.com/@DailyVerse-skincare"
                  target="_blank"
                  rel="noreferrer"
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center shadow-2xl transition-all duration-300 group-hover/play:scale-110 group-hover/play:bg-red-500">
                    <Play className="h-6 w-6 fill-white text-white ml-1" />
                  </div>
                </a>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-[#c8a96a]">
                  Latest AI Skincare Walkthroughs
                </p>
                <p className="text-[13px] text-white/55 leading-relaxed">
                  Step-by-step tutorials on automated Pinterest pin creation, botanical copywriting, and affiliate revenue strategies.
                </p>
              </div>
            </div>

            {/* Pinterest Card */}
            <div className="feature-card rounded-3xl p-7 bg-[#132e22] border-[#c8a96a]/20 space-y-6 group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-[#E60023] shadow-lg shadow-red-900/30 animate-pulse-glow">
                    <Pin className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-white">Pinterest Profile</h3>
                    <p className="text-xs text-[#c8a96a]">@DailyVerse07</p>
                  </div>
                </div>
                <a
                  href="https://in.pinterest.com/DailyVerse07/_created/"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button className="bg-[#E60023] hover:bg-[#c4001d] text-white font-bold text-xs rounded-full px-5 h-9 cursor-pointer magnetic-hover shadow-lg">
                    Follow <ExternalLink className="ml-1.5 h-3 w-3" />
                  </Button>
                </a>
              </div>

              {/* Pin masonry preview */}
              <div className="grid grid-cols-2 gap-3 aspect-video">
                {[
                  { src: "/brand/pinterest-1.jpg", label: "Peptide Serum" },
                  { src: "/brand/pinterest-2.jpg", label: "Pore Ampoule" },
                ].map((pin) => (
                  <div
                    key={pin.src}
                    className="relative rounded-xl overflow-hidden border border-white/8 group/pin cursor-pointer"
                  >
                    <img
                      src={pin.src}
                      alt={pin.label}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover/pin:scale-108"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-[#E60023]/0 group-hover/pin:bg-[#E60023]/20 transition-all duration-300 flex items-center justify-center">
                      <span className="opacity-0 group-hover/pin:opacity-100 text-[10px] font-bold uppercase tracking-wider bg-[#E60023] text-white px-2.5 py-1 rounded-full transition-all duration-300">
                        View Pin
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-[#c8a96a]">
                  Aesthetic Skincare Boards
                </p>
                <p className="text-[13px] text-white/55 leading-relaxed">
                  Browse our daily aesthetic pin collection featuring botanical serums, morning routine highlights, and beauty affiliate inspiration.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════
          FAQ SECTION
      ════════════════════════════ */}
      <section id="faq" className="bg-white py-28 border-b border-[#e7e2d9]">
        <div className="mx-auto max-w-3xl px-4">
          <div ref={r10} className="reveal text-center space-y-4 mb-14">
            <span className="text-[11px] uppercase tracking-[0.18em] text-[#c8a96a] font-semibold">
              Frequently Asked Questions
            </span>
            <h2
              className="font-serif font-black text-[#1e4734]"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
            >
              Everything You Need to Know
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <FaqItem
                key={faq.q}
                question={faq.q}
                answer={faq.a}
                isOpen={openFaq === idx}
                onToggle={() => setOpenFaq(openFaq === idx ? null : idx)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════
          FINAL CTA SECTION
      ════════════════════════════ */}
      <section className="relative overflow-hidden bg-mesh-dark aurora-bg-animate text-white py-32">
        {/* Orbs */}
        <div className="absolute top-[20%] left-[10%] w-[400px] h-[400px] bg-emerald-700/20 rounded-full blur-[120px] animate-orb pointer-events-none" />
        <div className="absolute bottom-[10%] right-[8%] w-[300px] h-[300px] bg-[#c8a96a]/12 rounded-full blur-[100px] animate-orb pointer-events-none" style={{ animationDelay: "4s" }} />

        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center space-y-8">
          <span className="inline-block text-[11px] uppercase tracking-[0.18em] text-[#c8a96a] font-semibold px-4 py-1.5 rounded-full border border-[#c8a96a]/30 bg-white/5 backdrop-blur-sm">
            Start Automating Today
          </span>

          <h2
            className="font-serif font-black text-white leading-tight"
            style={{ fontSize: "clamp(2.2rem, 5vw, 4rem)" }}
          >
            Transform Your Pinterest
            <br />
            <span className="gold-accent-text italic">Skincare Growth.</span>
          </h2>

          <p className="mx-auto max-w-xl text-white/65 text-[15px] leading-relaxed">
            Join beauty creators and affiliate strategists who use DailyVerse AI to publish high-converting Pinterest content at scale — completely automatically.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/auth">
              <Button
                size="lg"
                className="bg-[#c8a96a] hover:bg-[#d4af37] text-[#132e22] font-bold h-14 px-10 text-[15px] rounded-full cursor-pointer cta-primary magnetic-hover shadow-2xl shadow-[#c8a96a]/20"
              >
                Start Creating Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a
              href="https://in.pinterest.com/DailyVerse07/_created/"
              target="_blank"
              rel="noreferrer"
            >
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white bg-white/6 hover:bg-white/12 h-14 px-8 text-[15px] rounded-full cursor-pointer magnetic-hover backdrop-blur-sm"
              >
                <Pin className="mr-2 h-4 w-4 text-[#E60023]" />
                See Our Pins
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ════════════════════════════
          LUXURY FOOTER
      ════════════════════════════ */}
      <footer className="bg-[#0a1a10] border-t border-[#c8a96a]/10 text-white/60 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="space-y-4 lg:col-span-2">
              <div className="flex items-center gap-2.5">
                <img
                  src="/brand/logo.jpg"
                  alt="DailyVerse AI"
                  className="h-9 w-9 rounded-full object-cover border border-[#c8a96a]/30 shadow-sm"
                  loading="lazy"
                />
                <span className="font-serif text-base font-bold text-white tracking-tight">
                  DAILY VERSE AI
                </span>
              </div>
              <p className="text-sm leading-relaxed text-white/45 max-w-xs">
                Luxury skincare automation platform for Pinterest creators and affiliate marketers.
              </p>
              <div className="flex items-center gap-3">
                <a
                  href="https://www.youtube.com/@DailyVerse-skincare"
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-xl bg-white/5 border border-white/8 text-white/50 hover:text-red-400 hover:bg-red-900/20 hover:border-red-800/30 transition-all magnetic-hover"
                >
                  <Youtube className="h-4 w-4" />
                </a>
                <a
                  href="https://in.pinterest.com/DailyVerse07/_created/"
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-xl bg-white/5 border border-white/8 text-white/50 hover:text-[#E60023] hover:bg-red-900/20 hover:border-red-800/30 transition-all magnetic-hover"
                >
                  <Pin className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Quick links */}
            <div className="space-y-4">
              <h4 className="text-[11px] uppercase tracking-[0.15em] text-white/40 font-semibold">
                Platform
              </h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Features",  id: "features"  },
                  { label: "Gallery",   id: "gallery"   },
                  { label: "Community", id: "community" },
                  { label: "FAQ",       id: "faq"       },
                ].map((l) => (
                  <li key={l.id}>
                    <button
                      onClick={() => scrollTo(l.id)}
                      className="footer-link text-sm text-white/50 hover:text-[#c8a96a] cursor-pointer bg-transparent border-none p-0 text-left"
                    >
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Social */}
            <div className="space-y-4">
              <h4 className="text-[11px] uppercase tracking-[0.15em] text-white/40 font-semibold">
                Follow Us
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <a
                    href="https://www.youtube.com/@DailyVerse-skincare"
                    target="_blank"
                    rel="noreferrer"
                    className="footer-link text-sm text-white/50 hover:text-red-400 flex items-center gap-2"
                  >
                    <Youtube className="h-3.5 w-3.5 text-red-500" />
                    YouTube Channel
                  </a>
                </li>
                <li>
                  <a
                    href="https://in.pinterest.com/DailyVerse07/_created/"
                    target="_blank"
                    rel="noreferrer"
                    className="footer-link text-sm text-white/50 hover:text-[#E60023] flex items-center gap-2"
                  >
                    <Pin className="h-3.5 w-3.5 text-[#E60023]" />
                    Pinterest Profile
                  </a>
                </li>
                <li>
                  <Link
                    to="/auth"
                    className="footer-link text-sm text-white/50 hover:text-[#c8a96a] flex items-center gap-2"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[#c8a96a]" />
                    Creator Dashboard
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="section-divider" />

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[12px] text-white/30">
              © {new Date().getFullYear()} DAILY VERSE AI. All rights reserved.
            </p>
            <p className="text-[11px] text-white/25 uppercase tracking-widest">
              Luxury Skincare Automation Platform
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
