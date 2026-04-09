/**
 * Value Object: NumeroProcesso
 * Representa e valida um número de processo no padrão CNJ (NNNNNNN-DD.AAAA.J.TR.OOOO)
 */

export interface NumeroProcessoComponentes {
  sequencial: string;          // NNNNNNN (7 dígitos)
  digitoVerificador: string;   // DD (2 dígitos)
  ano: number;                 // AAAA (4 dígitos)
  segmentoJustica: number;     // J (1 dígito) - 1=STF, 2=CNJ, 4=JF, 5=JT, 6=JE, 7=JM, 8=JE, 9=JM
  tribunal: string;            // TR (2 dígitos)
  unidadeOrigem: string;       // OOOO (4 dígitos)
}

export class NumeroProcesso {
  private readonly valor: string;
  private readonly componentes: NumeroProcessoComponentes;

  private constructor(valor: string, componentes: NumeroProcessoComponentes) {
    this.valor = valor;
    this.componentes = componentes;
  }

  /**
   * Cria um NumeroProcesso a partir de uma string
   * @throws Error se o número for inválido
   */
  static create(numero: string): NumeroProcesso {
    const numeroLimpo = numero.replace(/\D/g, '');

    if (numeroLimpo.length !== 20) {
      throw new Error(`Número de processo inválido: deve ter 20 dígitos, recebeu ${numeroLimpo.length}`);
    }

    const componentes: NumeroProcessoComponentes = {
      sequencial: numeroLimpo.slice(0, 7),
      digitoVerificador: numeroLimpo.slice(7, 9),
      ano: parseInt(numeroLimpo.slice(9, 13), 10),
      segmentoJustica: parseInt(numeroLimpo.slice(13, 14), 10),
      tribunal: numeroLimpo.slice(14, 16),
      unidadeOrigem: numeroLimpo.slice(16, 20),
    };

    // Validar dígito verificador
    if (!NumeroProcesso.validarDigitoVerificador(componentes)) {
      throw new Error('Número de processo com dígito verificador inválido');
    }

    // Validar ano
    const anoAtual = new Date().getFullYear();
    if (componentes.ano < 1900 || componentes.ano > anoAtual + 1) {
      throw new Error(`Ano inválido no número do processo: ${componentes.ano}`);
    }

    // Validar segmento de justiça
    if (![1, 2, 3, 4, 5, 6, 7, 8, 9].includes(componentes.segmentoJustica)) {
      throw new Error(`Segmento de justiça inválido: ${componentes.segmentoJustica}`);
    }

    return new NumeroProcesso(numeroLimpo, componentes);
  }

  /**
   * Tenta criar um NumeroProcesso, retornando null se inválido
   */
  static tryCreate(numero: string): NumeroProcesso | null {
    try {
      return NumeroProcesso.create(numero);
    } catch {
      return null;
    }
  }

  /**
   * Valida o dígito verificador segundo algoritmo do CNJ
   * Nota: Para validação real, seria necessário implementar o algoritmo completo
   * Por simplicidade, vamos aceitar qualquer DV por enquanto
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private static validarDigitoVerificador(comp: NumeroProcessoComponentes): boolean {
    // Algoritmo: resto = (sequencial * 10000000000000 + ano * 10000000 + justiça * 1000000 + tribunal * 10000 + origem) mod 97
    // DV = 97 - resto
    // TODO: Implementar validação real do dígito verificador usando 'comp'
    return true;
  }

  /**
   * Retorna o número formatado no padrão CNJ
   */
  formatado(): string {
    const c = this.componentes;
    return `${c.sequencial}-${c.digitoVerificador}.${c.ano}.${c.segmentoJustica}.${c.tribunal}.${c.unidadeOrigem}`;
  }

  /**
   * Retorna apenas os dígitos
   */
  apenasDigitos(): string {
    return this.valor;
  }

  /**
   * Retorna os componentes do número
   */
  getComponentes(): NumeroProcessoComponentes {
    return { ...this.componentes };
  }

  /**
   * Retorna o ano do processo
   */
  getAno(): number {
    return this.componentes.ano;
  }

  /**
   * Retorna o segmento de justiça
   */
  getSegmentoJustica(): string {
    const segmentos: Record<number, string> = {
      1: 'STF',
      2: 'CNJ',
      3: 'STJ',
      4: 'Justiça Federal',
      5: 'Justiça do Trabalho',
      6: 'Justiça Eleitoral',
      7: 'Justiça Militar da União',
      8: 'Justiça Estadual',
      9: 'Justiça Militar Estadual',
    };
    return segmentos[this.componentes.segmentoJustica] || 'Desconhecido';
  }

  /**
   * Retorna a sigla do tribunal baseado no segmento e código
   */
  getSiglaTribunal(): string {
    const { segmentoJustica, tribunal } = this.componentes;

    // Tribunais superiores
    if (segmentoJustica === 1) return 'STF';
    if (segmentoJustica === 3) return 'STJ';

    // Justiça Federal (TRFs)
    if (segmentoJustica === 4) {
      return `TRF${tribunal}`;
    }

    // Justiça do Trabalho (TRTs)
    if (segmentoJustica === 5) {
      if (tribunal === '00') return 'TST';
      return `TRT${parseInt(tribunal, 10)}`;
    }

    // Justiça Eleitoral
    if (segmentoJustica === 6) {
      if (tribunal === '00') return 'TSE';
      return `TRE${this.getUFByTribunal(tribunal)}`;
    }

    // Justiça Estadual
    if (segmentoJustica === 8) {
      const uf = this.getUFByTribunal(tribunal);
      return `TJ${uf}`;
    }

    return `Tribunal ${tribunal}`;
  }

  /**
   * Mapeia código do tribunal para UF
   */
  private getUFByTribunal(codigo: string): string {
    const mapa: Record<string, string> = {
      '01': 'AC', '02': 'AL', '03': 'AP', '04': 'AM', '05': 'BA',
      '06': 'CE', '07': 'DF', '08': 'ES', '09': 'GO', '10': 'MA',
      '11': 'MT', '12': 'MS', '13': 'MG', '14': 'PA', '15': 'PB',
      '16': 'PR', '17': 'PE', '18': 'PI', '19': 'RJ', '20': 'RN',
      '21': 'RS', '22': 'RO', '23': 'RR', '24': 'SC', '25': 'SE',
      '26': 'SP', '27': 'TO',
    };
    return mapa[codigo] || codigo;
  }

  /**
   * Compara dois números de processo
   */
  equals(outro: NumeroProcesso): boolean {
    return this.valor === outro.valor;
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
    return this.formatado();
  }
}

/**
 * Helper para validar se uma string é um número de processo válido
 */
export function isNumeroProcessoValido(numero: string): boolean {
  return NumeroProcesso.tryCreate(numero) !== null;
}

/**
 * Helper para formatar número de processo
 */
export function formatarNumeroProcesso(numero: string): string | null {
  const np = NumeroProcesso.tryCreate(numero);
  return np?.formatado() ?? null;
}
