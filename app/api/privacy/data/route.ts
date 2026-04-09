import { apiHandler, successResponse, ValidationError } from "@/lib/api";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";

const deleteDataSchema = z.object({
  confirmation: z.literal("EXCLUIR DADOS"),
});

// DELETE /api/privacy/data - Delete all user data but keep account
export const DELETE = apiHandler(async (request, { user }) => {
  const supabase = await createServerSupabaseClient();

  // Validate confirmation
  const body = await request.json();
  const result = deleteDataSchema.safeParse(body);

  if (!result.success) {
    throw new ValidationError("Confirmação inválida. Digite 'EXCLUIR DADOS' para confirmar.");
  }

  // Delete user data in order (respecting foreign key constraints)
  // Messages are deleted via CASCADE when conversations are deleted
  const deleteOperations = await Promise.all([
    // Delete reports
    supabase.from("reports").delete().eq("user_id", user!.id),
    // Delete analyses
    supabase.from("analyses").delete().eq("user_id", user!.id),
    // Delete conversations (cascades to messages)
    supabase.from("conversations").delete().eq("user_id", user!.id),
    // Delete credit transactions
    supabase.from("credit_transactions").delete().eq("user_id", user!.id),
    // Reset credit balance to 0
    supabase
      .from("credit_balances")
      .update({ balance: 0, updated_at: new Date().toISOString() } as never)
      .eq("user_id", user!.id),
    // Reset notification preferences to defaults
    supabase
      .from("notification_preferences")
      .update({
        analysis_completed: true,
        report_generated: true,
        deadline_alerts: true,
        low_credits: true,
        product_updates: false,
        marketing_emails: false,
        push_enabled: false,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("user_id", user!.id),
  ]);

  // Check for errors
  const errors = deleteOperations.filter((op) => op.error);
  if (errors.length > 0) {
    throw new Error("Erro ao excluir alguns dados. Por favor, tente novamente.");
  }

  return successResponse({
    message: "Todos os seus dados foram excluídos com sucesso. Sua conta permanece ativa.",
  });
});
