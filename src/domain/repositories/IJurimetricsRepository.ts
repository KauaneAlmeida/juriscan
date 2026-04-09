/**
 * Interface: IJurimetricsRepository
 * Repositório para persistência de dados de jurimetria
 */

import { JurimetricsData, EscopoAnalise, TendenciaJurimetrica } from '../entities';
import { PeriodoAnalise } from '../value-objects';

/**
 * Filtros para busca de jurimetria
 */
export interface JurimetricsFilters {
  // IDs
  ids?: string[];

  // Escopo
  tribunal?: string;
  tribunais?: string[];
  vara?: string;
  juiz?: string;
  classe?: string;
  assunto?: string;
  materia?: string;

  // Período
  periodo_inicio_apos?: Date;
  periodo_fim_antes?: Date;
  ano?: number;

  // Usuário
  user_id?: string;
  gerado_por_relatorio?: string;
}

/**
 * Opções de consulta
 */
export interface JurimetricsQueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: 'created_at' | 'periodo_inicio' | 'total_processos';
  orderDirection?: 'asc' | 'desc';
}

/**
 * Resultado paginado
 */
export interface JurimetricsQueryResult {
  data: JurimetricsData[];
  total: number;
  hasMore: boolean;
}

/**
 * Dados para criação de jurimetria
 */
export interface CreateJurimetricsData {
  escopo: EscopoAnalise;
  periodo_inicio: Date;
  periodo_fim: Date;

  // Métricas básicas
  total_processos: number;

  // Taxas
  taxa_procedencia: number;
  taxa_improcedencia: number;
  taxa_parcial: number;
  taxa_acordo: number;
  taxa_extincao: number;
  total_decisoes: number;

  // Tempos
  tempo_medio_citacao_dias?: number;
  tempo_medio_sentenca_dias: number;
  tempo_medio_acordao_dias?: number;
  tempo_total_dias: number;
  tempo_mediano_dias?: number;

  // Valores
  valor_medio_causa?: number;
  valor_medio_condenacao?: number;
  valor_mediano_condenacao?: number;

  // Distribuições (JSON)
  distribuicao_por_classe?: Record<string, number>;
  distribuicao_por_assunto?: Record<string, number>;
  distribuicao_por_vara?: Record<string, number>;
  distribuicao_por_mes?: Record<string, number>;

  // Análises
  tendencias?: TendenciaJurimetrica[];
  insights_ia?: {
    sumario: string;
    destaques: string[];
    recomendacoes: string[];
  };

  // Metadados
  providers_consultados: string[];
  confiabilidade: number;
  raw_data?: Record<string, unknown>;
}

/**
 * Dados para atualização
 */
export interface UpdateJurimetricsData {
  tendencias?: TendenciaJurimetrica[];
  insights_ia?: {
    sumario: string;
    destaques: string[];
    recomendacoes: string[];
  };
  confiabilidade?: number;
}

/**
 * Parâmetros para comparativo
 */
export interface JurimetricsComparativoParams {
  escopo: EscopoAnalise;
  periodo_atual: { inicio: Date; fim: Date };
  periodo_anterior: { inicio: Date; fim: Date };
  metricas?: ('taxas' | 'tempos' | 'valores' | 'volume')[];
}

/**
 * Resultado do comparativo
 */
export interface JurimetricsComparativo {
  periodo_atual: JurimetricsData;
  periodo_anterior: JurimetricsData;
  variacoes: {
    metrica: string;
    valor_atual: number;
    valor_anterior: number;
    variacao_absoluta: number;
    variacao_percentual: number;
    tendencia: 'alta' | 'baixa' | 'estavel';
  }[];
}

/**
 * Interface do repositório de jurimetria
 */
export interface IJurimetricsRepository {
  /**
   * Encontra um registro pelo ID
   */
  findById(id: string): Promise<JurimetricsData | null>;

  /**
   * Encontra jurimetria por escopo e período (busca mais recente)
   */
  findByEscopoPeriodo(
    escopo: EscopoAnalise,
    periodo: PeriodoAnalise | { inicio: Date; fim: Date }
  ): Promise<JurimetricsData | null>;

  /**
   * Busca jurimetrias com filtros
   */
  find(filters: JurimetricsFilters, options?: JurimetricsQueryOptions): Promise<JurimetricsQueryResult>;

  /**
   * Conta registros
   */
  count(filters: JurimetricsFilters): Promise<number>;

  /**
   * Cria um novo registro de jurimetria
   */
  create(data: CreateJurimetricsData, userId?: string): Promise<JurimetricsData>;

  /**
   * Atualiza um registro existente
   */
  update(id: string, data: UpdateJurimetricsData): Promise<JurimetricsData>;

  /**
   * Remove um registro
   */
  delete(id: string): Promise<void>;

  // === Análises Especializadas ===

  /**
   * Obtém comparativo entre dois períodos
   */
  getComparativo(params: JurimetricsComparativoParams): Promise<JurimetricsComparativo | null>;

  /**
   * Obtém série histórica de uma métrica
   */
  getSerieHistorica(
    escopo: EscopoAnalise,
    metrica: 'taxa_procedencia' | 'tempo_medio' | 'valor_medio' | 'volume',
    granularidade: 'mes' | 'trimestre' | 'ano',
    periodos?: number  // Quantos períodos para trás
  ): Promise<{ periodo: string; valor: number }[]>;

  /**
   * Obtém ranking de varas por métrica
   */
  getRankingVaras(
    tribunal: string,
    metrica: 'taxa_procedencia' | 'tempo_medio' | 'volume',
    periodo?: { inicio: Date; fim: Date },
    limit?: number
  ): Promise<{ vara: string; valor: number; posicao: number }[]>;

  /**
   * Obtém ranking de magistrados por métrica
   */
  getRankingMagistrados(
    tribunal: string,
    metrica: 'taxa_procedencia' | 'tempo_medio' | 'volume',
    periodo?: { inicio: Date; fim: Date },
    limit?: number
  ): Promise<{ magistrado: string; valor: number; posicao: number }[]>;

  // === Cache ===

  /**
   * Obtém jurimetria do cache ou calcula
   */
  getOrCalculate(
    escopo: EscopoAnalise,
    periodo: { inicio: Date; fim: Date },
    maxAge?: number  // Idade máxima em segundos
  ): Promise<JurimetricsData>;

  /**
   * Invalida cache de jurimetria para um escopo
   */
  invalidateCache(escopo: EscopoAnalise): Promise<void>;

  // === Agregações ===

  /**
   * Obtém totais agregados por tribunal
   */
  getAgregadosPorTribunal(
    periodo?: { inicio: Date; fim: Date }
  ): Promise<{
    tribunal: string;
    total_processos: number;
    taxa_procedencia: number;
    tempo_medio: number;
  }[]>;

  /**
   * Obtém totais agregados por matéria
   */
  getAgregadosPorMateria(
    tribunal?: string,
    periodo?: { inicio: Date; fim: Date }
  ): Promise<{
    materia: string;
    total_processos: number;
    taxa_procedencia: number;
    tempo_medio: number;
  }[]>;
}
