import { apiHandler, successResponse, parseBody } from "@/lib/api";
import { ValidationError } from "@/lib/api/errors";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { getPagarme } from "@/lib/pagarme/client";
import { CREDIT_PACKAGES } from "@/lib/pagarme/config";
import { purchaseCreditsSchema } from "@/lib/validation/pagarme";
import { addCredits } from "@/services/credit.service";

interface Profile {
  pagarme_customer_id: string | null;
  name: string;
}

export const POST = apiHandler(async (request, { user }) => {
  const supabase = await createServerSupabaseClient();
  const adminClient = await createAdminClient();
  const { creditPackageId, paymentMethod, cardToken, document, phone, billingAddress } =
    await parseBody(request, purchaseCreditsSchema);

  console.log("[Pagar.me Credits] 1. Request:", { creditPackageId, paymentMethod, userId: user!.id, hasPhone: !!phone });

  const pkg = CREDIT_PACKAGES.find((p) => p.id === creditPackageId);
  if (!pkg) {
    throw new ValidationError("Pacote de créditos inválido");
  }

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

  // Parse phone into Pagar.me format (country_code, area_code, number)
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
    console.log("[Pagar.me Credits] 2. Creating customer for:", user!.email);
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
      console.log("[Pagar.me Credits] 3. Customer created:", customerId);

      await adminClient
        .from("profiles")
        .update({ pagarme_customer_id: customerId } as never)
        .eq("id", user!.id);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("[Pagar.me Credits] Customer creation failed:", msg);
      throw new ValidationError(`Erro ao criar cliente: ${msg}`);
    }
  } else {
    console.log("[Pagar.me Credits] 2. Existing customer:", customerId);

    // Update existing customer with phone if provided (required by Pagar.me for all methods)
    if (phonesPayload) {
      try {
        console.log("[Pagar.me Credits] 2b. Updating customer phone");
        await getPagarme().updateCustomer(customerId, {
          name: profile?.name || user!.email!,
          email: user!.email!,
          document: cleanDocument,
          document_type: resolvedDocType,
          type: resolvedDocType === "CPF" ? "individual" : "company",
          phones: phonesPayload,
        });
      } catch (error) {
        console.warn("[Pagar.me Credits] Customer update failed (non-fatal):", error instanceof Error ? error.message : error);
      }
    }
  }

  // Amount in cents for Pagar.me
  const amountInCents = Math.round(pkg.price * 100);

  // Build payment config
  const paymentConfig: Record<string, unknown> = {
    payment_method: paymentMethod,
    amount: amountInCents,
  };

  if (paymentMethod === "credit_card" && cardToken) {
    paymentConfig.credit_card = {
      card_token: cardToken,
      operation_type: "auth_and_capture",
      installments: 1,
      statement_descriptor: "JURISCAN",
      card: {
        billing_address: {
          line_1: billingAddress!.line_1,
          zip_code: billingAddress!.zip_code,
          city: billingAddress!.city,
          state: billingAddress!.state,
          country: billingAddress!.country || "BR",
        },
      },
    };
  } else if (paymentMethod === "pix") {
    paymentConfig.pix = {
      expires_in: 3600, // 1 hour
    };
  } else if (paymentMethod === "boleto") {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);
    paymentConfig.boleto = {
      due_at: dueDate.toISOString(),
      instructions: "Créditos Juriscan - Pagamento via boleto",
    };
  }

  console.log("[Pagar.me Credits] 3. Payment config:", {
    payment_method: paymentMethod,
    amount: amountInCents,
    has_card_token: paymentMethod === "credit_card" && !!cardToken,
    has_pix: paymentMethod === "pix",
    has_boleto: paymentMethod === "boleto",
  });

  // Create order
  let order;
  try {
    order = await getPagarme().createOrder({
      customer_id: customerId,
      items: [
        {
          amount: amountInCents,
          description: `${pkg.credits} créditos Juriscan`,
          quantity: 1,
          code: creditPackageId,
        },
      ],
      payments: [paymentConfig as never],
      metadata: {
        user_id: user!.id,
        type: "credit_purchase",
        credit_package_id: creditPackageId,
        credits: pkg.credits.toString(),
      },
    });

    console.log("[Pagar.me Credits] 4. Order created:", order.id, "status:", order.status);
    // Log charge details for all payment methods
    if (paymentMethod === "credit_card") {
      const rawOrder = order as unknown as Record<string, unknown>;
      const charges = rawOrder.charges as Array<Record<string, unknown>> | undefined;
      const charge = charges?.[0];
      const lastTx = charge?.last_transaction as Record<string, unknown> | undefined;
      console.log("[Pagar.me Credits] 5. Card charge:", {
        chargeStatus: charge?.status,
        txStatus: lastTx?.status,
        txType: lastTx?.transaction_type,
        acquirerMsg: lastTx?.acquirer_message,
        gatewayResponse: lastTx?.gateway_response ? JSON.stringify(lastTx.gateway_response) : undefined,
      });
    }
    // Log full charge structure for debugging PIX/boleto
    if (paymentMethod !== "credit_card") {
      const rawOrder = order as unknown as Record<string, unknown>;
      const charges = rawOrder.charges as Array<Record<string, unknown>> | undefined;
      console.log("[Pagar.me Credits] 5. Charges count:", charges?.length || 0);
      if (charges?.[0]) {
        console.log("[Pagar.me Credits] 6. Charge[0] keys:", Object.keys(charges[0]));
        const lastTx = charges[0].last_transaction as Record<string, unknown> | undefined;
        if (lastTx) {
          console.log("[Pagar.me Credits] 7. last_transaction keys:", Object.keys(lastTx));
          console.log("[Pagar.me Credits] 8. last_transaction data:", JSON.stringify(lastTx));
        } else {
          console.warn("[Pagar.me Credits] 7. No last_transaction found in charge[0]");
          console.log("[Pagar.me Credits] 7. Charge[0] full:", JSON.stringify(charges[0]));
        }
      }
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("[Pagar.me Credits] Order creation failed:", msg);
    throw new ValidationError(`Erro ao criar pedido: ${msg}`);
  }

  // Check if order failed
  if (order.status === "failed") {
    const rawOrder = order as unknown as Record<string, unknown>;
    const charges = rawOrder.charges as Array<Record<string, unknown>> | undefined;
    const failedCharge = charges?.[0];
    const failedTx = failedCharge?.last_transaction as Record<string, unknown> | undefined;
    const gatewayMsg = failedTx?.gateway_response as Record<string, unknown> | undefined;
    const acquirerMsg = failedTx?.acquirer_message as string | undefined;
    const gatewayMessage = (gatewayMsg?.message as string | undefined)
      || (gatewayMsg?.errors as Array<{ message?: string }> | undefined)?.[0]?.message;
    const txStatus = failedTx?.status as string | undefined;
    const txGatewayId = failedTx?.gateway_id as string | undefined;

    console.error("[Pagar.me Credits] ORDER FAILED:", {
      orderId: order.id,
      paymentMethod,
      chargeStatus: failedCharge?.status,
      txStatus,
      acquirerMsg,
      gatewayMessage,
      txGatewayId,
      gatewayResponse: gatewayMsg ? JSON.stringify(gatewayMsg) : undefined,
      fullCharge: JSON.stringify(failedCharge),
    });

    // Build a helpful error message based on what Pagar.me returned
    const errorDetail = acquirerMsg || gatewayMessage || txStatus || "Pagamento recusado";
    const methodLabels: Record<string, string> = {
      credit_card: "cartão de crédito",
      pix: "PIX",
      boleto: "boleto",
    };
    const methodLabel = methodLabels[paymentMethod] || paymentMethod;
    throw new ValidationError(
      `Pagamento via ${methodLabel} falhou: ${errorDetail}. Verifique os dados informados e tente novamente.`
    );
  }

  // Determine actual payment status from charge
  const rawOrder = order as unknown as Record<string, unknown>;
  const allCharges = rawOrder.charges as Array<Record<string, unknown>> | undefined;
  const firstCharge = allCharges?.[0];
  const firstChargeStatus = (firstCharge?.status as string) || "";
  const chargeId = firstCharge?.id as string | undefined;
  const isPaid = firstChargeStatus === "paid";

  console.log("[Pagar.me Credits] Payment status:", { orderStatus: order.status, firstChargeStatus, chargeId, isPaid });

  // For card payments: credit immediately when charge is paid.
  // For PIX/boleto: credits are added by webhook charge.paid when payment completes.
  // Idempotency: mark the charge as processed to prevent double-credit from webhook.
  if (isPaid) {
    let alreadyCredited = false;

    if (chargeId) {
      const { error: idempError } = await adminClient
        .from("processed_webhook_events")
        .insert({
          event_id: `credit_paid_${chargeId}`,
          event_type: "credit_purchase_immediate",
          processed_at: new Date().toISOString(),
        } as never);

      if (idempError?.code === "23505") {
        alreadyCredited = true;
        console.log("[Pagar.me Credits] Already credited for charge:", chargeId);
      }
    }

    if (!alreadyCredited) {
      const creditResult = await addCredits(
        adminClient,
        user!.id,
        pkg.credits,
        `Compra de ${pkg.credits} créditos (pedido ${order.id})`,
        "CREDIT_PURCHASE"
      );

      if (creditResult.success) {
        console.log("[Pagar.me Credits] Credits added immediately:", pkg.credits, "new balance:", creditResult.newBalance);
      } else {
        console.error("[Pagar.me Credits] Failed to add credits:", creditResult.error);
      }
    }
  }

  // Build response
  const response: Record<string, unknown> = {
    orderId: order.id,
    status: order.status,
    chargeStatus: firstChargeStatus || "unknown",
    isPaid,
    paymentMethod,
  };

  // Extract async payment data from charge
  const charge = allCharges?.[0];
  const lastTx = charge?.last_transaction as Record<string, unknown> | undefined;

  if (paymentMethod === "pix") {
    // Try multiple extraction paths for PIX data
    const qrCode =
      lastTx?.qr_code as string | undefined ??
      lastTx?.pix_qr_code as string | undefined ??
      (lastTx?.pix as Record<string, unknown> | undefined)?.qr_code as string | undefined;

    const qrCodeUrl =
      lastTx?.qr_code_url as string | undefined ??
      lastTx?.pix_qr_code_url as string | undefined ??
      (lastTx?.pix as Record<string, unknown> | undefined)?.qr_code_url as string | undefined;

    const expiresAt =
      lastTx?.expires_at as string | undefined ??
      (lastTx?.pix as Record<string, unknown> | undefined)?.expires_at as string | undefined ??
      charge?.expires_at as string | undefined;

    response.pix = {
      qr_code: qrCode || "",
      qr_code_url: qrCodeUrl || "",
      expires_at: expiresAt || new Date(Date.now() + 3600000).toISOString(),
    };

    console.log("[Pagar.me Credits] 9. PIX response:", {
      hasQrCode: !!qrCode,
      hasQrCodeUrl: !!qrCodeUrl,
      hasExpiresAt: !!expiresAt,
      qrCodeLength: qrCode?.length,
    });
  } else if (paymentMethod === "boleto") {
    const barcode =
      lastTx?.barcode as string | undefined ??
      (lastTx?.boleto as Record<string, unknown> | undefined)?.barcode as string | undefined;
    const line =
      lastTx?.line as string | undefined ??
      (lastTx?.boleto as Record<string, unknown> | undefined)?.line as string | undefined;
    const pdf =
      lastTx?.pdf as string | undefined ??
      (lastTx?.boleto as Record<string, unknown> | undefined)?.pdf as string | undefined;
    const dueAt =
      lastTx?.due_at as string | undefined ??
      (lastTx?.boleto as Record<string, unknown> | undefined)?.due_at as string | undefined;

    response.boleto = {
      barcode: barcode || "",
      line: line || "",
      pdf: pdf || "",
      due_at: dueAt || "",
    };
  }

  return successResponse(response);
});
