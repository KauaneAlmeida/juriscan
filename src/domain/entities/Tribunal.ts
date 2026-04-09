/**
 * Domain Entity: Tribunal
 * Representa um tribunal do sistema judiciário brasileiro
 */

export type TipoTribunal =
  | 'estadual'      // TJ (Tribunais de Justiça)
  | 'federal'       // TRF (Tribunais Regionais Federais)
  | 'trabalho'      // TRT (Tribunais Regionais do Trabalho)
  | 'eleitoral'     // TRE (Tribunais Regionais Eleitorais)
  | 'militar'       // TJM / STM
  | 'superior';     // STJ, STF, TST, TSE

export interface TribunalAPI {
  disponivel: boolean;
  url_base?: string;
  tipo?: 'REST' | 'SOAP' | 'GraphQL';
  requer_certificado?: boolean;
}

export interface TribunalEstatisticas {
  total_magistrados: number;
  total_varas: number;
  total_comarcas?: number;
  volume_anual: number;
  tempo_medio_tramitacao_dias?: number;
}

export interface Tribunal {
  id: string;
  sigla: string;               // "TJSP", "TRT2", "STJ"
  nome: string;                // "Tribunal de Justiça do Estado de São Paulo"
  tipo: TipoTribunal;
  uf?: string;                 // "SP", "RJ" (null para superiores)
  regiao?: number;             // 1-5 para TRFs, 1-24 para TRTs

  endereco?: {
    logradouro: string;
    cidade: string;
    uf: string;
    cep: string;
  };

  contato?: {
    telefone?: string;
    email?: string;
    site?: string;
  };

  estatisticas?: TribunalEstatisticas;
  api?: TribunalAPI;

  created_at?: Date;
  updated_at?: Date;
}

/**
 * Factory para criar Tribunal com valores padrão
 */
export function createTribunal(data: Partial<Tribunal> & Pick<Tribunal, 'sigla' | 'nome' | 'tipo'>): Tribunal {
  return {
    id: data.id || `tribunal_${data.sigla.toLowerCase()}`,
    sigla: data.sigla.toUpperCase(),
    nome: data.nome,
    tipo: data.tipo,
    uf: data.uf,
    regiao: data.regiao,
    endereco: data.endereco,
    contato: data.contato,
    estatisticas: data.estatisticas,
    api: data.api || { disponivel: false },
    created_at: data.created_at || new Date(),
    updated_at: data.updated_at || new Date(),
  };
}

/**
 * Lista de tribunais conhecidos
 */
export const TRIBUNAIS_CONHECIDOS: Record<string, Partial<Tribunal>> = {
  // Tribunais Superiores
  STF: { sigla: 'STF', nome: 'Supremo Tribunal Federal', tipo: 'superior' },
  STJ: { sigla: 'STJ', nome: 'Superior Tribunal de Justiça', tipo: 'superior' },
  TST: { sigla: 'TST', nome: 'Tribunal Superior do Trabalho', tipo: 'superior' },
  TSE: { sigla: 'TSE', nome: 'Tribunal Superior Eleitoral', tipo: 'superior' },
  STM: { sigla: 'STM', nome: 'Superior Tribunal Militar', tipo: 'militar' },

  // Tribunais de Justiça (estaduais)
  TJSP: { sigla: 'TJSP', nome: 'Tribunal de Justiça do Estado de São Paulo', tipo: 'estadual', uf: 'SP' },
  TJRJ: { sigla: 'TJRJ', nome: 'Tribunal de Justiça do Estado do Rio de Janeiro', tipo: 'estadual', uf: 'RJ' },
  TJMG: { sigla: 'TJMG', nome: 'Tribunal de Justiça do Estado de Minas Gerais', tipo: 'estadual', uf: 'MG' },
  TJRS: { sigla: 'TJRS', nome: 'Tribunal de Justiça do Estado do Rio Grande do Sul', tipo: 'estadual', uf: 'RS' },
  TJPR: { sigla: 'TJPR', nome: 'Tribunal de Justiça do Estado do Paraná', tipo: 'estadual', uf: 'PR' },

  // TRTs (Tribunais Regionais do Trabalho)
  TRT1: { sigla: 'TRT1', nome: 'Tribunal Regional do Trabalho da 1ª Região', tipo: 'trabalho', uf: 'RJ', regiao: 1 },
  TRT2: { sigla: 'TRT2', nome: 'Tribunal Regional do Trabalho da 2ª Região', tipo: 'trabalho', uf: 'SP', regiao: 2 },
  TRT3: { sigla: 'TRT3', nome: 'Tribunal Regional do Trabalho da 3ª Região', tipo: 'trabalho', uf: 'MG', regiao: 3 },
  TRT4: { sigla: 'TRT4', nome: 'Tribunal Regional do Trabalho da 4ª Região', tipo: 'trabalho', uf: 'RS', regiao: 4 },
  TRT15: { sigla: 'TRT15', nome: 'Tribunal Regional do Trabalho da 15ª Região', tipo: 'trabalho', uf: 'SP', regiao: 15 },

  // TRFs (Tribunais Regionais Federais)
  TRF1: { sigla: 'TRF1', nome: 'Tribunal Regional Federal da 1ª Região', tipo: 'federal', regiao: 1 },
  TRF2: { sigla: 'TRF2', nome: 'Tribunal Regional Federal da 2ª Região', tipo: 'federal', regiao: 2 },
  TRF3: { sigla: 'TRF3', nome: 'Tribunal Regional Federal da 3ª Região', tipo: 'federal', regiao: 3 },
  TRF4: { sigla: 'TRF4', nome: 'Tribunal Regional Federal da 4ª Região', tipo: 'federal', regiao: 4 },
  TRF5: { sigla: 'TRF5', nome: 'Tribunal Regional Federal da 5ª Região', tipo: 'federal', regiao: 5 },
};
