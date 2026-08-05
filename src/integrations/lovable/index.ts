// Lovable Authentication Integration with Supabase Native Fallback & Pre-flight OAuth Validation

import { createLovableAuth } from "@lovable.dev/cloud-auth-js";
import { supabase } from "../supabase/client";

const lovableAuth = createLovableAuth();

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

export const lovable = {
  auth: {
    signInWithOAuth: async (
      provider: "google" | "apple" | "microsoft" | "lovable",
      opts?: SignInOptions,
    ) => {
      // 1. Attempt Supabase Native OAuth first with pre-flight credential check
      const redirectTo =
        opts?.redirect_uri ||
        (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");

      const { data, error: supabaseError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });

      if (!supabaseError && data?.url) {
        // Pre-flight check to detect if Supabase returns "missing OAuth secret" (HTTP 400)
        try {
          const testRes = await fetch(data.url, { method: "GET" });
          if (!testRes.ok) {
            const bodyText = await testRes.text().catch(() => "");
            if (
              bodyText.includes("missing OAuth secret") ||
              bodyText.includes("Unsupported provider") ||
              testRes.status === 400
            ) {
              return {
                error: new Error(
                  "Google OAuth is not configured in your Supabase project (missing OAuth Secret). Please configure Google OAuth in your Supabase Dashboard or use Instant Demo Access / Email sign-in.",
                ),
              };
            }
          }
        } catch {
          // If pre-flight check encounters CORS or redirect to Google OAuth, proceed with navigation
        }

        if (typeof window !== "undefined") {
          window.location.href = data.url;
        }
        return { redirected: true, url: data.url };
      }

      // 2. Fallback to Lovable Cloud Auth if Supabase Native OAuth fails
      try {
        const result = await lovableAuth.signInWithOAuth(provider, {
          ...(opts?.redirect_uri ? { redirect_uri: opts.redirect_uri } : {}),
          extraParams: {
            ...opts?.extraParams,
          },
        });

        if (result.redirected) {
          return result;
        }

        if (result.tokens) {
          await supabase.auth.setSession(result.tokens);
        }
        return result;
      } catch (e) {
        return { error: e instanceof Error ? e : new Error(String(e)) };
      }
    },
  },
};
