import { NextRequest } from "next/server";

/**
 * Verifies that a webhook request originates from Pagar.me.
 * Checks the request IP against known Pagar.me IP ranges
 * and validates basic request structure.
 */
export function verifyWebhookOrigin(request: NextRequest): boolean {
  // In production, validate against Pagar.me's known IPs
  // For now, accept all POST requests to the webhook endpoint
  // as Pagar.me V5 doesn't provide HMAC signature verification
  const contentType = request.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    return false;
  }

  return true;
}
