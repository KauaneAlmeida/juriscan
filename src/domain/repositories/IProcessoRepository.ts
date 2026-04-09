/**
 * Interface: IProcessoRepository
 * Repositório para persistência de processos
 */

import { Processo, Movimentacao } from '../entities';
import { NumeroProcesso } from '../value-objects';

/**
 * Filtros para busca de processos no repositório
 */
export interface ProcessoFilters {
  // IDs
  ids?: string[];

  // Número
  numero?: string;
  numero_contains?: string;

  // Tribunal
  tribunal_sigla?: string;
  tribunais?: string[];

  // Classificação
  classe?: string;
  assuntos?: string[];

  // Partes
  parte_nome?: string;
  parte_documento?: string;

  // Datas
  distribuido_apos?: Date;
  distribuido_antes?: Date;
  atualizado_apos?: Date;

  // Status
  situacao?: string;
  situacoes?: string[];
  resultado?: string;

  // Usuário
  user_id?: string;
  favoritos_user_id?: string;

  // Segredo
  segredo_justica?: boolean;
}

/**
 * Opções de paginação e ordenação
 */
export interface ProcessoQueryOptions {
  // Paginação
  limit?: number;
  offset?: number;

  // Ordenação
  orderBy?: 'created_at' | 'updated_at' | 'data_distribuicao' | 'numero';
  orderDirection?: 'asc' | 'desc';

  // Includes
  includePartes?: boolean;
  includeMovimentacoes?: boolean;
  includeJuiz?: boolean;
  movimentacoesLimit?: number;
}

/**
 * Resultado paginado
 */
export interface ProcessoQueryResult {
  data: Processo[];
  total: number;
  hasMore: boolean;
}

/**
 * Dados para criação de processo
 */
export interface CreateProcessoData {
  numero: string;
  tribunal_sigla: string;
  classe: string;
  assuntos?: string[];
  valor_causa?: number;
  data_distribuicao?: Date;
  segredo_justica?: boolean;
  fonte_provider?: string;
  fonte_url?: string;
  raw_data?: Record<string, unknown>;
}

/**
 * Dados para atualização de processo
 */
export interface UpdateProcessoData {
  situacao?: string;
  resultado?: string;
  valor_condenacao?: number;
  data_sentenca?: Date;
  data_transito_julgado?: Date;
  juiz_id?: string;
  relator_id?: string;
  raw_data?: Record<string, unknown>;
}

/**
 * Interface do repositório de processos
 */
export interface IProcessoRepository {
  /**
   * Encontra um processo pelo ID interno
   */
  findById(id: string): Promise<Processo | null>;

  /**
   * Encontra um processo pelo número CNJ
   */
  findByNumero(numero: string | NumeroProcesso): Promise<Processo | null>;

  /**
   * Busca processos com filtros
   */
  find(filters: ProcessoFilters, options?: ProcessoQueryOptions): Promise<ProcessoQueryResult>;

  /**
   * Conta processos que correspondem aos filtros
   */
  count(filters: ProcessoFilters): Promise<number>;

  /**
   * Verifica se um processo existe
   */
  exists(numero: string | NumeroProcesso): Promise<boolean>;

  /**
   * Cria um novo processo
   */
  create(data: CreateProcessoData, userId?: string): Promise<Processo>;

  /**
   * Atualiza um processo existente
   */
  update(id: string, data: UpdateProcessoData): Promise<Processo>;

  /**
   * Atualiza ou cria um processo (upsert pelo número)
   */
  upsertByNumero(numero: string, data: CreateProcessoData & UpdateProcessoData): Promise<Processo>;

  /**
   * Remove um processo (soft delete)
   */
  delete(id: string): Promise<void>;

  /**
   * Adiciona uma movimentação ao processo
   */
  addMovimentacao(processoId: string, movimentacao: Omit<Movimentacao, 'id' | 'processo_id'>): Promise<Movimentacao>;

  /**
   * Obtém as movimentações de um processo
   */
  getMovimentacoes(processoId: string, limit?: number, offset?: number): Promise<Movimentacao[]>;

  /**
   * Adiciona processo aos favoritos do usuário
   */
  addToFavorites(processoId: string, userId: string): Promise<void>;

  /**
   * Remove processo dos favoritos do usuário
   */
  removeFromFavorites(processoId: string, userId: string): Promise<void>;

  /**
   * Verifica se processo está nos favoritos do usuário
   */
  isFavorite(processoId: string, userId: string): Promise<boolean>;

  /**
   * Lista processos favoritos do usuário
   */
  getFavorites(userId: string, options?: ProcessoQueryOptions): Promise<ProcessoQueryResult>;
}
