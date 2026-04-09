import { apiHandler, successResponse, parseBody } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

const sendNotificationSchema = z.object({
  type: z.enum(["analysis_completed", "report_generated", "deadline_alert", "low_credits", "product_update", "system"]),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  data: z.record(z.string(), z.unknown()).optional().default({}),
});

// POST /api/notifications/send - Send a notification to the authenticated user
// Security: userId is ALWAYS taken from the auth token, never from client input
export const POST = apiHandler(async (request, { user }) => {
  const { type, title, message, data } = await parseBody(request, sendNotificationSchema);

  const supabase = await createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: notificationId, error } = await (supabase as any).rpc("send_notification", {
    p_user_id: user!.id, // Forçar ID do token autenticado - NUNCA aceitar do client
    p_type: type,
    p_title: title,
    p_message: message,
    p_data: data,
  });

  if (error) {
    throw new Error(`Erro ao enviar notificação: ${error.message}`);
  }

  return successResponse({
    notificationId,
    sent: notificationId !== null,
  }, 201);
});
