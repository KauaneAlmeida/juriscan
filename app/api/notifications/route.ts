import { apiHandler, successResponse } from "@/lib/api";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";

// GET /api/notifications - List user notifications
export const GET = apiHandler(async (request, { user }) => {
  const supabase = await createServerSupabaseClient();

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);
  const offset = parseInt(url.searchParams.get("offset") || "0");
  const unreadOnly = url.searchParams.get("unread") === "true";

  let query = supabase
    .from("notifications")
    .select("*", { count: "exact" })
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (unreadOnly) {
    query = query.eq("read", false);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error("Erro ao buscar notificações");
  }

  return successResponse({
    notifications: data || [],
    total: count || 0,
    unreadCount: undefined as number | undefined,
  });
});

const markReadSchema = z.object({
  notificationId: z.string().uuid().optional(),
  markAllRead: z.boolean().optional(),
});

// PATCH /api/notifications - Mark notification(s) as read
export const PATCH = apiHandler(async (request, { user }) => {
  const supabase = await createServerSupabaseClient();

  const body = await request.json();
  const { notificationId, markAllRead } = markReadSchema.parse(body);

  const now = new Date().toISOString();

  if (markAllRead) {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true, read_at: now } as never)
      .eq("user_id", user!.id)
      .eq("read", false);

    if (error) throw new Error("Erro ao marcar notificações como lidas");

    return successResponse({ message: "Todas as notificações marcadas como lidas" });
  }

  if (notificationId) {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true, read_at: now } as never)
      .eq("id", notificationId)
      .eq("user_id", user!.id);

    if (error) throw new Error("Erro ao marcar notificação como lida");

    return successResponse({ message: "Notificação marcada como lida" });
  }

  throw new Error("notificationId ou markAllRead é obrigatório");
});
