/**
 * Interface: ILegalDataProvider
 * Contrato para providers de dados jurídicos (DataJud, Escavador, etc.)
 */

import {
  Processo,
  Jurisprudencia,
  Juiz,
  JurimetricsData,
  Tribunal,
} from '../entities';
// PeriodoAnalise disponível em ../value-objects se necessário

/**
 * Parâmetros de busca de processos
 */
export interface SearchProcessosParams {
  // Filtros principais
  numero?: string;
  tribunal?: string;
  classe?: string;
  assunto?: string;

  // Partes
  parte?: string;
  cpf_cnpj?: string;
  advogado?: string;
  oab?: string;

  // Período
  periodo?: {
    inicio: Date;
    fim: Date;
  };
  ano?: number;

  // Localização
  vara?: string;
  comarca?: string;
  uf?: string;

  // Status
  situacao?: string;
  segredo_justica?: boolean;

  // Paginação
  limit?: number;
  offset?: number;

  // Ordenação
  ordenar_por?: 'data_distribuicao' | 'data_atualizacao' | 'relevancia';
  ordem?: 'asc' | 'desc';
}

/**
 * Parâmetros de busca de jurisprudência
 */
export interface SearchJurisprudenciaParams {
  // Texto
  termo?: string;
  ementa?: string;

  // Filtros
  tribunal?: string;
  tribunais?: string[];
  tipo_decisao?: string;
  relator?: string;
  juiz?: string;
  orgao_julgador?: string;

  // Classificação
  materia?: string;
  assunto?: string;
  classe?: string;

  // Período
  periodo?: {
    inicio: Date;
    fim: Date;
  };
  ano?: number;

  // Paginação
  limit?: number;
  offset?: number;

  // Ordenação
  ordenar_por?: 'data_julgamento' | 'data_publicacao' | 'relevancia';
  ordem?: 'asc' | 'desc';
}

/**
 * Parâmetros para obter jurimetria
 */
export interface GetJurimetricsParams {
  // Escopo
  tribunal?: string;
  tribunais?: string[];
  vara?: string;
  juiz?: string;
  classe?: string;
  assunto?: string;
  materia?: string;

  // Período (obrigatório)
  periodo: {
    inicio: Date;
    fim: Date;
  };

  // Agregações desejadas
  agrupar_por?: ('mes' | 'ano' | 'classe' | 'assunto' | 'vara' | 'juiz')[];

  // Métricas desejadas
  metricas?: ('taxas' | 'tempos' | 'valores' | 'volume')[];
}

/**
 * Parâmetros para buscar perfil de juiz
 */
export interface GetJuizPerfilParams {
  nome?: string;
  id?: string;
  tribunal: string;
  vara?: string;

  // Período para análise de estatísticas
  periodo?: {
    inicio: Date;
    fim: Date;
  };
}

/**
 * Resultado de busca paginada
 */
export interface SearchResult<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Status de saúde do provider
 */
export interface ProviderHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency_ms?: number;
  last_check: Date;
  message?: string;
}

/**
 * Metadados do provider
 */
export interface ProviderMetadata {
  name: string;
  version?: string;
  capabilities: ProviderCapability[];
  tribunais_suportados?: string[];
  rate_limit?: {
    requests_per_minute: number;
    requests_per_day?: number;
  };
  requer_autenticacao: boolean;
}

export type ProviderCapability =
  | 'search_processos'
  | 'get_processo'
  | 'search_jurisprudencia'
  | 'get_jurimetrics'
  | 'get_juiz_perfil'
  | 'get_tribunal_stats'
  | 'realtime_updates';

/**
 * Interface principal para providers de dados jurídicos
 */
export interface ILegalDataProvider {
  /**
   * Nome identificador do provider
   */
  readonly name: string;

  /**
   * Metadados e capacidades do provider
   */
  getMetadata(): ProviderMetadata;

  /**
   * Verifica a saúde/disponibilidade do provider
   */
  healthCheck(): Promise<ProviderHealth>;

  /**
   * Busca processos
   */
  searchProcessos(params: SearchProcessosParams): Promise<SearchResult<Processo>>;

  /**
   * Obtém um processo específico pelo número
   */
  getProcessoByNumero(numero: string): Promise<Processo | null>;

  /**
   * Busca jurisprudência
   */
  searchJurisprudencia(params: SearchJurisprudenciaParams): Promise<SearchResult<Jurisprudencia>>;

  /**
   * Obtém dados de jurimetria agregados
   */
  getJurimetrics(params: GetJurimetricsParams): Promise<JurimetricsData>;

  /**
   * Obtém perfil de um magistrado
   */
  getJuizPerfil?(params: GetJuizPerfilParams): Promise<Juiz | null>;

  /**
   * Obtém informações de um tribunal
   */
  getTribunal?(sigla: string): Promise<Tribunal | null>;

  /**
   * Lista tribunais disponíveis no provider
   */
  listTribunais?(): Promise<Tribunal[]>;
}

/**
 * Interface para providers que suportam streaming/realtime
 */
export interface IRealtimeLegalDataProvider extends ILegalDataProvider {
  /**
   * Inscreve-se para atualizações de um processo
   */
  subscribeProcesso(
    numero: string,
    callback: (processo: Processo) => void
  ): () => void; // Retorna função para cancelar inscrição

  /**
   * Inscreve-se para novos processos que correspondem a um filtro
   */
  subscribeNovosProcessos(
    params: SearchProcessosParams,
    callback: (processo: Processo) => void
  ): () => void;
}

/**
 * Factory type para criar providers
 */
export type LegalDataProviderFactory = (config: Record<string, unknown>) => ILegalDataProvider;
