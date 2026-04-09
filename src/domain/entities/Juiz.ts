/**
 * Domain Entity: Juiz
 * Representa um magistrado (juiz, desembargador ou ministro)
 */

export type CargoMagistrado =
  | 'juiz'
  | 'juiz_substituto'
  | 'desembargador'
  | 'ministro';

export type TendenciaDecisao = 'autor' | 'reu' | 'neutro';
export type IntensidadeTendencia = 'forte' | 'moderada' | 'leve';

export interface JuizTendencias {
  favorece: TendenciaDecisao;
  intensidade: IntensidadeTendencia;
  confianca: number;  // 0.0 - 1.0, baseado em quantidade de dados
}

export interface JuizTaxas {
  procedencia: number;           // 0.0 - 1.0
  improcedencia: number;
  parcial_procedencia: number;
  acordo: number;
  reforma: number;               // % de decisões reformadas em recurso
  total_decisoes_analisadas: number;
}

export interface JuizMateriaFrequente {
  materia: string;
  codigo?: string;
  quantidade: number;
  percentual: number;
}

export interface JuizPerfil {
  tempo_atuacao_anos: number;
  total_decisoes: number;

  tendencias: JuizTendencias;
  taxas: JuizTaxas;

  tempo_medio_decisao_dias: number;
  tempo_mediano_decisao_dias?: number;

  materias_frequentes: JuizMateriaFrequente[];

  periodo_analise: {
    inicio: Date;
    fim: Date;
  };

  atualizado_em: Date;
}

export interface Juiz {
  id: string;
  nome: string;
  nome_completo?: string;

  cargo: CargoMagistrado;
  tribunal_sigla: string;
  vara?: string;
  turma?: string;              // Para desembargadores/ministros
  camara?: string;             // Para desembargadores

  situacao: 'ativo' | 'aposentado' | 'afastado' | 'desconhecido';

  formacao?: {
    instituicao?: string;
    ano_formatura?: number;
    especializacoes?: string[];
  };

  perfil?: JuizPerfil;

  observacoes?: string;

  created_at?: Date;
  updated_at?: Date;
}

/**
 * Factory para criar Juiz
 */
export function createJuiz(data: Partial<Juiz> & Pick<Juiz, 'nome' | 'cargo' | 'tribunal_sigla'>): Juiz {
  return {
    id: data.id || `juiz_${data.tribunal_sigla.toLowerCase()}_${data.nome.toLowerCase().replace(/\s+/g, '_').substring(0, 30)}`,
    nome: data.nome,
    nome_completo: data.nome_completo,
    cargo: data.cargo,
    tribunal_sigla: data.tribunal_sigla.toUpperCase(),
    vara: data.vara,
    turma: data.turma,
    camara: data.camara,
    situacao: data.situacao || 'desconhecido',
    formacao: data.formacao,
    perfil: data.perfil,
    observacoes: data.observacoes,
    created_at: data.created_at || new Date(),
    updated_at: data.updated_at || new Date(),
  };
}

/**
 * Calcula o perfil de tendência do juiz baseado nas taxas
 */
export function calcularTendencia(taxas: JuizTaxas): JuizTendencias {
  const { procedencia, improcedencia, total_decisoes_analisadas } = taxas;

  // Precisa de pelo menos 30 decisões para ter confiança mínima
  const confianca = Math.min(1, total_decisoes_analisadas / 100);

  // Diferença entre procedência e improcedência
  const diferenca = procedencia - improcedencia;

  let favorece: TendenciaDecisao;
  let intensidade: IntensidadeTendencia;

  if (Math.abs(diferenca) < 0.1) {
    favorece = 'neutro';
    intensidade = 'leve';
  } else if (diferenca > 0) {
    favorece = 'autor';
    intensidade = diferenca > 0.3 ? 'forte' : diferenca > 0.15 ? 'moderada' : 'leve';
  } else {
    favorece = 'reu';
    intensidade = diferenca < -0.3 ? 'forte' : diferenca < -0.15 ? 'moderada' : 'leve';
  }

  return { favorece, intensidade, confianca };
}

/**
 * Formata o nome do cargo
 */
export function formatarCargo(cargo: CargoMagistrado): string {
  const cargos: Record<CargoMagistrado, string> = {
    juiz: 'Juiz(a) de Direito',
    juiz_substituto: 'Juiz(a) Substituto(a)',
    desembargador: 'Desembargador(a)',
    ministro: 'Ministro(a)',
  };
  return cargos[cargo];
}
