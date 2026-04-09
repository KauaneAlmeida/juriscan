import { createAdminClient } from "@/lib/supabase/server";

export type AuditEvent =
  | "login_success"
  | "login_failed"
  | "logout"
  | "password_changed"
  | "data_export_requested"
  | "account_deletion_requested"
  | "rate_limit_hit";

interface AuditLogParams {
  userId?: string;
  event: AuditEvent;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Registra evento de auditoria. Nunca quebra o fluxo principal.
 */
export async function logAuditEvent(params: AuditLogParams): Promise<void> {
  try {
    const supabase = await createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("audit_logs").insert({
      user_id: params.userId ?? null,
      event_type: params.event,
      ip_address: params.ip ?? null,
      user_agent: params.userAgent ?? null,
      metadata: params.metadata ?? {},
    });
  } catch {
    // Silencioso - audit log nunca deve quebrar o fluxo principal
  }
}

/**
 * Extrai IP e User-Agent de um Request para audit logging
 */
export function extractRequestInfo(request: Request): { ip: string; userAgent: string } {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0].trim() || realIp || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  return { ip, userAgent };
}
