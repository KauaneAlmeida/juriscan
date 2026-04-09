/**
 * DataJud Adapter
 * Integração com a API pública do DataJud (CNJ)
 *
 * API Documentation: https://datajud-wiki.cnj.jus.br/
 * Base URL: https://api-publica.datajud.cnj.jus.br
 */

import {
  ILegalDataProvider,
  SearchProcessosParams,
  SearchJurisprudenciaParams,
  GetJurimetricsParams,
  SearchResult,
  ProviderHealth,
  ProviderMetadata,
  ProviderCapability,
} from '@/src/domain/repositories/ILegalDataProvider';

import {
  Processo,
  Jurisprudencia,
  JurimetricsData,
  Tribunal,
  createProcesso,
  createJurimetricsData,
} from '@/src/domain/entities';

/**
 * Converte data do DataJud para Date.
 * DataJud retorna datas em formatos inconsistentes:
 * - ISO: "2008-01-10T12:29:02.000Z"
 * - YYYYMMDDHHmmss: "20250914114635"
 * - Dados corrompidos: "9010-09-01T00:00:00.000Z", "42011031000000"
 * Valida que o ano está entre 1900-2100 para filtrar dados corrompidos.
 */
function parseDataJudDate(raw: string | number | undefined | null): Date | undefined {
  if (raw === undefined || raw === null) return undefined;
  const str = String(raw);

  // Tentar ISO primeiro (contém '-' ou 'T')
  if (str.includes('-') || str.includes('T')) {
    const d = new Date(str);
    if (!isNaN(d.getTime()) && d.getFullYear() >= 1900 && d.getFullYear() <= 2100) return d;
  }

  // Tentar formato YYYYMMDDHHmmss
  const s = str.replace(/\D/g, '');
  if (s.length >= 8) {
    const iso = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(8, 10) || '00'}:${s.slice(10, 12) || '00'}:${s.slice(12, 14) || '00'}`;
    const d = new Date(iso);
    if (!isNaN(d.getTime()) && d.getFullYear() >= 1900 && d.getFullYear() <= 2100) return d;
  }

  return undefined;
}

/**
 * Configuração do DataJud Adapter
 */
export interface DataJudConfig {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
}

/**
 * Resposta do Elasticsearch do DataJud
 */
interface DataJudSearchResponse {
  took: number;
  timed_out: boolean;
  hits: {
    total: {
      value: number;
      relation: 'eq' | 'gte';
    };
    max_score: number | null;
    hits: DataJudHit[];
  };
  aggregations?: Record<string, DataJudAggregation>;
}

interface DataJudHit {
  _index: string;
  _id: string;
  _score: number;
  _source: DataJudProcesso;
}

interface DataJudProcesso {
  id: string;
  numeroProcesso: string;
  classe: {
    codigo: number;
    nome: string;
  };
  sistema: {
    codigo: number;
    nome: string;
  };
  formato: {
    codigo: number;
    nome: string;
  };
  tribunal: string;
  dataHoraUltimaAtualizacao: string;
  grau: string;
  dataAjuizamento: string;
  movimentos: DataJudMovimento[];
  assuntos: DataJudAssunto[];
  orgaoJulgador?: {
    codigo: number;
    nome: string;
  };
  // Campos que podem ou não existir
  nivelSigilo?: number;
  valorCausa?: number;
}

interface DataJudMovimento {
  codigo: number;
  nome: string;
  dataHora: string;
  complementosTabelados?: {
    codigo: number;
    nome: string;
    valor: string;
  }[];
}

interface DataJudAssunto {
  codigo: number;
  nome: string;
}

interface DataJudAggregation {
  buckets?: { key: string; key_as_string?: string; doc_count: number }[];
  value?: number;
  doc_count?: number;
}

/**
 * Mapeamento de tribunais para índices do DataJud
 */
const TRIBUNAL_INDICES: Record<string, string> = {
  // Tribunais Superiores
  'STF': 'api_publica_stf',
  'STJ': 'api_publica_stj',
  'TST': 'api_publica_tst',
  'TSE': 'api_publica_tse',
  'STM': 'api_publica_stm',

  // Justiça Estadual
  'TJAC': 'api_publica_tjac',
  'TJAL': 'api_publica_tjal',
  'TJAM': 'api_publica_tjam',
  'TJAP': 'api_publica_tjap',
  'TJBA': 'api_publica_tjba',
  'TJCE': 'api_publica_tjce',
  'TJDFT': 'api_publica_tjdft',
  'TJES': 'api_publica_tjes',
  'TJGO': 'api_publica_tjgo',
  'TJMA': 'api_publica_tjma',
  'TJMG': 'api_publica_tjmg',
  'TJMS': 'api_publica_tjms',
  'TJMT': 'api_publica_tjmt',
  'TJPA': 'api_publica_tjpa',
  'TJPB': 'api_publica_tjpb',
  'TJPE': 'api_publica_tjpe',
  'TJPI': 'api_publica_tjpi',
  'TJPR': 'api_publica_tjpr',
  'TJRJ': 'api_publica_tjrj',
  'TJRN': 'api_publica_tjrn',
  'TJRO': 'api_publica_tjro',
  'TJRR': 'api_publica_tjrr',
  'TJRS': 'api_publica_tjrs',
  'TJSC': 'api_publica_tjsc',
  'TJSE': 'api_publica_tjse',
  'TJSP': 'api_publica_tjsp',
  'TJTO': 'api_publica_tjto',

  // Justiça do Trabalho
  'TRT1': 'api_publica_trt1',
  'TRT2': 'api_publica_trt2',
  'TRT3': 'api_publica_trt3',
  'TRT4': 'api_publica_trt4',
  'TRT5': 'api_publica_trt5',
  'TRT6': 'api_publica_trt6',
  'TRT7': 'api_publica_trt7',
  'TRT8': 'api_publica_trt8',
  'TRT9': 'api_publica_trt9',
  'TRT10': 'api_publica_trt10',
  'TRT11': 'api_publica_trt11',
  'TRT12': 'api_publica_trt12',
  'TRT13': 'api_publica_trt13',
  'TRT14': 'api_publica_trt14',
  'TRT15': 'api_publica_trt15',
  'TRT16': 'api_publica_trt16',
  'TRT17': 'api_publica_trt17',
  'TRT18': 'api_publica_trt18',
  'TRT19': 'api_publica_trt19',
  'TRT20': 'api_publica_trt20',
  'TRT21': 'api_publica_trt21',
  'TRT22': 'api_publica_trt22',
  'TRT23': 'api_publica_trt23',
  'TRT24': 'api_publica_trt24',

  // Justiça Federal
  'TRF1': 'api_publica_trf1',
  'TRF2': 'api_publica_trf2',
  'TRF3': 'api_publica_trf3',
  'TRF4': 'api_publica_trf4',
  'TRF5': 'api_publica_trf5',
  'TRF6': 'api_publica_trf6',
};

/**
 * DataJud Adapter - Implementação
 */
export class DataJudAdapter implements ILegalDataProvider {
  readonly name = 'datajud';

  private readonly baseUrl: string;
  private readonly apiKey: string | undefined;
  private readonly timeout: number;
  private readonly maxRetries: number;

  constructor(config: DataJudConfig = {}) {
    this.baseUrl = config.baseUrl || 'https://api-publica.datajud.cnj.jus.br';
    this.apiKey = config.apiKey || process.env.DATAJUD_API_KEY;
    this.timeout = config.timeout || 30000;
    this.maxRetries = config.maxRetries || 3;
  }

  /**
   * Retorna metadados do provider
   */
  getMetadata(): ProviderMetadata {
    const capabilities: ProviderCapability[] = [
      'search_processos',
      'get_processo',
      'get_jurimetrics',
      'get_tribunal_stats',
    ];

    return {
      name: 'DataJud - CNJ',
      version: '1.0',
      capabilities,
      tribunais_suportados: Object.keys(TRIBUNAL_INDICES),
      rate_limit: {
        requests_per_minute: 60,
        requests_per_day: 10000,
      },
      requer_autenticacao: true,
    };
  }

  /**
   * Verifica saúde do serviço
   */
  async healthCheck(): Promise<ProviderHealth> {
    const startTime = Date.now();

    try {
      // Faz uma busca simples para testar
      const response = await this.makeRequest<DataJudSearchResponse>('api_publica_tjsp/_search', {
        size: 1,
        query: { match_all: {} },
      });

      const latency = Date.now() - startTime;

      if (response.timed_out) {
        return {
          status: 'degraded',
          latency_ms: latency,
          last_check: new Date(),
          message: 'Serviço respondendo com timeout',
        };
      }

      return {
        status: 'healthy',
        latency_ms: latency,
        last_check: new Date(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        latency_ms: Date.now() - startTime,
        last_check: new Date(),
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  /**
   * Busca processos
   */
  async searchProcessos(params: SearchProcessosParams): Promise<SearchResult<Processo>> {
    const index = this.getIndex(params.tribunal);
    const query = this.buildSearchQuery(params);

    const body = {
      size: params.limit || 20,
      from: params.offset || 0,
      query,
      sort: this.buildSort(params),
    };

    try {
      const response = await this.makeRequest<DataJudSearchResponse>(`${index}/_search`, body);

      const processos = response.hits.hits.map(hit => this.mapToProcesso(hit._source));

      return {
        items: processos,
        total: response.hits.total.value,
        offset: params.offset || 0,
        limit: params.limit || 20,
        hasMore: (params.offset || 0) + processos.length < response.hits.total.value,
      };
    } catch (error) {
      console.error('[DataJud] Erro ao buscar processos:', error);
      throw new Error(`Erro ao buscar processos no DataJud: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Obtém processo pelo número
   */
  async getProcessoByNumero(numero: string): Promise<Processo | null> {
    const numeroLimpo = numero.replace(/\D/g, '');

    // Tenta identificar o tribunal pelo número
    const tribunal = this.identificarTribunalPorNumero(numeroLimpo);
    const index = tribunal ? TRIBUNAL_INDICES[tribunal] : 'api_publica_*';

    const body = {
      size: 1,
      query: {
        match: {
          numeroProcesso: numeroLimpo,
        },
      },
    };

    try {
      const response = await this.makeRequest<DataJudSearchResponse>(`${index}/_search`, body);

      if (response.hits.hits.length === 0) {
        return null;
      }

      return this.mapToProcesso(response.hits.hits[0]._source);
    } catch (error) {
      console.error('[DataJud] Erro ao buscar processo por número:', error);
      return null;
    }
  }

  /**
   * Busca jurisprudência (DataJud tem foco em processos, não jurisprudência)
   * Retorna resultado vazio - usar outro provider para jurisprudência
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async searchJurisprudencia(params: SearchJurisprudenciaParams): Promise<SearchResult<Jurisprudencia>> {
    // DataJud não é otimizado para busca de jurisprudência
    // Retorna vazio - deve usar Escavador ou outro provider
    return {
      items: [],
      total: 0,
      offset: 0,
      limit: 0,
      hasMore: false,
    };
  }

  /**
   * Obtém dados de jurimetria agregados
   */
  async getJurimetrics(params: GetJurimetricsParams): Promise<JurimetricsData> {
    const index = this.getIndex(params.tribunal);

    // DataJud tem defasagem nos dados - usar período histórico consolidado
    const now = new Date();
    const currentYear = now.getFullYear();
    const adjustedFim = new Date(currentYear - 1, 11, 31);  // 31/12 do ano passado
    const adjustedInicio = new Date(currentYear - 3, 0, 1);  // 01/01 de 3 anos atrás

    const adjustedParams = {
      ...params,
      periodo: {
        inicio: adjustedInicio,
        fim: adjustedFim,
      },
    };

    const body = {
      size: 0,
      query: this.buildJurimetricsQuery(adjustedParams),
      aggs: {
        total_processos: {
          value_count: { field: 'numeroProcesso.keyword' },
        },
        por_classe: {
          terms: { field: 'classe.nome.keyword', size: 20 },
        },
        por_assunto: {
          terms: { field: 'assuntos.nome.keyword', size: 20 },
        },
        por_orgao: {
          terms: { field: 'orgaoJulgador.nome.keyword', size: 20 },
        },
        // date_histogram não funciona em dataAjuizamento (campo armazenado como epoch_millis
        // de valores YYYYMMDDHHmmss), então usamos filters aggregation por ano
        por_ano: {
          filters: {
            filters: Object.fromEntries(
              Array.from(
                { length: adjustedFim.getFullYear() - adjustedInicio.getFullYear() + 1 },
                (_, i) => {
                  const year = adjustedInicio.getFullYear() + i;
                  return [`${year}`, {
                    range: {
                      dataAjuizamento: {
                        gte: `${year}0101000000`,
                        lte: `${year}1231235959`,
                      },
                    },
                  }];
                },
              ),
            ),
          },
        },
      },
    };

    try {
      const response = await this.makeRequest<DataJudSearchResponse>(`${index}/_search`, body);
      return this.mapToJurimetrics(response, adjustedParams);
    } catch (error) {
      console.error('[DataJud] Erro ao buscar jurimetria:', error);
      throw new Error(`Erro ao buscar jurimetria no DataJud: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Obtém informações do tribunal
   */
  async getTribunal(sigla: string): Promise<Tribunal | null> {
    const siglaUpper = sigla.toUpperCase();

    if (!TRIBUNAL_INDICES[siglaUpper]) {
      return null;
    }

    // Retorna informações básicas do tribunal
    // DataJud não tem endpoint específico para metadados de tribunal
    return {
      id: `tribunal_${siglaUpper.toLowerCase()}`,
      sigla: siglaUpper,
      nome: this.getNomeTribunal(siglaUpper),
      tipo: this.getTipoTribunal(siglaUpper),
      api: {
        disponivel: true,
        url_base: this.baseUrl,
        tipo: 'REST',
      },
    };
  }

  /**
   * Lista tribunais disponíveis
   */
  async listTribunais(): Promise<Tribunal[]> {
    return Object.keys(TRIBUNAL_INDICES).map(sigla => ({
      id: `tribunal_${sigla.toLowerCase()}`,
      sigla,
      nome: this.getNomeTribunal(sigla),
      tipo: this.getTipoTribunal(sigla),
      api: { disponivel: true },
    }));
  }

  // ============ Métodos Privados ============

  /**
   * Faz requisição HTTP para o DataJud
   */
  private async makeRequest<T>(endpoint: string, body: object): Promise<T> {
    const url = `${this.baseUrl}/${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `APIKey ${this.apiKey}`;
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        return await response.json() as T;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < this.maxRetries) {
          // Espera exponencial entre tentativas
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw lastError || new Error('Erro desconhecido na requisição');
  }

  /**
   * Obtém o índice do DataJud para o tribunal
   */
  private getIndex(tribunal?: string): string {
    if (!tribunal) {
      return 'api_publica_*';
    }

    const sigla = tribunal.toUpperCase();
    return TRIBUNAL_INDICES[sigla] || 'api_publica_*';
  }

  /**
   * Constrói query de busca do Elasticsearch
   */
  private buildSearchQuery(params: SearchProcessosParams): object {
    const must: object[] = [];
    const filter: object[] = [];

    if (params.numero) {
      must.push({
        match: { numeroProcesso: params.numero.replace(/\D/g, '') },
      });
    }

    if (params.classe) {
      must.push({
        match: { 'classe.nome': params.classe },
      });
    }

    if (params.assunto) {
      must.push({
        match: { 'assuntos.nome': params.assunto },
      });
    }

    if (params.parte) {
      // DataJud não expõe partes diretamente na API pública
      // Este filtro pode não funcionar
      must.push({
        multi_match: {
          query: params.parte,
          fields: ['partes.nome', 'partes.pessoa.nome'],
        },
      });
    }

    if (params.vara) {
      must.push({
        match: { 'orgaoJulgador.nome': params.vara },
      });
    }

    if (params.periodo) {
      filter.push({
        range: {
          dataAjuizamento: {
            gte: this.formatDateForDataJud(params.periodo.inicio),
            lte: this.formatDateForDataJud(params.periodo.fim),
          },
        },
      });
    }

    if (params.ano) {
      filter.push({
        range: {
          dataAjuizamento: {
            gte: `${params.ano}0101000000`,
            lte: `${params.ano}1231235959`,
          },
        },
      });
    }

    // Filtrar processos não sigilosos por padrão
    if (params.segredo_justica !== true) {
      filter.push({
        bool: {
          should: [
            { term: { nivelSigilo: 0 } },
            { bool: { must_not: { exists: { field: 'nivelSigilo' } } } },
          ],
        },
      });
    }

    if (must.length === 0 && filter.length === 0) {
      return { match_all: {} };
    }

    return {
      bool: {
        ...(must.length > 0 && { must }),
        ...(filter.length > 0 && { filter }),
      },
    };
  }

  /**
   * Formata data para o padrão do DataJud (YYYYMMDDHHmmss)
   */
  private formatDateForDataJud(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  /**
   * Constrói query para jurimetria
   */
  private buildJurimetricsQuery(params: GetJurimetricsParams): object {
    const filter: object[] = [];

    // Período é obrigatório - DataJud usa formato YYYYMMDDHHmmss
    const inicioFormatted = this.formatDateForDataJud(params.periodo.inicio);
    const fimFormatted = this.formatDateForDataJud(params.periodo.fim);

    filter.push({
      range: {
        dataAjuizamento: {
          gte: inicioFormatted,
          lte: fimFormatted,
        },
      },
    });

    if (params.classe) {
      filter.push({
        match: { 'classe.nome': params.classe },
      });
    }

    if (params.assunto) {
      filter.push({
        match: { 'assuntos.nome': params.assunto },
      });
    }

    if (params.materia) {
      filter.push({
        match: { 'assuntos.nome': params.materia },
      });
    }

    return {
      bool: { filter },
    };
  }

  /**
   * Constrói ordenação
   */
  private buildSort(params: SearchProcessosParams): object[] {
    const sortField = params.ordenar_por === 'data_atualizacao'
      ? 'dataHoraUltimaAtualizacao'
      : params.ordenar_por === 'relevancia'
        ? '_score'
        : 'dataAjuizamento';

    const sortOrder = params.ordem || 'desc';

    if (sortField === '_score') {
      return [{ _score: { order: sortOrder } }];
    }

    return [{ [sortField]: { order: sortOrder } }];
  }

  /**
   * Mapeia resposta do DataJud para entidade Processo
   */
  private mapToProcesso(source: DataJudProcesso): Processo {
    return createProcesso({
      id: source.id,
      numero: this.formatarNumeroProcesso(source.numeroProcesso),
      tribunal: {
        id: `tribunal_${source.tribunal.toLowerCase()}`,
        sigla: source.tribunal,
        nome: this.getNomeTribunal(source.tribunal),
        tipo: this.getTipoTribunal(source.tribunal),
      },
      classificacao: {
        classe: source.classe.nome,
        classe_codigo: String(source.classe.codigo),
        assuntos: source.assuntos.map(a => a.nome),
        assuntos_codigos: source.assuntos.map(a => String(a.codigo)),
      },
      vara: source.orgaoJulgador ? {
        id: `vara_${source.orgaoJulgador.codigo}`,
        nome: source.orgaoJulgador.nome,
        tipo: 'outro',
        tribunal_sigla: source.tribunal,
        ativa: true,
      } : undefined,
      valores: {
        causa: source.valorCausa || 0,
      },
      datas: {
        distribuicao: parseDataJudDate(source.dataAjuizamento) || new Date(),
        ultima_movimentacao: parseDataJudDate(source.dataHoraUltimaAtualizacao),
      },
      situacao: 'em_tramitacao',
      grau: source.grau === 'G1' ? 'primeiro' : source.grau === 'G2' ? 'segundo' : 'primeiro',
      movimentacoes: source.movimentos?.slice(0, 10).map(mov => ({
        id: `mov_${source.id}_${mov.codigo}_${mov.dataHora}`,
        processo_id: source.id,
        data: parseDataJudDate(mov.dataHora) || new Date(),
        tipo: 'outros' as const,
        codigo_cnj: String(mov.codigo),
        descricao: mov.nome,
        situacao: 'realizada' as const,
        publica: true,
      })) || [],
      segredo_justica: (source.nivelSigilo || 0) > 0,
      fonte: {
        provider: 'datajud',
        atualizado_em: parseDataJudDate(source.dataHoraUltimaAtualizacao) || new Date(),
      },
    });
  }

  /**
   * Mapeia resposta de agregação para JurimetricsData
   */
  private mapToJurimetrics(response: DataJudSearchResponse, params: GetJurimetricsParams): JurimetricsData {
    const aggs = response.aggregations || {};

    const totalProcessos = (aggs.total_processos as DataJudAggregation)?.value || 0;

    // Distribuição por classe
    const porClasse = ((aggs.por_classe as DataJudAggregation)?.buckets || []).map(b => ({
      classe: b.key,
      quantidade: b.doc_count,
      percentual: totalProcessos > 0 ? b.doc_count / totalProcessos : 0,
    }));

    // Distribuição por assunto
    const porAssunto = ((aggs.por_assunto as DataJudAggregation)?.buckets || []).map(b => ({
      assunto: b.key,
      quantidade: b.doc_count,
      percentual: totalProcessos > 0 ? b.doc_count / totalProcessos : 0,
    }));

    // Distribuição por vara/órgão
    const porVara = ((aggs.por_orgao as DataJudAggregation)?.buckets || []).map(b => ({
      vara: b.key,
      quantidade: b.doc_count,
      percentual: totalProcessos > 0 ? b.doc_count / totalProcessos : 0,
    }));

    // Volume por ano (via filters aggregation - date_histogram não funciona neste campo)
    const porAnoBuckets = aggs.por_ano as { buckets?: Record<string, { doc_count: number }> } | undefined;
    const porAno = porAnoBuckets?.buckets
      ? Object.entries(porAnoBuckets.buckets)
          .map(([key, val]) => ({ ano: parseInt(key, 10), quantidade: val.doc_count }))
          .filter(a => a.quantidade > 0)
          .sort((a, b) => a.ano - b.ano)
      : [];

    return createJurimetricsData({
      periodo: {
        inicio: params.periodo.inicio,
        fim: params.periodo.fim,
      },
      escopo: {
        tribunal: params.tribunal,
        tipo_acao: params.classe,
        materia: params.materia || params.assunto,
      },
      metricas: {
        total_processos: totalProcessos,
        taxas: {
          // DataJud não fornece resultados de julgamento diretamente
          // Estes valores são placeholders - precisam de análise adicional
          procedencia: 0,
          improcedencia: 0,
          parcial_procedencia: 0,
          acordo: 0,
          extincao_sem_merito: 0,
          outros: 1,
          total_decisoes: 0,
        },
        tempos: {
          // DataJud não fornece tempos de tramitação diretamente
          // Estes valores são placeholders
          distribuicao_citacao_dias: 0,
          citacao_sentenca_dias: 0,
          distribuicao_sentenca_dias: 0,
          sentenca_acordao_dias: 0,
          total_tramitacao_dias: 0,
        },
        valores: {
          media_valor_causa: 0, // DataJud não expõe valorCausa na API pública
          mediana_valor_causa: 0,
          media_condenacao: 0,
          mediana_condenacao: 0,
          total_condenacoes: 0,
        },
        volume: {
          por_mes: [], // DataJud não suporta date_histogram neste campo
          por_ano: porAno,
          total: totalProcessos,
        },
        distribuicao: {
          por_classe: porClasse,
          por_assunto: porAssunto,
          por_vara: porVara,
        },
      },
      metadata: {
        providers_consultados: ['datajud'],
        processos_analisados: totalProcessos,
        data_geracao: new Date(),
        confiabilidade: 0.7, // Confiabilidade média - faltam dados de resultado
        limitacoes: [
          'DataJud não fornece resultados de julgamento',
          'Tempos de tramitação não disponíveis',
          'Valores de causa e condenação não disponíveis na API pública',
        ],
      },
    });
  }

  /**
   * Formata número do processo no padrão CNJ
   */
  private formatarNumeroProcesso(numero: string): string {
    const n = numero.replace(/\D/g, '');
    if (n.length !== 20) return numero;
    return `${n.slice(0, 7)}-${n.slice(7, 9)}.${n.slice(9, 13)}.${n.slice(13, 14)}.${n.slice(14, 16)}.${n.slice(16, 20)}`;
  }

  /**
   * Identifica tribunal pelo número do processo
   */
  private identificarTribunalPorNumero(numero: string): string | null {
    if (numero.length !== 20) return null;

    const segmento = numero.charAt(13);
    const tribunal = numero.slice(14, 16);

    // Segmento 8 = Justiça Estadual
    if (segmento === '8') {
      const ufMap: Record<string, string> = {
        '01': 'TJAC', '02': 'TJAL', '03': 'TJAP', '04': 'TJAM', '05': 'TJBA',
        '06': 'TJCE', '07': 'TJDFT', '08': 'TJES', '09': 'TJGO', '10': 'TJMA',
        '11': 'TJMT', '12': 'TJMS', '13': 'TJMG', '14': 'TJPA', '15': 'TJPB',
        '16': 'TJPR', '17': 'TJPE', '18': 'TJPI', '19': 'TJRJ', '20': 'TJRN',
        '21': 'TJRS', '22': 'TJRO', '23': 'TJRR', '24': 'TJSC', '25': 'TJSE',
        '26': 'TJSP', '27': 'TJTO',
      };
      return ufMap[tribunal] || null;
    }

    // Segmento 5 = Justiça do Trabalho
    if (segmento === '5') {
      const num = parseInt(tribunal, 10);
      if (num === 0) return 'TST';
      return `TRT${num}`;
    }

    // Segmento 4 = Justiça Federal
    if (segmento === '4') {
      return `TRF${tribunal}`;
    }

    return null;
  }

  /**
   * Retorna nome do tribunal pela sigla
   */
  private getNomeTribunal(sigla: string): string {
    const nomes: Record<string, string> = {
      'STF': 'Supremo Tribunal Federal',
      'STJ': 'Superior Tribunal de Justiça',
      'TST': 'Tribunal Superior do Trabalho',
      'TJSP': 'Tribunal de Justiça do Estado de São Paulo',
      'TJRJ': 'Tribunal de Justiça do Estado do Rio de Janeiro',
      'TJMG': 'Tribunal de Justiça do Estado de Minas Gerais',
      'TRT2': 'Tribunal Regional do Trabalho da 2ª Região',
      'TRT15': 'Tribunal Regional do Trabalho da 15ª Região',
      // ... adicionar mais conforme necessário
    };
    return nomes[sigla] || `Tribunal ${sigla}`;
  }

  /**
   * Retorna tipo do tribunal pela sigla
   */
  private getTipoTribunal(sigla: string): 'estadual' | 'federal' | 'trabalho' | 'eleitoral' | 'militar' | 'superior' {
    if (['STF', 'STJ', 'TST', 'TSE', 'STM'].includes(sigla)) return 'superior';
    if (sigla.startsWith('TJ')) return 'estadual';
    if (sigla.startsWith('TRT') || sigla === 'TST') return 'trabalho';
    if (sigla.startsWith('TRF')) return 'federal';
    if (sigla.startsWith('TRE') || sigla === 'TSE') return 'eleitoral';
    return 'estadual';
  }
}

/**
 * Cria instância do DataJud Adapter
 */
export function createDataJudAdapter(config?: DataJudConfig): DataJudAdapter {
  return new DataJudAdapter(config);
}
