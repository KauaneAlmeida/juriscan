/**
 * AnalyzeCaseUseCase
 * Analisa mensagens do chat, extrai entidades e enriquece com dados jurídicos reais
 */

import {
  LegalDataGateway,
  getLegalDataGateway,
  UnifiedSearchResult,
} from '@/src/infrastructure/gateways/LegalDataGateway';

/**
 * Entidades extraídas da mensagem
 */
export interface ExtractedEntities {
  /** Tribunal mencionado (TJSP, TRT2, STJ, etc.) */
  tribunal?: string;
  /** Número do processo */
  numero_processo?: string;
  /** Tipo de ação/procedimento */
  tipo_acao?: string;
  /** Matéria jurídica */
  materia?: string;
  /** Nome de parte */
  parte?: string;
  /** Valor mencionado */
  valor?: number;
  /** Período para análise */
  periodo?: {
    inicio: Date;
    fim: Date;
  };
  /** Palavras-chave jurídicas encontradas */
  keywords: string[];
  /** Score de confiança (0-1) */
  confianca: number;
}

/**
 * Contexto enriquecido para a IA
 */
export interface EnrichedContext {
  /** Mensagem original */
  mensagem: string;
  /** Entidades extraídas */
  entidades: ExtractedEntities;
  /** Dados jurídicos obtidos */
  dados_juridicos?: {
    processos_encontrados: number;
    jurisprudencias_encontradas: number;
    jurimetria?: {
      total_processos: number;
      taxa_procedencia: string;
      tempo_medio_dias: number;
      valor_medio_condenacao?: number;
    };
    resumo: string;
  };
  /** Contexto formatado para o prompt */
  contexto_prompt: string;
}

/**
 * Input do use case
 */
export interface AnalyzeCaseInput {
  mensagem: string;
  userId: string;
  conversationId?: string;
}

/**
 * Output do use case
 */
export interface AnalyzeCaseOutput {
  contexto: EnrichedContext;
  dados_utilizados: {
    fonte: string[];
    processos_analisados: number;
    jurisprudencias: number;
    tempo_busca_ms: number;
  };
  deve_usar_dados: boolean;
}

/**
 * Padrões de regex para extração de entidades
 */
const PATTERNS = {
  // Tribunais
  TRIBUNAL: /\b(TJSP|TJRJ|TJMG|TJRS|TJPR|TJSC|TJBA|TJPE|TJCE|TJGO|TJDFT|TRT\d{1,2}|TRF\d|STJ|STF|TST|TSE)\b/gi,

  // Número de processo CNJ
  NUMERO_PROCESSO: /\d{7}-?\d{2}\.?\d{4}\.?\d\.?\d{2}\.?\d{4}/g,

  // Valores monetários
  VALOR: /R\$\s*[\d.,]+(?:\s*(?:mil|milhão|milhões|reais))?/gi,

  // Anos
  ANO: /\b(19|20)\d{2}\b/g,

  // OAB
  OAB: /OAB[\/\-\s]*[A-Z]{2}\s*\d{1,7}/gi,
};

/**
 * Palavras-chave por área do direito
 */
const KEYWORDS_BY_AREA: Record<string, string[]> = {
  trabalhista: [
    'rescisão indireta', 'hora extra', 'horas extras', 'verbas rescisórias',
    'adicional noturno', 'insalubridade', 'periculosidade', 'FGTS',
    'demissão', 'justa causa', 'aviso prévio', 'férias', '13º salário',
    'reclamação trabalhista', 'reclamações trabalhistas', 'ação trabalhista',
    'ações trabalhistas', 'processo trabalhista', 'processos trabalhistas',
    'CLT', 'empregador', 'empregado', 'trabalhador', 'trabalhadores',
    'vínculo empregatício', 'carteira assinada', 'dano moral trabalhista',
    'trabalhista', 'justiça do trabalho', 'tribunal do trabalho',
    'taxa de procedência', 'procedência',
  ],
  consumidor: [
    'CDC', 'código de defesa do consumidor', 'relação de consumo',
    'produto defeituoso', 'vício do produto', 'propaganda enganosa',
    'cobrança indevida', 'negativação indevida', 'SPC', 'Serasa',
    'banco', 'financeira', 'empréstimo', 'cartão de crédito',
    'plano de saúde', 'operadora', 'consumidor', 'fornecedor',
  ],
  civil: [
    'dano moral', 'dano material', 'indenização', 'responsabilidade civil',
    'contrato', 'inadimplemento', 'rescisão contratual', 'cobrança',
    'obrigação de fazer', 'obrigação de não fazer', 'perdas e danos',
    'lucros cessantes', 'acidente', 'negligência', 'imprudência',
  ],
  familia: [
    'divórcio', 'separação', 'guarda', 'pensão alimentícia', 'alimentos',
    'visitação', 'paternidade', 'maternidade', 'união estável',
    'partilha de bens', 'inventário', 'herança', 'sucessão',
  ],
  tributario: [
    'ICMS', 'ISS', 'IPTU', 'IPVA', 'imposto de renda', 'IR',
    'contribuição', 'tributo', 'fiscal', 'execução fiscal',
    'auto de infração', 'lançamento', 'compensação tributária',
  ],
  administrativo: [
    'licitação', 'concurso público', 'servidor público', 'aposentadoria',
    'ato administrativo', 'processo administrativo', 'mandado de segurança',
    'poder público', 'administração pública', 'responsabilidade do estado',
  ],
};

/**
 * Mapeamento de matéria para tipo de ação comum
 */
const MATERIA_TO_TIPO_ACAO: Record<string, string> = {
  trabalhista: 'Reclamação Trabalhista',
  consumidor: 'Procedimento Comum Cível',
  civil: 'Procedimento Comum Cível',
  familia: 'Procedimento de Família',
  tributario: 'Execução Fiscal',
  administrativo: 'Mandado de Segurança',
};

/**
 * AnalyzeCaseUseCase - Implementação
 */
export class AnalyzeCaseUseCase {
  private legalDataGateway: LegalDataGateway;

  constructor(gateway?: LegalDataGateway) {
    this.legalDataGateway = gateway || getLegalDataGateway();
  }

  /**
   * Executa a análise da mensagem
   */
  async execute(input: AnalyzeCaseInput): Promise<AnalyzeCaseOutput> {
    const startTime = Date.now();

    // 1. Extrair entidades da mensagem
    const entidades = this.extractEntities(input.mensagem);

    console.log('📊 [AnalyzeCase] Entidades extraídas:', {
      tribunal: entidades.tribunal,
      tipo_acao: entidades.tipo_acao,
      materia: entidades.materia,
      keywords: entidades.keywords.length,
      confianca: entidades.confianca,
    });

    // 2. Decidir se deve buscar dados reais
    const deveBuscarDados = this.shouldFetchRealData(entidades);

    let dadosJuridicos: UnifiedSearchResult | null = null;

    // 3. Buscar dados reais se necessário
    if (deveBuscarDados) {
      try {
        dadosJuridicos = await this.fetchLegalData(entidades);
        console.log('📦 [AnalyzeCase] Dados obtidos:', {
          processos: dadosJuridicos.processos.length,
          jurisprudencia: dadosJuridicos.jurisprudencia.length,
          jurimetrics: !!dadosJuridicos.jurimetrics,
        });
      } catch (error) {
        console.warn('⚠️ [AnalyzeCase] Erro ao buscar dados:', error);
      }
    }

    // 4. Construir contexto enriquecido
    const contexto = this.buildEnrichedContext(input.mensagem, entidades, dadosJuridicos);

    const tempoTotal = Date.now() - startTime;

    return {
      contexto,
      dados_utilizados: {
        fonte: dadosJuridicos?.metadata.providers_consultados || [],
        processos_analisados: dadosJuridicos?.jurimetrics?.metricas.total_processos || 0,
        jurisprudencias: dadosJuridicos?.jurisprudencia.length || 0,
        tempo_busca_ms: tempoTotal,
      },
      deve_usar_dados: deveBuscarDados && dadosJuridicos !== null,
    };
  }

  /**
   * Extrai entidades da mensagem
   */
  private extractEntities(mensagem: string): ExtractedEntities {
    const keywords: string[] = [];
    let confianca = 0;
    const mensagemLower = mensagem.toLowerCase();

    // Extrair tribunal
    const tribunalMatch = mensagem.match(PATTERNS.TRIBUNAL);
    const tribunal = tribunalMatch ? tribunalMatch[0].toUpperCase() : undefined;
    if (tribunal) confianca += 0.3;

    // Detectar contexto de jurimetria/estatísticas
    const isJurimetricsQuestion = /taxa|estatística|porcentagem|percentual|quantos|média|médio|tempo|duração|probabilidade|chance/i.test(mensagem);
    if (isJurimetricsQuestion) {
      confianca += 0.2;
      keywords.push('jurimetria');
    }

    // Extrair número do processo
    const numeroMatch = mensagem.match(PATTERNS.NUMERO_PROCESSO);
    const numero_processo = numeroMatch ? numeroMatch[0] : undefined;
    if (numero_processo) confianca += 0.4;

    // Extrair valor
    const valorMatch = mensagem.match(PATTERNS.VALOR);
    let valor: number | undefined;
    if (valorMatch) {
      const valorStr = valorMatch[0].replace(/[^\d,]/g, '').replace(',', '.');
      valor = parseFloat(valorStr);
      if (!isNaN(valor)) confianca += 0.1;
    }

    // Identificar matéria e extrair keywords
    let materia: string | undefined;
    let maxKeywords = 0;

    for (const [area, areaKeywords] of Object.entries(KEYWORDS_BY_AREA)) {
      const found = areaKeywords.filter(kw => mensagemLower.includes(kw.toLowerCase()));
      if (found.length > maxKeywords) {
        maxKeywords = found.length;
        materia = area;
        keywords.push(...found);
      }
    }

    if (materia) confianca += 0.2;

    // Determinar tipo de ação
    const tipo_acao = materia ? MATERIA_TO_TIPO_ACAO[materia] : undefined;

    // Extrair período (últimos 2 anos por padrão se houver contexto de jurimetria)
    let periodo: ExtractedEntities['periodo'];
    if (tribunal || materia) {
      const anoMatch = mensagem.match(PATTERNS.ANO);
      if (anoMatch) {
        const ano = parseInt(anoMatch[0], 10);
        periodo = {
          inicio: new Date(ano, 0, 1),
          fim: new Date(ano, 11, 31),
        };
      } else {
        // Padrão: últimos 2 anos
        periodo = {
          inicio: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000),
          fim: new Date(),
        };
      }
    }

    // Normalizar confiança
    confianca = Math.min(1, confianca);

    return {
      tribunal,
      numero_processo,
      tipo_acao,
      materia,
      valor,
      periodo,
      keywords: Array.from(new Set(keywords)), // Remover duplicatas
      confianca,
    };
  }

  /**
   * Decide se deve buscar dados reais
   */
  private shouldFetchRealData(entidades: ExtractedEntities): boolean {
    // Buscar se:
    // 1. Tem número de processo específico
    // 2. Tem tribunal E (tipo de ação OU matéria OU keywords)
    // 3. Tem tribunal apenas (para buscar jurimetria geral)
    // 4. Confiança >= 0.3

    if (entidades.numero_processo) return true;

    if (entidades.tribunal && (entidades.tipo_acao || entidades.materia || entidades.keywords.length > 0)) {
      return true;
    }

    // Se tem apenas tribunal, ainda vale buscar jurimetria
    if (entidades.tribunal) {
      return true;
    }

    return entidades.confianca >= 0.3;
  }

  /**
   * Busca dados jurídicos reais
   */
  private async fetchLegalData(entidades: ExtractedEntities): Promise<UnifiedSearchResult> {
    // Se tem número de processo específico, buscar apenas ele
    if (entidades.numero_processo) {
      const processo = await this.legalDataGateway.getProcesso(entidades.numero_processo);

      return {
        processos: processo ? [processo] : [],
        jurisprudencia: [],
        jurimetrics: null,
        metadata: {
          providers_consultados: this.legalDataGateway.getActiveProviders(),
          timestamp: new Date().toISOString(),
          cached: false,
        },
      };
    }

    // Busca geral com jurimetria
    return this.legalDataGateway.searchParallel({
      tribunal: entidades.tribunal,
      classe: entidades.tipo_acao,
      materia: entidades.materia,
      periodo: entidades.periodo,
      limit: 10,
      incluirProcessos: true,
      incluirJurisprudencia: true,
      incluirJurimetrics: !!entidades.tribunal && !!entidades.periodo,
    });
  }

  /**
   * Constrói contexto enriquecido para a IA
   */
  private buildEnrichedContext(
    mensagem: string,
    entidades: ExtractedEntities,
    dados: UnifiedSearchResult | null
  ): EnrichedContext {
    let contexto_prompt = '';
    let dados_juridicos: EnrichedContext['dados_juridicos'];

    if (dados && (dados.processos.length > 0 || dados.jurimetrics)) {
      // Construir resumo dos dados
      const jurimetria = dados.jurimetrics?.metricas;
      const taxaProcedencia = jurimetria?.taxas.procedencia
        ? `${(jurimetria.taxas.procedencia * 100).toFixed(1)}%`
        : 'não disponível';

      dados_juridicos = {
        processos_encontrados: dados.processos.length,
        jurisprudencias_encontradas: dados.jurisprudencia.length,
        jurimetria: jurimetria ? {
          total_processos: jurimetria.total_processos,
          taxa_procedencia: taxaProcedencia,
          tempo_medio_dias: jurimetria.tempos.distribuicao_sentenca_dias,
          valor_medio_condenacao: jurimetria.valores.media_condenacao || undefined,
        } : undefined,
        resumo: this.buildDataSummary(dados, entidades),
      };

      // Construir contexto para o prompt
      contexto_prompt = this.buildPromptContext(dados, entidades);
    }

    return {
      mensagem,
      entidades,
      dados_juridicos,
      contexto_prompt,
    };
  }

  /**
   * Constrói resumo dos dados para o frontend
   */
  private buildDataSummary(dados: UnifiedSearchResult, entidades: ExtractedEntities): string {
    const partes: string[] = [];

    if (entidades.tribunal) {
      partes.push(`Tribunal: ${entidades.tribunal}`);
    }

    if (dados.jurimetrics) {
      const j = dados.jurimetrics.metricas;
      partes.push(`${j.total_processos.toLocaleString()} processos analisados`);

      if (j.taxas.procedencia > 0) {
        partes.push(`Taxa de procedência: ${(j.taxas.procedencia * 100).toFixed(1)}%`);
      }
    }

    if (dados.processos.length > 0) {
      partes.push(`${dados.processos.length} processos similares encontrados`);
    }

    return partes.join(' | ');
  }

  /**
   * Constrói contexto adicional para o prompt da IA
   */
  private buildPromptContext(dados: UnifiedSearchResult, entidades: ExtractedEntities): string {
    const sections: string[] = [];

    // Seção de jurimetria
    if (dados.jurimetrics) {
      const j = dados.jurimetrics.metricas;
      const temTaxas = j.taxas.procedencia > 0;

      sections.push(`
# 📊 DADOS OFICIAIS DO ${entidades.tribunal || 'TRIBUNAL'}
**Fonte:** DataJud/CNJ (Conselho Nacional de Justiça)

| Métrica | Valor |
|---------|-------|
| **Total de Processos** | **${j.total_processos.toLocaleString('pt-BR')}** |
| **Período Analisado** | ${dados.jurimetrics.periodo.inicio.toLocaleDateString('pt-BR')} a ${dados.jurimetrics.periodo.fim.toLocaleDateString('pt-BR')} |
${temTaxas ? `| **Taxa de Procedência** | **${(j.taxas.procedencia * 100).toFixed(1)}%** |` : ''}
${j.taxas.acordo > 0 ? `| **Taxa de Acordos** | **${(j.taxas.acordo * 100).toFixed(1)}%** |` : ''}
${j.tempos.distribuicao_sentenca_dias > 0 ? `| **Tempo Médio até Sentença** | **${j.tempos.distribuicao_sentenca_dias} dias** |` : ''}
${j.valores.media_condenacao > 0 ? `| **Valor Médio de Condenação** | **R$ ${j.valores.media_condenacao.toLocaleString('pt-BR')}** |` : ''}
`);

      // Distribuição por classe (top 5)
      if (j.distribuicao.por_classe.length > 0) {
        const top5 = j.distribuicao.por_classe.slice(0, 5);
        sections.push(`
### 📊 Distribuição por Tipo de Ação:
${top5.map((c, i) => `${i + 1}. **${c.classe}**: ${c.quantidade.toLocaleString('pt-BR')} processos (${(c.percentual * 100).toFixed(1)}%)`).join('\n')}

---

## 📝 INSTRUÇÕES DE FORMATAÇÃO DA RESPOSTA

**Estruture sua resposta de forma elegante e profissional:**

1. **Inicie com um resumo impactante** destacando o total de **${j.total_processos.toLocaleString('pt-BR')} processos** analisados

2. **Use formatação rica:**
   - Títulos com emojis para seções (📊 📈 ⚖️ 💡)
   - **Negrito** para números e dados importantes
   - Listas organizadas para facilitar leitura
   - Separadores (---) entre seções quando apropriado

3. **Organize em seções claras:**
   - 📊 **Panorama Geral** - Total e período analisado
   - 📈 **Distribuição por Tipo de Ação** - Dados percentuais
   - ⚖️ **Análise** - Interpretação dos dados
   - 💡 **Conclusão** - Recomendações práticas

4. **Dados obrigatórios a mencionar:**
   - Total: **${j.total_processos.toLocaleString('pt-BR')}** processos
   - Período: ${dados.jurimetrics.periodo.inicio.toLocaleDateString('pt-BR')} a ${dados.jurimetrics.periodo.fim.toLocaleDateString('pt-BR')}
   - Use os percentuais reais da distribuição acima

5. **Se perguntarem sobre taxa de procedência:** Informe que o DataJud não fornece dados de resultado de julgamento, mas destaque os dados de volume que temos.

6. **Não invente dados** - use apenas as informações fornecidas acima.
`);
      }
    }

    // Seção de processos encontrados (resumo)
    if (dados.processos.length > 0) {
      sections.push(`
## PROCESSOS SIMILARES ENCONTRADOS
Foram encontrados ${dados.processos.length} processos similares. Exemplos:
${dados.processos.slice(0, 3).map(p => `- ${p.numero} (${p.classificacao.classe})`).join('\n')}
`);
    }

    // Limitações
    if (dados.metadata.erros && dados.metadata.erros.length > 0) {
      sections.push(`
**Nota:** Alguns dados podem estar incompletos devido a limitações da API.
`);
    }

    if (sections.length === 0) {
      return '';
    }

    return `
---
# CONTEXTO COM DADOS JURÍDICOS REAIS
Os dados abaixo foram obtidos de fontes oficiais e devem ser usados para embasar sua análise.
${sections.join('\n')}
---
`;
  }
}

/**
 * Factory function
 */
export function createAnalyzeCaseUseCase(gateway?: LegalDataGateway): AnalyzeCaseUseCase {
  return new AnalyzeCaseUseCase(gateway);
}
