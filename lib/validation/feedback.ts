import { z } from "zod";

export const betaFeedbackSchema = z.object({
  nps_score: z.number().int().min(0).max(10),
  rating_chat_ia: z.number().int().min(1).max(5).nullable().optional(),
  rating_analise_pdf: z.number().int().min(1).max(5).nullable().optional(),
  rating_relatorios: z.number().int().min(1).max(5).nullable().optional(),
  rating_jurimetria: z.number().int().min(1).max(5).nullable().optional(),
  rating_interface: z.number().int().min(1).max(5).nullable().optional(),
  rating_velocidade: z.number().int().min(1).max(5).nullable().optional(),
  feature_mais_util: z.string().max(1000).optional().default(""),
  feature_menos_util: z.string().max(1000).optional().default(""),
  feature_faltando: z.string().max(1000).optional().default(""),
  ia_qualidade: z.enum(["excelente", "boa", "regular", "ruim", "pessima"]).nullable().optional(),
  ia_precisao: z.enum(["muito_precisa", "precisa", "razoavel", "imprecisa", "muito_imprecisa"]).nullable().optional(),
  ia_comparacao: z.string().max(2000).optional().default(""),
  facilidade_uso: z.enum(["muito_facil", "facil", "neutro", "dificil", "muito_dificil"]).nullable().optional(),
  primeiro_uso_intuitivo: z.boolean().nullable().optional(),
  preco_justo: z.enum(["barato", "justo", "caro", "muito_caro"]).nullable().optional(),
  plano_interesse: z.enum(["free", "starter", "pro", "business", "nenhum"]).nullable().optional(),
  valor_max_mensal: z.number().int().min(0).max(10000).nullable().optional(),
  area_juridica: z.string().max(100).nullable().optional(),
  tamanho_escritorio: z.enum(["solo", "2_5", "6_15", "16_50", "50_plus"]).nullable().optional(),
  ponto_forte: z.string().max(2000).optional().default(""),
  ponto_fraco: z.string().max(2000).optional().default(""),
  sugestao_melhoria: z.string().max(2000).optional().default(""),
  depoimento: z.string().max(3000).optional().default(""),
  permite_depoimento: z.boolean().optional().default(false),
});

export type BetaFeedbackInput = z.infer<typeof betaFeedbackSchema>;
