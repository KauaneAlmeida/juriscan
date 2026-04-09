import { apiHandler, successResponse, parseBody, NotFoundError, ValidationError } from "@/lib/api";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { updateConversationSchema, uuidSchema } from "@/lib/validation/schemas";

// Helper to validate UUID from params
function validateId(id: string): string {
  const result = uuidSchema.safeParse(id);
  if (!result.success) {
    throw new ValidationError("ID inválido");
  }
  return result.data;
}

// GET /api/conversations/[id] - Get conversation with messages
export const GET = apiHandler(async (_request, { params, user }) => {
  const id = validateId(params.id);
  const supabase = await createServerSupabaseClient();

  // Get conversation
  const { data: conversationData, error: convError } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (convError || !conversationData) {
    throw new NotFoundError("Conversa");
  }

  // Get messages
  const { data: messagesData } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  return successResponse({
    conversation: conversationData,
    messages: messagesData || [],
  });
});

// PATCH /api/conversations/[id] - Update conversation (title, archive)
export const PATCH = apiHandler(async (request, { params, user }) => {
  const id = validateId(params.id);
  const supabase = await createServerSupabaseClient();

  const { title, status } = await parseBody(request, updateConversationSchema);

  const updateData: Record<string, string> = {
    updated_at: new Date().toISOString(),
  };

  if (title !== undefined) updateData.title = title;
  if (status !== undefined) updateData.status = status;

  const { data, error } = await supabase
    .from("conversations")
    .update(updateData as never)
    .eq("id", id)
    .eq("user_id", user!.id)
    .select()
    .single();

  if (error) {
    throw new Error("Erro ao atualizar conversa");
  }

  return successResponse({ conversation: data });
});

// DELETE /api/conversations/[id] - Delete conversation (soft delete)
export const DELETE = apiHandler(async (_request, { params, user }) => {
  const id = validateId(params.id);
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from("conversations")
    .update({ status: "DELETED", updated_at: new Date().toISOString() } as never)
    .eq("id", id)
    .eq("user_id", user!.id);

  if (error) {
    throw new Error("Erro ao deletar conversa");
  }

  return successResponse({ success: true });
});
