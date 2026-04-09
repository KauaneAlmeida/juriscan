import { createAdminClient } from "@/lib/supabase/server";
import { normalizeEmail } from "./email-normalization";
import { isDisposableEmail } from "./disposable-emails";

interface SignupValidationParams {
  email: string;
  ip: string;
  fingerprint?: string;
}

interface SignupValidationResult {
  allowed: boolean;
  reason?: string;
}

const MAX_SIGNUPS_PER_IP = 3;
const MAX_SIGNUPS_PER_FINGERPRINT = 2;
const WINDOW_HOURS = 24;

export async function validateSignup(
  params: SignupValidationParams
): Promise<SignupValidationResult> {
  const { email, ip, fingerprint } = params;

  // 1. Check disposable email
  if (isDisposableEmail(email)) {
    return { allowed: false, reason: "EMAIL_DISPOSABLE" };
  }

  const emailNormalized = normalizeEmail(email);
  const admin = await createAdminClient();

  // 2. Check if normalized email already exists in profiles
  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("email_normalized", emailNormalized)
    .limit(1)
    .single();

  if (existingProfile) {
    return { allowed: false, reason: "EMAIL_ALREADY_USED" };
  }

  const windowStart = new Date(
    Date.now() - WINDOW_HOURS * 60 * 60 * 1000
  ).toISOString();

  // 3. IP rate limit
  const { count: ipCount } = await admin
    .from("signup_attempts")
    .select("*", { count: "exact", head: true })
    .eq("ip_address", ip)
    .gte("created_at", windowStart);

  if ((ipCount ?? 0) >= MAX_SIGNUPS_PER_IP) {
    return { allowed: false, reason: "IP_RATE_LIMIT" };
  }

  // 4. Fingerprint check
  if (fingerprint) {
    const { count: fpCount } = await admin
      .from("signup_attempts")
      .select("*", { count: "exact", head: true })
      .eq("fingerprint", fingerprint)
      .gte("created_at", windowStart);

    if ((fpCount ?? 0) >= MAX_SIGNUPS_PER_FINGERPRINT) {
      return { allowed: false, reason: "FINGERPRINT_RATE_LIMIT" };
    }
  }

  return { allowed: true };
}

export async function recordSignupAttempt(params: {
  ip: string;
  email: string;
  fingerprint?: string;
  blocked: boolean;
  blockReason?: string;
}): Promise<void> {
  const admin = await createAdminClient();
  const emailNormalized = normalizeEmail(params.email);

  await admin.from("signup_attempts").insert({
    ip_address: params.ip,
    email: params.email,
    email_normalized: emailNormalized,
    fingerprint: params.fingerprint || null,
    blocked: params.blocked,
    block_reason: params.blockReason || null,
  } as never);
}
