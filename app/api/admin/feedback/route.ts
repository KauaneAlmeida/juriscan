/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api/handler";
import { successResponse } from "@/lib/api/response";
import { createAdminClient, createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET — admin-only: fetch all feedbacks + stats
export const GET = apiHandler(async (_request, { user }) => {
  // Verify admin role
  const supabase = await createServerSupabaseClient();
  const { data: profile } = await (supabase as unknown as { from: (t: string) => any })
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  if (profile?.role !== "ADMIN") {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Acesso negado" } },
      { status: 403 }
    );
  }

  // Use admin client to bypass RLS
  const admin = await createAdminClient();

  // Fetch all feedbacks with user info
  const { data: feedbacks, error } = await (admin as unknown as { from: (t: string) => any })
    .from("beta_feedback")
    .select("*, profiles:user_id(name, practice_areas)")
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Calculate stats
  const rows = (feedbacks || []) as Record<string, unknown>[];
  const total = rows.length;
  const npsScores = rows.map((f) => f.nps_score as number);
  const promoters = npsScores.filter((s) => s >= 9).length;
  const passives = npsScores.filter((s) => s >= 7 && s <= 8).length;
  const detractors = npsScores.filter((s) => s <= 6).length;
  const npsScore = total > 0 ? Math.round(((promoters - detractors) / total) * 100) : 0;

  // Average ratings helper
  const avgRating = (field: string) => {
    const values = rows
      .map((f) => f[field] as number | null)
      .filter((v): v is number => v !== null);
    return values.length > 0
      ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
      : null;
  };

  // Distribution counter helper
  const countField = (field: string) => {
    const counts: Record<string, number> = {};
    rows.forEach((f) => {
      const val = f[field] as string | null;
      if (val) counts[val] = (counts[val] || 0) + 1;
    });
    return counts;
  };

  // Average valor mensal
  const valorValues = rows
    .map((f) => f.valor_max_mensal as number | null)
    .filter((v): v is number => v !== null);
  const avgValorMensal = valorValues.length > 0
    ? Math.round(valorValues.reduce((a, b) => a + b, 0) / valorValues.length)
    : null;

  // Authorized testimonials
  const testimonials = rows
    .filter((f) => f.permite_depoimento && f.depoimento)
    .map((f) => ({
      depoimento: f.depoimento as string,
      user_name: (f.profiles as Record<string, unknown>)?.name as string || "Anônimo",
      area_juridica: f.area_juridica as string | null,
      created_at: f.created_at as string,
    }));

  return successResponse({
    feedbacks,
    stats: {
      totalResponses: total,
      npsScore,
      npsBreakdown: { promoters, passives, detractors },
      avgRatings: {
        chat_ia: avgRating("rating_chat_ia"),
        analise_pdf: avgRating("rating_analise_pdf"),
        relatorios: avgRating("rating_relatorios"),
        jurimetria: avgRating("rating_jurimetria"),
        interface: avgRating("rating_interface"),
        velocidade: avgRating("rating_velocidade"),
      },
      pricingDistribution: countField("preco_justo"),
      planDistribution: countField("plano_interesse"),
      iaQualidadeDistribution: countField("ia_qualidade"),
      iaPrecisaoDistribution: countField("ia_precisao"),
      avgValorMensal,
      authorizedTestimonials: testimonials,
    },
  });
});
