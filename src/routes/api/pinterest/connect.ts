/**
 * GET /api/pinterest/connect
 *
 * Initiates the Pinterest OAuth 2.0 authorization flow.
 * Redirects the browser to Pinterest's authorization page.
 *
 * Query parameters:
 *   userId  string  (optional — defaults to session user)
 *
 * On success: 302 redirect to Pinterest OAuth URL
 * On missing config: 302 redirect to /settings?error=pinterest_not_configured
 */
import { createFileRoute } from "@tanstack/react-router";
import { buildPinterestOAuthUrl } from "@/lib/pinterest-account.server";

export const Route = createFileRoute("/api/pinterest/connect")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const userId = url.searchParams.get("userId") ?? "anonymous";

        // Generate a CSRF state token (userId + timestamp)
        const state = Buffer.from(JSON.stringify({ userId, ts: Date.now() })).toString("base64url");

        const oauthUrl = buildPinterestOAuthUrl(state);

        if (!oauthUrl) {
          // Pinterest credentials not configured
          return Response.redirect(
            new URL(
              "/settings?error=pinterest_not_configured&message=Set+PINTEREST_CLIENT_ID%2C+PINTEREST_CLIENT_SECRET%2C+and+PINTEREST_REDIRECT_URI",
              request.url,
            ).toString(),
            302,
          );
        }

        return Response.redirect(oauthUrl, 302);
      },
    },
  },
});
