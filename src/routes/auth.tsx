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
        "Google OAuth is not configured in your Supabase project (missing Client Secret). Please use Instant Demo Access or Email sign-in.",
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
          "Google OAuth is not configured in your Supabase project (missing OAuth Secret). Please use Instant Demo Access or Email sign-in below.",
        );
      }
    } catch (e) {
      setGoogleOauthDisabled(true);
      setError(
        e instanceof Error
          ? e.message
          : "Google OAuth is not configured. Please use Instant Demo Access below.",
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
        // Detect unconfirmed email error
        if (
          signInErr.message.toLowerCase().includes("email not confirmed") ||
          signInErr.message.toLowerCase().includes("confirm")
        ) {
          setUnconfirmedEmail(email.trim());
          setError(
            "Your email address has not been confirmed yet. Please check your inbox or click below to resend confirmation.",
          );
          return;
        }

        // Try sign up if user does not exist
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8F6F2] px-4">
      <div className="w-full max-w-md rounded-2xl border border-[#E7E2D9] bg-white p-8 shadow-md space-y-6">
        <div className="text-center space-y-2">
          <img
            src="/brand/logo.jpg"
            alt="DAILY VERSE logo"
            className="mx-auto h-20 w-20 rounded-full object-cover border border-[#C8A96A]/40 shadow-sm transition-transform duration-500 hover:scale-105"
            loading="lazy"
          />
          <h1 className="font-serif text-3xl font-bold text-[#1E4734]">DAILY VERSE</h1>
          <p className="text-[10px] text-[#C8A96A] uppercase tracking-widest font-semibold">
            Skincare That Works
          </p>
        </div>

        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3.5 text-xs text-destructive leading-relaxed space-y-2">
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
            variant="default"
            size="lg"
            className="w-full bg-[#1E4734] hover:bg-[#355E4D] text-white font-medium shadow-sm h-11"
          >
            {demoLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#C8A96A]" />
                Entering Demo Mode…
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
            className="w-full"
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
            <p className="text-[11px] text-amber-600 text-center font-medium">
              Google OAuth is disabled (missing Client Secret in Supabase).
            </p>
          )}

          {/* Email Sign In Toggle */}
          {!emailMode ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground"
              onClick={() => setEmailMode(true)}
            >
              <Mail className="mr-1 h-3.5 w-3.5" /> Sign in with Email / Password
            </Button>
          ) : (
            <form onSubmit={handleEmailSignIn} className="space-y-3 pt-2">
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">Password (8+ chars, upper/lower/symbols)</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full" size="sm">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in / Register"}
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground pt-2">
          <Link to="/" className="underline hover:text-foreground">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
