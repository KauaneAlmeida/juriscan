import { createAdminClient } from "@/lib/supabase/server";

interface SendNotificationParams {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

async function sendNotification({ userId, type, title, message, data = {} }: SendNotificationParams) {
  const supabase = await createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: notificationId, error } = await (supabase as any).rpc("send_notification", {
    p_user_id: userId,
    p_type: type,
    p_title: title,
    p_message: message,
    p_data: data,
  });

  if (error) {
    console.error("Erro ao enviar notificação:", error);
    return null;
  }

  return notificationId;
}

export async function notifyAnalysisCompleted(userId: string, analysisId: string, processNumber?: string) {
  return sendNotification({
    userId,
    type: "analysis_completed",
    title: "Análise concluída",
    message: processNumber
      ? `A análise do processo ${processNumber} foi concluída.`
      : "Sua análise foi concluída com sucesso.",
    data: { analysisId, processNumber },
  });
}

export async function notifyReportReady(userId: string, reportId: string, reportTitle: string) {
  return sendNotification({
    userId,
    type: "report_generated",
    title: "Relatório pronto",
    message: `O relatório "${reportTitle}" está pronto para download.`,
    data: { reportId, reportTitle },
  });
}

export async function notifyLowCredits(userId: string, currentBalance: number) {
  return sendNotification({
    userId,
    type: "low_credits",
    title: "Créditos baixos",
    message: `Você tem apenas ${currentBalance} crédito${currentBalance !== 1 ? "s" : ""} restante${currentBalance !== 1 ? "s" : ""}. Considere adquirir mais.`,
    data: { currentBalance },
  });
}

export async function notifyDeadline(userId: string, processNumber: string, deadline: string, description: string) {
  return sendNotification({
    userId,
    type: "deadline_alert",
    title: "Prazo processual",
    message: `Prazo para ${description} no processo ${processNumber}: ${deadline}`,
    data: { processNumber, deadline, description },
  });
}
