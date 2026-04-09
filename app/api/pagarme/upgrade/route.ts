import { apiHandler, successResponse, ValidationError, parseBody } from "@/lib/api";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { getPagarme } from "@/lib/pagarme/client";
import { PLANS } from "@/lib/pagarme/config";
import { upgradePlanSchema } from "@/lib/validation/pagarme";
import type { PlanId } from "@/lib/pagarme/config";

interface SubscriptionRow {
  pagarme_subscription_id: string | null;
  plan_id: string;
}

export const POST = apiHandler(async (request, { user }) => {
  const supabase = await createServerSupabaseClient();
  const adminClient = await createAdminClient();
  const { planId } = await parseBody(request, upgradePlanSchema);

  const newPlan = PLANS[planId as PlanId];
  if (!newPlan.pagarmePlanId) {
    throw new ValidationError("Plano não configurado no Pagar.me");
  }

  // Get active subscription (read via user session is fine)
  const { data: subscriptionData } = await supabase
    .from("subscriptions")
    .select("pagarme_subscription_id, plan_id")
    .eq("user_id", user!.id)
    .eq("status", "active")
    .single();

  const subscription = subscriptionData as SubscriptionRow | null;

  if (!subscription?.pagarme_subscription_id) {
    throw new ValidationError("Nenhuma assinatura ativa encontrada");
  }

  // Update plan on Pagar.me
  await getPagarme().updateSubscriptionPlan(
    subscription.pagarme_subscription_id,
    newPlan.pagarmePlanId
  );

  // Update local subscription record (adminClient to bypass RLS)
  await adminClient
    .from("subscriptions")
    .update({
      plan_id: planId,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("user_id", user!.id)
    .eq("status", "active");

  // Update profile's current plan (adminClient to bypass RLS)
  await adminClient
    .from("profiles")
    .update({
      current_plan: planId,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", user!.id);

  return successResponse({
    message: `Plano atualizado para ${newPlan.name}`,
    planId,
  });
});
