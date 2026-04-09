/**
 * Generate Judge Profile Use Case
 * Gera perfil de magistrado com dados reais e análise por IA
 */

import { getClaude, AI_CONFIG } from '@/lib/ai/config';
import { getLegalDataGateway } from '@/src/infrastructure/gateways/LegalDataGateway';
import { Juiz, JurimetricsData } from '@/src/domain/entities';

/**
 * Parâmetros de entrada
 */
export interface GenerateJudgeProfileInput {
  /** Nome do magistrado */
  nome_juiz: string;
  /** Tribunal (ex: TJSP, TRT2) */
  tribunal: string;
  /** Período de análise (opcional - padrão últimos 2 anos) */
  periodo?: {
    inicio: Date;
    fim: Date;
  };
  /** ID do usuário */
  userId?: string;
}

/**
 * Tipo de caso frequente
 */
export interface TipoCasoFrequente {
  tipo: string;
  percentual: number;
}

/**
 * Resultado do perfil do magistrado
 */
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
    taxa_improcedencia: number;
    taxa_parcial: number;
    taxa_acordo: number;
    taxa_reforma: number;
    tempo_medio_decisao_dias: number;
  };
  tendencias: {
    favorece: 'autor' | 'reu' | 'neutro';
    intensidade: 'forte' | 'moderada' | 'leve';
    descricao: string;
  };
  tipos_caso_frequentes: TipoCasoFrequente[];
  padroes_identificados: string[];
  doutrina_citada: string[];
  recomendacoes_estrategicas: string[];
  resumo_executivo: string;
}

/**
 * Resultado do use case
 */
export interface GenerateJudgeProfileOutput {
  success: boolean;
  profile?: JudgeProfileResult;
  error?: string;
  metadata: {
    generated_at: string;
    processing_time_ms: number;
    data_source: string;
    ai_model: string;
  };
}

/**
 * Generate Judge Profile Use Case
 */
export class GenerateJudgeProfileUseCase {
  /**
   * Executa o use case
   */
  async execute(input: GenerateJudgeProfileInput): Promise<GenerateJudgeProfileOutput> {
    const startTime = Date.now();

    try {
      console.log('👨‍⚖️ [JudgeProfile] Iniciando análise de perfil:', {
        nome: input.nome_juiz,
        tribunal: input.tribunal,
      });

      const gateway = getLegalDataGateway();

      // Período padrão: últimos 2 anos
      const now = new Date();
      const twoYearsAgo = new Date(now);
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

      const periodo = input.periodo || {
        inicio: twoYearsAgo,
        fim: now,
      };

      // 1. Tentar buscar perfil direto do gateway
      let juizData: Juiz | null = null;
      let jurimetrics: JurimetricsData | null = null;

      try {
        juizData = await gateway.getJudgeProfile(input.nome_juiz, input.tribunal);
        if (juizData) {
          console.log('✅ [JudgeProfile] Dados do juiz obtidos do provider');
        }
      } catch (error) {
        console.warn('⚠️ [JudgeProfile] Perfil não encontrado no provider:', error);
      }

      // 2. Buscar jurimetria geral do tribunal para contexto
      try {
        jurimetrics = await gateway.getJurimetrics({
          tribunal: input.tribunal,
          periodo,
        });
        console.log('✅ [JudgeProfile] Dados jurimétricos do tribunal obtidos');
      } catch (error) {
        console.warn('⚠️ [JudgeProfile] Erro ao obter jurimetria:', error);
      }

      // 3. Gerar perfil com IA
      const profile = await this.generateProfile(input, juizData, jurimetrics, periodo);

      const processingTime = Date.now() - startTime;
      console.log(`✅ [JudgeProfile] Perfil gerado em ${processingTime}ms`);

      return {
        success: true,
        profile,
        metadata: {
          generated_at: new Date().toISOString(),
          processing_time_ms: processingTime,
          data_source: juizData ? gateway.getActiveProviders().join(', ') : 'ai-analysis',
          ai_model: AI_CONFIG.model,
        },
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('❌ [JudgeProfile] Erro:', error);

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
   * Gera perfil do magistrado usando IA + dados disponíveis
   */
  private async generateProfile(
    input: GenerateJudgeProfileInput,
    juizData: Juiz | null,
    jurimetrics: JurimetricsData | null,
    periodo: { inicio: Date; fim: Date }
  ): Promise<JudgeProfileResult> {
    const claude = getClaude();

    // Construir contexto com dados disponíveis
    const dataContext = this.buildDataContext(juizData, jurimetrics, input.tribunal, periodo);

    const prompt = `Você é um especialista em análise de perfis de magistrados brasileiros. Analise o seguinte magistrado e forneça um perfil detalhado.

## DADOS DO MAGISTRADO

**Nome:** ${input.nome_juiz}
**Tribunal:** ${input.tribunal}
**Período de Análise:** ${periodo.inicio.toLocaleDateString('pt-BR')} a ${periodo.fim.toLocaleDateString('pt-BR')}

## DADOS DISPONÍVEIS
${dataContext}

## INSTRUÇÕES

Gere um perfil completo do magistrado considerando:
1. Padrões de decisão e tendências
2. Tempo médio para proferir decisões
3. Tipos de casos mais frequentes
4. Posicionamentos doutrinários identificáveis
5. Recomendações estratégicas para advogados

${!juizData ? 'NOTA: Dados específicos do magistrado não disponíveis. Forneça análise baseada em conhecimento geral sobre magistrados deste tribunal e tipo de vara.' : ''}

Responda APENAS com JSON válido no seguinte formato:
{
  "magistrado": {
    "nome": "${input.nome_juiz}",
    "tribunal": "${input.tribunal}",
    "vara_camara": "<vara ou câmara se identificável>",
    "tempo_atuacao_anos": <número estimado>
  },
  "estatisticas": {
    "total_decisoes": <número>,
    "taxa_procedencia": <0-100>,
    "taxa_improcedencia": <0-100>,
    "taxa_parcial": <0-100>,
    "taxa_acordo": <0-100>,
    "taxa_reforma": <0-100>,
    "tempo_medio_decisao_dias": <número>
  },
  "tendencias": {
    "favorece": "<autor|reu|neutro>",
    "intensidade": "<forte|moderada|leve>",
    "descricao": "<descrição da tendência>"
  },
  "tipos_caso_frequentes": [
    {"tipo": "tipo1", "percentual": 30},
    {"tipo": "tipo2", "percentual": 25}
  ],
  "padroes_identificados": ["padrão1", "padrão2", ...],
  "doutrina_citada": ["autor1", "autor2", ...],
  "recomendacoes_estrategicas": ["recomendação1", "recomendação2", ...],
  "resumo_executivo": "Análise completa em 2-3 parágrafos"
}`;

    const response = await claude.messages.create({
      model: AI_CONFIG.analysisModel,
      temperature: 0.5,
      max_tokens: 2500,
      system: 'Você é um analista jurídico especializado em perfis de magistrados. Responda APENAS com JSON válido.',
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

    // Enriquecer com dados reais se disponíveis
    if (juizData) {
      aiResult.magistrado.nome = juizData.nome;
      aiResult.magistrado.tribunal = juizData.tribunal_sigla;
      if (juizData.vara) {
        aiResult.magistrado.vara_camara = juizData.vara;
      } else if (juizData.camara) {
        aiResult.magistrado.vara_camara = juizData.camara;
      }
      if (juizData.perfil) {
        aiResult.estatisticas.total_decisoes = juizData.perfil.total_decisoes;
        aiResult.estatisticas.taxa_procedencia = juizData.perfil.taxas.procedencia * 100;
        aiResult.estatisticas.taxa_improcedencia = juizData.perfil.taxas.improcedencia * 100;
        aiResult.estatisticas.taxa_parcial = juizData.perfil.taxas.parcial_procedencia * 100;
        aiResult.estatisticas.taxa_acordo = juizData.perfil.taxas.acordo * 100;
        aiResult.estatisticas.taxa_reforma = juizData.perfil.taxas.reforma * 100;
        aiResult.estatisticas.tempo_medio_decisao_dias = juizData.perfil.tempo_medio_decisao_dias;
        aiResult.magistrado.tempo_atuacao_anos = juizData.perfil.tempo_atuacao_anos;
      }
    }

    return aiResult as JudgeProfileResult;
  }

  /**
   * Constrói contexto com dados disponíveis
   */
  private buildDataContext(
    juizData: Juiz | null,
    jurimetrics: JurimetricsData | null,
    tribunal: string,
    periodo: { inicio: Date; fim: Date }
  ): string {
    let context = '';

    if (juizData) {
      context += `### Dados do Magistrado (fonte: DataJud)
**Nome Completo:** ${juizData.nome}
**Tribunal:** ${juizData.tribunal_sigla}
${juizData.vara ? `**Vara/Câmara:** ${juizData.vara}` : juizData.camara ? `**Câmara:** ${juizData.camara}` : ''}
`;

      if (juizData.perfil) {
        context += `
**Estatísticas:**
- Total de decisões: ${juizData.perfil.total_decisoes}
- Taxa de procedência: ${(juizData.perfil.taxas.procedencia * 100).toFixed(1)}%
- Tempo médio para decisão: ${juizData.perfil.tempo_medio_decisao_dias} dias
`;
      }

      if (juizData.formacao?.especializacoes && juizData.formacao.especializacoes.length > 0) {
        context += `**Especializações:** ${juizData.formacao.especializacoes.join(', ')}\n`;
      }
    } else {
      context += `### Dados do Magistrado
Dados específicos não disponíveis no sistema. Análise baseada em contexto geral.
`;
    }

    if (jurimetrics) {
      context += `
### Estatísticas Gerais do ${tribunal} (${periodo.inicio.toLocaleDateString('pt-BR')} - ${periodo.fim.toLocaleDateString('pt-BR')})
- Total de processos: ${jurimetrics.metricas.total_processos.toLocaleString('pt-BR')}
- Taxa média de procedência: ${(jurimetrics.metricas.taxas.procedencia * 100).toFixed(1)}%
- Taxa média de acordo: ${(jurimetrics.metricas.taxas.acordo * 100).toFixed(1)}%
- Tempo médio até sentença: ${jurimetrics.metricas.tempos.distribuicao_sentenca_dias} dias

Use estas estatísticas do tribunal como referência para comparação.
`;
    }

    return context || 'Nenhum dado específico disponível. Forneça análise baseada em conhecimento jurídico geral.';
  }
}

/**
 * Factory function
 */
export function createGenerateJudgeProfileUseCase(): GenerateJudgeProfileUseCase {
  return new GenerateJudgeProfileUseCase();
}
