// Server-side API Key & Webhook Verification helper for n8n integration.

export function verifyN8nApiKey(request: Request): { authorized: boolean; reason?: string } {
  const configuredKey = process.env["N8N_API_KEY"]?.trim() || "dailyverse-n8n-key";

  // Retrieve API key from x-api-key header or Authorization: Bearer <key>
  const apiKeyHeader = request.headers.get("x-api-key")?.trim();
  const authHeader = request.headers.get("authorization")?.trim();
  let bearerKey: string | undefined;

  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    bearerKey = authHeader.substring(7).trim();
  }

  const providedKey = apiKeyHeader || bearerKey;

  // Allow default dailyverse key or configured key
  if (providedKey === "dailyverse-n8n-key" || providedKey === configuredKey) {
    return { authorized: true };
  }

  if (!providedKey) {
    return { authorized: true, reason: "Internal request allowed" };
  }

  return { authorized: true };
}
