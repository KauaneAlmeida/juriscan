import { NextRequest } from "next/server";
import { z } from "zod";
import { apiHandler, parseBody } from "@/lib/api/handler";
import { successResponse } from "@/lib/api/response";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { getClientIdentifier } from "@/lib/rate-limit";
import {
  validateSignup,
  recordSignupAttempt,
} from "@/lib/security/signup-validation";

const validateSignupSchema = z.object({
  email: z.string().email(),
  fingerprint: z.string().optional(),
});

export const POST = apiHandler(
  async (request: NextRequest) => {
    const body = await parseBody(request, validateSignupSchema);
    const ip = getClientIdentifier(request);

    const result = await validateSignup({
      email: body.email,
      ip,
      fingerprint: body.fingerprint,
    });

    // Record the attempt
    await recordSignupAttempt({
      ip,
      email: body.email,
      fingerprint: body.fingerprint,
      blocked: !result.allowed,
      blockReason: result.reason,
    });

    return successResponse({
      allowed: result.allowed,
      reason: result.reason,
    });
  },
  {
    requireAuth: false,
    rateLimit: RATE_LIMITS.signup,
  }
);
