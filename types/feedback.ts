export interface BetaFeedback {
  id: string;
  user_id: string;
  nps_score: number;
  rating_chat_ia: number | null;
  rating_analise_pdf: number | null;
  rating_relatorios: number | null;
  rating_jurimetria: number | null;
  rating_interface: number | null;
  rating_velocidade: number | null;
  feature_mais_util: string | null;
  feature_menos_util: string | null;
  feature_faltando: string | null;
  ia_qualidade: string | null;
  ia_precisao: string | null;
  ia_comparacao: string | null;
  facilidade_uso: string | null;
  primeiro_uso_intuitivo: boolean | null;
  preco_justo: string | null;
  plano_interesse: string | null;
  valor_max_mensal: number | null;
  area_juridica: string | null;
  tamanho_escritorio: string | null;
  ponto_forte: string | null;
  ponto_fraco: string | null;
  sugestao_melhoria: string | null;
  depoimento: string | null;
  permite_depoimento: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeedbackFormData {
  // Step 1
  nps_score: number | null;
  rating_interface: number | null;
  facilidade_uso: string | null;
  primeiro_uso_intuitivo: boolean | null;
  // Step 2
  rating_chat_ia: number | null;
  rating_analise_pdf: number | null;
  rating_relatorios: number | null;
  rating_jurimetria: number | null;
  rating_velocidade: number | null;
  feature_mais_util: string;
  feature_menos_util: string;
  feature_faltando: string;
  // Step 3
  ia_qualidade: string | null;
  ia_precisao: string | null;
  ia_comparacao: string;
  // Step 4
  preco_justo: string | null;
  plano_interesse: string | null;
  valor_max_mensal: number | null;
  area_juridica: string | null;
  tamanho_escritorio: string | null;
  // Step 5
  ponto_forte: string;
  ponto_fraco: string;
  sugestao_melhoria: string;
  depoimento: string;
  permite_depoimento: boolean;
}

export interface FeedbackStats {
  totalResponses: number;
  npsScore: number;
  npsBreakdown: { promoters: number; passives: number; detractors: number };
  avgRatings: {
    chat_ia: number | null;
    analise_pdf: number | null;
    relatorios: number | null;
    jurimetria: number | null;
    interface: number | null;
    velocidade: number | null;
  };
  pricingDistribution: Record<string, number>;
  planDistribution: Record<string, number>;
  iaQualidadeDistribution: Record<string, number>;
  iaPrecisaoDistribution: Record<string, number>;
  avgValorMensal: number | null;
  authorizedTestimonials: Array<{
    depoimento: string;
    user_name: string;
    area_juridica: string | null;
    created_at: string;
  }>;
}
