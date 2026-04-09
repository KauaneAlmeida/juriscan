/**
 * Value Object: OAB
 * Representa e valida um número de inscrição na OAB
 */

const UFS_VALIDAS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const;

export type UFBrasil = typeof UFS_VALIDAS[number];

export interface OABComponentes {
  uf: UFBrasil;
  numero: string;
  tipo?: 'A' | 'B' | 'E' | 'N' | 'P' | 'S';  // A=Advogado, B=Estagiário, E=Estrangeiro, etc.
}

export class OAB {
  private readonly uf: UFBrasil;
  private readonly numero: string;
  private readonly tipo?: string;

  private constructor(uf: UFBrasil, numero: string, tipo?: string) {
    this.uf = uf;
    this.numero = numero;
    this.tipo = tipo;
  }

  /**
   * Cria um OAB a partir de uma string (ex: "SP123456", "OAB/RJ 12345", "123456/SP")
   * @throws Error se o número for inválido
   */
  static create(valor: string): OAB {
    const parsed = OAB.parse(valor);

    if (!parsed) {
      throw new Error(`Número de OAB inválido: ${valor}`);
    }

    return new OAB(parsed.uf, parsed.numero, parsed.tipo);
  }

  /**
   * Tenta criar um OAB, retornando null se inválido
   */
  static tryCreate(valor: string): OAB | null {
    try {
      return OAB.create(valor);
    } catch {
      return null;
    }
  }

  /**
   * Faz o parse de diferentes formatos de OAB
   */
  private static parse(valor: string): OABComponentes | null {
    // Remove espaços e converte para maiúsculas
    const limpo = valor.toUpperCase().replace(/\s+/g, '');

    // Padrões aceitos:
    // SP123456, OAB/SP123456, OAB-SP123456, 123456/SP, 123456-SP, OAB SP 123456
    const padroes = [
      /^OAB[\/\-]?([A-Z]{2})(\d+)([ABENPS])?$/,          // OAB/SP123456
      /^([A-Z]{2})(\d+)([ABENPS])?$/,                    // SP123456
      /^(\d+)[\/\-]([A-Z]{2})([ABENPS])?$/,              // 123456/SP
      /^OAB([A-Z]{2})(\d+)([ABENPS])?$/,                 // OABSP123456
    ];

    for (const padrao of padroes) {
      const match = limpo.match(padrao);
      if (match) {
        // Pode ser UF primeiro ou número primeiro
        let uf: string;
        let numero: string;
        let tipo: string | undefined;

        if (/^\d+$/.test(match[1])) {
          // Número primeiro (123456/SP)
          numero = match[1];
          uf = match[2];
          tipo = match[3];
        } else {
          // UF primeiro (SP123456)
          uf = match[1];
          numero = match[2];
          tipo = match[3];
        }

        // Validar UF
        if (!UFS_VALIDAS.includes(uf as UFBrasil)) {
          continue;
        }

        // Validar número (deve ter entre 1 e 7 dígitos)
        if (numero.length < 1 || numero.length > 7) {
          continue;
        }

        return {
          uf: uf as UFBrasil,
          numero: numero.padStart(6, '0'),  // Padroniza com 6 dígitos
          tipo: tipo as OABComponentes['tipo'],
        };
      }
    }

    return null;
  }

  /**
   * Retorna a UF da OAB
   */
  getUF(): UFBrasil {
    return this.uf;
  }

  /**
   * Retorna o número da OAB
   */
  getNumero(): string {
    return this.numero;
  }

  /**
   * Retorna o tipo de inscrição
   */
  getTipo(): string | undefined {
    return this.tipo;
  }

  /**
   * Retorna formatado como "UF 123456" (padrão mais comum)
   */
  formatado(): string {
    const num = parseInt(this.numero, 10).toString();  // Remove zeros à esquerda
    return `${this.uf} ${num}`;
  }

  /**
   * Retorna formatado como "OAB/UF 123456"
   */
  formatadoCompleto(): string {
    const num = parseInt(this.numero, 10).toString();
    return `OAB/${this.uf} ${num}`;
  }

  /**
   * Retorna compacto como "UF123456"
   */
  compacto(): string {
    return `${this.uf}${this.numero}`;
  }

  /**
   * Retorna o nome da seccional
   */
  getNomeSeccional(): string {
    const nomes: Record<UFBrasil, string> = {
      AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas',
      BA: 'Bahia', CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo',
      GO: 'Goiás', MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul',
      MG: 'Minas Gerais', PA: 'Pará', PB: 'Paraíba', PR: 'Paraná',
      PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte',
      RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina',
      SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins',
    };
    return `OAB/${this.uf} - ${nomes[this.uf]}`;
  }

  /**
   * Compara dois números de OAB
   */
  equals(outro: OAB): boolean {
    return this.uf === outro.uf && this.numero === outro.numero;
  }

  /**
   * Retorna representação string
   */
  toString(): string {
    return this.formatado();
  }

  /**
   * Serializa para JSON
   */
  toJSON(): string {
    return this.compacto();
  }
}

/**
 * Helper para validar se uma string é um número de OAB válido
 */
export function isOABValida(valor: string): boolean {
  return OAB.tryCreate(valor) !== null;
}

/**
 * Helper para formatar número de OAB
 */
export function formatarOAB(valor: string): string | null {
  const oab = OAB.tryCreate(valor);
  return oab?.formatado() ?? null;
}

/**
 * Extrai números de OAB de um texto
 */
export function extrairOABsDeTexto(texto: string): OAB[] {
  const padroes = [
    /OAB[\/\-\s]*([A-Z]{2})\s*(\d{1,7})/gi,
    /([A-Z]{2})\s*(\d{4,7})/g,
    /(\d{4,7})[\/\-]([A-Z]{2})/g,
  ];

  const encontradas: OAB[] = [];
  const vistos = new Set<string>();

  for (const padrao of padroes) {
    let match;
    while ((match = padrao.exec(texto)) !== null) {
      const oab = OAB.tryCreate(match[0]);
      if (oab && !vistos.has(oab.compacto())) {
        encontradas.push(oab);
        vistos.add(oab.compacto());
      }
    }
  }

  return encontradas;
}
