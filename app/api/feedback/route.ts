import { apiHandler, parseBody } from "@/lib/api/handler";
import { successResponse } from "@/lib/api/response";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { betaFeedbackSchema } from "@/lib/validation/feedback";

export const dynamic = "force-dynamic";

// GET — fetch current user's feedback (if exists)
export const GET = apiHandler(async (_request, { user }) => {
  const supabase = await createServerSupabaseClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as unknown as { from: (table: string) => any };
  const { data, error } = await sb
    .from("beta_feedback")
    .select("*")
    .eq("user_id", user!.id)
    .maybeSingle();

  if (error) throw error;

  return successResponse({ feedback: data });
});

// POST — submit feedback (insert or update)
export const POST = apiHandler(async (request, { user }) => {
  const body = await parseBody(request, betaFeedbackSchema);
  const supabase = await createServerSupabaseClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as unknown as { from: (table: string) => any };

  // Check if user already submitted
  const { data: existing } = await sb
    .from("beta_feedback")
    .select("id")
    .eq("user_id", user!.id)
    .maybeSingle();

  if (existing) {
    // Update existing feedback
    const { data, error } = await sb
      .from("beta_feedback")
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .eq("user_id", user!.id)
      .select()
      .single();

    if (error) throw error;
    return successResponse({ feedback: data });
  }

  // Insert new feedback
  const { data, error } = await sb
    .from("beta_feedback")
    .insert({ ...body, user_id: user!.id })
    .select()
    .single();

  if (error) throw error;
  return successResponse({ feedback: data }, 201);
});
