import { apiHandler } from "@/lib/api/handler";
import { successResponse } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/auth";
import type { SystemHealthCheck } from "@/types/admin";

export const dynamic = "force-dynamic";

async function checkSupabase(): Promise<SystemHealthCheck> {
  const start = Date.now();
  try {
    const admin = await createAdminClient();
    const { error } = await admin.from("plans").select("id").limit(1);
    return {
      service: "Supabase",
      status: error ? "degraded" : "healthy",
      latency_ms: Date.now() - start,
      message: error?.message || null,
      checked_at: new Date().toISOString(),
    };
  } catch (e) {
    return {
      service: "Supabase",
      status: "down",
      latency_ms: Date.now() - start,
      message: e instanceof Error ? e.message : "Erro desconhecido",
      checked_at: new Date().toISOString(),
    };
  }
}

async function checkPagarme(): Promise<SystemHealthCheck> {
  const start = Date.now();
  try {
    const apiKey = process.env.PAGARME_SECRET_KEY;
    if (!apiKey) {
      return {
        service: "Pagar.me",
        status: "degraded",
        latency_ms: 0,
        message: "API key nao configurada",
        checked_at: new Date().toISOString(),
      };
    }
    const res = await fetch("https://api.pagar.me/core/v5/merchants", {
      headers: {
        Authorization: `Basic ${Buffer.from(apiKey + ":").toString("base64")}`,
      },
      signal: AbortSignal.timeout(5000),
    });
    return {
      service: "Pagar.me",
      status: res.ok ? "healthy" : "degraded",
      latency_ms: Date.now() - start,
      message: res.ok ? null : `HTTP ${res.status}`,
      checked_at: new Date().toISOString(),
    };
  } catch (e) {
    return {
      service: "Pagar.me",
      status: "down",
      latency_ms: Date.now() - start,
      message: e instanceof Error ? e.message : "Erro desconhecido",
      checked_at: new Date().toISOString(),
    };
  }
}

async function checkOpenAI(): Promise<SystemHealthCheck> {
  const start = Date.now();
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return {
        service: "OpenAI",
        status: "degraded",
        latency_ms: 0,
        message: "API key nao configurada",
        checked_at: new Date().toISOString(),
      };
    }
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(5000),
    });
    return {
      service: "OpenAI",
      status: res.ok ? "healthy" : "degraded",
      latency_ms: Date.now() - start,
      message: res.ok ? null : `HTTP ${res.status}`,
      checked_at: new Date().toISOString(),
    };
  } catch (e) {
    return {
      service: "OpenAI",
      status: "down",
      latency_ms: Date.now() - start,
      message: e instanceof Error ? e.message : "Erro desconhecido",
      checked_at: new Date().toISOString(),
    };
  }
}

export const GET = apiHandler(
  async () => {
    await requireAdmin();

    const checks = await Promise.all([
      checkSupabase(),
      checkPagarme(),
      checkOpenAI(),
    ]);

    // Vercel is healthy if we're responding
    checks.push({
      service: "Vercel",
      status: "healthy",
      latency_ms: null,
      message: null,
      checked_at: new Date().toISOString(),
    });

    return successResponse({ checks });
  },
  { rateLimit: false }
);
