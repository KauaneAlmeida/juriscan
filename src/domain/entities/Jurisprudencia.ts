/**
 * Domain Entity: Jurisprudência
 * Representa uma decisão judicial (jurisprudência)
 */

export type TipoDecisao =
  | 'sentenca'
  | 'acordao'
  | 'decisao_monocratica'
  | 'sumula'
  | 'sumula_vinculante'
  | 'repercussao_geral'
  | 'recurso_repetitivo'
  | 'incidente_resolucao_demandas'
  | 'outro';

export type ResultadoDecisao =
  | 'provido'
  | 'parcialmente_provido'
  | 'nao_provido'
  | 'nao_conhecido'
  | 'prejudicado'
  | 'extinto'
  | 'homologacao_acordo'
  | 'outro';

export interface Ementa {
  texto: string;
  palavras_chave?: string[];
}

export interface VotoDecisao {
  magistrado: string;
  tipo: 'relator' | 'vogal' | 'revisor' | 'presidente';
  voto: 'favoravel' | 'contrario' | 'abstencao' | 'impedido';
  fundamentacao?: string;
}

export interface Jurisprudencia {
  id: string;

  // Identificação
  numero_processo: string;
  numero_acordao?: string;
  numero_registro?: string;

  // Classificação
  tipo: TipoDecisao;
  resultado?: ResultadoDecisao;
  unanimidade?: boolean;

  // Tribunal
  tribunal_sigla: string;
  tribunal_nome?: string;
  orgao_julgador?: string;         // "1ª Câmara de Direito Privado"
  turma?: string;
  comarca_origem?: string;

  // Magistrados
  relator: string;
  revisor?: string;
  votos?: VotoDecisao[];

  // Datas
  data_julgamento: Date;
  data_publicacao?: Date;
  data_registro?: Date;

  // Conteúdo
  ementa: Ementa;
  decisao?: string;                // Dispositivo da decisão
  inteiro_teor?: string;           // Texto completo
  inteiro_teor_url?: string;

  // Classificação temática
  classe_processual?: string;
  assuntos: string[];
  assuntos_codigos?: string[];
  palavras_chave?: string[];

  // Referências
  legislacao_citada?: {
    norma: string;                 // "Lei nº 8.078/1990"
    artigos?: string[];            // ["art. 6º", "art. 14"]
  }[];

  jurisprudencia_citada?: {
    tipo: string;                  // "Súmula", "Precedente"
    referencia: string;            // "Súmula 297 do STJ"
    tribunal?: string;
  }[];

  // Metadados de busca
  relevancia_score?: number;       // Score de relevância da busca
  citacoes?: number;               // Quantas vezes foi citada

  // Fonte
  fonte: {
    provider: string;
    url?: string;
    atualizado_em: Date;
  };

  created_at?: Date;
  updated_at?: Date;
}

/**
 * Factory para criar Jurisprudência
 */
export function createJurisprudencia(
  data: Partial<Jurisprudencia> & Pick<Jurisprudencia, 'numero_processo' | 'tipo' | 'tribunal_sigla' | 'relator' | 'data_julgamento' | 'ementa'>
): Jurisprudencia {
  return {
    id: data.id || `jurisp_${data.tribunal_sigla.toLowerCase()}_${data.numero_processo.replace(/\D/g, '').slice(-10)}`,
    numero_processo: data.numero_processo,
    numero_acordao: data.numero_acordao,
    numero_registro: data.numero_registro,
    tipo: data.tipo,
    resultado: data.resultado,
    unanimidade: data.unanimidade,
    tribunal_sigla: data.tribunal_sigla.toUpperCase(),
    tribunal_nome: data.tribunal_nome,
    orgao_julgador: data.orgao_julgador,
    turma: data.turma,
    comarca_origem: data.comarca_origem,
    relator: data.relator,
    revisor: data.revisor,
    votos: data.votos || [],
    data_julgamento: data.data_julgamento,
    data_publicacao: data.data_publicacao,
    data_registro: data.data_registro,
    ementa: data.ementa,
    decisao: data.decisao,
    inteiro_teor: data.inteiro_teor,
    inteiro_teor_url: data.inteiro_teor_url,
    classe_processual: data.classe_processual,
    assuntos: data.assuntos || [],
    assuntos_codigos: data.assuntos_codigos || [],
    palavras_chave: data.palavras_chave || extrairPalavrasChave(data.ementa.texto),
    legislacao_citada: data.legislacao_citada || [],
    jurisprudencia_citada: data.jurisprudencia_citada || [],
    relevancia_score: data.relevancia_score,
    citacoes: data.citacoes,
    fonte: data.fonte || { provider: 'manual', atualizado_em: new Date() },
    created_at: data.created_at || new Date(),
    updated_at: data.updated_at || new Date(),
  };
}

/**
 * Extrai palavras-chave da ementa
 */
export function extrairPalavrasChave(texto: string): string[] {
  // Remove palavras comuns e extrai termos relevantes
  const stopWords = new Set([
    'de', 'da', 'do', 'das', 'dos', 'a', 'o', 'as', 'os', 'um', 'uma',
    'e', 'ou', 'que', 'para', 'com', 'em', 'por', 'se', 'na', 'no',
    'nas', 'nos', 'ao', 'aos', 'pelo', 'pela', 'pelos', 'pelas',
    'seu', 'sua', 'seus', 'suas', 'este', 'esta', 'esse', 'essa',
    'isso', 'isto', 'aquele', 'aquela', 'como', 'mais', 'menos',
    'quando', 'onde', 'qual', 'quais', 'quem', 'porque', 'porquê',
    'ser', 'foi', 'foram', 'ter', 'teve', 'sendo', 'tendo',
  ]);

  const palavras = texto
    .toLowerCase()
    .replace(/[^\w\sáàâãéèêíïóôõöúç]/g, ' ')
    .split(/\s+/)
    .filter(p => p.length > 3 && !stopWords.has(p));

  // Conta frequência
  const frequencia = new Map<string, number>();
  palavras.forEach(p => {
    frequencia.set(p, (frequencia.get(p) || 0) + 1);
  });

  // Retorna as 10 mais frequentes
  return Array.from(frequencia.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([palavra]) => palavra);
}

/**
 * Extrai a ratio decidendi (razão de decidir) da ementa
 */
export function extrairRatioDecidendi(ementa: string): string[] {
  const ratios: string[] = [];

  // Padrões comuns de ratio decidendi
  const padroes = [
    /(?:entende-se|considera-se|configura-se|caracteriza-se)\s+(?:que\s+)?([^.]+)/gi,
    /(?:é\s+de\s+)?(?:direito|dever|obrigação)\s+(?:do|da)\s+([^.]+)/gi,
    /(?:não\s+)?(?:há|existe|cabe)\s+([^.]+)/gi,
    /(?:aplica-se|incide)\s+([^.]+)/gi,
  ];

  padroes.forEach(padrao => {
    let match;
    while ((match = padrao.exec(ementa)) !== null) {
      if (match[1] && match[1].length > 20) {
        ratios.push(match[1].trim());
      }
    }
  });

  return ratios.slice(0, 5);
}

/**
 * Verifica se é uma súmula
 */
export function isSumula(jurisprudencia: Jurisprudencia): boolean {
  return ['sumula', 'sumula_vinculante'].includes(jurisprudencia.tipo);
}

/**
 * Verifica se é precedente vinculante
 */
export function isPrecedenteVinculante(jurisprudencia: Jurisprudencia): boolean {
  return ['sumula_vinculante', 'repercussao_geral', 'recurso_repetitivo', 'incidente_resolucao_demandas'].includes(jurisprudencia.tipo);
}
