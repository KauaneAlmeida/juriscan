/**
 * Domain Layer - Barrel Export
 *
 * Este módulo contém as regras de negócio puras do Juriscan:
 * - Entities: Objetos de domínio com identidade (Processo, Jurisprudência, etc.)
 * - Value Objects: Objetos imutáveis sem identidade (NumeroProcesso, OAB, etc.)
 * - Repositories: Interfaces para persistência de dados
 */

// Entities
export * from './entities';

// Value Objects (with explicit exports to avoid conflicts)
export {
  NumeroProcesso,
  type NumeroProcessoComponentes,
  isNumeroProcessoValido,
  formatarNumeroProcesso as formatarNumeroProcessoCNJ,
} from './value-objects/NumeroProcesso';

export {
  OAB,
  type UFBrasil,
  type OABComponentes,
  isOABValida,
  formatarOAB,
  extrairOABsDeTexto,
} from './value-objects/OAB';

export {
  CNPJ,
  CPF,
  isCNPJValido,
  isCPFValido,
  formatarCNPJ as formatarCNPJDoc,
  formatarCPF as formatarCPFDoc,
  formatarDocumento,
} from './value-objects/CNPJ';

export {
  PeriodoAnalise,
  type GranularidadePeriodo,
  type PeriodoPreDefinido,
} from './value-objects/PeriodoAnalise';

// Repository Interfaces
export * from './repositories';
