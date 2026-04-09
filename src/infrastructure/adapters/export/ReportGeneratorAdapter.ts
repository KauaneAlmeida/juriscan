/**
 * Report Generator Adapter
 * Gera relatórios estruturados em HTML/JSON para exportação
 */

import { JurimetricsData, formatarTempo, formatarValor } from '@/src/domain/entities';

/**
 * Seção do relatório
 */
export interface ReportSection {
  titulo: string;
  tipo: 'texto' | 'tabela' | 'grafico' | 'lista' | 'destaque' | 'kpi';
  conteudo: unknown;
  ordem: number;
}

/**
 * KPI (Key Performance Indicator)
 */
export interface ReportKPI {
  label: string;
  valor: string | number;
  unidade?: string;
  variacao?: {
    valor: number;
    tipo: 'alta' | 'baixa' | 'estavel';
  };
  icone?: string;
}

/**
 * Dados de gráfico
 */
export interface ChartData {
  tipo: 'bar' | 'pie' | 'line' | 'donut';
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
  }[];
}

/**
 * Estrutura completa do relatório
 */
export interface ReportData {
  id: string;
  tipo: 'jurimetrics' | 'predictive' | 'judge_profile' | 'executive_summary';
  titulo: string;
  subtitulo?: string;

  metadata: {
    gerado_em: string;
    periodo?: { inicio: string; fim: string };
    escopo?: string;
    autor?: string;
    versao: string;
  };

  sumario_executivo: string;

  kpis: ReportKPI[];
  secoes: ReportSection[];

  fontes: string[];
  disclaimer: string;

  // Para exportação
  html?: string;
  json?: object;
}

/**
 * Configuração de estilo
 */
export interface ReportStyle {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  logoUrl?: string;
}

const DEFAULT_STYLE: ReportStyle = {
  primaryColor: '#1e40af',  // Blue 800
  secondaryColor: '#3b82f6', // Blue 500
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
};

/**
 * Report Generator Adapter
 */
export class ReportGeneratorAdapter {
  private style: ReportStyle;

  constructor(style?: Partial<ReportStyle>) {
    this.style = { ...DEFAULT_STYLE, ...style };
  }

  /**
   * Gera relatório de jurimetria
   */
  generateJurimetricsReport(
    data: JurimetricsData,
    insights: { sumario: string; destaques: string[]; recomendacoes: string[] }
  ): ReportData {
    const { metricas, periodo, escopo } = data;

    const kpis: ReportKPI[] = [
      {
        label: 'Total de Processos',
        valor: metricas.total_processos.toLocaleString('pt-BR'),
        icone: '📊',
      },
      {
        label: 'Taxa de Procedência',
        valor: `${(metricas.taxas.procedencia * 100).toFixed(1)}%`,
        icone: '✅',
      },
      {
        label: 'Tempo Médio até Sentença',
        valor: formatarTempo(metricas.tempos.distribuicao_sentenca_dias),
        icone: '⏱️',
      },
    ];

    if (metricas.valores.media_condenacao > 0) {
      kpis.push({
        label: 'Valor Médio de Condenação',
        valor: formatarValor(metricas.valores.media_condenacao),
        icone: '💰',
      });
    }

    const secoes: ReportSection[] = [];

    // Seção: Volume Processual
    if (metricas.volume.por_mes.length > 0) {
      secoes.push({
        titulo: 'Volume Processual',
        tipo: 'grafico',
        ordem: 1,
        conteudo: {
          tipo: 'bar',
          labels: metricas.volume.por_mes.map(m => m.mes),
          datasets: [{
            label: 'Processos',
            data: metricas.volume.por_mes.map(m => m.quantidade),
            backgroundColor: [this.style.primaryColor],
          }],
        } as ChartData,
      });
    }

    // Seção: Distribuição de Resultados
    secoes.push({
      titulo: 'Distribuição de Resultados',
      tipo: 'grafico',
      ordem: 2,
      conteudo: {
        tipo: 'pie',
        labels: ['Procedente', 'Improcedente', 'Parcialmente Procedente', 'Acordo', 'Extinção'],
        datasets: [{
          label: 'Resultados',
          data: [
            metricas.taxas.procedencia * 100,
            metricas.taxas.improcedencia * 100,
            metricas.taxas.parcial_procedencia * 100,
            metricas.taxas.acordo * 100,
            metricas.taxas.extincao_sem_merito * 100,
          ],
          backgroundColor: ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6', '#6b7280'],
        }],
      } as ChartData,
    });

    // Seção: Ranking por Classe
    if (metricas.distribuicao.por_classe.length > 0) {
      secoes.push({
        titulo: 'Classes Processuais Mais Frequentes',
        tipo: 'tabela',
        ordem: 3,
        conteudo: {
          colunas: ['Classe', 'Quantidade', '%'],
          linhas: metricas.distribuicao.por_classe.slice(0, 10).map(c => [
            c.classe,
            c.quantidade.toLocaleString('pt-BR'),
            `${(c.percentual * 100).toFixed(1)}%`,
          ]),
        },
      });
    }

    // Seção: Ranking por Vara
    if (metricas.distribuicao.por_vara && metricas.distribuicao.por_vara.length > 0) {
      secoes.push({
        titulo: 'Varas com Maior Volume',
        tipo: 'tabela',
        ordem: 4,
        conteudo: {
          colunas: ['Vara', 'Processos', '%'],
          linhas: metricas.distribuicao.por_vara.slice(0, 10).map(v => [
            v.vara,
            v.quantidade.toLocaleString('pt-BR'),
            `${(v.percentual * 100).toFixed(1)}%`,
          ]),
        },
      });
    }

    // Seção: Destaques (IA)
    if (insights.destaques.length > 0) {
      secoes.push({
        titulo: 'Destaques da Análise',
        tipo: 'lista',
        ordem: 5,
        conteudo: insights.destaques,
      });
    }

    // Seção: Recomendações (IA)
    if (insights.recomendacoes.length > 0) {
      secoes.push({
        titulo: 'Recomendações Estratégicas',
        tipo: 'lista',
        ordem: 6,
        conteudo: insights.recomendacoes,
      });
    }

    const tribunalNome = escopo.tribunal || 'Geral';
    const periodoStr = `${periodo.inicio.toLocaleDateString('pt-BR')} a ${periodo.fim.toLocaleDateString('pt-BR')}`;

    const report: ReportData = {
      id: `report_jurimetrics_${Date.now()}`,
      tipo: 'jurimetrics',
      titulo: `Relatório de Jurimetria - ${tribunalNome}`,
      subtitulo: periodoStr,
      metadata: {
        gerado_em: new Date().toISOString(),
        periodo: {
          inicio: periodo.inicio.toISOString(),
          fim: periodo.fim.toISOString(),
        },
        escopo: [
          escopo.tribunal,
          escopo.tipo_acao,
          escopo.materia,
        ].filter(Boolean).join(' | ') || 'Geral',
        versao: '1.0',
      },
      sumario_executivo: insights.sumario,
      kpis,
      secoes: secoes.sort((a, b) => a.ordem - b.ordem),
      fontes: data.metadata.providers_consultados,
      disclaimer: 'Este relatório é baseado em dados públicos e análise estatística. Os resultados são probabilísticos e não constituem garantia de resultado em casos específicos. Recomenda-se sempre a análise individual de cada caso por profissional qualificado.',
    };

    // Gerar HTML
    report.html = this.generateHTML(report);

    return report;
  }

  /**
   * Gera HTML do relatório
   */
  generateHTML(report: ReportData): string {
    const { primaryColor, secondaryColor, fontFamily } = this.style;

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${report.titulo}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: ${fontFamily};
      line-height: 1.6;
      color: #1f2937;
      background: #fff;
      padding: 40px;
      max-width: 1000px;
      margin: 0 auto;
    }

    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid ${primaryColor};
    }
    .header h1 {
      color: ${primaryColor};
      font-size: 28px;
      margin-bottom: 8px;
    }
    .header .subtitle {
      color: #6b7280;
      font-size: 16px;
    }
    .header .meta {
      font-size: 12px;
      color: #9ca3af;
      margin-top: 12px;
    }

    .summary {
      background: #f8fafc;
      padding: 24px;
      border-radius: 12px;
      margin-bottom: 32px;
      border-left: 4px solid ${primaryColor};
    }
    .summary h2 {
      font-size: 18px;
      margin-bottom: 12px;
      color: ${primaryColor};
    }
    .summary p {
      color: #4b5563;
    }

    .kpis {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }
    .kpi {
      background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
      color: white;
      padding: 24px;
      border-radius: 12px;
      text-align: center;
    }
    .kpi .icon { font-size: 32px; margin-bottom: 8px; }
    .kpi .value { font-size: 28px; font-weight: 700; }
    .kpi .label { font-size: 14px; opacity: 0.9; }

    .section {
      margin-bottom: 32px;
      page-break-inside: avoid;
    }
    .section h2 {
      font-size: 20px;
      color: ${primaryColor};
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      background: #f3f4f6;
      font-weight: 600;
      color: ${primaryColor};
    }
    tr:hover { background: #f9fafb; }

    ul.lista {
      list-style: none;
      padding: 0;
    }
    ul.lista li {
      padding: 12px 16px;
      margin-bottom: 8px;
      background: #f8fafc;
      border-radius: 8px;
      border-left: 3px solid ${secondaryColor};
    }

    .chart-placeholder {
      background: #f3f4f6;
      border-radius: 12px;
      padding: 40px;
      text-align: center;
      color: #6b7280;
    }

    .footer {
      margin-top: 48px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #6b7280;
    }
    .footer .disclaimer {
      background: #fef3c7;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    .footer .sources {
      margin-top: 12px;
    }

    @media print {
      body { padding: 20px; }
      .kpi { break-inside: avoid; }
      .section { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${report.titulo}</h1>
    ${report.subtitulo ? `<div class="subtitle">${report.subtitulo}</div>` : ''}
    <div class="meta">
      Gerado em ${new Date(report.metadata.gerado_em).toLocaleString('pt-BR')} |
      ${report.metadata.escopo}
    </div>
  </div>

  <div class="summary">
    <h2>📋 Sumário Executivo</h2>
    <p>${report.sumario_executivo}</p>
  </div>

  <div class="kpis">
    ${report.kpis.map(kpi => `
      <div class="kpi">
        <div class="icon">${kpi.icone || '📈'}</div>
        <div class="value">${kpi.valor}</div>
        <div class="label">${kpi.label}</div>
      </div>
    `).join('')}
  </div>

  ${report.secoes.map(secao => this.renderSection(secao)).join('')}

  <div class="footer">
    <div class="disclaimer">
      <strong>⚠️ Aviso Legal:</strong> ${report.disclaimer}
    </div>
    <div class="sources">
      <strong>Fontes:</strong> ${report.fontes.join(', ')}
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Renderiza uma seção do relatório
   */
  private renderSection(secao: ReportSection): string {
    let conteudoHTML = '';

    switch (secao.tipo) {
      case 'tabela': {
        const tabela = secao.conteudo as { colunas: string[]; linhas: string[][] };
        conteudoHTML = `
          <table>
            <thead>
              <tr>${tabela.colunas.map(c => `<th>${c}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${tabela.linhas.map(linha => `
                <tr>${linha.map(cel => `<td>${cel}</td>`).join('')}</tr>
              `).join('')}
            </tbody>
          </table>
        `;
        break;
      }

      case 'lista': {
        const items = secao.conteudo as string[];
        conteudoHTML = `
          <ul class="lista">
            ${items.map(item => `<li>• ${item}</li>`).join('')}
          </ul>
        `;
        break;
      }

      case 'grafico': {
        const chart = secao.conteudo as ChartData;
        // Placeholder para gráficos - no frontend pode usar Chart.js
        conteudoHTML = `
          <div class="chart-placeholder" data-chart='${JSON.stringify(chart)}'>
            📊 Gráfico: ${secao.titulo}<br>
            <small>Visualização disponível na versão interativa</small>
          </div>
        `;
        break;
      }

      case 'texto': {
        conteudoHTML = `<p>${secao.conteudo}</p>`;
        break;
      }

      default:
        conteudoHTML = `<pre>${JSON.stringify(secao.conteudo, null, 2)}</pre>`;
    }

    return `
      <div class="section">
        <h2>${secao.titulo}</h2>
        ${conteudoHTML}
      </div>
    `;
  }

  /**
   * Converte relatório para JSON exportável
   */
  toJSON(report: ReportData): object {
    return {
      ...report,
      html: undefined, // Remove HTML do JSON
      exportado_em: new Date().toISOString(),
    };
  }
}

/**
 * Factory function
 */
export function createReportGenerator(style?: Partial<ReportStyle>): ReportGeneratorAdapter {
  return new ReportGeneratorAdapter(style);
}
