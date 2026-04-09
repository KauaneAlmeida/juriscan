import { apiHandler, successResponse, ValidationError } from "@/lib/api";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { logAuditEvent, extractRequestInfo } from "@/lib/audit/logger";
import { z } from "zod";

const deleteAccountSchema = z.object({
  confirmation: z.string().email("Email inválido"),
});

// DELETE /api/privacy/account - Permanently delete account
export const DELETE = apiHandler(async (request, { user }) => {
  const { ip, userAgent } = extractRequestInfo(request);
  logAuditEvent({ userId: user!.id, event: "account_deletion_requested", ip, userAgent });

  const supabase = await createServerSupabaseClient();

  // Validate confirmation matches user email
  const body = await request.json();
  const result = deleteAccountSchema.safeParse(body);

  if (!result.success) {
    throw new ValidationError("Email de confirmação inválido.");
  }

  if (result.data.confirmation !== user!.email) {
    throw new ValidationError("O email digitado não corresponde ao email da sua conta.");
  }

  // Cancel any active Pagar.me subscription first
  const { data: subscriptionData } = await supabase
    .from("subscriptions")
    .select("pagarme_subscription_id")
    .eq("user_id", user!.id)
    .eq("status", "active")
    .single();

  const sub = subscriptionData as { pagarme_subscription_id: string | null } | null;

  if (sub?.pagarme_subscription_id) {
    try {
      const { getPagarme } = await import("@/lib/pagarme/client");
      await getPagarme().cancelSubscription(sub.pagarme_subscription_id);
    } catch {
      // Log but don't block deletion if Pagar.me fails
      // The user data deletion is more important
    }
  }

  // Soft delete: Mark profile as deleted instead of hard delete
  // This preserves data integrity and allows recovery if needed
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      status: "DELETED",
      deleted_at: new Date().toISOString(),
      email: `deleted_${user!.id}@deleted.juriscan.com`, // Anonymize email
      name: "Usuário Removido",
      oab: null,
      phone: null,
      avatar_url: null,
      law_firm: null,
      practice_areas: [],
    } as never)
    .eq("id", user!.id);

  if (updateError) {
    throw new Error("Erro ao excluir conta. Por favor, tente novamente.");
  }

  // Delete all user data
  await Promise.all([
    supabase.from("reports").delete().eq("user_id", user!.id),
    supabase.from("analyses").delete().eq("user_id", user!.id),
    supabase.from("conversations").delete().eq("user_id", user!.id),
    supabase.from("credit_transactions").delete().eq("user_id", user!.id),
    supabase.from("credit_balances").delete().eq("user_id", user!.id),
    supabase.from("notification_preferences").delete().eq("user_id", user!.id),
    supabase.from("subscriptions").delete().eq("user_id", user!.id),
    supabase.from("sessions").delete().eq("user_id", user!.id),
  ]);

  // Use admin client to delete the auth user
  const adminSupabase = await createAdminClient();
  await adminSupabase.auth.admin.deleteUser(user!.id);

  return successResponse({
    message: "Sua conta foi excluída permanentemente.",
  });
});
