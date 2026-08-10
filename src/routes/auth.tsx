import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Loader2, Sparkles, LogIn, Mail, RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  beforeLoad: async () => {
    const isDemoMode =
      typeof window !== "undefined" && localStorage.getItem("dailyverse_demo_mode") === "true";
    if (isDemoMode) {
      throw redirect({ to: "/dashboard" });
    }
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      throw redirect({ to: "/dashboard" });
    }
  },
  head: () => ({
    meta: [
      { title: "Sign in — DailyVerse AI" },
      {
        name: "description",
        content: "Sign in to DailyVerse AI to automate your affiliate content workflow.",
      },
      { property: "og:title", content: "Sign in — DailyVerse AI" },
      {
        property: "og:description",
        content: "Sign in to DailyVerse AI to automate your affiliate content workflow.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [emailMode, setEmailMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);
  const [googleOauthDisabled, setGoogleOauthDisabled] = useState(false);

  useEffect(() => {
    async function checkGoogleOAuth() {
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            skipBrowserRedirect: true,
            redirectTo: window.location.origin,
          },
        });
        if (error || !data?.url) {
          setGoogleOauthDisabled(true);
          return;
        }
        const res = await fetch(data.url, { method: "GET" }).catch(() => null);
        if (res && (!res.ok || res.status === 400)) {
          const body = await res.text().catch(() => "");
          if (body.includes("missing OAuth secret") || body.includes("Unsupported provider")) {
            setGoogleOauthDisabled(true);
          }
        }
      } catch {
        setGoogleOauthDisabled(true);
      }
    }
    void checkGoogleOAuth();
  }, []);

  async function signInWithGoogle() {
    if (googleOauthDisabled) {
      setError(
        "Google OAuth is not configured in your Supabase project (missing Client Secret). Please use Instant Demo Access or Email sign-in."
      );
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result && "error" in result && result.error) {
        setGoogleOauthDisabled(true);
        setError(
          "Google OAuth is not configured in your Supabase project. Please use Instant Demo Access or Email sign-in below."
        );
      }
    } catch (e) {
      setGoogleOauthDisabled(true);
      setError(
        e instanceof Error
          ? e.message
          : "Google OAuth is not configured. Please use Instant Demo Access below."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError(null);
    setUnconfirmedEmail(null);

    try {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (signInErr) {
        if (
          signInErr.message.toLowerCase().includes("email not confirmed") ||
          signInErr.message.toLowerCase().includes("confirm")
        ) {
          setUnconfirmedEmail(email.trim());
          setError(
            "Your email address has not been confirmed yet. Please check your inbox or click below to resend confirmation."
          );
          return;
        }

        const { error: signUpErr } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
        });

        if (signUpErr) {
          if (
            signUpErr.message.toLowerCase().includes("email not confirmed") ||
            signUpErr.message.toLowerCase().includes("confirm")
          ) {
            setUnconfirmedEmail(email.trim());
            setError("Confirmation email sent! Please check your inbox to activate your account.");
            return;
          }
          throw signUpErr;
        }

        toast.success("Registration successful! Check your email if confirmation is enabled.");
      }

      localStorage.removeItem("dailyverse_demo_mode");
      window.location.href = "/dashboard";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendConfirmation() {
    if (!unconfirmedEmail) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: unconfirmedEmail,
      });
      if (error) throw error;
      toast.success(`Confirmation email resent to ${unconfirmedEmail}. Please check your inbox.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to resend confirmation email");
    } finally {
      setResending(false);
    }
  }

  function handleDemoSignIn() {
    setDemoLoading(true);
    setError(null);
    localStorage.setItem("dailyverse_demo_mode", "true");
    window.location.href = "/dashboard";
  }

  return (
    <div className="min-h-screen flex bg-[#F8F6F2] text-[#222222] selection:bg-[#C8A96A]/30">
      {/* Left Panel - Editorial Brand Showcase (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#132E22] text-[#F8F6F2] p-12 flex-col justify-between relative overflow-hidden border-r border-[#28543E]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1E4734]/40 via-transparent to-[#C8A96A]/10 pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/brand/logo.jpg"
              alt="DAILY VERSE logo"
              className="h-10 w-10 rounded-xl object-cover border border-[#C8A96A]/40 shadow-sm"
              loading="lazy"
            />
            <div className="flex flex-col">
              <span className="font-serif text-lg font-bold tracking-tight text-[#F8F6F2]">
                DAILY VERSE AI
              </span>
              <span className="text-[10px] tracking-widest text-[#C8A96A] uppercase font-semibold">
                Luxury Automation Suite
              </span>
            </div>
          </Link>

          <div className="pt-12 space-y-4 max-w-lg">
            <h2 className="font-serif text-4xl font-bold leading-tight text-[#F8F6F2]">
              Elevate Your Beauty Affiliate Pipeline
            </h2>
            <p className="text-sm text-[#F8F6F2]/80 leading-relaxed">
              Transform botanical skincare formulas into high-CTR Pinterest pins, FLUX.1 studio renderings, and automated syndication workflows.
            </p>
          </div>
        </div>

        {/* Feature Badges Showcase */}
        <div className="relative z-10 space-y-4 pt-12">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#1E4734]/60 border border-[#28543E] space-y-1 backdrop-blur-md">
              <Sparkles className="h-5 w-5 text-[#C8A96A]" />
              <p className="text-xs font-bold text-white">FLUX.1 Visual Engine</p>
              <p className="text-[10px] text-[#C8A96A]">Native 9:16 Skincare Pins</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#1E4734]/60 border border-[#28543E] space-y-1 backdrop-blur-md">
              <LogIn className="h-5 w-5 text-emerald-400" />
              <p className="text-xs font-bold text-white">n8n Pipeline Route</p>
              <p className="text-[10px] text-emerald-400 font-medium">Single-Call Automation</p>
            </div>
          </div>
          <p className="text-[11px] text-[#F8F6F2]/60 font-serif italic">
            &quot;Luxury skincare content automation designed for modern affiliate creators.&quot;
          </p>
        </div>
      </div>

      {/* Right Panel - Auth Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <Link to="/" className="inline-block lg:hidden">
              <img
                src="/brand/logo.jpg"
                alt="DAILY VERSE logo"
                className="mx-auto h-16 w-16 rounded-full object-cover border border-[#C8A96A]/40 shadow-sm"
                loading="lazy"
              />
            </Link>
            <h1 className="font-serif text-3xl font-bold text-[#1E4734]">Welcome to DailyVerse</h1>
            <p className="text-xs text-[#666666]">
              Sign in or enter Instant Demo Mode to access your workspace.
            </p>
          </div>

          <div className="luxury-card rounded-2xl p-6 sm:p-8 space-y-6 bg-white border-[#E7E2D9] shadow-xl">
            {error && (
              <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-3.5 text-xs text-destructive leading-relaxed space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>{error}</div>
                </div>
                {unconfirmedEmail && (
                  <div className="pt-2 flex flex-wrap gap-2 border-t border-destructive/20">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-destructive/40 text-destructive hover:bg-destructive/20"
                      onClick={handleResendConfirmation}
                      disabled={resending}
                    >
                      {resending ? (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-1 h-3 w-3" />
                      )}
                      Resend Confirmation
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-foreground"
                      onClick={handleDemoSignIn}
                    >
                      Explore via Demo Mode
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              {/* Quick Demo Access Button */}
              <Button
                onClick={handleDemoSignIn}
                disabled={demoLoading || loading}
                size="lg"
                className="w-full bg-[#1E4734] hover:bg-[#355E4D] text-white font-medium shadow-sm h-12 text-xs cursor-pointer hover-lift"
              >
                {demoLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#C8A96A]" />
                    Entering Demo Workspace…
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4 text-[#C8A96A]" />
                    Instant Demo Access (Quick Start)
                  </>
                )}
              </Button>

              {/* Google OAuth Button */}
              <Button
                onClick={signInWithGoogle}
                disabled={loading || demoLoading || googleOauthDisabled}
                variant="outline"
                size="lg"
                className="w-full border-[#E7E2D9] text-[#222222] hover:bg-[#F8F6F2] text-xs h-11 cursor-pointer"
              >
                {loading && !emailMode ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting OAuth…
                  </>
                ) : (
                  "Sign in with Google"
                )}
              </Button>

              {googleOauthDisabled && (
                <p className="text-[11px] text-amber-700 text-center font-medium">
                  Google OAuth is unconfigured in Supabase. Use Instant Demo Access above.
                </p>
              )}

              {/* Email Sign In Toggle */}
              {!emailMode ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-[#666666] hover:text-[#1E4734] cursor-pointer"
                  onClick={() => setEmailMode(true)}
                >
                  <Mail className="mr-1.5 h-3.5 w-3.5 text-[#C8A96A]" /> Sign in with Email / Password
                </Button>
              ) : (
                <form onSubmit={handleEmailSignIn} className="space-y-4 pt-2">
                  <div className="space-y-1 text-left">
                    <Label htmlFor="email" className="text-xs font-semibold text-[#222222]">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="creator@dailyverse.ai"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-[#F8F6F2] border-[#E7E2D9] focus-visible:ring-[#1E4734] text-xs h-10"
                      required
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <Label htmlFor="password" className="text-xs font-semibold text-[#222222]">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-[#F8F6F2] border-[#E7E2D9] focus-visible:ring-[#1E4734] text-xs h-10"
                      required
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full bg-[#1E4734] hover:bg-[#355E4D] text-white text-xs h-10 cursor-pointer">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin text-[#C8A96A]" /> : "Sign in / Register"}
                  </Button>
                </form>
              )}
            </div>

            <p className="text-center text-xs text-[#666666] pt-2">
              <Link to="/" className="hover:text-[#1E4734] underline">
                Back to landing page
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
