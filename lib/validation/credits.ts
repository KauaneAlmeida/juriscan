import { z } from "zod";

/**
 * Credit operation types
 */
export const creditOperationType = z.enum([
  "CHAT_MESSAGE",
  "DOCUMENT_ANALYSIS",
  "REPORT_GENERATION",
  "PURCHASE",
  "BONUS",
  "REFUND",
  "ADMIN_ADJUSTMENT",
]);

export type CreditOperationType = z.infer<typeof creditOperationType>;

/**
 * Deduct credits schema
 */
export const deductCreditsSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().int().positive("Quantidade deve ser positiva"),
  operation: creditOperationType,
  referenceId: z.string().uuid().optional(),
  description: z.string().max(500).optional(),
});

export type DeductCreditsInput = z.infer<typeof deductCreditsSchema>;

/**
 * Add credits schema
 */
export const addCreditsSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().int().positive("Quantidade deve ser positiva"),
  operation: creditOperationType,
  referenceId: z.string().uuid().optional(),
  description: z.string().max(500).optional(),
});

export type AddCreditsInput = z.infer<typeof addCreditsSchema>;

/**
 * Credit balance response schema
 */
export const creditBalanceSchema = z.object({
  balance: z.number().int().min(0),
  lastUpdated: z.string().datetime().optional(),
});

export type CreditBalance = z.infer<typeof creditBalanceSchema>;

/**
 * Credit transaction schema
 */
export const creditTransactionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  amount: z.number().int(),
  operation: creditOperationType,
  balanceAfter: z.number().int().min(0),
  referenceId: z.string().uuid().nullable(),
  description: z.string().nullable(),
  createdAt: z.string().datetime(),
});

export type CreditTransaction = z.infer<typeof creditTransactionSchema>;

/**
 * Purchase credits schema (for future payment integration)
 */
export const purchaseCreditsSchema = z.object({
  packageId: z.string().uuid(),
  paymentMethodId: z.string().optional(),
});

export type PurchaseCreditsInput = z.infer<typeof purchaseCreditsSchema>;

/**
 * Credit package schema
 */
export const creditPackageSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  credits: z.number().int().positive(),
  price: z.number().positive(),
  currency: z.string().default("BRL"),
  isActive: z.boolean(),
});

export type CreditPackage = z.infer<typeof creditPackageSchema>;
