/**
 * Cache Gateway
 * Sistema de cache em múltiplas camadas: Memória -> Supabase
 */

/**
 * Interface para item de cache
 */
interface CacheItem<T> {
  key: string;
  value: T;
  expiresAt: number;  // Unix timestamp
  createdAt: number;
  hits: number;
}

/**
 * Configuração do cache
 */
export interface CacheConfig {
  /** TTL padrão em segundos */
  defaultTTL?: number;
  /** Tamanho máximo do cache em memória */
  maxMemoryItems?: number;
  /** Prefixo para chaves */
  prefix?: string;
  /** Habilitar cache em memória */
  enableMemory?: boolean;
  /** Habilitar cache no Supabase */
  enableSupabase?: boolean;
}

/**
 * Estatísticas do cache
 */
export interface CacheStats {
  memoryHits: number;
  memoryMisses: number;
  supabaseHits: number;
  supabaseMisses: number;
  totalItems: number;
  hitRate: number;
}

/**
 * Cache Gateway - Implementação
 */
export class CacheGateway {
  private memoryCache: Map<string, CacheItem<unknown>>;
  private readonly config: Required<CacheConfig>;
  private stats: CacheStats;

  constructor(config: CacheConfig = {}) {
    this.config = {
      defaultTTL: config.defaultTTL ?? 3600,           // 1 hora
      maxMemoryItems: config.maxMemoryItems ?? 1000,
      prefix: config.prefix ?? 'juriscan:',
      enableMemory: config.enableMemory ?? true,
      enableSupabase: config.enableSupabase ?? false,  // Desabilitado por padrão
    };

    this.memoryCache = new Map();
    this.stats = {
      memoryHits: 0,
      memoryMisses: 0,
      supabaseHits: 0,
      supabaseMisses: 0,
      totalItems: 0,
      hitRate: 0,
    };

    // Limpar itens expirados periodicamente
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanup(), 60000); // A cada minuto
    }
  }

  /**
   * Obtém valor do cache
   */
  async get<T>(key: string): Promise<T | null> {
    const fullKey = this.getFullKey(key);

    // Tentar memória primeiro
    if (this.config.enableMemory) {
      const memoryItem = this.memoryCache.get(fullKey) as CacheItem<T> | undefined;

      if (memoryItem) {
        if (memoryItem.expiresAt > Date.now()) {
          memoryItem.hits++;
          this.stats.memoryHits++;
          this.updateHitRate();
          return memoryItem.value;
        } else {
          // Expirado - remover
          this.memoryCache.delete(fullKey);
        }
      }

      this.stats.memoryMisses++;
    }

    // Tentar Supabase se habilitado
    if (this.config.enableSupabase) {
      try {
        const supabaseValue = await this.getFromSupabase<T>(fullKey);
        if (supabaseValue !== null) {
          this.stats.supabaseHits++;

          // Promover para memória
          if (this.config.enableMemory) {
            this.setMemory(fullKey, supabaseValue, this.config.defaultTTL);
          }

          this.updateHitRate();
          return supabaseValue;
        }
        this.stats.supabaseMisses++;
      } catch (error) {
        console.warn('[Cache] Erro ao buscar do Supabase:', error);
      }
    }

    this.updateHitRate();
    return null;
  }

  /**
   * Define valor no cache
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const fullKey = this.getFullKey(key);
    const ttl = ttlSeconds ?? this.config.defaultTTL;

    // Salvar em memória
    if (this.config.enableMemory) {
      this.setMemory(fullKey, value, ttl);
    }

    // Salvar no Supabase se habilitado
    if (this.config.enableSupabase) {
      try {
        await this.setInSupabase(fullKey, value, ttl);
      } catch (error) {
        console.warn('[Cache] Erro ao salvar no Supabase:', error);
      }
    }
  }

  /**
   * Remove valor do cache
   */
  async delete(key: string): Promise<void> {
    const fullKey = this.getFullKey(key);

    // Remover da memória
    this.memoryCache.delete(fullKey);

    // Remover do Supabase
    if (this.config.enableSupabase) {
      try {
        await this.deleteFromSupabase(fullKey);
      } catch (error) {
        console.warn('[Cache] Erro ao remover do Supabase:', error);
      }
    }
  }

  /**
   * Verifica se chave existe
   */
  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  /**
   * Obtém ou define valor (get-or-set pattern)
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttlSeconds);
    return value;
  }

  /**
   * Limpa cache por padrão de chave
   */
  async invalidatePattern(pattern: string): Promise<number> {
    const fullPattern = this.getFullKey(pattern);
    let count = 0;

    // Limpar memória
    const keys = Array.from(this.memoryCache.keys());
    for (const key of keys) {
      if (key.includes(fullPattern) || this.matchPattern(key, fullPattern)) {
        this.memoryCache.delete(key);
        count++;
      }
    }

    // Limpar Supabase
    if (this.config.enableSupabase) {
      try {
        const supabaseCount = await this.invalidatePatternSupabase(fullPattern);
        count += supabaseCount;
      } catch (error) {
        console.warn('[Cache] Erro ao invalidar padrão no Supabase:', error);
      }
    }

    return count;
  }

  /**
   * Limpa todo o cache
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();

    if (this.config.enableSupabase) {
      try {
        await this.clearSupabase();
      } catch (error) {
        console.warn('[Cache] Erro ao limpar Supabase:', error);
      }
    }

    this.stats = {
      memoryHits: 0,
      memoryMisses: 0,
      supabaseHits: 0,
      supabaseMisses: 0,
      totalItems: 0,
      hitRate: 0,
    };
  }

  /**
   * Retorna estatísticas do cache
   */
  getStats(): CacheStats {
    this.stats.totalItems = this.memoryCache.size;
    return { ...this.stats };
  }

  // ============ Métodos Privados ============

  /**
   * Obtém chave completa com prefixo
   */
  private getFullKey(key: string): string {
    return `${this.config.prefix}${key}`;
  }

  /**
   * Define valor na memória
   */
  private setMemory<T>(fullKey: string, value: T, ttlSeconds: number): void {
    // Verificar limite de tamanho
    if (this.memoryCache.size >= this.config.maxMemoryItems) {
      this.evictOldest();
    }

    const item: CacheItem<T> = {
      key: fullKey,
      value,
      expiresAt: Date.now() + (ttlSeconds * 1000),
      createdAt: Date.now(),
      hits: 0,
    };

    this.memoryCache.set(fullKey, item);
  }

  /**
   * Remove itens mais antigos (LRU simplificado)
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    const entries = Array.from(this.memoryCache.entries());
    for (const [key, item] of entries) {
      // Priorizar remoção de itens com menos hits e mais antigos
      const score = item.createdAt - (item.hits * 1000);
      if (score < oldestTime) {
        oldestTime = score;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
    }
  }

  /**
   * Limpa itens expirados
   */
  private cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.memoryCache.entries());
    for (const [key, item] of entries) {
      if (item.expiresAt <= now) {
        this.memoryCache.delete(key);
      }
    }
  }

  /**
   * Atualiza taxa de acerto
   */
  private updateHitRate(): void {
    const totalRequests = this.stats.memoryHits + this.stats.memoryMisses +
      this.stats.supabaseHits + this.stats.supabaseMisses;
    const totalHits = this.stats.memoryHits + this.stats.supabaseHits;

    this.stats.hitRate = totalRequests > 0 ? totalHits / totalRequests : 0;
  }

  /**
   * Verifica se chave corresponde ao padrão
   */
  private matchPattern(key: string, pattern: string): boolean {
    // Padrão simples com wildcard *
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regex.test(key);
  }

  // ============ Métodos Supabase (Stubs) ============

  /**
   * Obtém valor do Supabase
   * TODO: Implementar quando necessário
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async getFromSupabase<T>(key: string): Promise<T | null> {
    // Implementação futura - usar tabela de cache no Supabase
    // const { data } = await supabase.from('cache').select('value, expires_at').eq('key', key).single();
    // if (data && new Date(data.expires_at) > new Date()) return data.value as T;
    return null;
  }

  /**
   * Define valor no Supabase
   * TODO: Implementar quando necessário
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async setInSupabase<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    // Implementação futura
    // await supabase.from('cache').upsert({ key, value, expires_at: new Date(Date.now() + ttl * 1000) });
  }

  /**
   * Remove valor do Supabase
   * TODO: Implementar quando necessário
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async deleteFromSupabase(key: string): Promise<void> {
    // Implementação futura
    // await supabase.from('cache').delete().eq('key', key);
  }

  /**
   * Invalida padrão no Supabase
   * TODO: Implementar quando necessário
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async invalidatePatternSupabase(pattern: string): Promise<number> {
    // Implementação futura
    // const { count } = await supabase.from('cache').delete().like('key', pattern);
    return 0;
  }

  /**
   * Limpa cache no Supabase
   * TODO: Implementar quando necessário
   */
  private async clearSupabase(): Promise<void> {
    // Implementação futura
    // await supabase.from('cache').delete().like('key', this.config.prefix + '%');
  }
}

/**
 * Instância singleton do cache
 */
let cacheInstance: CacheGateway | null = null;

/**
 * Obtém instância do cache (singleton)
 */
export function getCache(config?: CacheConfig): CacheGateway {
  if (!cacheInstance) {
    cacheInstance = new CacheGateway(config);
  }
  return cacheInstance;
}

/**
 * Cria nova instância do cache
 */
export function createCache(config?: CacheConfig): CacheGateway {
  return new CacheGateway(config);
}

/**
 * TTLs comuns
 */
export const CacheTTL = {
  /** 5 minutos - para dados que mudam frequentemente */
  SHORT: 300,
  /** 1 hora - padrão */
  MEDIUM: 3600,
  /** 24 horas - para dados relativamente estáveis */
  LONG: 86400,
  /** 7 dias - para dados históricos */
  VERY_LONG: 604800,
  /** Para jurimetria: 1 hora */
  JURIMETRICS: 3600,
  /** Para processos individuais: 30 minutos */
  PROCESSO: 1800,
  /** Para jurisprudência: 24 horas */
  JURISPRUDENCIA: 86400,
  /** Para perfil de juiz: 24 horas */
  JUIZ_PERFIL: 86400,
} as const;

/**
 * Gera chave de cache para processo
 */
export function cacheKeyProcesso(numero: string): string {
  return `processo:${numero.replace(/\D/g, '')}`;
}

/**
 * Gera chave de cache para jurimetria
 */
export function cacheKeyJurimetrics(
  tribunal: string,
  periodo: { inicio: Date; fim: Date },
  filtros?: { classe?: string; assunto?: string }
): string {
  const parts = [
    'jurimetrics',
    tribunal,
    periodo.inicio.toISOString().slice(0, 10),
    periodo.fim.toISOString().slice(0, 10),
  ];

  if (filtros?.classe) parts.push(`c:${filtros.classe}`);
  if (filtros?.assunto) parts.push(`a:${filtros.assunto}`);

  return parts.join(':');
}

/**
 * Gera chave de cache para perfil de juiz
 */
export function cacheKeyJuizPerfil(nome: string, tribunal: string): string {
  const nomeSlug = nome.toLowerCase().replace(/\s+/g, '_').slice(0, 30);
  return `juiz:${tribunal}:${nomeSlug}`;
}

/**
 * Gera chave de cache para busca
 */
export function cacheKeySearch(
  tipo: 'processos' | 'jurisprudencia',
  params: Record<string, unknown>
): string {
  const hash = JSON.stringify(params);
  const hashBase64 = Buffer.from(hash).toString('base64').slice(0, 32);
  return `search:${tipo}:${hashBase64}`;
}
