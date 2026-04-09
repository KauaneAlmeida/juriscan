import { apiHandler, successResponse, parseBody } from "@/lib/api";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";

const updatePreferencesSchema = z.object({
  share_data_improvements: z.boolean().optional(),
  usage_analytics: z.boolean().optional(),
});

// GET /api/privacy/preferences - Get privacy preferences
export const GET = apiHandler(async (_request, { user }) => {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("share_data_improvements, usage_analytics")
    .eq("id", user!.id)
    .single();

  if (error) {
    // Return defaults if not found
    return successResponse({
      preferences: {
        share_data_improvements: true,
        usage_analytics: true,
      },
    });
  }

  const row = data as { share_data_improvements: boolean | null; usage_analytics: boolean | null };

  return successResponse({
    preferences: {
      share_data_improvements: row.share_data_improvements ?? true,
      usage_analytics: row.usage_analytics ?? true,
    },
  });
});

// PATCH /api/privacy/preferences - Update privacy preferences
export const PATCH = apiHandler(async (request, { user }) => {
  const supabase = await createServerSupabaseClient();

  const data = await parseBody(request, updatePreferencesSchema);

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (data.share_data_improvements !== undefined) {
    updateData.share_data_improvements = data.share_data_improvements;
  }
  if (data.usage_analytics !== undefined) {
    updateData.usage_analytics = data.usage_analytics;
  }

  const { error } = await supabase
    .from("profiles")
    .update(updateData as never)
    .eq("id", user!.id);

  if (error) {
    throw new Error("Erro ao salvar preferências de privacidade");
  }

  return successResponse({
    message: "Preferências de privacidade atualizadas com sucesso",
  });
});
