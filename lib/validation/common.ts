import { z } from "zod";

/**
 * UUID validation schema
 */
export const uuidSchema = z.string().uuid("ID inválido");

/**
 * Pagination query parameters schema
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

/**
 * Sorting query parameters schema
 */
export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type SortParams = z.infer<typeof sortSchema>;

/**
 * Date range filter schema
 */
export const dateRangeSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type DateRangeParams = z.infer<typeof dateRangeSchema>;

/**
 * Search query schema
 */
export const searchSchema = z.object({
  q: z.string().min(1).max(200).optional(),
});

export type SearchParams = z.infer<typeof searchSchema>;

/**
 * Email validation schema with Brazilian Portuguese error message
 */
export const emailSchema = z.string().email("Email inválido").toLowerCase();

/**
 * Phone validation schema (Brazilian format)
 */
export const phoneSchema = z
  .string()
  .regex(/^\+?55?\s?\(?[1-9]{2}\)?\s?9?\d{4}[-\s]?\d{4}$/, "Telefone inválido")
  .optional();

/**
 * CPF validation schema (Brazilian document)
 */
export const cpfSchema = z
  .string()
  .regex(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, "CPF inválido")
  .optional();

/**
 * OAB number validation schema (Brazilian Bar Association)
 */
export const oabSchema = z
  .string()
  .regex(/^[A-Z]{2}\d{4,6}$/, "Número OAB inválido (formato: UF + números, ex: SP123456)")
  .optional();
