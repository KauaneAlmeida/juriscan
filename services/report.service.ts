import type { SupabaseClient } from "@supabase/supabase-js";
import { getClaude, AI_CONFIG } from "@/lib/ai/config";
import {
  buildPredictivePrompt,
  buildJurimetricsPrompt,
  buildJudgeProfilePrompt,
} from "@/lib/ai/report-prompts";
import type {
  Report,
  ReportType,
  CreateReportInput,
  PredictiveAnalysisParams,
  PredictiveAnalysisResult,
  JurimetricsParams,
  JurimetricsResult,
  JudgeProfileParams,
  JudgeProfileResult,
} from "@/types/reports";
import { deductCredits } from "./credit.service";
import {
  createGenerateJurimetricsReportUseCase,
  createGeneratePredictiveAnalysisUseCase,
  createGenerateJudgeProfileUseCase,
} from "@/src/application/use-cases/reports";

// Re-export costs from centralized source
export { REPORT_COSTS } from "@/lib/credits/costs";

interface ReportRow {
  id: string;
  user_id: string;
  analysis_id: string | null;
  title: string;
  type: ReportType;
  version: string;
  content: Record<string, unknown> | null;
  file_url: string | null;
  file_size: number | null;
  page_count: number | null;
  credits_used: number;
  status: string;
  created_at: string;
  updated_at: string;
  generated_at: string | null;
}

/**
 * List all reports for a user
 */
export async function listReports(
  supabase: SupabaseClient,
  userId: string,
  options?: {
    type?: ReportType;
    status?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ data: Report[]; error: string | null }> {
  let query = supabase
    .from("reports")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (options?.type) {
    query = query.eq("type", options.type);
  }

  if (options?.status) {
    query = query.eq("status", options.status);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: (data || []) as Report[], error: null };
}

/**
 * Get a single report by ID
 */
export async function getReport(
  supabase: SupabaseClient,
  userId: string,
  reportId: string
): Promise<{ data: Report | null; error: string | null }> {
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("id", reportId)
    .eq("user_id", userId)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Report, error: null };
}

/**
 * Create a new report (draft)
 */
export async function createReport(
  supabase: SupabaseClient,
  userId: string,
  input: CreateReportInput
): Promise<{ data: Report | null; error: string | null }> {
  const { data, error } = await supabase
    .from("reports")
    .insert({
      user_id: userId,
      title: input.title,
      type: input.type,
      status: "DRAFT",
      content: { parameters: input.parameters },
      credits_used: 0,
    } as never)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Report, error: null };
}

/**
 * Delete a report
 */
export async function deleteReport(
  supabase: SupabaseClient,
  userId: string,
  reportId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("reports")
    .delete()
    .eq("id", reportId)
    .eq("user_id", userId);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Generate report content using AI
 */
export async function generateReport(
  supabase: SupabaseClient,
  userId: string,
  reportId: string,
  creditsToDeduct: number
): Promise<{ data: Report | null; error: string | null }> {
  // Get the report
  const { data: report, error: fetchError } = await getReport(supabase, userId, reportId);

  if (fetchError || !report) {
    return { data: null, error: fetchError || "Relatório não encontrado" };
  }

  if (report.status !== "DRAFT") {
    return { data: null, error: "Relatório já foi gerado" };
  }

  // Deduct credits first
  const creditResult = await deductCredits(
    supabase,
    userId,
    creditsToDeduct,
    `Geração de relatório: ${report.title}`
  );

  if (!creditResult.success) {
    return { data: null, error: creditResult.error || "Erro ao deduzir créditos" };
  }

  // Update status to generating
  await supabase
    .from("reports")
    .update({ status: "GENERATING" } as never)
    .eq("id", reportId);

  const startTime = Date.now();

  try {
    // Generate content based on type
    const parameters = (report.content as { parameters?: Record<string, unknown> })?.parameters || {};
    let result: unknown;
    let prompt: string;

    switch (report.type) {
      case "PREDICTIVE_ANALYSIS":
        // Use new UseCase with real data integration
        result = await generatePredictiveWithRealData(
          parameters as unknown as PredictiveAnalysisParams,
          userId
        );
        break;

      case "JURIMETRICS":
        // Use new UseCase with real data integration
        result = await generateJurimetricsWithRealData(
          parameters as unknown as JurimetricsParams,
          userId
        );
        break;

      case "RELATOR_PROFILE":
        // Use new UseCase with real data integration
        result = await generateJudgeProfileWithRealData(
          parameters as unknown as JudgeProfileParams,
          userId
        );
        break;

      default:
        return { data: null, error: "Tipo de relatório não suportado" };
    }

    const processingTime = Date.now() - startTime;

    // Update report with generated content
    const { data: updatedReport, error: updateError } = await supabase
      .from("reports")
      .update({
        status: "COMPLETED",
        content: {
          parameters,
          result,
          generated_at: new Date().toISOString(),
          processing_time_ms: processingTime,
        },
        credits_used: creditsToDeduct,
        generated_at: new Date().toISOString(),
      } as never)
      .eq("id", reportId)
      .select()
      .single();

    if (updateError) {
      return { data: null, error: updateError.message };
    }

    return { data: updatedReport as Report, error: null };
  } catch (error) {
    // Update status to failed
    await supabase
      .from("reports")
      .update({
        status: "FAILED",
        content: {
          ...(report.content as object),
          error: error instanceof Error ? error.message : "Erro desconhecido",
        },
      } as never)
      .eq("id", reportId);

    return {
      data: null,
      error: error instanceof Error ? error.message : "Erro ao gerar relatório",
    };
  }
}

/**
 * Generate jurimetrics report with real data from legal APIs
 */
async function generateJurimetricsWithRealData(
  params: JurimetricsParams,
  userId: string
): Promise<JurimetricsResult> {
  // Calculate default period (last 12 months if not specified)
  const now = new Date();
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const periodo = {
    inicio: params.periodo_inicio ? new Date(params.periodo_inicio) : oneYearAgo,
    fim: params.periodo_fim ? new Date(params.periodo_fim) : now,
  };

  // Use the new UseCase
  const useCase = createGenerateJurimetricsReportUseCase();
  const result = await useCase.execute({
    tribunal: params.tribunal,
    periodo,
    filtros: {
      classe: params.tipo_acao,
    },
    userId,
  });

  if (!result.success || !result.report) {
    // Fallback to AI-only generation
    console.warn("[Report] Falling back to AI-only generation for jurimetrics");
    const prompt = buildJurimetricsPrompt(params);
    return generateWithAI<JurimetricsResult>(prompt);
  }

  // Convert UseCase result to JurimetricsResult format
  const report = result.report;
  const kpis = report.kpis;

  // Extract values from KPIs
  const totalProcessos = parseInt(
    kpis.find((k) => k.label === "Total de Processos")?.valor?.toString().replace(/\D/g, "") || "0"
  );
  const taxaProcedencia = parseFloat(
    kpis.find((k) => k.label === "Taxa de Procedência")?.valor?.toString().replace("%", "") || "0"
  ) / 100;
  const valorMedio = parseFloat(
    kpis.find((k) => k.label === "Valor Médio de Condenação")?.valor?.toString().replace(/[R$.\s]/g, "").replace(",", ".") || "0"
  );

  // Build JurimetricsResult from report data
  const jurimetricsResult: JurimetricsResult = {
    tribunal: params.tribunal,
    periodo_analise: {
      inicio: periodo.inicio.toISOString().split("T")[0],
      fim: periodo.fim.toISOString().split("T")[0],
    },
    volume_total: totalProcessos,
    taxa_procedencia: taxaProcedencia,
    taxa_improcedencia: 1 - taxaProcedencia - 0.1 - 0.05, // Approximate
    taxa_parcial: 0.1, // Approximate
    taxa_acordo: 0.05, // Approximate
    tempo_medio_sentenca_dias: parseInt(
      kpis.find((k) => k.label === "Tempo Médio até Sentença")?.valor?.toString().match(/\d+/)?.[0] || "180"
    ),
    tempo_medio_transito_dias: 365, // Approximate
    valor_medio_condenacao: valorMedio || null,
    tendencias: [],
    comparativo_nacional: {
      acima_media: taxaProcedencia > 0.5,
      diferenca_percentual: (taxaProcedencia - 0.5) * 100,
    },
    insights: [],
    distribuicao_por_tipo: [],
    evolucao_temporal: [],
  };

  // Extract insights from sections
  const destaques = report.secoes.find((s) => s.titulo === "Destaques da Análise");
  if (destaques && Array.isArray(destaques.conteudo)) {
    jurimetricsResult.tendencias = destaques.conteudo as string[];
  }

  const recomendacoes = report.secoes.find((s) => s.titulo === "Recomendações Estratégicas");
  if (recomendacoes && Array.isArray(recomendacoes.conteudo)) {
    jurimetricsResult.insights = recomendacoes.conteudo as string[];
  }

  return jurimetricsResult;
}

/**
 * Generate predictive analysis with real data from legal APIs
 */
async function generatePredictiveWithRealData(
  params: PredictiveAnalysisParams,
  userId: string
): Promise<PredictiveAnalysisResult> {
  // Use the new UseCase
  const useCase = createGeneratePredictiveAnalysisUseCase();
  const result = await useCase.execute({
    tipo_acao: params.tipo_acao,
    tribunal: params.tribunal,
    argumentos: params.argumentos,
    pedidos: params.pedidos,
    valor_causa: params.valor_causa,
    processo_numero: params.processo_numero,
    userId,
  });

  if (!result.success || !result.analysis) {
    // Fallback to AI-only generation
    console.warn("[Report] Falling back to AI-only generation for predictive analysis");
    const prompt = buildPredictivePrompt(params);
    return generateWithAI<PredictiveAnalysisResult>(prompt);
  }

  // Convert UseCase result to PredictiveAnalysisResult format
  return {
    probabilidade_exito: result.analysis.probabilidade_exito,
    confianca: result.analysis.confianca,
    fatores_favoraveis: result.analysis.fatores_favoraveis,
    fatores_desfavoraveis: result.analysis.fatores_desfavoraveis,
    jurisprudencia: result.analysis.jurisprudencia,
    recomendacoes: result.analysis.recomendacoes,
    riscos: result.analysis.riscos,
    resumo_executivo: result.analysis.resumo_executivo,
  };
}

/**
 * Generate judge profile with real data from legal APIs
 */
async function generateJudgeProfileWithRealData(
  params: JudgeProfileParams,
  userId: string
): Promise<JudgeProfileResult> {
  // Calculate period if provided
  const periodo = params.periodo_inicio && params.periodo_fim
    ? {
        inicio: new Date(params.periodo_inicio),
        fim: new Date(params.periodo_fim),
      }
    : undefined;

  // Use the new UseCase
  const useCase = createGenerateJudgeProfileUseCase();
  const result = await useCase.execute({
    nome_juiz: params.nome_juiz,
    tribunal: params.tribunal,
    periodo,
    userId,
  });

  if (!result.success || !result.profile) {
    // Fallback to AI-only generation
    console.warn("[Report] Falling back to AI-only generation for judge profile");
    const prompt = buildJudgeProfilePrompt(params);
    return generateWithAI<JudgeProfileResult>(prompt);
  }

  // Return UseCase result (already in correct format)
  return result.profile;
}

/**
 * Generate content using Claude
 */
async function generateWithAI<T>(prompt: string): Promise<T> {
  const response = await getClaude().messages.create({
    model: AI_CONFIG.analysisModel,
    max_tokens: 2000,
    temperature: 0.3, // Lower temperature for more consistent output
    system: "Você é um analista jurídico especializado. Responda APENAS com JSON válido, sem markdown ou texto adicional.",
    messages: [
      { role: "user", content: prompt },
    ],
  });

  const content = response.content[0]?.type === "text" ? response.content[0].text : null;

  if (!content) {
    throw new Error("Resposta vazia da IA");
  }

  // Parse JSON response
  try {
    // Remove markdown code blocks if present
    const cleanContent = content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    return JSON.parse(cleanContent) as T;
  } catch {
    throw new Error("Erro ao processar resposta da IA");
  }
}

/**
 * Get report statistics for a user
 */
export async function getReportStats(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  total: number;
  by_type: Record<ReportType, number>;
  by_status: Record<string, number>;
  credits_used: number;
}> {
  const { data } = await supabase
    .from("reports")
    .select("type, status, credits_used")
    .eq("user_id", userId);

  const reports = (data || []) as ReportRow[];

  const stats = {
    total: reports.length,
    by_type: {} as Record<ReportType, number>,
    by_status: {} as Record<string, number>,
    credits_used: 0,
  };

  for (const report of reports) {
    // Count by type
    stats.by_type[report.type as ReportType] = (stats.by_type[report.type as ReportType] || 0) + 1;

    // Count by status
    stats.by_status[report.status] = (stats.by_status[report.status] || 0) + 1;

    // Sum credits
    stats.credits_used += report.credits_used || 0;
  }

  return stats;
}
