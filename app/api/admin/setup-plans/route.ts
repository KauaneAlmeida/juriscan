import { NextRequest, NextResponse } from "next/server";
import { getPagarme } from "@/lib/pagarme/client";
import { createAdminClient } from "@/lib/supabase/server";
import { PLANS } from "@/lib/pagarme/config";
import type { PlanId } from "@/lib/pagarme/config";

export const dynamic = "force-dynamic";

const ADMIN_KEY = process.env.ADMIN_API_KEY;

// Plans that need to be created in Pagar.me (exclude free)
const PAID_PLANS: PlanId[] = ["starter", "pro", "business"];

export async function POST(request: NextRequest) {
  // Auth via admin key
  const adminKey = request.headers.get("x-admin-key");
  if (!ADMIN_KEY || adminKey !== ADMIN_KEY) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Check if force recreate is requested
  const body = await request.json().catch(() => ({}));
  const forceRecreate = body?.force === true;

  const results: Record<string, { status: string; pagarme_plan_id?: string; error?: string }> = {};
  const pagarme = getPagarme();
  const supabase = await createAdminClient();

  for (const planId of PAID_PLANS) {
    const plan = PLANS[planId];

    try {
      // Skip if already configured (unless force recreate)
      if (plan.pagarmePlanId && !forceRecreate) {
        results[planId] = {
          status: "already_configured",
          pagarme_plan_id: plan.pagarmePlanId,
        };
        continue;
      }

      // Create plan in Pagar.me V5 with all payment methods
      const priceInCents = Math.round(plan.price * 100);
      const pagarmePlan = await pagarme.createPlan({
        name: `Juriscan ${plan.name}`,
        currency: "BRL",
        interval: "month",
        interval_count: 1,
        quantity: 1,
        payment_methods: ["credit_card", "boleto"],
        installments: [1],
        billing_type: "prepaid",
        pricing_scheme: {
          price: priceInCents,
          scheme_type: "unit",
        },
        metadata: {
          plan_slug: planId,
          credits: plan.credits.toString(),
        },
      });

      // Save Pagar.me plan ID in Supabase
      await supabase
        .from("plans")
        .update({ pagarme_plan_id: pagarmePlan.id } as never)
        .eq("slug", planId);

      results[planId] = {
        status: forceRecreate ? "recreated" : "created",
        pagarme_plan_id: pagarmePlan.id,
      };

      console.log(`[Setup Plans] Created Pagar.me plan for ${planId}: ${pagarmePlan.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(`[Setup Plans] Error creating plan ${planId}:`, message);
      results[planId] = {
        status: "error",
        error: message,
      };
    }
  }

  return NextResponse.json({
    message: "Plan setup complete",
    results,
  });
}
