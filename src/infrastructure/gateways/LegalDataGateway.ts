/**
 * Legal Data Gateway
 * Orquestrador de múltiplos providers de dados jurídicos
 */

import {
  ILegalDataProvider,
  SearchProcessosParams,
  SearchJurisprudenciaParams,
  GetJurimetricsParams,
  SearchResult,
  ProviderHealth,
} from '@/src/domain/repositories/ILegalDataProvider';

import {
  Processo,
  Jurisprudencia,
  JurimetricsData,
  Tribunal,
  Juiz,
} from '@/src/domain/entities';

import { createDataJudAdapter } from '../adapters/legal-data/DataJudAdapter';
import {
  CacheGateway,
  getCache,
  CacheTTL,
  cacheKeyProcesso,
  cacheKeyJurimetrics,
  cacheKeyJuizPerfil,
  cacheKeySearch,
} from './CacheGateway';

/**
 * Configuração do Legal Data Gateway
 */
export interface LegalDataGatewayConfig {
  /** Habilitar DataJud */
  enableDataJud?: boolean;
  /** Habilitar cache */
  enableCache?: boolean;
  /** Timeout para requisições em ms */
  timeout?: number;
  /** API Key do DataJud */
  datajudApiKey?: string;
}

/**
 * Resultado unificado de busca
 */
export interface UnifiedSearchResult {
  processos: Processo[];
  jurisprudencia: Jurisprudencia[];
  jurimetrics: JurimetricsData | null;
  metadata: {
    providers_consultados: string[];
    timestamp: string;
    cached: boolean;
    erros?: string[];
  };
}

/**
 * Parâmetros unificados de busca
 */
export interface UnifiedSearchParams {
  // Texto livre
  termo?: string;

  // Filtros
  tribunal?: string;
  classe?: string;
  assunto?: string;
  materia?: string;
  parte?: string;

  // Período
  periodo?: {
    inicio: Date;
    fim: Date;
  };

  // Limites
  limit?: number;

  // O que buscar
  incluirProcessos?: boolean;
  incluirJurisprudencia?: boolean;
  incluirJurimetrics?: boolean;
}

/**
 * Legal Data Gateway - Implementação
 */
export class LegalDataGateway {
  private providers: Map<string, ILegalDataProvider>;
  private cache: CacheGateway;
  private readonly config: Required<LegalDataGatewayConfig>;

  constructor(config: LegalDataGatewayConfig = {}) {
    this.config = {
      enableDataJud: config.enableDataJud ?? true,
      enableCache: config.enableCache ?? true,
      timeout: config.timeout ?? 30000,
      datajudApiKey: config.datajudApiKey ?? process.env.DATAJUD_API_KEY ?? '',
    };

    this.providers = new Map();
    this.cache = getCache();

    // Inicializar providers
    this.initializeProviders();
  }

  /**
   * Inicializa os providers habilitados
   */
  private initializeProviders(): void {
    if (this.config.enableDataJud) {
      const datajud = createDataJudAdapter({
        apiKey: this.config.datajudApiKey,
        timeout: this.config.timeout,
      });
      this.providers.set('datajud', datajud);
    }

    // Adicionar mais providers aqui conforme necessário
    // if (this.config.enableEscavador) { ... }
  }

  /**
   * Busca dados de múltiplos providers em paralelo
   */
  async searchParallel(params: UnifiedSearchParams): Promise<UnifiedSearchResult> {
    const cacheKey = cacheKeySearch('processos', params as unknown as Record<string, unknown>);

    // Verificar cache
    if (this.config.enableCache) {
      const cached = await this.cache.get<UnifiedSearchResult>(cacheKey);
      if (cached) {
        console.log('📦 [LegalDataGateway] Cache hit:', cacheKey);
        return { ...cached, metadata: { ...cached.metadata, cached: true } };
      }
    }

    console.log('🔍 [LegalDataGateway] Buscando em providers:', Array.from(this.providers.keys()));

    const erros: string[] = [];

    // Executar buscas em paralelo
    const promises: Promise<unknown>[] = [];

    if (params.incluirProcessos !== false) {
      promises.push(this.searchProcessos(params).catch(e => {
        erros.push(`Processos: ${e.message}`);
        return { items: [], total: 0, offset: 0, limit: 0, hasMore: false };
      }));
    } else {
      promises.push(Promise.resolve({ items: [], total: 0, offset: 0, limit: 0, hasMore: false }));
    }

    if (params.incluirJurisprudencia !== false) {
      promises.push(this.searchJurisprudencia(params).catch(e => {
        erros.push(`Jurisprudência: ${e.message}`);
        return { items: [], total: 0, offset: 0, limit: 0, hasMore: false };
      }));
    } else {
      promises.push(Promise.resolve({ items: [], total: 0, offset: 0, limit: 0, hasMore: false }));
    }

    if (params.incluirJurimetrics !== false && params.tribunal && params.periodo) {
      // Não filtrar por classe/matéria - DataJud usa nomenclaturas específicas
      promises.push(this.getJurimetrics({
        tribunal: params.tribunal,
        periodo: params.periodo,
      }).catch(e => {
        erros.push(`Jurimetria: ${e.message}`);
        return null;
      }));
    } else {
      promises.push(Promise.resolve(null));
    }

    const [processosResult, jurisprudenciaResult, jurimetricsResult] = await Promise.all(promises);

    const unified: UnifiedSearchResult = {
      processos: (processosResult as SearchResult<Processo>).items,
      jurisprudencia: (jurisprudenciaResult as SearchResult<Jurisprudencia>).items,
      jurimetrics: jurimetricsResult as JurimetricsData | null,
      metadata: {
        providers_consultados: Array.from(this.providers.keys()),
        timestamp: new Date().toISOString(),
        cached: false,
        ...(erros.length > 0 && { erros }),
      },
    };

    // Salvar no cache
    if (this.config.enableCache && erros.length === 0) {
      await this.cache.set(cacheKey, unified, CacheTTL.MEDIUM);
    }

    return unified;
  }

  /**
   * Busca processo por número em todos os providers
   */
  async getProcesso(numero: string): Promise<Processo | null> {
    const cacheKey = cacheKeyProcesso(numero);

    // Verificar cache
    if (this.config.enableCache) {
      const cached = await this.cache.get<Processo>(cacheKey);
      if (cached) {
        console.log('📦 [LegalDataGateway] Cache hit processo:', numero);
        return cached;
      }
    }

    console.log('🔍 [LegalDataGateway] Buscando processo:', numero);

    // Tentar cada provider até encontrar
    for (const [name, provider] of Array.from(this.providers.entries())) {
      try {
        const processo = await provider.getProcessoByNumero(numero);
        if (processo) {
          console.log(`✅ [LegalDataGateway] Processo encontrado via ${name}`);

          // Salvar no cache
          if (this.config.enableCache) {
            await this.cache.set(cacheKey, processo, CacheTTL.PROCESSO);
          }

          return processo;
        }
      } catch (error) {
        console.warn(`⚠️ [LegalDataGateway] Erro ao buscar em ${name}:`, error);
      }
    }

    return null;
  }

  /**
   * Busca processos
   */
  async searchProcessos(params: SearchProcessosParams | UnifiedSearchParams): Promise<SearchResult<Processo>> {
    // Converter para SearchProcessosParams se necessário
    const searchParams: SearchProcessosParams = {
      tribunal: params.tribunal,
      classe: params.classe,
      assunto: params.assunto || (params as UnifiedSearchParams).materia,
      parte: params.parte,
      periodo: params.periodo,
      limit: params.limit || 20,
    };

    // Usar primeiro provider que suporta busca de processos
    for (const [name, provider] of Array.from(this.providers.entries())) {
      const metadata = provider.getMetadata();
      if (metadata.capabilities.includes('search_processos')) {
        try {
          console.log(`🔍 [LegalDataGateway] Buscando processos via ${name}`);
          return await provider.searchProcessos(searchParams);
        } catch (error) {
          console.warn(`⚠️ [LegalDataGateway] Erro em ${name}:`, error);
        }
      }
    }

    return { items: [], total: 0, offset: 0, limit: 0, hasMore: false };
  }

  /**
   * Busca jurisprudência
   */
  async searchJurisprudencia(params: SearchJurisprudenciaParams | UnifiedSearchParams): Promise<SearchResult<Jurisprudencia>> {
    // Converter para SearchJurisprudenciaParams se necessário
    const searchParams: SearchJurisprudenciaParams = {
      termo: (params as UnifiedSearchParams).termo,
      tribunal: params.tribunal,
      materia: (params as UnifiedSearchParams).materia || params.assunto,
      periodo: params.periodo,
      limit: params.limit || 20,
    };

    // Usar primeiro provider que suporta busca de jurisprudência
    for (const [name, provider] of Array.from(this.providers.entries())) {
      const metadata = provider.getMetadata();
      if (metadata.capabilities.includes('search_jurisprudencia')) {
        try {
          console.log(`🔍 [LegalDataGateway] Buscando jurisprudência via ${name}`);
          return await provider.searchJurisprudencia(searchParams);
        } catch (error) {
          console.warn(`⚠️ [LegalDataGateway] Erro em ${name}:`, error);
        }
      }
    }

    // DataJud não suporta jurisprudência bem, retornar vazio
    return { items: [], total: 0, offset: 0, limit: 0, hasMore: false };
  }

  /**
   * Obtém jurimetria agregada
   */
  async getJurimetrics(params: GetJurimetricsParams): Promise<JurimetricsData> {
    const cacheKey = cacheKeyJurimetrics(
      params.tribunal || 'all',
      params.periodo,
      { classe: params.classe, assunto: params.assunto }
    );

    // Verificar cache
    if (this.config.enableCache) {
      const cached = await this.cache.get<JurimetricsData>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Usar primeiro provider que suporta jurimetria
    for (const [name, provider] of Array.from(this.providers.entries())) {
      const metadata = provider.getMetadata();
      if (metadata.capabilities.includes('get_jurimetrics')) {
        try {
          const jurimetrics = await provider.getJurimetrics(params);

          if (this.config.enableCache) {
            await this.cache.set(cacheKey, jurimetrics, CacheTTL.JURIMETRICS);
          }
          return jurimetrics;
        } catch (error) {
          console.warn(`[LegalDataGateway] Erro ao obter jurimetria de ${name}:`, error);
        }
      }
    }

    throw new Error('Nenhum provider disponível para jurimetria');
  }

  /**
   * Obtém perfil de magistrado
   */
  async getJudgeProfile(nome: string, tribunal: string): Promise<Juiz | null> {
    const cacheKey = cacheKeyJuizPerfil(nome, tribunal);

    // Verificar cache
    if (this.config.enableCache) {
      const cached = await this.cache.get<Juiz>(cacheKey);
      if (cached) {
        console.log('📦 [LegalDataGateway] Cache hit perfil juiz:', nome);
        return cached;
      }
    }

    // Usar provider que suporta perfil de juiz
    for (const [name, provider] of Array.from(this.providers.entries())) {
      const metadata = provider.getMetadata();
      if (metadata.capabilities.includes('get_juiz_perfil') && provider.getJuizPerfil) {
        try {
          const juiz = await provider.getJuizPerfil({ nome, tribunal });
          if (juiz) {
            if (this.config.enableCache) {
              await this.cache.set(cacheKey, juiz, CacheTTL.JUIZ_PERFIL);
            }
            return juiz;
          }
        } catch (error) {
          console.warn(`⚠️ [LegalDataGateway] Erro em ${name}:`, error);
        }
      }
    }

    return null;
  }

  /**
   * Obtém informações de um tribunal
   */
  async getTribunal(sigla: string): Promise<Tribunal | null> {
    for (const [, provider] of Array.from(this.providers.entries())) {
      if (provider.getTribunal) {
        try {
          const tribunal = await provider.getTribunal(sigla);
          if (tribunal) return tribunal;
        } catch (error) {
          console.warn('[LegalDataGateway] Erro ao obter tribunal:', error);
        }
      }
    }
    return null;
  }

  /**
   * Lista tribunais disponíveis
   */
  async listTribunais(): Promise<Tribunal[]> {
    const tribunais: Tribunal[] = [];
    const siglasSeen = new Set<string>();

    for (const [, provider] of Array.from(this.providers.entries())) {
      if (provider.listTribunais) {
        try {
          const lista = await provider.listTribunais();
          for (const t of lista) {
            if (!siglasSeen.has(t.sigla)) {
              siglasSeen.add(t.sigla);
              tribunais.push(t);
            }
          }
        } catch (error) {
          console.warn('[LegalDataGateway] Erro ao listar tribunais:', error);
        }
      }
    }

    return tribunais;
  }

  /**
   * Verifica saúde de todos os providers
   */
  async healthCheck(): Promise<Map<string, ProviderHealth>> {
    const results = new Map<string, ProviderHealth>();

    for (const [name, provider] of Array.from(this.providers.entries())) {
      try {
        const health = await provider.healthCheck();
        results.set(name, health);
      } catch (error) {
        results.set(name, {
          status: 'unhealthy',
          last_check: new Date(),
          message: error instanceof Error ? error.message : 'Erro desconhecido',
        });
      }
    }

    return results;
  }

  /**
   * Invalida cache para um tribunal
   */
  async invalidateCacheTribunal(tribunal: string): Promise<void> {
    if (this.config.enableCache) {
      await this.cache.invalidatePattern(`*${tribunal}*`);
    }
  }

  /**
   * Retorna estatísticas do cache
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Retorna lista de providers ativos
   */
  getActiveProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}

/**
 * Instância singleton do gateway
 */
let gatewayInstance: LegalDataGateway | null = null;

/**
 * Obtém instância do gateway (singleton)
 */
export function getLegalDataGateway(config?: LegalDataGatewayConfig): LegalDataGateway {
  if (!gatewayInstance) {
    gatewayInstance = new LegalDataGateway(config);
  }
  return gatewayInstance;
}

/**
 * Cria nova instância do gateway
 */
export function createLegalDataGateway(config?: LegalDataGatewayConfig): LegalDataGateway {
  return new LegalDataGateway(config);
}
