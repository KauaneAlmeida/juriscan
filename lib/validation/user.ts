import { z } from "zod";
import { emailSchema, phoneSchema, oabSchema } from "./common";

/**
 * User profile schema
 */
export const profileSchema = z.object({
  id: z.string().uuid(),
  email: emailSchema,
  full_name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100).nullable(),
  avatar_url: z.string().url("URL de avatar inválida").nullable(),
  phone: phoneSchema.nullable(),
  oab_number: oabSchema.nullable(),
  specialty: z.string().max(100).nullable(),
  office_name: z.string().max(200).nullable(),
  terms_accepted_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Profile = z.infer<typeof profileSchema>;

/**
 * Update profile schema (all fields optional)
 */
export const updateProfileSchema = z.object({
  full_name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100).optional(),
  phone: phoneSchema,
  oab_number: oabSchema,
  specialty: z.string().max(100).optional(),
  office_name: z.string().max(200).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * Accept terms schema
 */
export const acceptTermsSchema = z.object({
  accepted: z.literal(true, {
    error: "Você deve aceitar os termos para continuar",
  }),
});

export type AcceptTermsInput = z.infer<typeof acceptTermsSchema>;

/**
 * Change password schema
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Senha atual é obrigatória"),
    newPassword: z
      .string()
      .min(8, "Senha deve ter pelo menos 8 caracteres")
      .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
      .regex(/[a-z]/, "Senha deve conter pelo menos uma letra minúscula")
      .regex(/[0-9]/, "Senha deve conter pelo menos um número"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/**
 * Delete account schema
 */
export const deleteAccountSchema = z.object({
  confirmation: z.literal("DELETAR MINHA CONTA", {
    error: "Digite 'DELETAR MINHA CONTA' para confirmar",
  }),
});

export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
