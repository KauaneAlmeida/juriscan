/**
 * Interface: IJurisprudenciaRepository
 * Repositório para persistência de jurisprudência
 */

import { Jurisprudencia } from '../entities';

/**
 * Filtros para busca de jurisprudência
 */
export interface JurisprudenciaFilters {
  // IDs
  ids?: string[];

  // Texto
  termo_busca?: string;
  ementa_contains?: string;

  // Tribunal
  tribunal_sigla?: string;
  tribunais?: string[];
  orgao_julgador?: string;

  // Classificação
  tipo?: string;
  tipos?: string[];
  classe_processual?: string;
  assuntos?: string[];
  materia?: string;

  // Magistrados
  relator?: string;
  relator_contains?: string;

  // Datas
  julgado_apos?: Date;
  julgado_antes?: Date;
  publicado_apos?: Date;
  publicado_antes?: Date;
  ano_julgamento?: number;

  // Resultado
  resultado?: string;
  unanimidade?: boolean;

  // Usuário
  user_id?: string;
  favoritos_user_id?: string;
  colecao_id?: string;
}

/**
 * Opções de paginação e ordenação
 */
export interface JurisprudenciaQueryOptions {
  // Paginação
  limit?: number;
  offset?: number;

  // Ordenação
  orderBy?: 'data_julgamento' | 'data_publicacao' | 'relevancia' | 'citacoes';
  orderDirection?: 'asc' | 'desc';

  // Busca semântica
  similaridade_minima?: number;  // Para busca vetorial, 0-1

  // Includes
  includeInteiroTeor?: boolean;
  includeVotos?: boolean;
}

/**
 * Resultado paginado
 */
export interface JurisprudenciaQueryResult {
  data: Jurisprudencia[];
  total: number;
  hasMore: boolean;
}

/**
 * Dados para criação de jurisprudência
 */
export interface CreateJurisprudenciaData {
  numero_processo: string;
  numero_acordao?: string;
  tipo: string;
  tribunal_sigla: string;
  orgao_julgador?: string;
  relator: string;
  data_julgamento: Date;
  data_publicacao?: Date;
  ementa_texto: string;
  ementa_palavras_chave?: string[];
  decisao?: string;
  inteiro_teor?: string;
  inteiro_teor_url?: string;
  classe_processual?: string;
  assuntos?: string[];
  resultado?: string;
  unanimidade?: boolean;
  fonte_provider?: string;
  fonte_url?: string;
  raw_data?: Record<string, unknown>;
}

/**
 * Dados para atualização de jurisprudência
 */
export interface UpdateJurisprudenciaData {
  inteiro_teor?: string;
  inteiro_teor_url?: string;
  citacoes?: number;
  relevancia_score?: number;
  raw_data?: Record<string, unknown>;
}

/**
 * Coleção de jurisprudências (pasta do usuário)
 */
export interface JurisprudenciaColecao {
  id: string;
  user_id: string;
  nome: string;
  descricao?: string;
  cor?: string;
  quantidade: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Interface do repositório de jurisprudência
 */
export interface IJurisprudenciaRepository {
  /**
   * Encontra uma jurisprudência pelo ID
   */
  findById(id: string): Promise<Jurisprudencia | null>;

  /**
   * Encontra pelo número do processo e tribunal
   */
  findByProcessoTribunal(numero: string, tribunal: string): Promise<Jurisprudencia | null>;

  /**
   * Busca jurisprudências com filtros
   */
  find(filters: JurisprudenciaFilters, options?: JurisprudenciaQueryOptions): Promise<JurisprudenciaQueryResult>;

  /**
   * Busca por texto (full-text search)
   */
  search(termo: string, filters?: JurisprudenciaFilters, options?: JurisprudenciaQueryOptions): Promise<JurisprudenciaQueryResult>;

  /**
   * Busca jurisprudências similares a um texto (busca semântica)
   */
  findSimilar(texto: string, limit?: number, filters?: JurisprudenciaFilters): Promise<Jurisprudencia[]>;

  /**
   * Conta jurisprudências que correspondem aos filtros
   */
  count(filters: JurisprudenciaFilters): Promise<number>;

  /**
   * Cria uma nova jurisprudência
   */
  create(data: CreateJurisprudenciaData): Promise<Jurisprudencia>;

  /**
   * Atualiza uma jurisprudência existente
   */
  update(id: string, data: UpdateJurisprudenciaData): Promise<Jurisprudencia>;

  /**
   * Atualiza ou cria jurisprudência (upsert)
   */
  upsert(numeroProcesso: string, tribunal: string, data: CreateJurisprudenciaData): Promise<Jurisprudencia>;

  /**
   * Remove uma jurisprudência (soft delete)
   */
  delete(id: string): Promise<void>;

  // === Coleções do Usuário ===

  /**
   * Cria uma coleção para o usuário
   */
  createColecao(userId: string, nome: string, descricao?: string): Promise<JurisprudenciaColecao>;

  /**
   * Lista coleções do usuário
   */
  listColecoes(userId: string): Promise<JurisprudenciaColecao[]>;

  /**
   * Adiciona jurisprudência a uma coleção
   */
  addToColecao(jurisprudenciaId: string, colecaoId: string): Promise<void>;

  /**
   * Remove jurisprudência de uma coleção
   */
  removeFromColecao(jurisprudenciaId: string, colecaoId: string): Promise<void>;

  /**
   * Lista jurisprudências de uma coleção
   */
  getColecaoItems(colecaoId: string, options?: JurisprudenciaQueryOptions): Promise<JurisprudenciaQueryResult>;

  // === Favoritos ===

  /**
   * Adiciona aos favoritos do usuário
   */
  addToFavorites(jurisprudenciaId: string, userId: string): Promise<void>;

  /**
   * Remove dos favoritos
   */
  removeFromFavorites(jurisprudenciaId: string, userId: string): Promise<void>;

  /**
   * Verifica se está nos favoritos
   */
  isFavorite(jurisprudenciaId: string, userId: string): Promise<boolean>;

  /**
   * Lista favoritos do usuário
   */
  getFavorites(userId: string, options?: JurisprudenciaQueryOptions): Promise<JurisprudenciaQueryResult>;

  // === Estatísticas ===

  /**
   * Obtém relatores mais frequentes
   */
  getTopRelatores(filters: JurisprudenciaFilters, limit?: number): Promise<{ relator: string; quantidade: number }[]>;

  /**
   * Obtém assuntos mais frequentes
   */
  getTopAssuntos(filters: JurisprudenciaFilters, limit?: number): Promise<{ assunto: string; quantidade: number }[]>;

  /**
   * Obtém distribuição por resultado
   */
  getDistribuicaoResultado(filters: JurisprudenciaFilters): Promise<{ resultado: string; quantidade: number }[]>;
}
