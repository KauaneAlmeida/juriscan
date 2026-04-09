import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { addCredits, resetCredits } from "@/services/credit.service";
import { PLANS } from "@/lib/pagarme/config";
import type { PlanId } from "@/lib/pagarme/config";
import type { PagarmeWebhookEvent } from "@/lib/pagarme/types";
import { verifyWebhookOrigin } from "@/lib/pagarme/verify-webhook";

export const dynamic = "force-dynamic";

/**
 * Determines if an error is permanent (should NOT be retried) vs transient.
 * Permanent errors: missing metadata, invalid data, business logic violations.
 * Transient errors: DB connection failures, timeouts, etc.
 */
function isPermanentError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    // Missing metadata — retrying won't help
    if (msg.includes("missing") && msg.includes("metadata")) return true;
    // Invalid data that won't change on retry
    if (msg.includes("invalid") || msg.includes("not found")) return true;
  }
  return false;
}

export async function POST(request: NextRequest) {
  // C5 fix: Verify webhook origin
  if (!verifyWebhookOrigin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let event: PagarmeWebhookEvent;

  try {
    event = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!event.id || !event.type) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  const supabase = await createAdminClient();

  try {
    // Idempotency: INSERT first, catch duplicate key error (23505)
    const { error: insertError } = await supabase
      .from("processed_webhook_events")
      .insert({
        event_id: event.id,
        event_type: event.type,
        processed_at: new Date().toISOString(),
      } as never);

    if (insertError) {
      // Unique constraint violation = already processed
      if (insertError.code === "23505") {
        return NextResponse.json({ received: true, skipped: true });
      }
      // Other DB error — log but continue processing
      console.error("[Webhook Pagar.me] Idempotency insert error:", insertError);
    }

    switch (event.type) {
      case "subscription.created":
        await handleSubscriptionCreated(supabase, event);
        break;

      case "subscription.updated":
        await handleSubscriptionUpdated(supabase, event);
        break;

      case "charge.paid":
        await handleChargePaid(supabase, event);
        break;

      case "charge.payment_failed":
        await handleChargePaymentFailed(supabase, event);
        break;

      case "subscription.canceled":
        await handleSubscriptionCanceled(supabase, event);
        break;

      case "charge.pending":
        console.log("[Webhook Pagar.me] Charge pending (PIX/boleto awaiting payment):", event.data.id);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Webhook Pagar.me] Handler error:", error);

    // M3 fix: For permanent errors, return 200 to stop Pagar.me infinite retries
    if (isPermanentError(error)) {
      console.warn("[Webhook Pagar.me] Permanent error — returning 200 to stop retries");
      return NextResponse.json({ received: true, error: "Permanent processing error" });
    }

    // Transient error: remove idempotency record so Pagar.me retry can reprocess
    await supabase
      .from("processed_webhook_events")
      .delete()
      .eq("event_id", event.id);

    // Return 500 so Pagar.me retries the webhook
    return NextResponse.json(
      { received: false, error: "Internal error" },
      { status: 500 }
    );
  }
}

async function handleSubscriptionCreated(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  event: PagarmeWebhookEvent
) {
  const subscription = event.data.subscription || event.data;
  const metadata = subscription.metadata || event.data.metadata;
  const userId = metadata?.user_id;
  const planSlug = metadata?.plan_slug;

  if (!userId) {
    console.error("[Webhook Pagar.me] subscription.created missing user_id metadata");
    return;
  }

  const cycle = (subscription as Record<string, unknown>).current_cycle as { start_at?: string; end_at?: string } | undefined;

  const periodStart = cycle?.start_at || new Date().toISOString();
  const periodEnd = cycle?.end_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await supabase.from("subscriptions").upsert({
    user_id: userId,
    pagarme_subscription_id: subscription.id || event.data.id,
    pagarme_customer_id: (subscription.customer as { id?: string } | undefined)?.id || null,
    plan_id: planSlug || "free",
    status: "active",
    payment_method: (subscription as Record<string, unknown>).payment_method || "credit_card",
    current_period_start: periodStart,
    current_period_end: periodEnd,
    cancel_at_period_end: false,
    updated_at: new Date().toISOString(),
  } as never);

  await supabase
    .from("profiles")
    .update({
      current_plan: planSlug || "free",
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", userId);

  // Credits are NOT added here — only on charge.paid event
  // to guarantee the payment was actually confirmed
  console.log("[Webhook Pagar.me] subscription.created saved for user:", userId, "plan:", planSlug);
}

async function handleSubscriptionUpdated(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  event: PagarmeWebhookEvent
) {
  const subscription = event.data.subscription || event.data;
  const metadata = subscription.metadata || event.data.metadata;
  const userId = metadata?.user_id;
  const planSlug = metadata?.plan_slug;

  if (!userId) {
    console.error("[Webhook Pagar.me] subscription.updated missing user_id metadata");
    return;
  }

  // Use the real status from the event instead of always setting "active"
  const realStatus = (subscription as Record<string, unknown>).status as string | undefined;
  const status = realStatus || "active";

  const cycle = (subscription as Record<string, unknown>).current_cycle as { start_at?: string; end_at?: string } | undefined;
  const periodStart = cycle?.start_at;
  const periodEnd = cycle?.end_at;

  // Build update payload with only defined fields
  const updatePayload: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (planSlug) updatePayload.plan_id = planSlug;
  if (periodStart) updatePayload.current_period_start = periodStart;
  if (periodEnd) updatePayload.current_period_end = periodEnd;

  const paymentMethod = (subscription as Record<string, unknown>).payment_method as string | undefined;
  if (paymentMethod) updatePayload.payment_method = paymentMethod;

  await supabase
    .from("subscriptions")
    .update(updatePayload as never)
    .eq("user_id", userId);

  // Update profile plan if provided
  if (planSlug) {
    await supabase
      .from("profiles")
      .update({
        current_plan: planSlug,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", userId);
  }

  console.log("[Webhook Pagar.me] subscription.updated for user:", userId, "status:", status, "plan:", planSlug);
}

async function handleChargePaid(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  event: PagarmeWebhookEvent
) {
  const metadata = event.data.metadata;
  const userId = metadata?.user_id;

  if (!userId) {
    console.error("[Webhook Pagar.me] charge.paid missing user_id metadata");
    return;
  }

  // Check if this is a credit purchase (one-time order)
  const credits = metadata?.credits;
  if (credits) {
    // Check if already credited immediately by purchase-credits route
    const chargeId = event.data.id;
    if (chargeId) {
      const { data: alreadyCredited } = await supabase
        .from("processed_webhook_events")
        .select("event_id")
        .eq("event_id", `credit_paid_${chargeId}`)
        .maybeSingle();

      if (alreadyCredited) {
        console.log("[Webhook Pagar.me] Credits already added immediately for charge:", chargeId, "— skipping");
        return;
      }
    }

    const creditsToAdd = parseInt(credits);
    const result = await addCredits(
      supabase,
      userId,
      creditsToAdd,
      `Compra de ${creditsToAdd} créditos`,
      "CREDIT_PURCHASE"
    );

    if (!result.success) {
      throw new Error(`Failed to add credits for user ${userId}: ${result.error}`);
    }

    console.log("[Webhook Pagar.me] Credits added for user:", userId, "amount:", creditsToAdd);
    return;
  }

  // For subscription charges, RESET monthly credits (not add)
  // C1 fix: Use resetCredits to SET balance to plan amount instead of accumulating
  const planSlug = metadata?.plan_slug;
  if (planSlug) {
    const plan = PLANS[planSlug as PlanId];
    if (plan && plan.credits > 0) {
      const result = await resetCredits(
        supabase,
        userId,
        plan.credits,
        `Créditos mensais - Plano ${plan.name}`,
        "MONTHLY_ALLOCATION"
      );

      if (!result.success) {
        throw new Error(`Failed to reset monthly credits for user ${userId}: ${result.error}`);
      }

      console.log("[Webhook Pagar.me] Monthly credits reset for user:", userId, "plan:", planSlug, "credits:", plan.credits);
    }

    // C6 fix: Restore subscription to active after successful payment
    // This handles the past_due -> active recovery when a retry payment succeeds
    await supabase
      .from("subscriptions")
      .update({
        status: "active",
        updated_at: new Date().toISOString(),
      } as never)
      .eq("user_id", userId)
      .in("status", ["past_due", "pending"]);

    await supabase
      .from("profiles")
      .update({
        current_plan: planSlug,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", userId);

    console.log("[Webhook Pagar.me] Subscription restored to active for user:", userId);
  }
}

async function handleChargePaymentFailed(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  event: PagarmeWebhookEvent
) {
  const metadata = event.data.metadata;
  const userId = metadata?.user_id;

  if (!userId) return;

  // Set subscription to past_due
  await supabase
    .from("subscriptions")
    .update({
      status: "past_due",
      updated_at: new Date().toISOString(),
    } as never)
    .eq("user_id", userId)
    .eq("status", "active");

  console.log("[Webhook Pagar.me] Payment failed for user:", userId);
}

async function handleSubscriptionCanceled(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  event: PagarmeWebhookEvent
) {
  const subscription = event.data.subscription || event.data;
  const metadata = subscription.metadata || event.data.metadata;
  const userId = metadata?.user_id;

  if (!userId) {
    console.error("[Webhook Pagar.me] subscription.canceled missing user_id metadata");
    return;
  }

  // M2 fix: Check if subscription should remain active until period end
  const cancelAtPeriodEnd = (subscription as Record<string, unknown>).cancel_at_period_end;
  const cycle = (subscription as Record<string, unknown>).current_cycle as { end_at?: string } | undefined;
  const periodEnd = cycle?.end_at;

  if (cancelAtPeriodEnd && periodEnd) {
    const periodEndDate = new Date(periodEnd);
    if (periodEndDate > new Date()) {
      // Period hasn't ended yet — mark as canceled but keep plan active until period end
      await supabase
        .from("subscriptions")
        .update({
          status: "canceled",
          cancel_at_period_end: true,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("user_id", userId);

      console.log("[Webhook Pagar.me] subscription.canceled — plan remains active until:", periodEnd);
      // Do NOT downgrade to free yet — the user paid for this period
      return;
    }
  }

  // Period has ended or no grace period — downgrade immediately
  await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("user_id", userId);

  // Downgrade to free plan
  await supabase
    .from("profiles")
    .update({
      current_plan: "free",
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", userId);

  console.log("[Webhook Pagar.me] subscription.canceled — downgraded to free for user:", userId);
}
