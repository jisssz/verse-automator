"use client";
import { useState, useEffect, useRef, useCallback, MouseEvent as ReactMouseEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
  useMotionValue,
  AnimatePresence,
  type Variants,
} from "framer-motion";
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

export const Route = createFileRoute("/")({
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
});

/* ══════════════════════════════
   SCENE CHOREOGRAPHY VARIANTS
══════════════════════════════ */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1],
      delay: delay as number,
    },
  }),
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: (delay = 0) => ({
    opacity: 1,
    transition: { duration: 0.65, ease: "easeOut", delay: delay as number },
  }),
};

const revealLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] },
  },
};

const revealRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] },
  },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: (delay = 0) => ({
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.75,
      ease: [0.16, 1, 0.3, 1],
      delay: delay as number,
    },
  }),
};

const maskReveal: Variants = {
  hidden: { clipPath: "inset(100% 0% 0% 0%)", opacity: 0 },
  visible: (delay = 0) => ({
    clipPath: "inset(0% 0% 0% 0%)",
    opacity: 1,
    transition: {
      duration: 0.95,
      ease: [0.16, 1, 0.3, 1],
      delay: delay as number,
    },
  }),
};

const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.09, delayChildren: 0.1 },
  },
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};

/* ══════════════════════════════
   MAGNETIC BUTTON HOOK
══════════════════════════════ */
function useMagnetic(strength = 0.35) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springConfig = { stiffness: 220, damping: 20, mass: 0.5 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseMove = useCallback(
    (e: ReactMouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      x.set((e.clientX - cx) * strength);
      y.set((e.clientY - cy) * strength);
    },
    [x, y, strength],
  );

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return { ref, springX, springY, handleMouseMove, handleMouseLeave };
}

/* ══════════════════════════════
   ANIMATED COUNTER
══════════════════════════════ */
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
  const inView = useInView(ref, { once: true, margin: "-30px" });
  const started = useRef(false);

  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, target, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ══════════════════════════════
   FAQ ACCORDION ITEM
══════════════════════════════ */
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
  return (
    <motion.div
      layout
      className={`rounded-2xl overflow-hidden border transition-all duration-300 relative ${
        isOpen
          ? "border-[#c8a96a]/60 bg-white shadow-lg shadow-[#1e4734]/6"
          : "border-[#e7e2d9] bg-white hover:border-[#c8a96a]/40"
      }`}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            exit={{ scaleY: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute left-0 top-0 bottom-0 w-1 bg-[#c8a96a]"
          />
        )}
      </AnimatePresence>

      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between px-6 py-5 text-left group cursor-pointer"
      >
        <span className="font-serif text-[15px] font-semibold text-[#1a1a1a] pr-4 leading-snug group-hover:text-[#1e4734] transition-colors">
          {question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-300 ${
            isOpen ? "bg-[#c8a96a]" : "bg-[#f3efe8] group-hover:bg-[#e7e2d9]"
          }`}
        >
          <ChevronDown className={`h-4 w-4 ${isOpen ? "text-[#132e22]" : "text-[#6b7280]"}`} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="faq-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: "hidden" }}
          >
            <p className="px-6 pb-6 text-sm text-[#6b7280] leading-relaxed border-t border-[#f0ece4] pt-4">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ══════════════════════════════
   MAIN LANDING PAGE COMPONENT
══════════════════════════════ */
function LandingPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);

  /* Scroll Parallax Hooks */
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const heroParallax = useTransform(scrollY, [0, 600], [0, -110]);
  const heroOpacity = useTransform(scrollY, [0, 480], [1, 0]);

  /* Mouse Spotlight Tracking */
  const mouseX = useMotionValue(50);
  const mouseY = useMotionValue(50);
  const smoothX = useSpring(mouseX, { stiffness: 70, damping: 22 });
  const smoothY = useSpring(mouseY, { stiffness: 70, damping: 22 });

  const handleHeroMouse = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      const el = heroRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      mouseX.set(((e.clientX - rect.left) / rect.width) * 100);
      mouseY.set(((e.clientY - rect.top) / rect.height) * 100);
    },
    [mouseX, mouseY],
  );

  /* Scroll listener for floating nav */
  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileNavOpen(false);
  }, []);

  /* Magnetic button instances */
  const magCta = useMagnetic(0.32);
  const magCta2 = useMagnetic(0.32);

  const steps = [
    {
      num: "01",
      label: "Choose Product",
      title: "Discover Trending Skincare",
      body: "Surface high-converting botanical serums and formulas from curated beauty affiliate lists. DailyVerse identifies the products most likely to earn clicks.",
      icon: Layers,
    },
    {
      num: "02",
      label: "Generate Copy",
      title: "Craft Editorial Pin Copy",
      body: "Our AI copywriter produces elegant botanical descriptions, high-traffic Pinterest search titles, and SEO-optimised hashtags tuned for your niche audience.",
      icon: Sparkles,
    },
    {
      num: "03",
      label: "Create Visual",
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
      body: "Elegant botanical descriptions and high-CTR pin titles — generated in seconds, not hours.",
    },
    {
      icon: ImageIcon,
      title: "Luxury Visual Studio",
      body: "Studio-grade 9:16 vertical skincare photography with soft lighting and organic botanical textures.",
    },
    {
      icon: Pin,
      title: "Pinterest Automation",
      body: "Schedule, syndicate, and track pins across your beauty boards — completely on autopilot.",
    },
    {
      icon: BarChart3,
      title: "Growth Analytics",
      body: "Track affiliate clicks, saves, and organic impressions with an elegant creator dashboard.",
    },
    {
      icon: Zap,
      title: "One-Click Publishing",
      body: "From product URL to live Pinterest pin in under 60 seconds. No design skills required.",
    },
    {
      icon: Crown,
      title: "Luxury Brand Aesthetic",
      body: "Every output matches premium skincare editorial standards — not generic template designs.",
    },
  ];

  const testimonials = [
    {
      quote:
        "DailyVerse AI turned my skincare blog into a steady affiliate revenue engine. The 9:16 visual renders look like professional studio photography.",
      name: "Elena Adams",
      role: "Beauty & Skincare Creator",
      initials: "EA",
      color: "#1e4734",
    },
    {
      quote:
        "I used to spend hours in Canva. Now DailyVerse generates high-ranking pin titles, descriptions, and visuals automatically every single day.",
      name: "Sophia Chen",
      role: "Affiliate Strategist",
      color: "#c8a96a",
      initials: "SC",
    },
    {
      quote:
        "The editorial quality is what sets DailyVerse apart. My pins actually look like they belong on a luxury beauty brand's official boards.",
      name: "Maya Laurent",
      role: "Pinterest Growth Specialist",
      color: "#355e4d",
      initials: "ML",
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
    { label: "Features", id: "features" },
    { label: "Gallery", id: "gallery" },
    { label: "Community", id: "community" },
    { label: "FAQ", id: "faq" },
  ];

  return (
    <div
      className="bg-[#f8f6f2] text-[#1a1a1a] min-h-screen flex flex-col selection:bg-[#c8a96a]/25 overflow-x-hidden"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      {/* Skip Link for Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-[#c8a96a] focus:text-[#132e22] focus:font-bold focus:text-sm focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* ══════════════════════════════
          SCENE 1: FLOATING GLASS NAV
      ══════════════════════════════ */}
      <motion.nav
        role="navigation"
        aria-label="Main navigation"
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 flex justify-center ${
          navScrolled ? "pt-3 px-4" : "pt-0 px-0"
        }`}
      >
        <div
          className={`w-full transition-all duration-500 flex items-center justify-between ${
            navScrolled
              ? "max-w-5xl h-14 rounded-full floating-glass-pill px-6"
              : "max-w-7xl h-16 bg-transparent px-4 sm:px-6"
          }`}
        >
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group cursor-pointer">
            <motion.img
              whileHover={{ scale: 1.08 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              src="/brand/logo.jpg"
              alt="DailyVerse AI"
              className="h-8 w-8 rounded-full object-cover border border-[#c8a96a]/40 shadow-sm"
            />
            <span
              className="font-serif text-base font-bold text-white tracking-tight"
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}
            >
              DAILY VERSE AI
            </span>
          </Link>

          {/* Desktop Nav Items */}
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

          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-2.5">
            <a
              href="https://www.youtube.com/@DailyVerse-skincare"
              target="_blank"
              rel="noreferrer"
              aria-label="DailyVerse AI official YouTube channel (opens in new tab)"
              className="p-2 rounded-lg text-white/70 hover:text-red-400 hover:bg-white/8 transition-all"
            >
              <Youtube className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              href="https://in.pinterest.com/DailyVerse07/_created/"
              target="_blank"
              rel="noreferrer"
              aria-label="DailyVerse AI official Pinterest profile (opens in new tab)"
              className="p-2 rounded-lg text-white/70 hover:text-[#E60023] hover:bg-white/8 transition-all"
            >
              <Pin className="h-4 w-4" aria-hidden="true" />
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
              <motion.div
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <Button
                  size="sm"
                  className="bg-[#c8a96a] hover:bg-[#d4af37] text-[#132e22] font-bold text-[13px] rounded-full px-5 h-8 cursor-pointer shadow-md"
                >
                  Get Started
                </Button>
              </motion.div>
            </Link>
          </div>

          {/* Mobile Menu Icon */}
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="md:hidden p-2 text-white cursor-pointer"
            aria-label="Toggle menu"
          >
            <AnimatePresence mode="wait" initial={false}>
              {mobileNavOpen ? (
                <motion.span
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="h-5 w-5" />
                </motion.span>
              ) : (
                <motion.span
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="h-5 w-5" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Mobile Dropdown */}
        <AnimatePresence>
          {mobileNavOpen && (
            <motion.div
              key="mobile-menu"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="md:hidden glass-nav absolute top-16 left-4 right-4 rounded-2xl border border-white/12 overflow-hidden"
            >
              <div className="px-4 py-4 space-y-1">
                {navLinks.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => scrollTo(link.id)}
                    className="w-full text-left px-3 py-2.5 text-sm font-medium text-white/80 hover:text-white hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                  >
                    {link.label}
                  </button>
                ))}
                <div className="pt-3">
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
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ══════════════════════════════
          SCENE 2: CINEMATIC HERO
      ══════════════════════════════ */}
      <div
        id="main-content"
        ref={heroRef}
        onMouseMove={handleHeroMouse}
        className="relative overflow-hidden min-h-[100svh] flex flex-col justify-center bg-mesh-dark text-white"
      >
        {/* Interactive Mouse Ambient Spotlight */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: useTransform(
              [smoothX, smoothY],
              ([x, y]) =>
                `radial-gradient(ellipse 65% 55% at ${x}% ${y}%, rgba(200,169,106,0.13) 0%, transparent 70%)`,
            ),
          }}
        />

        {/* Ambient Glowing Orbs */}
        <motion.div
          className="absolute top-[12%] left-[6%] w-[520px] h-[520px] bg-emerald-700/20 rounded-full blur-[130px] pointer-events-none"
          animate={{
            scale: [1, 1.08, 0.96, 1],
            x: [0, 12, -8, 0],
            y: [0, -16, 8, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-[8%] right-[4%] w-[400px] h-[400px] bg-[#c8a96a]/12 rounded-full blur-[110px] pointer-events-none"
          animate={{
            scale: [1, 0.94, 1.06, 1],
            x: [0, -10, 6, 0],
            y: [0, 10, -12, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />

        {/* Hero Content Layer */}
        <motion.div
          className="relative z-10 mx-auto max-w-6xl w-full px-4 sm:px-6 pt-28 pb-20"
          style={{ y: heroParallax, opacity: heroOpacity }}
        >
          <div className="text-center space-y-8">
            {/* Top Crown Badge */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.25}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#c8a96a]/40 text-[#c8a96a] text-[11px] font-semibold uppercase tracking-[0.15em] bg-white/5 backdrop-blur-sm shadow-sm"
            >
              <Crown className="h-3 w-3" aria-hidden="true" />
              Luxury Skincare · AI Automation · Pinterest Growth
            </motion.div>

            {/* Headline Line Reveal */}
            <div className="overflow-hidden">
              <motion.h1
                variants={maskReveal}
                initial="hidden"
                animate="visible"
                custom={0.4}
                className="font-serif font-black tracking-tight leading-[1.02] text-white"
                style={{
                  fontSize: "clamp(2.8rem, 7.5vw, 5.8rem)",
                  textShadow: "0 2px 24px rgba(0,0,0,0.45)",
                }}
              >
                Turn Skincare Into
                <br />
                <em className="not-italic gold-accent-text">Pinterest Revenue.</em>
              </motion.h1>
            </div>

            {/* Subtitle Fade */}
            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.6}
              className="mx-auto max-w-2xl text-[#f8f6f2]/75 leading-relaxed font-light"
              style={{ fontSize: "clamp(1rem, 2.2vw, 1.18rem)" }}
            >
              DailyVerse AI transforms botanical beauty formulas into editorial pin copy,
              studio-grade luxury visuals, and fully automated board syndication — so you earn more
              while doing less.
            </motion.p>

            {/* Magnetic CTA Buttons */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.75}
              className="flex flex-wrap justify-center gap-4 pt-2"
            >
              <motion.div
                ref={magCta.ref}
                style={{ x: magCta.springX, y: magCta.springY }}
                onMouseMove={magCta.handleMouseMove}
                onMouseLeave={magCta.handleMouseLeave}
              >
                <Link to="/auth">
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 22 }}
                    className="relative overflow-hidden inline-flex items-center gap-2 bg-[#c8a96a] hover:bg-[#d4af37] text-[#132e22] font-bold h-13 px-9 text-[15px] rounded-full cursor-pointer shadow-2xl shadow-[#c8a96a]/30"
                  >
                    <motion.span
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                      initial={{ x: "-100%" }}
                      animate={{ x: "220%" }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        repeatDelay: 4,
                        ease: "easeInOut",
                      }}
                    />
                    <span className="relative z-10 flex items-center gap-2">
                      Start Creating
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </motion.button>
                </Link>
              </motion.div>

              <motion.div
                ref={magCta2.ref}
                style={{ x: magCta2.springX, y: magCta2.springY }}
                onMouseMove={magCta2.handleMouseMove}
                onMouseLeave={magCta2.handleMouseLeave}
              >
                <a
                  href="https://www.youtube.com/@DailyVerse-skincare"
                  target="_blank"
                  rel="noreferrer"
                >
                  <motion.button
                    whileHover={{ scale: 1.04, backgroundColor: "rgba(255,255,255,0.12)" }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 22 }}
                    className="inline-flex items-center gap-2 border border-white/22 text-white bg-white/6 h-13 px-9 text-[15px] rounded-full cursor-pointer backdrop-blur-sm"
                  >
                    <Play className="h-4 w-4 text-red-400 fill-red-400" aria-hidden="true" />
                    Watch Demo
                  </motion.button>
                </a>
              </motion.div>
            </motion.div>

            {/* Trust Marks Row */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="flex flex-wrap justify-center gap-7 pt-3"
            >
              {[
                { v: "1.4M+", label: "Pins Published" },
                { v: "4.8★", label: "Creator Rating" },
                { v: "15 hrs", label: "Saved Per Week" },
              ].map((s) => (
                <motion.div
                  key={s.label}
                  variants={staggerItem}
                  className="flex items-center gap-2.5"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-[#c8a96a] animate-pulse-glow" />
                  <span className="text-xs text-white/60">
                    <strong className="text-white font-semibold">{s.v}</strong> {s.label}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Hero Banner Showcase */}
          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            custom={0.9}
            className="mt-14 relative mx-auto max-w-4xl"
          >
            {/* Left Glass Tag */}
            <motion.div
              className="absolute -top-5 left-4 sm:left-6 z-20 hidden sm:flex items-center gap-2.5 glass-panel-dark px-4 py-2.5 rounded-xl border border-[#c8a96a]/35 shadow-xl"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="p-1.5 rounded-lg bg-[#c8a96a]/20">
                <Sparkles className="h-4 w-4 text-[#c8a96a]" aria-hidden="true" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-white">AI Visual Studio</p>
                <p className="text-[10px] text-[#c8a96a]/85">9:16 Studio-grade Pins</p>
              </div>
            </motion.div>

            {/* Right Glass Tag */}
            <motion.div
              className="absolute -top-5 right-4 sm:right-6 z-20 hidden sm:flex items-center gap-2.5 glass-panel-dark px-4 py-2.5 rounded-xl border border-emerald-500/35 shadow-xl"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
            >
              <div className="p-1.5 rounded-lg bg-emerald-500/15">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden="true" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-white">Auto-Published</p>
                <p className="text-[10px] text-emerald-400/85">Pinterest Board Syndication</p>
              </div>
            </motion.div>

            {/* Main Showcase Image with 3D Tilt */}
            <motion.div
              whileHover={{ scale: 1.015, rotateX: 1.5, rotateY: -1 }}
              transition={{ type: "spring", stiffness: 180, damping: 22 }}
              className="relative rounded-3xl overflow-hidden border border-[#c8a96a]/30 shadow-[0_32px_100px_-20px_rgba(0,0,0,0.65)]"
              style={{ transformPerspective: 1000 }}
            >
              <img
                src="/brand/hero-banner.jpg"
                alt="DailyVerse AI — Luxury Skincare Automation Studio"
                className="w-full object-cover"
                style={{ maxHeight: "520px" }}
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c1c14]/70 via-transparent to-transparent" />
              <div
                className="absolute inset-0"
                style={{ boxShadow: "inset 0 0 120px rgba(12,28,20,0.45)" }}
              />
            </motion.div>

            {/* Scroll Cue */}
            <motion.div
              className="mt-12 flex flex-col items-center gap-2"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center pt-2">
                <div className="w-1 h-2.5 rounded-full bg-white/40" />
              </div>
              <span className="text-[10px] text-white/38 uppercase tracking-widest font-medium">
                Explore
              </span>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* ══════════════════════════════
          SCENE 3: STATS BAR
      ══════════════════════════════ */}
      <section className="bg-[#0c1c14] border-y border-[#c8a96a]/18 relative">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="mx-auto max-w-6xl px-4 py-12 grid grid-cols-2 lg:grid-cols-4 gap-6 relative"
        >
          {[
            { n: 1400000, s: "+", label: "Pins Automated" },
            { n: 99, s: ".4%", label: "Automation Uptime" },
            { n: 4, s: ".8 / 5", label: "Creator Rating" },
            { n: 100, s: "%", label: "Scheduled Publishing" },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              variants={staggerItem}
              whileHover={{ y: -2, borderColor: "rgba(200,169,106,0.5)" }}
              className="stat-card rounded-2xl p-6 text-center cursor-default relative group"
            >
              <p className="font-serif text-3xl sm:text-4xl font-black text-[#c8a96a] tabular-nums">
                <AnimatedCounter target={stat.n} suffix={stat.s} duration={1600} />
              </p>
              <p className="mt-2 text-[11px] font-medium text-white/48 uppercase tracking-[0.13em]">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ══════════════════════════════
          SCENE 4: PROBLEM / SOLUTION
      ══════════════════════════════ */}
      <section className="bg-cream-section py-28 border-b border-[#e7e2d9]">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Problem Column */}
            <motion.div
              variants={revealLeft}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="space-y-6"
            >
              <span className="text-[11px] uppercase tracking-[0.18em] text-[#c8a96a] font-semibold">
                The Creator Problem
              </span>
              <h2
                className="font-serif font-black text-[#1e4734] leading-tight"
                style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
              >
                Great Skincare Content Takes Too Long to Create.
              </h2>
              <p className="text-[#6b7280] leading-relaxed text-[15px]">
                The average beauty creator spends{" "}
                <strong className="text-[#1a1a1a]">15+ hours per week</strong> designing pins,
                writing descriptions, and manually scheduling posts — time that should be spent
                growing your brand and income.
              </p>
              <motion.ul
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="space-y-3"
              >
                {[
                  "Manual Canva design for every single pin",
                  "Writing titles and descriptions from scratch",
                  "Guessing the right hashtags and keywords",
                  "Scheduling each post manually, one by one",
                ].map((item) => (
                  <motion.li key={item} variants={staggerItem} className="flex items-start gap-3">
                    <div className="mt-0.5 w-5 h-5 rounded-full bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                      <X className="h-3 w-3 text-red-400" aria-hidden="true" />
                    </div>
                    <span className="text-sm text-[#6b7280]">{item}</span>
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>

            {/* Solution Column */}
            <motion.div
              variants={revealRight}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="space-y-5 p-8 rounded-3xl bg-white border border-[#e7e2d9] shadow-xl shadow-[#1e4734]/5 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#c8a96a]/10 rounded-full blur-2xl pointer-events-none" />
              <span className="text-[11px] uppercase tracking-[0.18em] text-[#1e4734] font-semibold">
                The DailyVerse Solution
              </span>
              <h3 className="font-serif font-bold text-[#1e4734] text-2xl leading-snug">
                One platform. Fully automated.
              </h3>
              <motion.ul
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="space-y-3 pt-1"
              >
                {[
                  "Studio-grade 9:16 pin graphics — generated instantly",
                  "Editorial botanical copy and SEO titles — written by AI",
                  "Optimal hashtags and search terms — researched automatically",
                  "Scheduled syndication to your boards — runs 24/7",
                ].map((item) => (
                  <motion.li key={item} variants={staggerItem} className="flex items-start gap-3">
                    <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" aria-hidden="true" />
                    </div>
                    <span className="text-sm text-[#4b5563] font-medium">{item}</span>
                  </motion.li>
                ))}
              </motion.ul>
              <div className="pt-3">
                <Link to="/auth">
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-2 bg-[#1e4734] hover:bg-[#355e4d] text-white font-semibold rounded-full px-7 h-11 cursor-pointer text-sm transition-colors shadow-md"
                  >
                    Start Automating
                    <ArrowRight className="h-4 w-4 text-[#c8a96a]" aria-hidden="true" />
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          SCENE 5: FEATURE GRID
      ══════════════════════════════ */}
      <section id="features" className="bg-white py-28 border-b border-[#e7e2d9]">
        <div className="mx-auto max-w-6xl px-4">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="text-center space-y-4 mb-16"
          >
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
              Replace manual design, writing, and scheduling with one continuous luxury content
              engine.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {features.map((feat) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={feat.title}
                  variants={staggerItem}
                  whileHover={{
                    y: -6,
                    boxShadow:
                      "0 20px 60px -12px rgba(30,71,52,0.14), 0 4px 16px -4px rgba(200,169,106,0.12)",
                    borderColor: "rgba(200,169,106,0.5)",
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  className="feature-card rounded-3xl p-8 space-y-4 cursor-default group"
                >
                  <div className="bg-[#1e4734] text-[#c8a96a] w-12 h-12 rounded-2xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-[#1e4734]">{feat.title}</h3>
                  <p className="text-sm text-[#6b7280] leading-relaxed">{feat.body}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════
          SCENE 6: WORKFLOW VISUALIZATION
      ══════════════════════════════ */}
      <section className="bg-cream-section py-28 border-b border-[#e7e2d9]">
        <div className="mx-auto max-w-6xl px-4">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="text-center space-y-4 mb-16"
          >
            <span className="text-[11px] uppercase tracking-[0.18em] text-[#c8a96a] font-semibold">
              Simple 4-Step Journey
            </span>
            <h2
              className="font-serif font-black text-[#1e4734]"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
            >
              From Formula to Live Pin in Minutes
            </h2>
          </motion.div>

          <div className="grid lg:grid-cols-12 gap-10 items-start">
            {/* Step selector list */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="lg:col-span-5 space-y-3"
            >
              {steps.map((step, idx) => {
                const Icon = step.icon;
                const active = activeStep === idx;
                return (
                  <motion.button
                    key={step.num}
                    variants={staggerItem}
                    onClick={() => setActiveStep(idx)}
                    whileHover={{ x: active ? 0 : 4 }}
                    transition={{ type: "spring", stiffness: 300, damping: 22 }}
                    className={`w-full text-left rounded-2xl border p-5 flex items-center gap-4 cursor-pointer relative overflow-hidden transition-all duration-300 ${
                      active
                        ? "bg-[#1e4734] border-[#c8a96a] shadow-lg shadow-[#1e4734]/15"
                        : "bg-white border-[#e7e2d9] hover:border-[#c8a96a]/50"
                    }`}
                  >
                    {active && (
                      <motion.div
                        layoutId="activeStepIndicator"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-[#c8a96a]"
                      />
                    )}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                        active
                          ? "bg-[#c8a96a] text-[#132e22]"
                          : "bg-[#f3efe8] text-[#1e4734] border border-[#e7e2d9]"
                      }`}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div>
                      <p
                        className={`text-[10px] uppercase tracking-widest font-semibold font-mono ${
                          active ? "text-[#c8a96a]/80" : "text-[#9ca3af]"
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
                  </motion.button>
                );
              })}
            </motion.div>

            {/* Step detail card */}
            <div className="lg:col-span-7">
              <AnimatePresence mode="wait">
                {(() => {
                  const s = steps[activeStep];
                  if (!s) return null;
                  const Icon = s.icon;
                  return (
                    <motion.div
                      key={activeStep}
                      initial={{ opacity: 0, y: 16, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -12, scale: 0.98 }}
                      transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                      className="luxury-card rounded-3xl p-8 space-y-6 bg-white border-[#e7e2d9]"
                    >
                      <div className="flex items-center justify-between border-b border-[#f0ece4] pb-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#c8a96a] text-[#132e22] flex items-center justify-center shadow-sm">
                            <Icon className="h-5 w-5" aria-hidden="true" />
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

                      <p className="text-[15px] text-[#4b5563] leading-relaxed">{s.body}</p>

                      <div className="bg-[#0c1c14] rounded-2xl p-5 font-mono text-xs space-y-2 border border-[#c8a96a]/20">
                        <div className="flex items-center justify-between text-emerald-400">
                          <span>● DailyVerse AI Studio</span>
                          <motion.span
                            animate={{ opacity: [1, 0.4, 1] }}
                            transition={{ duration: 1.4, repeat: Infinity }}
                            className="text-[#c8a96a]"
                          >
                            LIVE
                          </motion.span>
                        </div>
                        <p className="text-[#6b7280]">&gt; Executing: {s.label.toLowerCase()}...</p>
                        <p className="text-emerald-400">
                          &gt; Output generated. Editorial quality verified. ✓
                        </p>
                      </div>

                      <Link to="/auth">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full bg-[#1e4734] hover:bg-[#355e4d] text-white font-medium rounded-xl h-11 cursor-pointer text-sm flex items-center justify-center gap-2 transition-colors"
                        >
                          Try {s.title}
                          <ArrowRight className="h-4 w-4 text-[#c8a96a]" aria-hidden="true" />
                        </motion.button>
                      </Link>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          SCENE 7: PINTEREST GALLERY
      ══════════════════════════════ */}
      <section id="gallery" className="bg-white py-28 border-b border-[#e7e2d9]">
        <div className="mx-auto max-w-6xl px-4">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="text-center space-y-4 mb-14"
          >
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
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {/* Featured Studio Render Banner */}
            <motion.div
              variants={staggerItem}
              whileHover={{ scale: 1.015 }}
              transition={{ type: "spring", stiffness: 250, damping: 22 }}
              className="col-span-2 row-span-2 rounded-3xl overflow-hidden border border-[#e7e2d9] shadow-lg group relative"
            >
              <div className="relative overflow-hidden h-full">
                <motion.img
                  whileHover={{ scale: 1.06 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  src="/brand/hero-banner.jpg"
                  alt="Luxury Skincare Editorial — DailyVerse AI"
                  className="w-full h-full object-cover"
                  style={{ minHeight: "360px" }}
                  loading="lazy"
                  decoding="async"
                />
                <motion.div
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.35 }}
                  className="absolute inset-0 bg-gradient-to-t from-[#0c1c14]/75 via-transparent to-transparent flex items-end p-6"
                >
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-[#c8a96a] font-bold">
                      DailyVerse AI
                    </span>
                    <p className="font-serif text-xl font-bold text-white mt-1 leading-tight">
                      Luxury Editorial
                      <br />
                      Skincare Pin Render
                    </p>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Portrait Cards */}
            {[
              { src: "/brand/pinterest-1.jpg", label: "Peptide Hydrating Serum" },
              { src: "/brand/pinterest-2.jpg", label: "Pore Lifting Ampoule" },
            ].map((pin) => (
              <motion.div
                key={pin.src}
                variants={staggerItem}
                whileHover={{ scale: 1.02, y: -4 }}
                transition={{ type: "spring", stiffness: 250, damping: 22 }}
                className="rounded-2xl overflow-hidden border border-[#e7e2d9] shadow-md group relative"
              >
                <div className="relative overflow-hidden aspect-[2/3]">
                  <motion.img
                    whileHover={{ scale: 1.08 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    src={pin.src}
                    alt={`${pin.label} — DailyVerse AI`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute top-2.5 left-2.5 bg-[#1e4734] text-[#c8a96a] text-[9px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md shadow-sm">
                    AI Generated
                  </div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.25 }}
                    className="absolute inset-0 bg-black/25 flex items-end p-4"
                  >
                    <p className="text-[11px] font-semibold text-white">{pin.label}</p>
                  </motion.div>
                </div>
              </motion.div>
            ))}

            {/* Profile CTA card */}
            <motion.div
              variants={staggerItem}
              className="col-span-2 rounded-2xl overflow-hidden border border-[#e7e2d9] shadow-md bg-[#0c1c14] p-6 flex items-center justify-between gap-6"
            >
              <div className="space-y-2">
                <p className="text-[10px] text-[#c8a96a] uppercase tracking-widest font-bold">
                  @DailyVerse07
                </p>
                <p className="font-serif text-lg font-bold text-white leading-tight">
                  Follow our official
                  <br />
                  Pinterest profile
                </p>
                <p className="text-xs text-white/55">New botanical pins added daily.</p>
              </div>
              <a
                href="https://in.pinterest.com/DailyVerse07/_created/"
                target="_blank"
                rel="noreferrer"
                aria-label="Follow DailyVerse on Pinterest (opens in new tab)"
              >
                <motion.button
                  whileHover={{ scale: 1.05, backgroundColor: "#c4001d" }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-[#E60023] text-white font-bold text-xs rounded-full px-6 h-10 cursor-pointer inline-flex items-center gap-1.5 shrink-0"
                >
                  <Pin className="h-3.5 w-3.5" aria-hidden="true" />
                  Follow Profile
                </motion.button>
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════
          SCENE 8: BENEFITS & TESTIMONIALS
      ══════════════════════════════ */}
      <section className="bg-cream-section py-28 border-b border-[#e7e2d9]">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left Column Benefits */}
            <motion.div
              variants={revealLeft}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="space-y-8"
            >
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

              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="space-y-6"
              >
                {[
                  {
                    icon: TrendingUp,
                    title: "Higher Affiliate Traffic",
                    body: "Publish high-ranking pins consistently to drive targeted organic visitors to your beauty affiliate links.",
                  },
                  {
                    icon: Clock,
                    title: "Save 15+ Hours Weekly",
                    body: "Automate pin creation, copywriting, and scheduling in one place so you can focus on scaling your brand.",
                  },
                  {
                    icon: Heart,
                    title: "Luxury Aesthetic Quality",
                    body: "Every graphic matches premium skincare standards with botanical aesthetics and editorial typography.",
                  },
                  {
                    icon: Crown,
                    title: "Built for Pinterest SEO",
                    body: "Our AI researches trending keywords, hashtags, and pin formats to ensure your content ranks on Pinterest.",
                  },
                ].map((b) => {
                  const Icon = b.icon;
                  return (
                    <motion.div key={b.title} variants={staggerItem} className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#1e4734] text-[#c8a96a] flex items-center justify-center shrink-0 shadow-md">
                        <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#1e4734] text-sm">{b.title}</h3>
                        <p className="text-[13px] text-[#6b7280] leading-relaxed mt-0.5">
                          {b.body}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </motion.div>

            {/* Right Column Testimonials */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className="space-y-4"
            >
              {testimonials.map((t) => (
                <motion.div
                  key={t.name}
                  variants={staggerItem}
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 250, damping: 22 }}
                  className="quote-card rounded-2xl p-6 space-y-4"
                >
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, si) => (
                      <Star
                        key={si}
                        className="h-3.5 w-3.5 text-[#c8a96a] fill-[#c8a96a]"
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                  <p className="text-sm text-[#374151] italic leading-relaxed">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white font-serif"
                      style={{ background: t.color }}
                    >
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#1e4734]">{t.name}</p>
                      <p className="text-[10px] text-[#9ca3af]">{t.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          SCENE 9: DUAL COMMUNITY SHOWCASE
      ══════════════════════════════ */}
      <section id="community" className="bg-[#0c1c14] py-28 border-y border-[#c8a96a]/18">
        <div className="mx-auto max-w-6xl px-4">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="text-center space-y-4 mb-16"
          >
            <span className="text-[11px] uppercase tracking-[0.18em] text-[#c8a96a] font-semibold">
              Official Channels
            </span>
            <h2
              className="font-serif font-black text-white"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
            >
              Join the DailyVerse Community
            </h2>
            <p className="mx-auto max-w-lg text-white/58 text-[15px]">
              Follow our official channels for live tutorials, automation guides, and daily
              aesthetic pin collections.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="grid lg:grid-cols-2 gap-6"
          >
            {/* YouTube Card */}
            <motion.div
              variants={staggerItem}
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 220, damping: 22 }}
              className="rounded-3xl p-7 bg-[#132e22] border border-[#c8a96a]/22 space-y-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{
                      boxShadow: [
                        "0 0 0 0 rgba(220,38,38,0)",
                        "0 0 24px 6px rgba(220,38,38,0.3)",
                        "0 0 0 0 rgba(220,38,38,0)",
                      ],
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="p-3 rounded-2xl bg-red-600"
                  >
                    <Youtube className="h-5 w-5 text-white" aria-hidden="true" />
                  </motion.div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-white">YouTube Channel</h3>
                    <p className="text-xs text-[#c8a96a]">@DailyVerse-skincare</p>
                  </div>
                </div>
                <a
                  href="https://www.youtube.com/@DailyVerse-skincare"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Subscribe to DailyVerse on YouTube (opens in new tab)"
                >
                  <motion.button
                    whileHover={{ scale: 1.05, backgroundColor: "#dc2626" }}
                    whileTap={{ scale: 0.97 }}
                    className="bg-red-600 text-white font-bold text-xs rounded-full px-5 h-9 cursor-pointer inline-flex items-center gap-1.5 shadow-lg"
                  >
                    Subscribe
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </motion.button>
                </a>
              </div>

              <a
                href="https://www.youtube.com/@DailyVerse-skincare"
                target="_blank"
                rel="noreferrer"
                aria-label="Watch DailyVerse AI tutorials on YouTube"
                className="block"
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 250, damping: 22 }}
                  className="relative rounded-2xl overflow-hidden aspect-video border border-white/8 group/play cursor-pointer"
                >
                  <motion.img
                    whileHover={{ scale: 1.06 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    src="/brand/hero-banner.jpg"
                    alt="DailyVerse YouTube Channel preview"
                    className="w-full h-full object-cover opacity-55"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      whileHover={{ scale: 1.12 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center shadow-2xl"
                    >
                      <Play className="h-6 w-6 fill-white text-white ml-1" aria-hidden="true" />
                    </motion.div>
                  </div>
                </motion.div>
              </a>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-[#c8a96a]">
                  Latest AI Skincare Walkthroughs
                </p>
                <p className="text-[13px] text-white/52 leading-relaxed">
                  Step-by-step tutorials on automated Pinterest pin creation, botanical copywriting,
                  and affiliate revenue strategies.
                </p>
              </div>
            </motion.div>

            {/* Pinterest Card */}
            <motion.div
              variants={staggerItem}
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 220, damping: 22 }}
              className="rounded-3xl p-7 bg-[#132e22] border border-[#c8a96a]/22 space-y-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{
                      boxShadow: [
                        "0 0 0 0 rgba(230,0,35,0)",
                        "0 0 24px 6px rgba(230,0,35,0.3)",
                        "0 0 0 0 rgba(230,0,35,0)",
                      ],
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                    className="p-3 rounded-2xl bg-[#E60023]"
                  >
                    <Pin className="h-5 w-5 text-white" aria-hidden="true" />
                  </motion.div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-white">Pinterest Profile</h3>
                    <p className="text-xs text-[#c8a96a]">@DailyVerse07</p>
                  </div>
                </div>
                <a
                  href="https://in.pinterest.com/DailyVerse07/_created/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Follow DailyVerse on Pinterest (opens in new tab)"
                >
                  <motion.button
                    whileHover={{ scale: 1.05, backgroundColor: "#c4001d" }}
                    whileTap={{ scale: 0.97 }}
                    className="bg-[#E60023] text-white font-bold text-xs rounded-full px-5 h-9 cursor-pointer inline-flex items-center gap-1.5 shadow-lg"
                  >
                    Follow
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </motion.button>
                </a>
              </div>

              <div className="grid grid-cols-2 gap-3 aspect-video">
                {[
                  { src: "/brand/pinterest-1.jpg", label: "Peptide Serum" },
                  { src: "/brand/pinterest-2.jpg", label: "Pore Ampoule" },
                ].map((pin) => (
                  <a
                    key={pin.src}
                    href="https://in.pinterest.com/DailyVerse07/_created/"
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`View ${pin.label} pin on Pinterest`}
                    className="block"
                  >
                    <motion.div
                      whileHover={{ scale: 1.04 }}
                      transition={{ type: "spring", stiffness: 300, damping: 22 }}
                      className="relative rounded-xl overflow-hidden border border-white/8 h-full group/pin cursor-pointer"
                    >
                      <motion.img
                        whileHover={{ scale: 1.08 }}
                        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                        src={pin.src}
                        alt={pin.label}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                      <motion.div
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        transition={{ duration: 0.25 }}
                        className="absolute inset-0 bg-[#E60023]/22 flex items-center justify-center"
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-[#E60023] text-white px-2.5 py-1 rounded-full">
                          View Pin
                        </span>
                      </motion.div>
                    </motion.div>
                  </a>
                ))}
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-[#c8a96a]">Aesthetic Skincare Boards</p>
                <p className="text-[13px] text-white/52 leading-relaxed">
                  Browse our daily aesthetic pin collection featuring botanical serums, morning
                  routines, and beauty affiliate inspiration.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════
          SCENE 10: FAQ ACCORDION
      ══════════════════════════════ */}
      <section id="faq" className="bg-white py-28 border-b border-[#e7e2d9]">
        <div className="mx-auto max-w-3xl px-4">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="text-center space-y-4 mb-14"
          >
            <span className="text-[11px] uppercase tracking-[0.18em] text-[#c8a96a] font-semibold">
              Frequently Asked Questions
            </span>
            <h2
              className="font-serif font-black text-[#1e4734]"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
            >
              Everything You Need to Know
            </h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="space-y-3"
          >
            {faqs.map((faq, idx) => (
              <motion.div key={faq.q} variants={staggerItem}>
                <FaqItem
                  question={faq.q}
                  answer={faq.a}
                  isOpen={openFaq === idx}
                  onToggle={() => setOpenFaq(openFaq === idx ? null : idx)}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════
          SCENE 11: FINAL CALL TO ACTION
      ══════════════════════════════ */}
      <section className="relative overflow-hidden bg-mesh-dark text-white py-32">
        {/* Ambient Glow Circles */}
        <motion.div
          className="absolute top-[18%] left-[8%] w-[420px] h-[420px] bg-emerald-700/20 rounded-full blur-[130px] pointer-events-none"
          animate={{ scale: [1, 1.06, 0.96, 1], x: [0, 8, -6, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[8%] right-[6%] w-[340px] h-[340px] bg-[#c8a96a]/12 rounded-full blur-[110px] pointer-events-none"
          animate={{ scale: [1, 0.94, 1.05, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        />

        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center space-y-8">
          <motion.span
            variants={fadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="inline-block text-[11px] uppercase tracking-[0.18em] text-[#c8a96a] font-semibold px-4 py-1.5 rounded-full border border-[#c8a96a]/30 bg-white/5 backdrop-blur-sm shadow-sm"
          >
            Start Automating Today
          </motion.span>

          <motion.h2
            variants={maskReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0.1}
            className="font-serif font-black text-white leading-tight"
            style={{ fontSize: "clamp(2.2rem, 5vw, 4rem)" }}
          >
            Transform Your Pinterest
            <br />
            <em className="not-italic gold-accent-text">Skincare Growth.</em>
          </motion.h2>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0.2}
            className="mx-auto max-w-xl text-white/65 text-[15px] leading-relaxed"
          >
            Join beauty creators and affiliate strategists who use DailyVerse AI to publish
            high-converting Pinterest content at scale — completely automatically.
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0.3}
            className="flex flex-wrap justify-center gap-4"
          >
            <Link to="/auth">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 350, damping: 22 }}
                className="relative overflow-hidden inline-flex items-center gap-2 bg-[#c8a96a] hover:bg-[#d4af37] text-[#132e22] font-bold h-14 px-10 text-[15px] rounded-full cursor-pointer shadow-2xl shadow-[#c8a96a]/22"
              >
                <motion.span
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                  initial={{ x: "-100%" }}
                  animate={{ x: "220%" }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 5, ease: "easeInOut" }}
                />
                <span className="relative z-10 flex items-center gap-2">
                  Start Creating Free
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </span>
              </motion.button>
            </Link>
            <a
              href="https://in.pinterest.com/DailyVerse07/_created/"
              target="_blank"
              rel="noreferrer"
              aria-label="View DailyVerse pins on Pinterest (opens in new tab)"
            >
              <motion.button
                whileHover={{ scale: 1.04, backgroundColor: "rgba(255,255,255,0.12)" }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 350, damping: 22 }}
                className="inline-flex items-center gap-2 border border-white/22 text-white bg-white/6 h-14 px-8 text-[15px] rounded-full cursor-pointer backdrop-blur-sm"
              >
                <Pin className="h-4 w-4 text-[#E60023]" aria-hidden="true" />
                See Our Pins
              </motion.button>
            </a>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════
          SCENE 12: LUXURY FOOTER
      ══════════════════════════════ */}
      <footer className="bg-[#0a1a10] border-t border-[#c8a96a]/12 text-white/58 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            {/* Brand Column */}
            <div className="space-y-4 lg:col-span-2">
              <Link to="/" className="flex items-center gap-2.5 group w-fit">
                <motion.img
                  whileHover={{ scale: 1.08, rotate: 3 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  src="/brand/logo.jpg"
                  alt="DailyVerse AI"
                  className="h-9 w-9 rounded-full object-cover border border-[#c8a96a]/30 shadow-sm"
                  loading="lazy"
                  decoding="async"
                />
                <span className="font-serif text-base font-bold text-white tracking-tight">
                  DAILY VERSE AI
                </span>
              </Link>
              <p className="text-sm leading-relaxed text-white/42 max-w-xs">
                Luxury skincare automation platform for Pinterest creators and affiliate marketers.
              </p>
              <div className="flex items-center gap-3">
                {[
                  {
                    href: "https://www.youtube.com/@DailyVerse-skincare",
                    label: "YouTube",
                    hoverClass: "hover:text-red-400 hover:border-red-800/30 hover:bg-red-900/20",
                    icon: <Youtube className="h-4 w-4" aria-hidden="true" />,
                  },
                  {
                    href: "https://in.pinterest.com/DailyVerse07/_created/",
                    label: "Pinterest",
                    hoverClass: "hover:text-[#E60023] hover:border-red-800/30 hover:bg-red-900/20",
                    icon: <Pin className="h-4 w-4" aria-hidden="true" />,
                  },
                ].map((s) => (
                  <motion.a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`DailyVerse AI on ${s.label} (opens in new tab)`}
                    whileHover={{ y: -2 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={`p-2.5 rounded-xl bg-white/5 border border-white/8 text-white/50 transition-all ${s.hoverClass}`}
                  >
                    {s.icon}
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Nav Column */}
            <div className="space-y-4">
              <h4 className="text-[11px] uppercase tracking-[0.15em] text-white/38 font-semibold">
                Platform
              </h4>
              <ul className="space-y-2.5">
                {navLinks.map((l) => (
                  <li key={l.id}>
                    <button
                      onClick={() => scrollTo(l.id)}
                      className="footer-link text-sm text-white/48 hover:text-[#c8a96a] cursor-pointer bg-transparent border-none p-0 text-left"
                    >
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Social Column */}
            <div className="space-y-4">
              <h4 className="text-[11px] uppercase tracking-[0.15em] text-white/38 font-semibold">
                Follow Us
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <a
                    href="https://www.youtube.com/@DailyVerse-skincare"
                    target="_blank"
                    rel="noreferrer"
                    className="footer-link text-sm text-white/48 hover:text-red-400 flex items-center gap-2"
                  >
                    <Youtube className="h-3.5 w-3.5 text-red-500" aria-hidden="true" />
                    YouTube Channel
                  </a>
                </li>
                <li>
                  <a
                    href="https://in.pinterest.com/DailyVerse07/_created/"
                    target="_blank"
                    rel="noreferrer"
                    className="footer-link text-sm text-white/48 hover:text-[#E60023] flex items-center gap-2"
                  >
                    <Pin className="h-3.5 w-3.5 text-[#E60023]" aria-hidden="true" />
                    Pinterest Profile
                  </a>
                </li>
                <li>
                  <Link
                    to="/auth"
                    className="footer-link text-sm text-white/48 hover:text-[#c8a96a] flex items-center gap-2"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[#c8a96a]" aria-hidden="true" />
                    Creator Dashboard
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="section-divider" />

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[12px] text-white/28">
              © {new Date().getFullYear()} DAILY VERSE AI. All rights reserved.
            </p>

            <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-800/40 px-3 py-1 rounded-full">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-glow" />
              <span className="text-[11px] text-emerald-300 font-medium">
                All Systems Operational
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
