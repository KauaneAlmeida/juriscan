import { apiHandler, successResponse, ValidationError } from "@/lib/api";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { getPagarme } from "@/lib/pagarme/client";

interface SubscriptionRow {
  pagarme_subscription_id: string | null;
}

export const POST = apiHandler(async (_request, { user }) => {
  const supabase = await createServerSupabaseClient();
  const adminClient = await createAdminClient();

  // Get active subscription (read via user session is fine)
  const { data: subscriptionData } = await supabase
    .from("subscriptions")
    .select("pagarme_subscription_id")
    .eq("user_id", user!.id)
    .eq("status", "active")
    .single();

  const subscription = subscriptionData as SubscriptionRow | null;

  if (!subscription?.pagarme_subscription_id) {
    throw new ValidationError("Nenhuma assinatura ativa encontrada");
  }

  // Cancel on Pagar.me
  await getPagarme().cancelSubscription(subscription.pagarme_subscription_id);

  // Mark as cancel_at_period_end in DB (adminClient to bypass RLS)
  await adminClient
    .from("subscriptions")
    .update({
      cancel_at_period_end: true,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("user_id", user!.id)
    .eq("status", "active");

  return successResponse({ message: "Assinatura será cancelada ao final do período" });
});
