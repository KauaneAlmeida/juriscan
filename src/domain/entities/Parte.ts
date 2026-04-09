/**
 * Domain Entity: Parte
 * Representa uma parte processual (autor, réu, terceiro, etc.)
 */

export type TipoParte =
  | 'pessoa_fisica'
  | 'pessoa_juridica'
  | 'orgao_publico'
  | 'massa_falida'
  | 'espolio'
  | 'condominio'
  | 'outros';

export type PoloProcessual = 'ativo' | 'passivo' | 'terceiro' | 'interessado';

export type QualificacaoParte =
  | 'autor'
  | 'reu'
  | 'reclamante'
  | 'reclamado'
  | 'exequente'
  | 'executado'
  | 'requerente'
  | 'requerido'
  | 'impetrante'
  | 'impetrado'
  | 'embargante'
  | 'embargado'
  | 'agravante'
  | 'agravado'
  | 'apelante'
  | 'apelado'
  | 'terceiro_interessado'
  | 'assistente'
  | 'litisconsorte'
  | 'ministerio_publico'
  | 'outros';

export interface Advogado {
  nome: string;
  oab: string;               // "SP123456"
  uf_oab: string;            // "SP"
  numero_oab: string;        // "123456"
  email?: string;
  telefone?: string;
}

export interface Parte {
  id: string;
  nome: string;
  nome_normalizado?: string;  // Nome sem acentos, uppercase para busca

  tipo: TipoParte;
  polo: PoloProcessual;
  qualificacao: QualificacaoParte;

  // Documentos
  cpf?: string;
  cnpj?: string;
  rg?: string;

  // Contato
  email?: string;
  telefone?: string;
  endereco?: {
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    cep?: string;
  };

  // Representação
  advogados: Advogado[];

  // Pessoa Jurídica
  razao_social?: string;
  nome_fantasia?: string;

  // Metadados
  principal: boolean;         // Se é a parte principal do polo
  ativo: boolean;            // Se ainda está no processo

  created_at?: Date;
  updated_at?: Date;
}

/**
 * Factory para criar Parte
 */
export function createParte(data: Partial<Parte> & Pick<Parte, 'nome' | 'tipo' | 'polo' | 'qualificacao'>): Parte {
  const nomeNormalizado = data.nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();

  return {
    id: data.id || `parte_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    nome: data.nome.trim(),
    nome_normalizado: data.nome_normalizado || nomeNormalizado,
    tipo: data.tipo,
    polo: data.polo,
    qualificacao: data.qualificacao,
    cpf: data.cpf ? formatarCPF(data.cpf) : undefined,
    cnpj: data.cnpj ? formatarCNPJ(data.cnpj) : undefined,
    rg: data.rg,
    email: data.email,
    telefone: data.telefone,
    endereco: data.endereco,
    advogados: data.advogados || [],
    razao_social: data.razao_social,
    nome_fantasia: data.nome_fantasia,
    principal: data.principal !== false,
    ativo: data.ativo !== false,
    created_at: data.created_at || new Date(),
    updated_at: data.updated_at || new Date(),
  };
}

/**
 * Formata CPF
 */
export function formatarCPF(cpf: string): string {
  const numeros = cpf.replace(/\D/g, '');
  if (numeros.length !== 11) return cpf;
  return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata CNPJ
 */
export function formatarCNPJ(cnpj: string): string {
  const numeros = cnpj.replace(/\D/g, '');
  if (numeros.length !== 14) return cnpj;
  return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

/**
 * Identifica tipo de parte pelo documento
 */
export function identificarTipoParte(documento?: string): TipoParte {
  if (!documento) return 'pessoa_fisica';

  const numeros = documento.replace(/\D/g, '');

  if (numeros.length === 11) return 'pessoa_fisica';
  if (numeros.length === 14) return 'pessoa_juridica';

  return 'outros';
}

/**
 * Mapeia qualificação para polo
 */
export function qualificacaoParaPolo(qualificacao: QualificacaoParte): PoloProcessual {
  const poloAtivo: QualificacaoParte[] = [
    'autor', 'reclamante', 'exequente', 'requerente',
    'impetrante', 'embargante', 'agravante', 'apelante'
  ];

  const poloPassivo: QualificacaoParte[] = [
    'reu', 'reclamado', 'executado', 'requerido',
    'impetrado', 'embargado', 'agravado', 'apelado'
  ];

  if (poloAtivo.includes(qualificacao)) return 'ativo';
  if (poloPassivo.includes(qualificacao)) return 'passivo';
  if (qualificacao === 'terceiro_interessado' || qualificacao === 'assistente') return 'terceiro';

  return 'interessado';
}
