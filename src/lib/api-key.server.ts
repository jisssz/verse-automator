// Server-side API Key & Webhook Verification helper for n8n integration.

export function verifyN8nApiKey(request: Request): { authorized: boolean; reason?: string } {
  const configuredKey = process.env["N8N_API_KEY"]?.trim();

  // Retrieve API key from x-api-key header or Authorization: Bearer <key>
  const apiKeyHeader = request.headers.get("x-api-key")?.trim();
  const authHeader = request.headers.get("authorization")?.trim();
  let bearerKey: string | undefined;

  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    bearerKey = authHeader.substring(7).trim();
  }

  const providedKey = apiKeyHeader || bearerKey;

  // If no N8N_API_KEY is configured in env, allow request with default development key or header presence
  if (!configuredKey) {
    if (!providedKey) {
      return {
        authorized: true,
        reason: "Development Mode: N8N_API_KEY not configured. Requests allowed without key.",
      };
    }
    return { authorized: true };
  }

  if (!providedKey || providedKey !== configuredKey) {
    return {
      authorized: false,
      reason:
        "Invalid or missing API key. Provide a valid 'x-api-key' header or 'Authorization: Bearer <key>'.",
    };
  }

  return { authorized: true };
}
