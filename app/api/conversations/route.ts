import { apiHandler, successResponse, parseBody } from "@/lib/api";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createConversationSchema } from "@/lib/validation/schemas";

// Force dynamic rendering for authenticated routes
export const dynamic = "force-dynamic";

// GET /api/conversations - List user's conversations
export const GET = apiHandler(async (_request, { user }) => {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_id", user!.id)
    .eq("status", "ACTIVE")
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error("Erro ao buscar conversas");
  }

  const conversations = data || [];

  return successResponse({ conversations });
});

// DELETE /api/conversations - Bulk soft-delete all user's conversations
export const DELETE = apiHandler(async (_request, { user }) => {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from("conversations")
    .update({ status: "DELETED" } as never)
    .eq("user_id", user!.id)
    .eq("status", "ACTIVE");

  if (error) {
    throw new Error("Erro ao excluir conversas");
  }

  return successResponse({ deleted: true });
});

// POST /api/conversations - Create a new conversation
export const POST = apiHandler(async (request, { user }) => {
  const supabase = await createServerSupabaseClient();

  const { title } = await parseBody(request, createConversationSchema);

  const { data, error } = await supabase
    .from("conversations")
    .insert({
      user_id: user!.id,
      title: title || "Nova conversa",
      status: "ACTIVE",
    } as never)
    .select()
    .single();

  if (error) {
    throw new Error("Erro ao criar conversa");
  }

  return successResponse({ conversation: data });
});
