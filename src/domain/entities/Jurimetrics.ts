/**
 * Domain Entity: Jurimetrics
 * Representa dados de jurimetria (estatísticas judiciais)
 */

export interface PeriodoAnalise {
  inicio: Date;
  fim: Date;
}

export interface EscopoAnalise {
  tribunal?: string;
  tribunais?: string[];
  vara?: string;
  varas?: string[];
  juiz?: string;
  juizes?: string[];
  tipo_acao?: string;
  tipos_acao?: string[];
  materia?: string;
  materias?: string[];
  comarca?: string;
  uf?: string;
}

export interface TaxasJurimetria {
  procedencia: number;              // 0.0 - 1.0
  improcedencia: number;
  parcial_procedencia: number;
  acordo: number;
  extincao_sem_merito: number;
  outros: number;
  total_decisoes: number;
}

export interface TemposJurimetria {
  distribuicao_citacao_dias: number;
  citacao_sentenca_dias: number;
  distribuicao_sentenca_dias: number;
  sentenca_acordao_dias: number;
  total_tramitacao_dias: number;

  // Medianas (mais precisas que médias)
  mediana_sentenca_dias?: number;
  mediana_acordao_dias?: number;

  // Percentis
  percentil_25_dias?: number;
  percentil_75_dias?: number;
  percentil_90_dias?: number;
}

export interface ValoresJurimetria {
  media_valor_causa: number;
  mediana_valor_causa: number;
  media_condenacao: number;
  mediana_condenacao: number;

  percentil_75_condenacao?: number;
  percentil_90_condenacao?: number;
  max_condenacao?: number;
  min_condenacao?: number;

  media_acordo?: number;
  mediana_acordo?: number;

  total_condenacoes: number;
}

export interface VolumeJurimetria {
  por_mes: {
    mes: string;           // "2024-01"
    quantidade: number;
    tendencia?: 'alta' | 'baixa' | 'estavel';
  }[];

  por_ano: {
    ano: number;
    quantidade: number;
    variacao_percentual?: number;   // Em relação ao ano anterior
  }[];

  por_dia_semana?: {
    dia: number;           // 0-6 (domingo-sábado)
    quantidade: number;
  }[];

  total: number;
}

export interface DistribuicaoJurimetria {
  por_classe: {
    classe: string;
    codigo?: string;
    quantidade: number;
    percentual: number;
    taxa_procedencia?: number;
  }[];

  por_assunto: {
    assunto: string;
    codigo?: string;
    quantidade: number;
    percentual: number;
    taxa_procedencia?: number;
  }[];

  por_vara?: {
    vara: string;
    quantidade: number;
    percentual: number;
    taxa_procedencia?: number;
    tempo_medio_dias?: number;
  }[];

  por_juiz?: {
    juiz: string;
    quantidade: number;
    percentual: number;
    taxa_procedencia?: number;
    tempo_medio_dias?: number;
  }[];

  por_comarca?: {
    comarca: string;
    quantidade: number;
    percentual: number;
  }[];
}

export interface TendenciaJurimetrica {
  tipo: 'alta' | 'baixa' | 'estavel';
  metrica: string;                  // "taxa_procedencia", "tempo_tramitacao", etc.
  variacao_percentual: number;
  periodo_comparacao: string;       // "ultimo_ano", "ultimo_semestre"
  descricao: string;
  significancia: 'alta' | 'media' | 'baixa';
}

export interface ComparativoJurimetrico {
  periodo_atual: PeriodoAnalise;
  periodo_anterior: PeriodoAnalise;

  variacoes: {
    metrica: string;
    valor_atual: number;
    valor_anterior: number;
    variacao_absoluta: number;
    variacao_percentual: number;
  }[];
}

export interface MetricasJurimetria {
  total_processos: number;
  taxas: TaxasJurimetria;
  tempos: TemposJurimetria;
  valores: ValoresJurimetria;
  volume: VolumeJurimetria;
  distribuicao: DistribuicaoJurimetria;
}

export interface JurimetricsData {
  id: string;

  // Escopo da análise
  periodo: PeriodoAnalise;
  escopo: EscopoAnalise;

  // Métricas
  metricas: MetricasJurimetria;

  // Análises
  tendencias: TendenciaJurimetrica[];
  comparativo?: ComparativoJurimetrico;

  // Insights gerados por IA
  insights?: {
    sumario: string;
    destaques: string[];
    alertas: string[];
    recomendacoes: string[];
  };

  // Metadados
  metadata: {
    providers_consultados: string[];
    processos_analisados: number;
    data_geracao: Date;
    confiabilidade: number;        // 0.0 - 1.0
    limitacoes?: string[];
  };

  created_at?: Date;
  updated_at?: Date;
}

/**
 * Factory para criar JurimetricsData
 */
export function createJurimetricsData(
  data: Partial<JurimetricsData> & Pick<JurimetricsData, 'periodo' | 'escopo' | 'metricas'>
): JurimetricsData {
  const id = `jurimetrics_${data.escopo.tribunal || 'all'}_${data.periodo.inicio.toISOString().slice(0, 7)}`;

  return {
    id: data.id || id,
    periodo: data.periodo,
    escopo: data.escopo,
    metricas: data.metricas,
    tendencias: data.tendencias || [],
    comparativo: data.comparativo,
    insights: data.insights,
    metadata: data.metadata || {
      providers_consultados: [],
      processos_analisados: data.metricas.total_processos,
      data_geracao: new Date(),
      confiabilidade: 0.8,
    },
    created_at: data.created_at || new Date(),
    updated_at: data.updated_at || new Date(),
  };
}

/**
 * Calcula a tendência de uma métrica
 */
export function calcularTendencia(
  valores: { data: Date; valor: number }[],
  metrica: string
): TendenciaJurimetrica | null {
  if (valores.length < 2) return null;

  // Ordenar por data
  const ordenados = [...valores].sort((a, b) => a.data.getTime() - b.data.getTime());

  // Calcular média da primeira e segunda metade
  const meio = Math.floor(ordenados.length / 2);
  const primeiraMeta = ordenados.slice(0, meio);
  const segundaMetade = ordenados.slice(meio);

  const mediaPrimeira = primeiraMeta.reduce((sum, v) => sum + v.valor, 0) / primeiraMeta.length;
  const mediaSegunda = segundaMetade.reduce((sum, v) => sum + v.valor, 0) / segundaMetade.length;

  const variacao = mediaPrimeira !== 0
    ? ((mediaSegunda - mediaPrimeira) / mediaPrimeira) * 100
    : 0;

  let tipo: 'alta' | 'baixa' | 'estavel';
  if (variacao > 5) tipo = 'alta';
  else if (variacao < -5) tipo = 'baixa';
  else tipo = 'estavel';

  return {
    tipo,
    metrica,
    variacao_percentual: variacao,
    periodo_comparacao: 'periodo_analisado',
    descricao: `${metrica} ${tipo === 'alta' ? 'aumentou' : tipo === 'baixa' ? 'diminuiu' : 'manteve-se estável'} em ${Math.abs(variacao).toFixed(1)}%`,
    significancia: Math.abs(variacao) > 20 ? 'alta' : Math.abs(variacao) > 10 ? 'media' : 'baixa',
  };
}

/**
 * Formata taxas como percentuais
 */
export function formatarTaxas(taxas: TaxasJurimetria): Record<string, string> {
  return {
    procedencia: `${(taxas.procedencia * 100).toFixed(1)}%`,
    improcedencia: `${(taxas.improcedencia * 100).toFixed(1)}%`,
    parcial_procedencia: `${(taxas.parcial_procedencia * 100).toFixed(1)}%`,
    acordo: `${(taxas.acordo * 100).toFixed(1)}%`,
    extincao_sem_merito: `${(taxas.extincao_sem_merito * 100).toFixed(1)}%`,
  };
}

/**
 * Formata tempo em dias de forma legível
 */
export function formatarTempo(dias: number): string {
  if (dias < 30) return `${dias} dias`;
  if (dias < 365) return `${Math.round(dias / 30)} meses`;
  const anos = Math.floor(dias / 365);
  const meses = Math.round((dias % 365) / 30);
  return meses > 0 ? `${anos} ano(s) e ${meses} meses` : `${anos} ano(s)`;
}

/**
 * Formata valor monetário
 */
export function formatarValor(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}
