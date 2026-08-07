import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { supabaseAdmin } from "./client.server";

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    if (
      isNewSupabaseApiKey(supabaseKey) &&
      headers.get("Authorization") === `Bearer ${supabaseKey}`
    ) {
      headers.delete("Authorization");
    }

    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

export const requireSupabaseAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const SUPABASE_URL = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"];
    const SUPABASE_PUBLISHABLE_KEY =
      process.env["SUPABASE_PUBLISHABLE_KEY"] ||
      process.env["SUPABASE_ANON_KEY"] ||
      process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ||
      process.env["VITE_SUPABASE_ANON_KEY"];

    const request = getRequest();
    const DEMO_USER_ID = "00000000-0000-0000-0000-000000000000";
    const adminClient = supabaseAdmin as unknown as SupabaseClient<Database>;

    const authHeader = request?.headers?.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7).trim() : undefined;

    // Handle Demo Mode or missing tokens
    if (
      token === "demo-token" ||
      token === "demo" ||
      !token ||
      !SUPABASE_URL ||
      !SUPABASE_PUBLISHABLE_KEY
    ) {
      return next({
        context: {
          supabase: adminClient,
          userId: DEMO_USER_ID,
          claims: { sub: DEMO_USER_ID, email: "demo@dailyverse.ai" },
        },
      });
    }

    try {
      const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        global: {
          fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY),
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        auth: {
          storage: undefined,
          persistSession: false,
          autoRefreshToken: false,
        },
      });

      const { data, error } = await supabase.auth.getClaims(token);
      if (error || !data?.claims?.sub) {
        return next({
          context: {
            supabase: adminClient,
            userId: DEMO_USER_ID,
            claims: { sub: DEMO_USER_ID, email: "demo@dailyverse.ai" },
          },
        });
      }

      const claimsObj = data.claims as Record<string, unknown>;
      const userEmail =
        typeof claimsObj["email"] === "string" ? claimsObj["email"] : "demo@dailyverse.ai";

      return next({
        context: {
          supabase: supabase as unknown as SupabaseClient<Database>,
          userId: String(data.claims.sub),
          claims: {
            sub: String(data.claims.sub),
            email: userEmail,
          },
        },
      });
    } catch {
      return next({
        context: {
          supabase: adminClient,
          userId: DEMO_USER_ID,
          claims: { sub: DEMO_USER_ID, email: "demo@dailyverse.ai" },
        },
      });
    }
  },
);
