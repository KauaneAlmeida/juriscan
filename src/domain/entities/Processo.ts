/**
 * Domain Entity: Processo
 * Representa um processo judicial no sistema judiciário brasileiro
 */

import { Tribunal } from './Tribunal';
import { Vara } from './Vara';
import { Juiz } from './Juiz';
import { Parte } from './Parte';
import { Movimentacao } from './Movimentacao';

export type GrauJurisdicao = 'primeiro' | 'segundo' | 'superior' | 'supremo';

export type SituacaoProcesso =
  | 'em_tramitacao'
  | 'suspenso'
  | 'sobrestado'
  | 'arquivado'
  | 'baixado'
  | 'transito_julgado';

export type ResultadoProcesso =
  | 'procedente'
  | 'improcedente'
  | 'parcialmente_procedente'
  | 'acordo'
  | 'extincao_sem_merito'
  | 'desistencia'
  | 'em_andamento';

export interface ProcessoValores {
  causa: number;
  condenacao?: number;
  acordo?: number;
  honorarios?: number;
  custas?: number;
  correcao_monetaria?: number;
}

export interface ProcessoDatas {
  distribuicao: Date;
  citacao?: Date;
  audiencia?: Date;
  sentenca?: Date;
  acordao?: Date;
  transito_julgado?: Date;
  arquivamento?: Date;
  ultima_movimentacao?: Date;
}

export interface ProcessoClassificacao {
  classe: string;                    // "Procedimento Comum Cível"
  classe_codigo?: string;            // Código CNJ
  assuntos: string[];                // ["Indenização por Dano Moral", "Responsabilidade Civil"]
  assuntos_codigos?: string[];       // Códigos CNJ dos assuntos
  competencia?: string;              // "Cível"
  natureza?: 'publica' | 'privada';
}

export interface Processo {
  id: string;
  numero: string;                    // "1234567-89.2024.8.26.0100"
  numero_alternativo?: string;       // Número antigo, se houver

  grau: GrauJurisdicao;
  instancia?: number;                // 1, 2, 3 (especial), 4 (extraordinário)

  tribunal: Tribunal;
  vara?: Vara;

  classificacao: ProcessoClassificacao;

  partes: {
    polo_ativo: Parte[];
    polo_passivo: Parte[];
    terceiros?: Parte[];
  };

  valores: ProcessoValores;
  datas: ProcessoDatas;

  situacao: SituacaoProcesso;
  resultado?: ResultadoProcesso;

  // Magistrados
  juiz?: Juiz;                       // 1º grau
  relator?: Juiz;                    // 2º grau em diante
  revisor?: Juiz;

  // Relacionamentos
  processo_originario?: string;      // Número do processo de origem (se recurso)
  processos_relacionados?: string[]; // Outros processos vinculados

  // Movimentações
  movimentacoes: Movimentacao[];
  total_movimentacoes?: number;

  // Metadados
  segredo_justica: boolean;
  justica_gratuita: boolean;
  prioridade?: 'idoso' | 'doenca_grave' | 'crianca_adolescente' | 'outro';

  // Dados da fonte
  fonte: {
    provider: string;              // "datajud", "tjsp", "escavador"
    url?: string;
    atualizado_em: Date;
  };

  created_at?: Date;
  updated_at?: Date;
}

/**
 * Factory para criar Processo
 */
export function createProcesso(
  data: Partial<Processo> & Pick<Processo, 'numero' | 'tribunal' | 'classificacao'>
): Processo {
  return {
    id: data.id || `proc_${data.numero.replace(/\D/g, '')}`,
    numero: formatarNumeroProcesso(data.numero),
    numero_alternativo: data.numero_alternativo,
    grau: data.grau || identificarGrau(data.numero),
    instancia: data.instancia,
    tribunal: data.tribunal,
    vara: data.vara,
    classificacao: data.classificacao,
    partes: data.partes || { polo_ativo: [], polo_passivo: [] },
    valores: data.valores || { causa: 0 },
    datas: data.datas || { distribuicao: new Date() },
    situacao: data.situacao || 'em_tramitacao',
    resultado: data.resultado,
    juiz: data.juiz,
    relator: data.relator,
    revisor: data.revisor,
    processo_originario: data.processo_originario,
    processos_relacionados: data.processos_relacionados || [],
    movimentacoes: data.movimentacoes || [],
    total_movimentacoes: data.total_movimentacoes,
    segredo_justica: data.segredo_justica || false,
    justica_gratuita: data.justica_gratuita || false,
    prioridade: data.prioridade,
    fonte: data.fonte || { provider: 'manual', atualizado_em: new Date() },
    created_at: data.created_at || new Date(),
    updated_at: data.updated_at || new Date(),
  };
}

/**
 * Formata número do processo no padrão CNJ
 * NNNNNNN-DD.AAAA.J.TR.OOOO
 */
export function formatarNumeroProcesso(numero: string): string {
  const numeros = numero.replace(/\D/g, '');

  if (numeros.length !== 20) {
    // Se não tem 20 dígitos, retorna como está
    return numero;
  }

  // NNNNNNN-DD.AAAA.J.TR.OOOO
  return `${numeros.slice(0, 7)}-${numeros.slice(7, 9)}.${numeros.slice(9, 13)}.${numeros.slice(13, 14)}.${numeros.slice(14, 16)}.${numeros.slice(16, 20)}`;
}

/**
 * Extrai informações do número do processo CNJ
 */
export function parseNumeroProcesso(numero: string): {
  sequencial: string;
  digito_verificador: string;
  ano: number;
  segmento_justica: number;
  tribunal: string;
  origem: string;
} | null {
  const numeros = numero.replace(/\D/g, '');

  if (numeros.length !== 20) return null;

  return {
    sequencial: numeros.slice(0, 7),
    digito_verificador: numeros.slice(7, 9),
    ano: parseInt(numeros.slice(9, 13), 10),
    segmento_justica: parseInt(numeros.slice(13, 14), 10),
    tribunal: numeros.slice(14, 16),
    origem: numeros.slice(16, 20),
  };
}

/**
 * Identifica o grau de jurisdição pelo número
 */
export function identificarGrau(numero: string): GrauJurisdicao {
  const parsed = parseNumeroProcesso(numero);
  if (!parsed) return 'primeiro';

  // Baseado no segmento de justiça e tribunal
  // 8 = Justiça Estadual, 5 = Justiça do Trabalho, 4 = Justiça Federal
  // Tribunais superiores: STJ (04), STF (01), TST (05)

  const { tribunal } = parsed;

  if (['01'].includes(tribunal)) return 'supremo';    // STF
  if (['04', '05', '06', '07'].includes(tribunal)) return 'superior'; // STJ, TST, TSE, STM

  return 'primeiro';
}

/**
 * Calcula o tempo de tramitação em dias
 */
export function calcularTempoTramitacao(processo: Processo): number | null {
  const inicio = processo.datas.distribuicao;
  const fim = processo.datas.transito_julgado ||
    processo.datas.arquivamento ||
    processo.datas.ultima_movimentacao ||
    new Date();

  if (!inicio) return null;

  const diffTime = fim.getTime() - inicio.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Verifica se o processo está ativo
 */
export function isProcessoAtivo(processo: Processo): boolean {
  return ['em_tramitacao', 'suspenso', 'sobrestado'].includes(processo.situacao);
}

/**
 * Obtém a parte principal do polo ativo
 */
export function getAutorPrincipal(processo: Processo): Parte | undefined {
  return processo.partes.polo_ativo.find(p => p.principal) || processo.partes.polo_ativo[0];
}

/**
 * Obtém a parte principal do polo passivo
 */
export function getReuPrincipal(processo: Processo): Parte | undefined {
  return processo.partes.polo_passivo.find(p => p.principal) || processo.partes.polo_passivo[0];
}
