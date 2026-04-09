// Report Types for Juriscan

export type ReportType =
  | "PREDICTIVE_ANALYSIS"
  | "JURIMETRICS"
  | "EXECUTIVE_SUMMARY"
  | "RELATOR_PROFILE"
  | "CUSTOM";

export type ReportStatus = "DRAFT" | "GENERATING" | "COMPLETED" | "FAILED";

export interface Report {
  id: string;
  user_id: string;
  analysis_id: string | null;
  title: string;
  type: ReportType;
  version: string;
  content: ReportContent | null;
  file_url: string | null;
  file_size: number | null;
  page_count: number | null;
  credits_used: number;
  status: ReportStatus;
  created_at: string;
  updated_at: string;
  generated_at: string | null;
}

// Report content structures based on type
export interface ReportContent {
  summary?: string;
  sections?: ReportSection[];
  metadata?: Record<string, unknown>;
}

export interface ReportSection {
  id: string;
  title: string;
  content: string;
  order: number;
  type: "text" | "chart" | "table" | "recommendation";
  data?: unknown;
}

// Predictive Analysis specific types
export interface PredictiveAnalysisParams {
  tipo_acao: string;
  tribunal: string;
  argumentos: string;
  pedidos: string;
  valor_causa?: number;
  processo_numero?: string;
}

export interface PredictiveAnalysisResult {
  probabilidade_exito: number;
  confianca: "alta" | "media" | "baixa";
  fatores_favoraveis: string[];
  fatores_desfavoraveis: string[];
  jurisprudencia: JurisprudenciaItem[];
  recomendacoes: string[];
  riscos: string[];
  resumo_executivo: string;
}

export interface JurisprudenciaItem {
  tribunal: string;
  numero: string;
  resumo: string;
  relevancia?: number;
}

// Jurimetrics specific types
export interface JurimetricsParams {
  tribunal: string;
  vara?: string;
  tipo_acao?: string;
  periodo_inicio?: string;
  periodo_fim?: string;
}

export interface JurimetricsResult {
  tribunal: string;
  periodo_analise: {
    inicio: string;
    fim: string;
  };
  volume_total: number;
  taxa_procedencia: number;
  taxa_improcedencia: number;
  taxa_parcial: number;
  taxa_acordo: number;
  tempo_medio_sentenca_dias: number;
  tempo_medio_transito_dias: number;
  valor_medio_condenacao: number | null;
  tendencias: string[];
  comparativo_nacional: {
    acima_media: boolean;
    diferenca_percentual: number;
  };
  insights: string[];
  distribuicao_por_tipo?: ChartData[];
  evolucao_temporal?: ChartData[];
}

export interface ChartData {
  label: string;
  value: number;
  color?: string;
}

// Judge Profile specific types
export interface JudgeProfileParams {
  nome_juiz: string;
  tribunal: string;
  periodo_inicio?: string;
  periodo_fim?: string;
}

export interface JudgeProfileResult {
  magistrado: {
    nome: string;
    tribunal: string;
    vara_camara: string;
    tempo_atuacao_anos: number;
  };
  estatisticas: {
    total_decisoes: number;
    taxa_procedencia: number;
    taxa_reforma: number;
    tempo_medio_decisao_dias: number;
  };
  tendencias: {
    favorece: "autor" | "reu" | "neutro";
    intensidade: "forte" | "moderada" | "leve";
  };
  tipos_caso_frequentes: Array<{
    tipo: string;
    percentual: number;
  }>;
  padroes_identificados: string[];
  doutrina_citada: string[];
  recomendacoes_estrategicas: string[];
}

// Create Report input
export interface CreateReportInput {
  type: ReportType;
  title: string;
  parameters: PredictiveAnalysisParams | JurimetricsParams | JudgeProfileParams;
}

// Report type metadata for UI
export const REPORT_TYPE_INFO: Record<ReportType, {
  label: string;
  description: string;
  icon: string;
  color: string;
}> = {
  PREDICTIVE_ANALYSIS: {
    label: "Análise Preditiva",
    description: "Previsão de êxito com análise de riscos e recomendações",
    icon: "Brain",
    color: "blue",
  },
  JURIMETRICS: {
    label: "Jurimetria",
    description: "Estatísticas por tribunal, vara e tipo de ação",
    icon: "BarChart3",
    color: "purple",
  },
  RELATOR_PROFILE: {
    label: "Perfil de Relator",
    description: "Análise do histórico de decisões do magistrado",
    icon: "Users",
    color: "green",
  },
  EXECUTIVE_SUMMARY: {
    label: "Resumo Executivo",
    description: "Síntese completa com todos os tipos de análise",
    icon: "FileText",
    color: "amber",
  },
  CUSTOM: {
    label: "Personalizado",
    description: "Relatório customizado conforme necessidade",
    icon: "Settings",
    color: "gray",
  },
};
