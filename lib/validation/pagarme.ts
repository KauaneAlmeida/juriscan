import { z } from "zod";

const paymentMethodSchema = z.enum(["credit_card", "pix", "boleto"]);

// Subscriptions only support credit_card and boleto (Pagar.me V5 limitation)
const subscriptionPaymentMethodSchema = z.enum(["credit_card", "boleto"]);

const billingAddressSchema = z.object({
  line_1: z.string().min(1, "Endereço é obrigatório"),
  zip_code: z.string().min(8, "CEP inválido").max(8),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().length(2, "Estado deve ter 2 letras"),
  country: z.string().default("BR"),
});

export const subscribeSchema = z.object({
  planId: z.enum(["starter", "pro", "business"]),
  paymentMethod: subscriptionPaymentMethodSchema.default("credit_card"),
  cardToken: z.string().optional(),
  document: z.string().min(11).max(18),
  documentType: z.enum(["CPF", "CNPJ"]).default("CPF"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  billingAddress: billingAddressSchema.optional(),
}).refine(
  (data) => data.paymentMethod !== "credit_card" || data.cardToken,
  { message: "Token do cartão é obrigatório para pagamento com cartão", path: ["cardToken"] }
).refine(
  (data) => data.phone.replace(/\D/g, "").length >= 10,
  { message: "Telefone deve ter pelo menos 10 dígitos", path: ["phone"] }
).refine(
  (data) => data.paymentMethod !== "credit_card" || data.billingAddress,
  { message: "Endereço de cobrança é obrigatório para cartão", path: ["billingAddress"] }
);

export const purchaseCreditsSchema = z.object({
  creditPackageId: z.enum(["credits_10", "credits_50", "credits_100"]),
  paymentMethod: paymentMethodSchema.default("credit_card"),
  cardToken: z.string().optional(),
  document: z.string().min(11).max(18),
  documentType: z.enum(["CPF", "CNPJ"]).default("CPF"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  billingAddress: billingAddressSchema.optional(),
}).refine(
  (data) => data.paymentMethod !== "credit_card" || data.cardToken,
  { message: "Token do cartão é obrigatório para pagamento com cartão", path: ["cardToken"] }
).refine(
  (data) => data.phone.replace(/\D/g, "").length >= 10,
  { message: "Telefone deve ter pelo menos 10 dígitos", path: ["phone"] }
).refine(
  (data) => data.paymentMethod !== "credit_card" || data.billingAddress,
  { message: "Endereço de cobrança é obrigatório para cartão", path: ["billingAddress"] }
);

export const cancelSubscriptionSchema = z.object({
  reason: z.string().optional(),
});

export const updatePaymentSchema = z.object({
  cardToken: z.string().min(1, "Token do cartão é obrigatório"),
});

export const upgradePlanSchema = z.object({
  planId: z.enum(["starter", "pro", "business"]),
});

export type SubscribeInput = z.infer<typeof subscribeSchema>;
export type PurchaseCreditsInput = z.infer<typeof purchaseCreditsSchema>;
export type CancelSubscriptionInput = z.infer<typeof cancelSubscriptionSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
export type UpgradePlanInput = z.infer<typeof upgradePlanSchema>;
