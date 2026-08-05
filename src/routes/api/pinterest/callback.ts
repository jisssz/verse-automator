/**
 * GET /api/pinterest/callback
 *
 * Pinterest OAuth 2.0 callback handler.
 * Receives ?code=&state= from Pinterest, exchanges code for tokens,
 * fetches user info, saves to pinterest_accounts, then redirects to /settings.
 *
 * Success: redirect to /settings?pinterest=connected
 * Error:   redirect to /settings?error=pinterest_auth_failed&message=<reason>
 */
import { createFileRoute } from "@tanstack/react-router";
import {
  exchangeCodeForTokens,
  savePinterestAccount,
  fetchPinterestUserInfo,
} from "@/lib/pinterest-account.server";
import { fetchAndCacheBoards } from "@/lib/pinterest-boards.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/pinterest/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const errorParam = url.searchParams.get("error");
        const errorDescription = url.searchParams.get("error_description");

        // Pinterest denied access
        if (errorParam) {
          const msg = encodeURIComponent(errorDescription ?? "Pinterest authorization was denied");
          return Response.redirect(
            new URL(`/settings?error=pinterest_auth_failed&message=${msg}`, request.url).toString(),
            302,
          );
        }

        if (!code) {
          return Response.redirect(
            new URL(
              "/settings?error=pinterest_auth_failed&message=Missing+authorization+code",
              request.url,
            ).toString(),
            302,
          );
        }

        // Decode state to recover userId
        let userId = "00000000-0000-0000-0000-000000000000";
        if (state) {
          try {
            const decoded = JSON.parse(Buffer.from(state, "base64url").toString("utf8")) as {
              userId?: string;
            };
            if (decoded.userId && decoded.userId !== "anonymous") {
              userId = decoded.userId;
            }
          } catch {
            // Ignore malformed state
          }
        }

        // Exchange code for tokens
        const tokens = await exchangeCodeForTokens(code);
        if (!tokens) {
          return Response.redirect(
            new URL(
              "/settings?error=pinterest_auth_failed&message=Token+exchange+failed",
              request.url,
            ).toString(),
            302,
          );
        }

        // Fetch Pinterest user info
        const userInfo = await fetchPinterestUserInfo(tokens.accessToken);

        // Save account to pinterest_accounts table
        try {
          await savePinterestAccount(userId, {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken ?? undefined,
            expiresIn: tokens.expiresIn ?? undefined,
            scope: tokens.scope ?? undefined,
            pinterestUserId: userInfo?.id,
            username: userInfo?.username,
          });
        } catch (err) {
          const msg = encodeURIComponent(
            err instanceof Error ? err.message : "Failed to save account",
          );
          return Response.redirect(
            new URL(`/settings?error=pinterest_auth_failed&message=${msg}`, request.url).toString(),
            302,
          );
        }

        // Pre-populate board cache in background (non-blocking)
        fetchAndCacheBoards(userId, tokens.accessToken).catch((err) => {
          console.warn("[pinterest/callback] board cache pre-load failed:", err);
        });

        // Log successful connection
        await supabaseAdmin.from("automation_logs").insert({
          source_system: "pinterest_oauth",
          event_type: "pinterest_oauth_callback_success",
          level: "info",
          message: `Pinterest OAuth callback success for user ${userId}`,
          details: {
            userId,
            pinterestUserId: userInfo?.id ?? null,
            username: userInfo?.username ?? null,
            scope: tokens.scope ?? null,
          },
        });

        return Response.redirect(
          new URL(
            `/settings?pinterest=connected&username=${encodeURIComponent(userInfo?.username ?? "")}`,
            request.url,
          ).toString(),
          302,
        );
      },
    },
  },
});
