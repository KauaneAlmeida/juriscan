/**
 * Generate Predictive Analysis Use Case
 * Gera análise preditiva de casos com dados reais e IA
 */

import { getClaude, AI_CONFIG } from '@/lib/ai/config';
import { getLegalDataGateway } from '@/src/infrastructure/gateways/LegalDataGateway';
import { JurimetricsData } from '@/src/domain/entities';

/**
 * Parâmetros de entrada
 */
export interface GeneratePredictiveAnalysisInput {
  /** Tipo da ação (ex: "Reclamação Trabalhista", "Ação de Cobrança") */
  tipo_acao: string;
  /** Tribunal (ex: TJSP, TRT2) */
  tribunal: string;
  /** Argumentos principais do caso */
  argumentos: string;
  /** Pedidos da parte */
  pedidos: string;
  /** Valor da causa (opcional) */
  valor_causa?: number;
  /** Número do processo se já existente (opcional) */
  processo_numero?: string;
  /** ID do usuário */
  userId?: string;
}

/**
 * Item de jurisprudência encontrada
 */
export interface JurisprudenciaItem {
  tribunal: string;
  numero: string;
  resumo: string;
  relevancia: number;
}

/**
 * Resultado da análise preditiva
 */
export interface PredictiveAnalysisResult {
  probabilidade_exito: number;
  confianca: 'alta' | 'media' | 'baixa';
  fatores_favoraveis: string[];
  fatores_desfavoraveis: string[];
  jurisprudencia: JurisprudenciaItem[];
  recomendacoes: string[];
  riscos: string[];
  resumo_executivo: string;
  dados_base: {
    total_processos_analisados: number;
    taxa_procedencia_historica: number;
    tempo_medio_tramitacao_dias: number;
    valor_medio_condenacao: number | null;
    periodo_analise: string;
  };
}

/**
 * Resultado do use case
 */
export interface GeneratePredictiveAnalysisOutput {
  success: boolean;
  analysis?: PredictiveAnalysisResult;
  error?: string;
  metadata: {
    generated_at: string;
    processing_time_ms: number;
    data_source: string;
    ai_model: string;
  };
}

/**
 * Generate Predictive Analysis Use Case
 */
export class GeneratePredictiveAnalysisUseCase {
  /**
   * Executa o use case
   */
  async execute(input: GeneratePredictiveAnalysisInput): Promise<GeneratePredictiveAnalysisOutput> {
    const startTime = Date.now();

    try {
      console.log('🔮 [PredictiveAnalysis] Iniciando análise preditiva:', {
        tipo_acao: input.tipo_acao,
        tribunal: input.tribunal,
      });

      // 1. Buscar dados de jurimetria para o tipo de ação
      const gateway = getLegalDataGateway();

      // Período padrão: últimos 2 anos
      const now = new Date();
      const twoYearsAgo = new Date(now);
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

      let jurimetrics: JurimetricsData | null = null;

      try {
        jurimetrics = await gateway.getJurimetrics({
          tribunal: input.tribunal,
          classe: input.tipo_acao,
          periodo: {
            inicio: twoYearsAgo,
            fim: now,
          },
        });
        console.log('✅ [PredictiveAnalysis] Dados jurimétricos obtidos:', {
          total_processos: jurimetrics.metricas.total_processos,
        });
      } catch (error) {
        console.warn('⚠️ [PredictiveAnalysis] Erro ao obter jurimetria, usando análise sem dados:', error);
      }

      // 2. Gerar análise com IA
      const analysis = await this.generateAnalysis(input, jurimetrics);

      const processingTime = Date.now() - startTime;
      console.log(`✅ [PredictiveAnalysis] Análise gerada em ${processingTime}ms`);

      return {
        success: true,
        analysis,
        metadata: {
          generated_at: new Date().toISOString(),
          processing_time_ms: processingTime,
          data_source: jurimetrics ? gateway.getActiveProviders().join(', ') : 'ai-only',
          ai_model: AI_CONFIG.model,
        },
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('❌ [PredictiveAnalysis] Erro:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        metadata: {
          generated_at: new Date().toISOString(),
          processing_time_ms: processingTime,
          data_source: 'none',
          ai_model: AI_CONFIG.model,
        },
      };
    }
  }

  /**
   * Gera análise preditiva usando IA + dados reais
   */
  private async generateAnalysis(
    input: GeneratePredictiveAnalysisInput,
    jurimetrics: JurimetricsData | null
  ): Promise<PredictiveAnalysisResult> {
    const claude = getClaude();

    // Construir contexto com dados reais (se disponíveis)
    const dataContext = jurimetrics
      ? this.buildDataContext(jurimetrics)
      : 'Dados estatísticos não disponíveis. Análise baseada apenas em conhecimento jurídico.';

    // Calcular probabilidade base dos dados
    const baseProbability = jurimetrics
      ? jurimetrics.metricas.taxas.procedencia + (jurimetrics.metricas.taxas.parcial_procedencia * 0.5)
      : null;

    const prompt = `Você é um especialista em análise preditiva jurídica. Analise o seguinte caso e forneça uma previsão detalhada.

## DADOS DO CASO

**Tribunal:** ${input.tribunal}
**Tipo de Ação:** ${input.tipo_acao}
**Argumentos:** ${input.argumentos}
**Pedidos:** ${input.pedidos}
${input.valor_causa ? `**Valor da Causa:** R$ ${input.valor_causa.toLocaleString('pt-BR')}` : ''}
${input.processo_numero ? `**Número do Processo:** ${input.processo_numero}` : ''}

## DADOS ESTATÍSTICOS REAIS
${dataContext}

${baseProbability !== null ? `**Probabilidade Base (dados históricos):** ${(baseProbability * 100).toFixed(1)}%` : ''}

## INSTRUÇÕES

Analise o caso considerando:
1. Os dados estatísticos reais fornecidos (taxa de procedência, tempos, valores)
2. A qualidade dos argumentos apresentados
3. A viabilidade dos pedidos
4. Jurisprudência aplicável ao caso
5. Riscos processuais

Responda APENAS com JSON válido no seguinte formato:
{
  "probabilidade_exito": <número 0-100>,
  "confianca": "<alta|media|baixa>",
  "fatores_favoraveis": ["fator1", "fator2", ...],
  "fatores_desfavoraveis": ["fator1", "fator2", ...],
  "jurisprudencia": [
    {"tribunal": "STJ", "numero": "REsp XXXX", "resumo": "...", "relevancia": 0.9}
  ],
  "recomendacoes": ["recomendação1", "recomendação2", ...],
  "riscos": ["risco1", "risco2", ...],
  "resumo_executivo": "Análise completa em 2-3 parágrafos"
}`;

    const response = await claude.messages.create({
      model: AI_CONFIG.analysisModel,
      temperature: 0.5,
      max_tokens: 2500,
      system: 'Você é um analista jurídico especializado em jurimetria e análise preditiva. Responda APENAS com JSON válido.',
      messages: [
        { role: 'user', content: prompt },
      ],
    });

    const content = response.content[0]?.type === 'text' ? response.content[0].text : null;
    if (!content) {
      throw new Error('Resposta vazia da IA');
    }

    // Parse e validar resposta
    const cleanContent = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const aiResult = JSON.parse(cleanContent);

    // Ajustar probabilidade com dados reais se disponíveis
    let finalProbability = aiResult.probabilidade_exito;
    if (baseProbability !== null) {
      // Média ponderada: 60% dados reais, 40% análise IA
      finalProbability = Math.round(
        (baseProbability * 100 * 0.6) + (aiResult.probabilidade_exito * 0.4)
      );
    }

    // Determinar confiança baseada na disponibilidade de dados
    let confianca: 'alta' | 'media' | 'baixa' = aiResult.confianca;
    if (!jurimetrics) {
      confianca = confianca === 'alta' ? 'media' : 'baixa';
    }

    return {
      probabilidade_exito: finalProbability,
      confianca,
      fatores_favoraveis: aiResult.fatores_favoraveis || [],
      fatores_desfavoraveis: aiResult.fatores_desfavoraveis || [],
      jurisprudencia: aiResult.jurisprudencia || [],
      recomendacoes: aiResult.recomendacoes || [],
      riscos: aiResult.riscos || [],
      resumo_executivo: aiResult.resumo_executivo || '',
      dados_base: {
        total_processos_analisados: jurimetrics?.metricas.total_processos || 0,
        taxa_procedencia_historica: jurimetrics
          ? jurimetrics.metricas.taxas.procedencia * 100
          : 0,
        tempo_medio_tramitacao_dias: jurimetrics?.metricas.tempos.distribuicao_sentenca_dias || 0,
        valor_medio_condenacao: jurimetrics?.metricas.valores.media_condenacao || null,
        periodo_analise: jurimetrics
          ? `${jurimetrics.periodo.inicio.toLocaleDateString('pt-BR')} a ${jurimetrics.periodo.fim.toLocaleDateString('pt-BR')}`
          : 'N/A',
      },
    };
  }

  /**
   * Constrói contexto com dados reais para a IA
   */
  private buildDataContext(data: JurimetricsData): string {
    const { metricas, periodo } = data;

    return `### Estatísticas do ${data.escopo.tribunal || 'Tribunal'} (${periodo.inicio.toLocaleDateString('pt-BR')} a ${periodo.fim.toLocaleDateString('pt-BR')})

**Volume:** ${metricas.total_processos.toLocaleString('pt-BR')} processos analisados

**Taxas de Resultado:**
- Procedência total: ${(metricas.taxas.procedencia * 100).toFixed(1)}%
- Procedência parcial: ${(metricas.taxas.parcial_procedencia * 100).toFixed(1)}%
- Improcedência: ${(metricas.taxas.improcedencia * 100).toFixed(1)}%
- Acordo: ${(metricas.taxas.acordo * 100).toFixed(1)}%

**Tempos Médios:**
- Até sentença: ${metricas.tempos.distribuicao_sentenca_dias} dias
- Tramitação total: ${metricas.tempos.total_tramitacao_dias} dias

**Valores:**
- Média de condenação: R$ ${metricas.valores.media_condenacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Mediana: R$ ${metricas.valores.mediana_condenacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  }
}

/**
 * Factory function
 */
export function createGeneratePredictiveAnalysisUseCase(): GeneratePredictiveAnalysisUseCase {
  return new GeneratePredictiveAnalysisUseCase();
}
