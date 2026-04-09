/**
 * Domain Entity: Movimentação
 * Representa uma movimentação processual
 */

export type TipoMovimentacao =
  | 'distribuicao'
  | 'citacao'
  | 'intimacao'
  | 'peticao'
  | 'despacho'
  | 'decisao_interlocutoria'
  | 'sentenca'
  | 'acordao'
  | 'recurso'
  | 'audiencia'
  | 'pericia'
  | 'juntada'
  | 'baixa'
  | 'transito_julgado'
  | 'cumprimento'
  | 'arquivamento'
  | 'desarquivamento'
  | 'suspensao'
  | 'outros';

export type SituacaoMovimentacao = 'pendente' | 'realizada' | 'cancelada';

export interface Movimentacao {
  id: string;
  processo_id: string;

  data: Date;
  data_disponibilizacao?: Date;   // Data de publicação no DJE

  tipo: TipoMovimentacao;
  codigo_cnj?: string;            // Código CNJ da movimentação (ex: "11385" para sentença)
  codigo_complemento?: string;

  descricao: string;              // Texto da movimentação
  descricao_completa?: string;    // Descrição detalhada

  // Para decisões
  magistrado?: {
    nome: string;
    cargo?: string;
  };

  // Documentos anexados
  documentos?: {
    id: string;
    nome: string;
    tipo: string;
    url?: string;
  }[];

  // Prazos gerados
  prazo?: {
    tipo: string;
    dias: number;
    fatal: boolean;
    data_inicio: Date;
    data_fim: Date;
  };

  // Valores envolvidos
  valores?: {
    tipo: string;       // "custas", "honorarios", "condenacao"
    valor: number;
  }[];

  situacao: SituacaoMovimentacao;
  publica: boolean;              // Se é visível ao público

  created_at?: Date;
  updated_at?: Date;
}

/**
 * Factory para criar Movimentação
 */
export function createMovimentacao(
  data: Partial<Movimentacao> & Pick<Movimentacao, 'processo_id' | 'data' | 'descricao'>
): Movimentacao {
  return {
    id: data.id || `mov_${data.processo_id}_${Date.now()}`,
    processo_id: data.processo_id,
    data: data.data,
    data_disponibilizacao: data.data_disponibilizacao,
    tipo: data.tipo || identificarTipoMovimentacao(data.descricao),
    codigo_cnj: data.codigo_cnj,
    codigo_complemento: data.codigo_complemento,
    descricao: data.descricao,
    descricao_completa: data.descricao_completa,
    magistrado: data.magistrado,
    documentos: data.documentos || [],
    prazo: data.prazo,
    valores: data.valores || [],
    situacao: data.situacao || 'realizada',
    publica: data.publica !== false,
    created_at: data.created_at || new Date(),
    updated_at: data.updated_at || new Date(),
  };
}

/**
 * Identifica o tipo de movimentação pela descrição
 */
export function identificarTipoMovimentacao(descricao: string): TipoMovimentacao {
  const desc = descricao.toLowerCase();

  if (desc.includes('distribu')) return 'distribuicao';
  if (desc.includes('citação') || desc.includes('citacao') || desc.includes('citado')) return 'citacao';
  if (desc.includes('intimação') || desc.includes('intimacao') || desc.includes('intimado')) return 'intimacao';
  if (desc.includes('petição') || desc.includes('peticao')) return 'peticao';
  if (desc.includes('despacho')) return 'despacho';
  if (desc.includes('sentença') || desc.includes('sentenca')) return 'sentenca';
  if (desc.includes('acórdão') || desc.includes('acordao')) return 'acordao';
  if (desc.includes('decisão') || desc.includes('decisao')) return 'decisao_interlocutoria';
  if (desc.includes('recurso') || desc.includes('apelação') || desc.includes('agravo')) return 'recurso';
  if (desc.includes('audiência') || desc.includes('audiencia')) return 'audiencia';
  if (desc.includes('perícia') || desc.includes('pericia') || desc.includes('perito')) return 'pericia';
  if (desc.includes('juntada')) return 'juntada';
  if (desc.includes('baixa')) return 'baixa';
  if (desc.includes('trânsito') || desc.includes('transito')) return 'transito_julgado';
  if (desc.includes('cumprimento')) return 'cumprimento';
  if (desc.includes('arquiv')) return 'arquivamento';
  if (desc.includes('suspen')) return 'suspensao';

  return 'outros';
}

/**
 * Verifica se a movimentação é uma decisão
 */
export function isDecisao(mov: Movimentacao): boolean {
  return ['despacho', 'decisao_interlocutoria', 'sentenca', 'acordao'].includes(mov.tipo);
}

/**
 * Verifica se a movimentação é terminal (encerra fase/processo)
 */
export function isMovimentacaoTerminal(mov: Movimentacao): boolean {
  return ['sentenca', 'acordao', 'transito_julgado', 'arquivamento'].includes(mov.tipo);
}

/**
 * Códigos CNJ das movimentações mais comuns
 */
export const CODIGOS_CNJ_MOVIMENTACAO: Record<string, TipoMovimentacao> = {
  '26': 'distribuicao',
  '11385': 'sentenca',
  '11009': 'despacho',
  '12019': 'citacao',
  '12020': 'intimacao',
  '60': 'baixa',
  '22': 'arquivamento',
  '85': 'audiencia',
  '11010': 'decisao_interlocutoria',
};
