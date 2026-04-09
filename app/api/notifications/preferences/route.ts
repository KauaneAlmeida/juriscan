import { apiHandler, successResponse, parseBody } from "@/lib/api";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";

const updatePreferencesSchema = z.object({
  analises_concluidas: z.boolean().optional(),
  relatorios_gerados: z.boolean().optional(),
  prazos_processuais: z.boolean().optional(),
  creditos_baixos: z.boolean().optional(),
  novidades_atualizacoes: z.boolean().optional(),
  marketing_promocoes: z.boolean().optional(),
});

// Map frontend field names to database column names
const fieldMapping: Record<string, string> = {
  analises_concluidas: "analysis_completed",
  relatorios_gerados: "report_generated",
  prazos_processuais: "deadline_alerts",
  creditos_baixos: "low_credits",
  novidades_atualizacoes: "product_updates",
  marketing_promocoes: "marketing_emails",
};

// Reverse mapping for GET response
const reverseFieldMapping: Record<string, string> = {
  analysis_completed: "analises_concluidas",
  report_generated: "relatorios_gerados",
  deadline_alerts: "prazos_processuais",
  low_credits: "creditos_baixos",
  product_updates: "novidades_atualizacoes",
  marketing_emails: "marketing_promocoes",
};

interface NotificationPreferencesRow {
  analysis_completed: boolean;
  report_generated: boolean;
  deadline_alerts: boolean;
  low_credits: boolean;
  product_updates: boolean;
  marketing_emails: boolean;
}

// GET /api/notifications/preferences - Get notification preferences
export const GET = apiHandler(async (_request, { user }) => {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("notification_preferences")
    .select("analysis_completed, report_generated, deadline_alerts, low_credits, product_updates, marketing_emails")
    .eq("user_id", user!.id)
    .single();

  if (error) {
    // If no preferences found, return defaults
    return successResponse({
      preferences: {
        analises_concluidas: true,
        relatorios_gerados: true,
        prazos_processuais: true,
        creditos_baixos: true,
        novidades_atualizacoes: false,
        marketing_promocoes: false,
      },
    });
  }

  const row = data as NotificationPreferencesRow;

  // Map database columns to frontend field names
  const preferences: Record<string, boolean> = {};
  for (const [dbField, frontendField] of Object.entries(reverseFieldMapping)) {
    preferences[frontendField] = row[dbField as keyof NotificationPreferencesRow];
  }

  return successResponse({ preferences });
});

// PATCH /api/notifications/preferences - Update notification preferences
export const PATCH = apiHandler(async (request, { user }) => {
  const supabase = await createServerSupabaseClient();

  const data = await parseBody(request, updatePreferencesSchema);

  // Map frontend field names to database column names
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  for (const [frontendField, value] of Object.entries(data)) {
    if (value !== undefined) {
      const dbField = fieldMapping[frontendField];
      if (dbField) {
        updateData[dbField] = value;
      }
    }
  }

  const { error } = await supabase
    .from("notification_preferences")
    .update(updateData as never)
    .eq("user_id", user!.id);

  if (error) {
    throw new Error("Erro ao salvar preferências de notificação");
  }

  return successResponse({
    message: "Preferências de notificação atualizadas com sucesso",
  });
});
