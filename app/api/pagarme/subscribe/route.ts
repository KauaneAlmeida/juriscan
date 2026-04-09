import { apiHandler, successResponse, parseBody } from "@/lib/api";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { getPagarme } from "@/lib/pagarme/client";
import { PLANS } from "@/lib/pagarme/config";
import { subscribeSchema } from "@/lib/validation/pagarme";
import { ValidationError } from "@/lib/api/errors";
import type { PlanId } from "@/lib/pagarme/config";

interface Profile {
  pagarme_customer_id: string | null;
  name: string;
}

export const POST = apiHandler(async (request, { user }) => {
  const supabase = await createServerSupabaseClient();
  const { planId, paymentMethod, cardToken, document, phone, billingAddress } =
    await parseBody(request, subscribeSchema);

  console.log("[Pagar.me Subscribe] 1. Request:", { planId, paymentMethod, userId: user!.id, hasPhone: !!phone, hasCardToken: !!cardToken });

  const plan = PLANS[planId as PlanId];
  if (!plan.pagarmePlanId) {
    console.error("[Pagar.me Subscribe] Plan ID not configured for:", planId);
    throw new ValidationError(`Plano "${planId}" não configurado no Pagar.me. Execute POST /api/admin/setup-plans primeiro.`);
  }

  console.log("[Pagar.me Subscribe] 2. Plan:", { name: plan.name, pagarmePlanId: plan.pagarmePlanId });

  // Get or create Pagar.me customer
  const { data: profileData } = await supabase
    .from("profiles")
    .select("pagarme_customer_id, name")
    .eq("id", user!.id)
    .single();

  const profile = profileData as Profile | null;
  let customerId = profile?.pagarme_customer_id;

  // Clean document (remove dots, dashes, slashes) and determine type server-side
  const cleanDocument = document.replace(/\D/g, "");
  const resolvedDocType = cleanDocument.length <= 11 ? "CPF" as const : "CNPJ" as const;

  // Parse phone into Pagar.me format
  const cleanPhone = phone?.replace(/\D/g, "") || "";
  const phonesPayload = cleanPhone.length >= 10
    ? {
        mobile_phone: {
          country_code: "55",
          area_code: cleanPhone.slice(0, 2),
          number: cleanPhone.slice(2),
        },
      }
    : undefined;

  if (!customerId) {
    console.log("[Pagar.me Subscribe] 3. Creating customer for:", user!.email);
    try {
      const customer = await getPagarme().createCustomer({
        name: profile?.name || user!.email!,
        email: user!.email!,
        document: cleanDocument,
        document_type: resolvedDocType,
        type: resolvedDocType === "CPF" ? "individual" : "company",
        ...(phonesPayload && { phones: phonesPayload }),
      });

      customerId = customer.id;
      console.log("[Pagar.me Subscribe] 4. Customer created:", customerId);

      await supabase
        .from("profiles")
        .update({ pagarme_customer_id: customerId } as never)
        .eq("id", user!.id);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("[Pagar.me Subscribe] Customer creation failed:", msg);
      throw new ValidationError(`Erro ao criar cliente: ${msg}`);
    }
  } else {
    console.log("[Pagar.me Subscribe] 3. Existing customer:", customerId);

    // Update existing customer with phone if provided
    if (phonesPayload) {
      try {
        console.log("[Pagar.me Subscribe] 3b. Updating customer phone");
        await getPagarme().updateCustomer(customerId, {
          name: profile?.name || user!.email!,
          email: user!.email!,
          document: cleanDocument,
          document_type: resolvedDocType,
          type: resolvedDocType === "CPF" ? "individual" : "company",
          phones: phonesPayload,
        });
      } catch (error) {
        console.warn("[Pagar.me Subscribe] Customer update failed (non-fatal):", error instanceof Error ? error.message : error);
      }
    }
  }

  // M4 fix: Double-click protection — check for existing active/pending subscription
  const adminClient = await createAdminClient();
  const { data: existingSubData } = await adminClient
    .from("subscriptions")
    .select("id, status, created_at")
    .eq("user_id", user!.id)
    .in("status", ["active", "pending"])
    .single();

  const existingSub = existingSubData as { id: string; status: string; created_at: string } | null;

  if (existingSub) {
    const createdAt = new Date(existingSub.created_at).getTime();
    const now = Date.now();
    const thirtySeconds = 30 * 1000;

    if (now - createdAt < thirtySeconds) {
      // Recently created — likely a double-click
      throw new ValidationError("Assinatura já está sendo processada. Aguarde alguns segundos.");
    }

    if (existingSub.status === "active") {
      throw new ValidationError("Você já possui uma assinatura ativa. Cancele a atual antes de criar uma nova.");
    }
  }

  // Create subscription
  const subscriptionPayload: Record<string, unknown> = {
    plan_id: plan.pagarmePlanId,
    customer_id: customerId,
    payment_method: paymentMethod,
    card_token: paymentMethod === "credit_card" ? cardToken : undefined,
    metadata: {
      user_id: user!.id,
      plan_slug: planId,
    },
  };

  // Pagar.me V5 requires billing_address for credit card subscriptions
  if (paymentMethod === "credit_card" && billingAddress) {
    subscriptionPayload.card = {
      billing_address: {
        line_1: billingAddress.line_1,
        zip_code: billingAddress.zip_code,
        city: billingAddress.city,
        state: billingAddress.state,
        country: billingAddress.country || "BR",
      },
    };
  }

  console.log("[Pagar.me Subscribe] 5. Creating subscription:", JSON.stringify(subscriptionPayload));

  let subscription;
  try {
    subscription = await getPagarme().createSubscription(subscriptionPayload as never);
    console.log("[Pagar.me Subscribe] 6. Subscription created:", { id: subscription.id, status: subscription.status });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("[Pagar.me Subscribe] Subscription creation failed:", msg);
    throw new ValidationError(`Erro ao criar assinatura: ${msg}`);
  }

  // Check charge status from the subscription response
  const rawSub = subscription as unknown as Record<string, unknown>;
  const charges = rawSub.charges as Array<Record<string, unknown>> | undefined;
  const firstCharge = charges?.[0];
  const firstChargeStatus = (firstCharge?.status as string) || "";
  const lastTx = firstCharge
    ? (firstCharge.last_transaction as Record<string, unknown> | undefined)
    : undefined;
  const acquirerMsg = lastTx?.acquirer_message as string | undefined;

  console.log("[Pagar.me Subscribe] 6b. Charge details:", {
    chargeStatus: firstChargeStatus || "no_charge",
    subscriptionStatus: subscription.status,
    acquirerMsg,
    hasCharges: !!charges?.length,
  });

  // Reject explicitly failed charges
  if (firstChargeStatus === "failed" || firstChargeStatus === "payment_failed") {
    const gatewayMsg = lastTx?.gateway_response as Record<string, unknown> | undefined;
    console.error("[Pagar.me Subscribe] Charge failed:", {
      chargeStatus: firstChargeStatus,
      acquirerMsg,
      gatewayMsg: gatewayMsg ? JSON.stringify(gatewayMsg) : undefined,
      fullCharge: JSON.stringify(firstCharge),
    });
    const errorDetail = acquirerMsg || "Pagamento recusado pelo provedor";
    throw new ValidationError(`Pagamento falhou: ${errorDetail}`);
  }

  // ── Persist subscription in Supabase ──
  // ONLY consider paid if the charge is EXPLICITLY "paid"
  // Do NOT trust subscription.status === "active" alone — Pagar.me may
  // mark subscriptions active before the charge is actually confirmed.
  const isPaid = firstChargeStatus === "paid";
  const dbStatus = isPaid ? "active" : "pending";

  const cycle = (rawSub.current_cycle as { start_at?: string; end_at?: string }) || null;
  const periodStart = cycle?.start_at || new Date().toISOString();
  const periodEnd = cycle?.end_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  console.log("[Pagar.me Subscribe] 7. Charge status:", { firstChargeStatus, subscriptionStatus: subscription.status, isPaid, dbStatus });

  // Reuse admin client from double-click check above (bypasses RLS)

  // Always save the subscription row so the user can see it
  const { error: upsertError } = await adminClient.from("subscriptions").upsert({
    user_id: user!.id,
    pagarme_subscription_id: subscription.id,
    pagarme_customer_id: customerId,
    plan_id: planId,
    status: dbStatus,
    payment_method: paymentMethod,
    current_period_start: periodStart,
    current_period_end: periodEnd,
    cancel_at_period_end: false,
    updated_at: new Date().toISOString(),
  } as never, { onConflict: "user_id" });

  if (upsertError) {
    console.error("[Pagar.me Subscribe] Subscription upsert failed:", upsertError.message);
  }

  // Update profile plan so UI reflects the new plan immediately
  if (isPaid) {
    const { error: profileError } = await adminClient
      .from("profiles")
      .update({
        current_plan: planId,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", user!.id);

    if (profileError) {
      console.error("[Pagar.me Subscribe] Profile update failed:", profileError.message);
    }
  }

  // Credits are NOT added here — only added by webhook charge.paid
  // to guarantee payment is actually confirmed by Pagar.me
  console.log("[Pagar.me Subscribe] 8. DB saved:", { planId, dbStatus });

  // Build response based on payment method
  const response: Record<string, unknown> = {
    subscriptionId: subscription.id,
    status: subscription.status,
    chargeStatus: firstChargeStatus || "unknown",
    isPaid,
    paymentMethod,
  };

  // For boleto, extract payment info from first charge
  if (paymentMethod === "boleto" && firstCharge) {
    if (lastTx) {
      response.boleto = {
        barcode: lastTx.barcode,
        line: lastTx.line,
        pdf: lastTx.pdf,
        due_at: lastTx.due_at,
      };
      console.log("[Pagar.me Subscribe] 9. Boleto generated");
    }
  } else if (paymentMethod !== "credit_card") {
    console.warn("[Pagar.me Subscribe] 9. No charge/transaction found for async payment method:", paymentMethod);
  }

  return successResponse(response);
});
