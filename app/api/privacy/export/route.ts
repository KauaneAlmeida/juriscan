import { apiHandler, successResponse } from "@/lib/api";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { logAuditEvent, extractRequestInfo } from "@/lib/audit/logger";

// POST /api/privacy/export - Request data export (LGPD compliance)
export const POST = apiHandler(async (_request, { user }) => {
  const { ip, userAgent } = extractRequestInfo(_request);
  logAuditEvent({ userId: user!.id, event: "data_export_requested", ip, userAgent });
  const supabase = await createServerSupabaseClient();

  // Fetch all user data for export
  const [
    { data: profile },
    { data: conversations },
    { data: messages },
    { data: analyses },
    { data: reports },
    { data: transactions },
    { data: notificationPrefs },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user!.id).single(),
    supabase.from("conversations").select("*").eq("user_id", user!.id),
    supabase
      .from("messages")
      .select("*, conversations!inner(user_id)")
      .eq("conversations.user_id", user!.id),
    supabase.from("analyses").select("*").eq("user_id", user!.id),
    supabase.from("reports").select("*").eq("user_id", user!.id),
    supabase.from("credit_transactions").select("*").eq("user_id", user!.id),
    supabase.from("notification_preferences").select("*").eq("user_id", user!.id).single(),
  ]);

  // Compile all data into export format
  const exportData = {
    export_date: new Date().toISOString(),
    user_id: user!.id,
    profile: profile || null,
    conversations: conversations || [],
    messages: messages || [],
    analyses: analyses || [],
    reports: reports || [],
    credit_transactions: transactions || [],
    notification_preferences: notificationPrefs || null,
  };

  // In production, you would:
  // 1. Generate a secure download link
  // 2. Send an email with the link
  // 3. Store the export request in a queue
  // For now, return the data directly (can be downloaded as JSON)

  return successResponse({
    message: "Dados exportados com sucesso",
    data: exportData,
  });
});
