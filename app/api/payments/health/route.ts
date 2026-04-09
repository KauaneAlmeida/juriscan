import { NextResponse } from "next/server";
import { getPagarme } from "@/lib/pagarme/client";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface CheckResult {
  status: "ok" | "error";
  message: string;
}

export async function GET() {
  const checks: Record<string, CheckResult> = {};

  // 1. Check PAGARME_SECRET_KEY
  checks.pagarme_secret_key = process.env.PAGARME_SECRET_KEY
    ? { status: "ok", message: "Configured" }
    : { status: "error", message: "PAGARME_SECRET_KEY not set" };

  // 2. Check Pagar.me API connectivity
  try {
    const pagarme = getPagarme();
    await pagarme.listCustomers(1);
    checks.pagarme_api = { status: "ok", message: "API reachable" };
  } catch (error) {
    checks.pagarme_api = {
      status: "error",
      message: error instanceof Error ? error.message : "Connection failed",
    };
  }

  // 3. Check SUPABASE_SERVICE_ROLE_KEY
  checks.supabase_service_role = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? { status: "ok", message: "Configured" }
    : { status: "error", message: "SUPABASE_SERVICE_ROLE_KEY not set" };

  // 4. Check plans table
  try {
    const supabase = await createAdminClient();
    const { data: plans, error } = await supabase
      .from("plans")
      .select("slug, is_active")
      .eq("is_active", true);

    if (error) throw error;

    const count = plans?.length || 0;
    checks.plans_table = count >= 4
      ? { status: "ok", message: `${count} active plans found` }
      : { status: "error", message: `Only ${count} active plans (expected 4)` };
  } catch (error) {
    checks.plans_table = {
      status: "error",
      message: error instanceof Error ? error.message : "Query failed",
    };
  }

  // 5. Check credit_balances table
  try {
    const supabase = await createAdminClient();
    const { error } = await supabase
      .from("credit_balances")
      .select("user_id")
      .limit(1);

    checks.credit_balances_table = error
      ? { status: "error", message: error.message }
      : { status: "ok", message: "Table accessible" };
  } catch (error) {
    checks.credit_balances_table = {
      status: "error",
      message: error instanceof Error ? error.message : "Query failed",
    };
  }

  // 6. Check Pagar.me plan IDs configured
  const planIds = {
    starter: process.env.PAGARME_PLAN_STARTER,
    pro: process.env.PAGARME_PLAN_PRO,
    business: process.env.PAGARME_PLAN_BUSINESS,
  };
  const configuredPlans = Object.entries(planIds).filter(([, v]) => v && v !== "plan_...");
  checks.pagarme_plan_ids = configuredPlans.length === 3
    ? { status: "ok", message: "All 3 plan IDs configured" }
    : { status: "error", message: `${configuredPlans.length}/3 plan IDs configured (run POST /api/admin/setup-plans)` };

  const allOk = Object.values(checks).every((c) => c.status === "ok");

  return NextResponse.json({
    status: allOk ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    checks,
  });
}
