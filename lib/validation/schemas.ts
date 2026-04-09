import { z } from "zod";
import { uuidSchema } from "./common";

// Re-export uuidSchema for backwards compatibility
export { uuidSchema };

// Attachment schema
export const attachmentSchema = z.object({
  id: z.string(),
  type: z.enum(["file", "image", "audio"]),
  name: z.string(),
  url: z.string().url(),
  size: z.number(),
  mime_type: z.string(),
  metadata: z.object({
    pages: z.number().optional(),
    extracted_text: z.string().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    duration: z.number().optional(),
    transcription: z.string().optional(),
  }).optional().default({}),
});

// Chat API schemas
export const chatMessageSchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().max(10000, "Mensagem muito longa").default(""),
  attachments: z.array(attachmentSchema).max(5).optional().default([]),
}).refine(
  (data) => data.message.trim().length > 0 || (data.attachments && data.attachments.length > 0),
  { message: "Mensagem ou anexo é obrigatório" }
);

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;

// Conversation API schemas
export const createConversationSchema = z.object({
  title: z.string().min(1).max(200).optional(),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;

export const updateConversationSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  status: z.enum(["ACTIVE", "ARCHIVED", "DELETED"]).optional(),
});

export type UpdateConversationInput = z.infer<typeof updateConversationSchema>;

// Helper function to validate and parse request body
export async function validateBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      const firstIssue = result.error.issues[0];
      return {
        success: false,
        error: firstIssue?.message || "Dados inválidos",
      };
    }

    return { success: true, data: result.data };
  } catch {
    return { success: false, error: "Corpo da requisição inválido" };
  }
}

// Helper function to validate UUID param
export function validateUuid(id: string): { success: true; id: string } | { success: false; error: string } {
  const result = uuidSchema.safeParse(id);

  if (!result.success) {
    return { success: false, error: "ID inválido" };
  }

  return { success: true, id: result.data };
}
