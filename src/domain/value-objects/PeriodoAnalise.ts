/**
 * Value Object: PeriodoAnalise
 * Representa um período de análise com validações
 */

export type GranularidadePeriodo = 'dia' | 'semana' | 'mes' | 'trimestre' | 'semestre' | 'ano';

export interface PeriodoPreDefinido {
  nome: string;
  inicio: Date;
  fim: Date;
}

export class PeriodoAnalise {
  private readonly inicio: Date;
  private readonly fim: Date;

  private constructor(inicio: Date, fim: Date) {
    this.inicio = inicio;
    this.fim = fim;
  }

  /**
   * Cria um período a partir de duas datas
   * @throws Error se as datas forem inválidas
   */
  static create(inicio: Date | string, fim: Date | string): PeriodoAnalise {
    const dataInicio = typeof inicio === 'string' ? new Date(inicio) : inicio;
    const dataFim = typeof fim === 'string' ? new Date(fim) : fim;

    if (isNaN(dataInicio.getTime())) {
      throw new Error('Data de início inválida');
    }

    if (isNaN(dataFim.getTime())) {
      throw new Error('Data de fim inválida');
    }

    if (dataInicio > dataFim) {
      throw new Error('Data de início não pode ser posterior à data de fim');
    }

    // Normalizar para início e fim do dia
    const inicioNormalizado = new Date(dataInicio);
    inicioNormalizado.setHours(0, 0, 0, 0);

    const fimNormalizado = new Date(dataFim);
    fimNormalizado.setHours(23, 59, 59, 999);

    return new PeriodoAnalise(inicioNormalizado, fimNormalizado);
  }

  /**
   * Tenta criar um período, retornando null se inválido
   */
  static tryCreate(inicio: Date | string, fim: Date | string): PeriodoAnalise | null {
    try {
      return PeriodoAnalise.create(inicio, fim);
    } catch {
      return null;
    }
  }

  /**
   * Cria período para os últimos N dias
   */
  static ultimosDias(dias: number): PeriodoAnalise {
    const fim = new Date();
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - dias);
    return PeriodoAnalise.create(inicio, fim);
  }

  /**
   * Cria período para os últimos N meses
   */
  static ultimosMeses(meses: number): PeriodoAnalise {
    const fim = new Date();
    const inicio = new Date();
    inicio.setMonth(inicio.getMonth() - meses);
    return PeriodoAnalise.create(inicio, fim);
  }

  /**
   * Cria período para os últimos N anos
   */
  static ultimosAnos(anos: number): PeriodoAnalise {
    const fim = new Date();
    const inicio = new Date();
    inicio.setFullYear(inicio.getFullYear() - anos);
    return PeriodoAnalise.create(inicio, fim);
  }

  /**
   * Cria período para um ano específico
   */
  static ano(ano: number): PeriodoAnalise {
    return PeriodoAnalise.create(
      new Date(ano, 0, 1),
      new Date(ano, 11, 31)
    );
  }

  /**
   * Cria período para um mês específico
   */
  static mes(ano: number, mes: number): PeriodoAnalise {
    const inicio = new Date(ano, mes - 1, 1);
    const fim = new Date(ano, mes, 0);  // Último dia do mês
    return PeriodoAnalise.create(inicio, fim);
  }

  /**
   * Cria período para um trimestre
   */
  static trimestre(ano: number, trimestre: 1 | 2 | 3 | 4): PeriodoAnalise {
    const mesInicio = (trimestre - 1) * 3;
    const inicio = new Date(ano, mesInicio, 1);
    const fim = new Date(ano, mesInicio + 3, 0);
    return PeriodoAnalise.create(inicio, fim);
  }

  /**
   * Cria período para um semestre
   */
  static semestre(ano: number, semestre: 1 | 2): PeriodoAnalise {
    const mesInicio = (semestre - 1) * 6;
    const inicio = new Date(ano, mesInicio, 1);
    const fim = new Date(ano, mesInicio + 6, 0);
    return PeriodoAnalise.create(inicio, fim);
  }

  /**
   * Retorna períodos pré-definidos comuns
   */
  static getPeriodosPreDefinidos(): PeriodoPreDefinido[] {
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();

    return [
      { nome: 'Últimos 30 dias', ...PeriodoAnalise.ultimosDias(30).toObject() },
      { nome: 'Últimos 90 dias', ...PeriodoAnalise.ultimosDias(90).toObject() },
      { nome: 'Últimos 6 meses', ...PeriodoAnalise.ultimosMeses(6).toObject() },
      { nome: 'Último ano', ...PeriodoAnalise.ultimosAnos(1).toObject() },
      { nome: 'Últimos 2 anos', ...PeriodoAnalise.ultimosAnos(2).toObject() },
      { nome: 'Últimos 5 anos', ...PeriodoAnalise.ultimosAnos(5).toObject() },
      { nome: `Ano ${anoAtual}`, ...PeriodoAnalise.ano(anoAtual).toObject() },
      { nome: `Ano ${anoAtual - 1}`, ...PeriodoAnalise.ano(anoAtual - 1).toObject() },
    ];
  }

  /**
   * Retorna a data de início
   */
  getInicio(): Date {
    return new Date(this.inicio);
  }

  /**
   * Retorna a data de fim
   */
  getFim(): Date {
    return new Date(this.fim);
  }

  /**
   * Retorna a duração em dias
   */
  getDuracaoDias(): number {
    const diff = this.fim.getTime() - this.inicio.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Retorna a duração em meses (aproximado)
   */
  getDuracaoMeses(): number {
    return Math.ceil(this.getDuracaoDias() / 30);
  }

  /**
   * Verifica se uma data está dentro do período
   */
  contem(data: Date): boolean {
    return data >= this.inicio && data <= this.fim;
  }

  /**
   * Verifica se dois períodos se sobrepõem
   */
  sobrepoe(outro: PeriodoAnalise): boolean {
    return this.inicio <= outro.fim && this.fim >= outro.inicio;
  }

  /**
   * Retorna a interseção de dois períodos
   */
  intersecao(outro: PeriodoAnalise): PeriodoAnalise | null {
    if (!this.sobrepoe(outro)) {
      return null;
    }

    const inicio = this.inicio > outro.inicio ? this.inicio : outro.inicio;
    const fim = this.fim < outro.fim ? this.fim : outro.fim;

    return PeriodoAnalise.create(inicio, fim);
  }

  /**
   * Expande o período pelo número de dias especificado
   */
  expandir(diasAntes: number, diasDepois: number): PeriodoAnalise {
    const novoInicio = new Date(this.inicio);
    novoInicio.setDate(novoInicio.getDate() - diasAntes);

    const novoFim = new Date(this.fim);
    novoFim.setDate(novoFim.getDate() + diasDepois);

    return PeriodoAnalise.create(novoInicio, novoFim);
  }

  /**
   * Divide o período em subperíodos
   */
  dividir(granularidade: GranularidadePeriodo): PeriodoAnalise[] {
    const periodos: PeriodoAnalise[] = [];
    let atual = new Date(this.inicio);

    while (atual <= this.fim) {
      const fimPeriodo = new Date(atual);

      switch (granularidade) {
        case 'dia':
          fimPeriodo.setDate(fimPeriodo.getDate() + 1);
          break;
        case 'semana':
          fimPeriodo.setDate(fimPeriodo.getDate() + 7);
          break;
        case 'mes':
          fimPeriodo.setMonth(fimPeriodo.getMonth() + 1);
          break;
        case 'trimestre':
          fimPeriodo.setMonth(fimPeriodo.getMonth() + 3);
          break;
        case 'semestre':
          fimPeriodo.setMonth(fimPeriodo.getMonth() + 6);
          break;
        case 'ano':
          fimPeriodo.setFullYear(fimPeriodo.getFullYear() + 1);
          break;
      }

      // Ajustar o fim para não ultrapassar o período total
      const fimAjustado = fimPeriodo > this.fim ? this.fim : fimPeriodo;
      fimAjustado.setDate(fimAjustado.getDate() - 1);

      if (atual <= this.fim) {
        periodos.push(PeriodoAnalise.create(atual, fimAjustado));
      }

      atual = new Date(fimPeriodo);
    }

    return periodos;
  }

  /**
   * Retorna formatado como "DD/MM/YYYY - DD/MM/YYYY"
   */
  formatado(): string {
    const formatarData = (d: Date) =>
      d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

    return `${formatarData(this.inicio)} - ${formatarData(this.fim)}`;
  }

  /**
   * Retorna formatado de forma compacta
   */
  formatadoCompacto(): string {
    const dias = this.getDuracaoDias();

    if (dias <= 31) {
      return `Últimos ${dias} dias`;
    }

    const meses = this.getDuracaoMeses();
    if (meses <= 12) {
      return `Últimos ${meses} meses`;
    }

    const anos = Math.round(meses / 12);
    return `Últimos ${anos} ano(s)`;
  }

  /**
   * Retorna como objeto simples
   */
  toObject(): { inicio: Date; fim: Date } {
    return {
      inicio: this.getInicio(),
      fim: this.getFim(),
    };
  }

  /**
   * Retorna como strings ISO
   */
  toISO(): { inicio: string; fim: string } {
    return {
      inicio: this.inicio.toISOString(),
      fim: this.fim.toISOString(),
    };
  }

  /**
   * Compara dois períodos
   */
  equals(outro: PeriodoAnalise): boolean {
    return this.inicio.getTime() === outro.inicio.getTime() &&
      this.fim.getTime() === outro.fim.getTime();
  }

  /**
   * Retorna representação string
   */
  toString(): string {
    return this.formatado();
  }
}
