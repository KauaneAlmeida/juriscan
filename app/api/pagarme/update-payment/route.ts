import { apiHandler, successResponse, ValidationError, parseBody } from "@/lib/api";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { getPagarme } from "@/lib/pagarme/client";
import { updatePaymentSchema } from "@/lib/validation/pagarme";

interface SubscriptionRow {
  pagarme_subscription_id: string | null;
}

export const POST = apiHandler(async (request, { user }) => {
  const supabase = await createServerSupabaseClient();
  const adminClient = await createAdminClient();
  const { cardToken } = await parseBody(request, updatePaymentSchema);

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

  // Update card on Pagar.me
  await getPagarme().updateSubscriptionCard(
    subscription.pagarme_subscription_id,
    cardToken
  );

  // Persist payment method change in DB (adminClient to bypass RLS)
  await adminClient
    .from("subscriptions")
    .update({
      payment_method: "credit_card",
      updated_at: new Date().toISOString(),
    } as never)
    .eq("user_id", user!.id)
    .eq("status", "active");

  return successResponse({ message: "Forma de pagamento atualizada" });
});
