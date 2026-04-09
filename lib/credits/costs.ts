/**
 * Tabela centralizada de custos de créditos do Juriscan.
 *
 * IMPORTANTE: Alterar custos APENAS neste arquivo.
 * Todos os outros arquivos devem importar daqui.
 */

// ===== CHAT =====
export const CHAT_COSTS = {
  /** Mensagem de texto simples (chat_simple) */
  text_message: 5,
  /** Mensagem com imagem (texto + análise de imagem) */
  with_image: 7,
  /** Mensagem com documento PDF/DOC (analysis_pdf) */
  with_document: 7,
  /** Mensagem com áudio (texto + transcrição Whisper) */
  with_audio: 7,
  /** Transcrição de áudio avulsa (sem mensagem de chat) */
  audio_transcription: 1,
} as const;

// ===== RELATÓRIOS =====
export const REPORT_COSTS = {
  /** Relatório padrão em PDF */
  PREDICTIVE_ANALYSIS: 5,
  /** Jurimetria avançada */
  JURIMETRICS: 5,
  /** Perfil do relator */
  RELATOR_PROFILE: 3,
  /** Resumo executivo */
  EXECUTIVE_SUMMARY: 3,
  /** Relatório customizado */
  CUSTOM: 3,
} as const;

// ===== EXPORTAÇÃO =====
export const EXPORT_COSTS = {
  pdf: 0,
  txt: 0,
} as const;

// ===== ANÁLISES =====
export const ANALYSIS_COSTS = {
  general: 2,
} as const;

// ===== TIPOS DE TRANSAÇÃO (match DB enum transaction_type) =====
export type TransactionType =
  | "CREDIT_PURCHASE"
  | "MONTHLY_ALLOCATION"
  | "ANALYSIS_DEBIT"
  | "REPORT_DEBIT"
  | "REFUND"
  | "ADJUSTMENT";

/**
 * Calcula custo de uma mensagem de chat com base nos attachments.
 */
export function calculateChatCost(attachments: { type: string }[]): number {
  if (attachments.length === 0) {
    return CHAT_COSTS.text_message;
  }

  let cost = CHAT_COSTS.text_message;

  for (const att of attachments) {
    switch (att.type) {
      case "image":
        cost += CHAT_COSTS.with_image - CHAT_COSTS.text_message;
        break;
      case "file":
        cost += CHAT_COSTS.with_document - CHAT_COSTS.text_message;
        break;
      case "audio":
        cost += CHAT_COSTS.with_audio - CHAT_COSTS.text_message;
        break;
    }
  }

  return cost;
}

/**
 * Retorna o custo de geração de um relatório pelo tipo.
 */
export function getReportCost(reportType: string): number {
  return (REPORT_COSTS as Record<string, number>)[reportType] ?? REPORT_COSTS.CUSTOM;
}
