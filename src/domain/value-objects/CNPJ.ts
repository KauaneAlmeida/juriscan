/**
 * Value Object: CNPJ
 * Representa e valida um CNPJ brasileiro
 */

export class CNPJ {
  private readonly valor: string;

  private constructor(valor: string) {
    this.valor = valor;
  }

  /**
   * Cria um CNPJ a partir de uma string
   * @throws Error se o CNPJ for inválido
   */
  static create(cnpj: string): CNPJ {
    const numeros = cnpj.replace(/\D/g, '');

    if (numeros.length !== 14) {
      throw new Error(`CNPJ inválido: deve ter 14 dígitos, recebeu ${numeros.length}`);
    }

    if (!CNPJ.validarDigitos(numeros)) {
      throw new Error('CNPJ inválido: dígitos verificadores incorretos');
    }

    if (CNPJ.isCNPJConhecidoInvalido(numeros)) {
      throw new Error('CNPJ inválido: sequência não permitida');
    }

    return new CNPJ(numeros);
  }

  /**
   * Tenta criar um CNPJ, retornando null se inválido
   */
  static tryCreate(cnpj: string): CNPJ | null {
    try {
      return CNPJ.create(cnpj);
    } catch {
      return null;
    }
  }

  /**
   * Valida os dígitos verificadores do CNPJ
   */
  private static validarDigitos(cnpj: string): boolean {
    // Primeiro dígito verificador
    let soma = 0;
    let peso = 5;
    for (let i = 0; i < 12; i++) {
      soma += parseInt(cnpj[i], 10) * peso;
      peso = peso === 2 ? 9 : peso - 1;
    }
    let resto = soma % 11;
    const dv1 = resto < 2 ? 0 : 11 - resto;

    if (parseInt(cnpj[12], 10) !== dv1) {
      return false;
    }

    // Segundo dígito verificador
    soma = 0;
    peso = 6;
    for (let i = 0; i < 13; i++) {
      soma += parseInt(cnpj[i], 10) * peso;
      peso = peso === 2 ? 9 : peso - 1;
    }
    resto = soma % 11;
    const dv2 = resto < 2 ? 0 : 11 - resto;

    return parseInt(cnpj[13], 10) === dv2;
  }

  /**
   * Verifica CNPJs conhecidamente inválidos (todos dígitos iguais)
   */
  private static isCNPJConhecidoInvalido(cnpj: string): boolean {
    const invalidos = [
      '00000000000000',
      '11111111111111',
      '22222222222222',
      '33333333333333',
      '44444444444444',
      '55555555555555',
      '66666666666666',
      '77777777777777',
      '88888888888888',
      '99999999999999',
    ];
    return invalidos.includes(cnpj);
  }

  /**
   * Retorna o CNPJ formatado (XX.XXX.XXX/XXXX-XX)
   */
  formatado(): string {
    return this.valor.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      '$1.$2.$3/$4-$5'
    );
  }

  /**
   * Retorna apenas os dígitos
   */
  apenasDigitos(): string {
    return this.valor;
  }

  /**
   * Retorna a raiz do CNPJ (primeiros 8 dígitos)
   */
  getRaiz(): string {
    return this.valor.slice(0, 8);
  }

  /**
   * Retorna o número da filial (4 dígitos após a raiz)
   */
  getFilial(): string {
    return this.valor.slice(8, 12);
  }

  /**
   * Verifica se é matriz (filial = 0001)
   */
  isMatriz(): boolean {
    return this.getFilial() === '0001';
  }

  /**
   * Verifica se é filial
   */
  isFilial(): boolean {
    return !this.isMatriz();
  }

  /**
   * Retorna os dígitos verificadores
   */
  getDigitosVerificadores(): string {
    return this.valor.slice(12, 14);
  }

  /**
   * Compara dois CNPJs
   */
  equals(outro: CNPJ): boolean {
    return this.valor === outro.valor;
  }

  /**
   * Verifica se dois CNPJs são da mesma empresa (mesma raiz)
   */
  isMesmaEmpresa(outro: CNPJ): boolean {
    return this.getRaiz() === outro.getRaiz();
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
 * Value Object: CPF
 * Representa e valida um CPF brasileiro
 */
export class CPF {
  private readonly valor: string;

  private constructor(valor: string) {
    this.valor = valor;
  }

  /**
   * Cria um CPF a partir de uma string
   * @throws Error se o CPF for inválido
   */
  static create(cpf: string): CPF {
    const numeros = cpf.replace(/\D/g, '');

    if (numeros.length !== 11) {
      throw new Error(`CPF inválido: deve ter 11 dígitos, recebeu ${numeros.length}`);
    }

    if (!CPF.validarDigitos(numeros)) {
      throw new Error('CPF inválido: dígitos verificadores incorretos');
    }

    if (CPF.isCPFConhecidoInvalido(numeros)) {
      throw new Error('CPF inválido: sequência não permitida');
    }

    return new CPF(numeros);
  }

  /**
   * Tenta criar um CPF, retornando null se inválido
   */
  static tryCreate(cpf: string): CPF | null {
    try {
      return CPF.create(cpf);
    } catch {
      return null;
    }
  }

  /**
   * Valida os dígitos verificadores do CPF
   */
  private static validarDigitos(cpf: string): boolean {
    // Primeiro dígito verificador
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpf[i], 10) * (10 - i);
    }
    let resto = (soma * 10) % 11;
    const dv1 = resto === 10 ? 0 : resto;

    if (parseInt(cpf[9], 10) !== dv1) {
      return false;
    }

    // Segundo dígito verificador
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpf[i], 10) * (11 - i);
    }
    resto = (soma * 10) % 11;
    const dv2 = resto === 10 ? 0 : resto;

    return parseInt(cpf[10], 10) === dv2;
  }

  /**
   * Verifica CPFs conhecidamente inválidos
   */
  private static isCPFConhecidoInvalido(cpf: string): boolean {
    const invalidos = [
      '00000000000', '11111111111', '22222222222', '33333333333',
      '44444444444', '55555555555', '66666666666', '77777777777',
      '88888888888', '99999999999',
    ];
    return invalidos.includes(cpf);
  }

  /**
   * Retorna o CPF formatado (XXX.XXX.XXX-XX)
   */
  formatado(): string {
    return this.valor.replace(
      /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
      '$1.$2.$3-$4'
    );
  }

  /**
   * Retorna apenas os dígitos
   */
  apenasDigitos(): string {
    return this.valor;
  }

  /**
   * Retorna o CPF com máscara parcial para exibição (***.***.XXX-XX)
   */
  mascarado(): string {
    return `***.***${this.valor.slice(6, 9)}-${this.valor.slice(9, 11)}`;
  }

  /**
   * Compara dois CPFs
   */
  equals(outro: CPF): boolean {
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
 * Helpers
 */
export function isCNPJValido(cnpj: string): boolean {
  return CNPJ.tryCreate(cnpj) !== null;
}

export function isCPFValido(cpf: string): boolean {
  return CPF.tryCreate(cpf) !== null;
}

export function formatarCNPJ(cnpj: string): string | null {
  return CNPJ.tryCreate(cnpj)?.formatado() ?? null;
}

export function formatarCPF(cpf: string): string | null {
  return CPF.tryCreate(cpf)?.formatado() ?? null;
}

/**
 * Identifica se é CPF ou CNPJ e retorna formatado
 */
export function formatarDocumento(documento: string): string | null {
  const numeros = documento.replace(/\D/g, '');

  if (numeros.length === 11) {
    return formatarCPF(numeros);
  }

  if (numeros.length === 14) {
    return formatarCNPJ(numeros);
  }

  return null;
}
