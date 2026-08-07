// Server-side Supabase client — used in server functions and middleware.
// When SUPABASE_SERVICE_ROLE_KEY is present it bypasses RLS (admin).
// When it is absent it falls back to the publishable/anon key (respects RLS).
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

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

    // New Supabase API keys are opaque strings, not bearer JWTs.
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

function sanitizeSupabaseUrl(rawUrl: string | undefined): string {
  if (!rawUrl) return "https://placeholder.supabase.co";
  let url = rawUrl.trim();
  url = url.replace(/\/rest\/v1\/?$/, "");
  url = url.replace(/\/+$/, "");
  return url;
}

function createSupabaseAdminClient() {
  const rawUrl = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"];
  const SUPABASE_URL = sanitizeSupabaseUrl(rawUrl);
  const SUPABASE_SERVICE_ROLE_KEY = process.env["SUPABASE_SERVICE_ROLE_KEY"]?.trim();

  // Fallback to publishable key if service role key is not configured.
  // This means RLS will be active — queries will only work with a valid user session.
  const SUPABASE_FALLBACK_KEY = (
    process.env["SUPABASE_PUBLISHABLE_KEY"] ||
    process.env["SUPABASE_ANON_KEY"] ||
    process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ||
    process.env["VITE_SUPABASE_ANON_KEY"]
  )?.trim();

  const effectiveKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_FALLBACK_KEY;

  if (!rawUrl || !effectiveKey) {
    const missing = [
      ...(!rawUrl ? ["SUPABASE_URL / VITE_SUPABASE_URL"] : []),
      ...(!effectiveKey ? ["SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_PUBLISHABLE_KEY)"] : []),
    ];
    const message = `Missing required Supabase environment variable(s): ${missing.join(", ")}. Please configure them in your Vercel environment settings or local .env file.`;
    console.error(`[Supabase Admin] ${message}`);
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.warn(
      "[Supabase Admin] SUPABASE_SERVICE_ROLE_KEY is not set. " +
        "Falling back to publishable key — RLS will be enforced. " +
        "Demo mode queries will be scoped to the demo user only if RLS policies allow it. " +
        "Set SUPABASE_SERVICE_ROLE_KEY in Vercel → Settings → Environment Variables for full admin access.",
    );
  }

  return createClient<Database>(SUPABASE_URL, effectiveKey || "placeholder-key", {
    global: {
      fetch: createSupabaseFetch(effectiveKey || "placeholder-key"),
    },
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

let _supabaseAdmin: ReturnType<typeof createSupabaseAdminClient> | undefined;

// Server-side Supabase client — bypasses RLS when service role key is set.
// SECURITY: Only use this for trusted server-side operations.
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createSupabaseAdminClient>, {
  get(_, prop, receiver) {
    if (!_supabaseAdmin) _supabaseAdmin = createSupabaseAdminClient();
    return Reflect.get(_supabaseAdmin, prop, receiver);
  },
});
