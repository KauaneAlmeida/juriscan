/**
 * Domain Entity: Vara
 * Representa uma vara ou unidade judiciária
 */

export type TipoVara =
  | 'civel'
  | 'criminal'
  | 'familia'
  | 'fazenda_publica'
  | 'trabalho'
  | 'federal'
  | 'juizado_especial'
  | 'empresarial'
  | 'infancia_juventude'
  | 'execucao_penal'
  | 'vara_unica'
  | 'outro';

export interface VaraEstatisticas {
  total_processos_ativos: number;
  volume_mensal_medio: number;
  tempo_medio_sentenca_dias: number;
  taxa_acordo: number;
  taxa_procedencia: number;
}

export interface Vara {
  id: string;
  nome: string;                   // "1ª Vara Cível"
  numero?: number;                // 1, 2, 3...
  tipo: TipoVara;

  tribunal_sigla: string;         // "TJSP"
  comarca?: string;               // "São Paulo"
  foro?: string;                  // "Foro Central Cível"

  competencia?: string[];         // ["Procedimento Comum", "Execução de Título"]

  juiz_titular?: {
    id: string;
    nome: string;
  };

  contato?: {
    telefone?: string;
    email?: string;
    endereco?: string;
  };

  estatisticas?: VaraEstatisticas;

  ativa: boolean;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Factory para criar Vara
 */
export function createVara(data: Partial<Vara> & Pick<Vara, 'nome' | 'tipo' | 'tribunal_sigla'>): Vara {
  return {
    id: data.id || `vara_${data.tribunal_sigla.toLowerCase()}_${data.nome.toLowerCase().replace(/\s+/g, '_')}`,
    nome: data.nome,
    numero: data.numero,
    tipo: data.tipo,
    tribunal_sigla: data.tribunal_sigla.toUpperCase(),
    comarca: data.comarca,
    foro: data.foro,
    competencia: data.competencia || [],
    juiz_titular: data.juiz_titular,
    contato: data.contato,
    estatisticas: data.estatisticas,
    ativa: data.ativa !== false,
    created_at: data.created_at || new Date(),
    updated_at: data.updated_at || new Date(),
  };
}

/**
 * Identifica o tipo de vara pelo nome
 */
export function identificarTipoVara(nome: string): TipoVara {
  const nomeLower = nome.toLowerCase();

  if (nomeLower.includes('cível') || nomeLower.includes('civel')) return 'civel';
  if (nomeLower.includes('criminal') || nomeLower.includes('crime')) return 'criminal';
  if (nomeLower.includes('família') || nomeLower.includes('familia')) return 'familia';
  if (nomeLower.includes('fazenda')) return 'fazenda_publica';
  if (nomeLower.includes('trabalho')) return 'trabalho';
  if (nomeLower.includes('federal')) return 'federal';
  if (nomeLower.includes('juizado') || nomeLower.includes('especial')) return 'juizado_especial';
  if (nomeLower.includes('empresarial') || nomeLower.includes('falência')) return 'empresarial';
  if (nomeLower.includes('infância') || nomeLower.includes('juventude')) return 'infancia_juventude';
  if (nomeLower.includes('execução penal') || nomeLower.includes('execucao penal')) return 'execucao_penal';
  if (nomeLower.includes('única') || nomeLower.includes('unica')) return 'vara_unica';

  return 'outro';
}
