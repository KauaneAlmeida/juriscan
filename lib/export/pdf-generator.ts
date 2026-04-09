import { jsPDF } from "jspdf";
import type {
  Report,
  PredictiveAnalysisResult,
  JurimetricsResult,
  JudgeProfileResult,
} from "@/types/reports";
import { REPORT_TYPE_INFO } from "@/types/reports";

type ReportResult =
  | PredictiveAnalysisResult
  | JurimetricsResult
  | JudgeProfileResult;

const COLORS = {
  primary: [30, 64, 175] as [number, number, number],
  primaryLight: [219, 234, 254] as [number, number, number],
  text: [31, 41, 55] as [number, number, number],
  textLight: [107, 114, 128] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  background: [248, 250, 252] as [number, number, number],
  success: [34, 197, 94] as [number, number, number],
  successLight: [220, 252, 231] as [number, number, number],
  danger: [239, 68, 68] as [number, number, number],
  dangerLight: [254, 226, 226] as [number, number, number],
  warning: [245, 158, 11] as [number, number, number],
  warningLight: [254, 243, 199] as [number, number, number],
  gray: [229, 231, 235] as [number, number, number],
  grayDark: [75, 85, 99] as [number, number, number],
};

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 20;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

class PDFBuilder {
  private doc: jsPDF;
  private y: number = 0;

  constructor() {
    this.doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    this.y = 0;
  }

  private checkPageBreak(needed: number) {
    if (this.y + needed > PAGE_HEIGHT - 40) {
      this.doc.addPage();
      this.y = 25;
    }
  }

  private drawHeader(report: Report) {
    // Blue header bar
    this.doc.setFillColor(...COLORS.primary);
    this.doc.rect(0, 0, PAGE_WIDTH, 38, "F");

    // Brand name
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(22);
    this.doc.setTextColor(...COLORS.white);
    this.doc.text("JURISCAN", PAGE_WIDTH / 2, 16, { align: "center" });

    // Subtitle
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(9);
    this.doc.setTextColor(147, 197, 253);
    this.doc.text(
      "Inteligencia Juridica Avancada",
      PAGE_WIDTH / 2,
      25,
      { align: "center" }
    );

    // Thin accent line
    this.doc.setFillColor(96, 165, 250);
    this.doc.rect(0, 38, PAGE_WIDTH, 1.5, "F");

    this.y = 50;

    // Report title
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(16);
    this.doc.setTextColor(...COLORS.text);
    const titleLines = this.doc.splitTextToSize(report.title, CONTENT_WIDTH);
    this.doc.text(titleLines, PAGE_WIDTH / 2, this.y, { align: "center" });
    this.y += titleLines.length * 7 + 4;

    // Report meta
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(9);
    this.doc.setTextColor(...COLORS.textLight);
    const meta = `${REPORT_TYPE_INFO[report.type]?.label}  |  ${formatDate(report.generated_at || report.created_at)}`;
    this.doc.text(meta, PAGE_WIDTH / 2, this.y, { align: "center" });
    this.y += 12;

    // Separator
    this.doc.setDrawColor(...COLORS.gray);
    this.doc.setLineWidth(0.3);
    this.doc.line(MARGIN, this.y, PAGE_WIDTH - MARGIN, this.y);
    this.y += 8;
  }

  private drawSectionTitle(title: string) {
    this.checkPageBreak(15);
    // Accent bar
    this.doc.setFillColor(...COLORS.primary);
    this.doc.rect(MARGIN, this.y, 3, 6, "F");

    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(12);
    this.doc.setTextColor(...COLORS.primary);
    this.doc.text(title, MARGIN + 7, this.y + 5);
    this.y += 12;
  }

  private drawMetricCard(
    x: number,
    y: number,
    width: number,
    value: string,
    label: string,
    bgColor: [number, number, number] = COLORS.background,
    valueColor: [number, number, number] = COLORS.primary
  ) {
    // Card background
    this.doc.setFillColor(...bgColor);
    this.doc.roundedRect(x, y, width, 28, 2, 2, "F");

    // Value
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(16);
    this.doc.setTextColor(...valueColor);
    this.doc.text(value, x + width / 2, y + 12, { align: "center" });

    // Label
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(7);
    this.doc.setTextColor(...COLORS.textLight);
    this.doc.text(label, x + width / 2, y + 21, { align: "center" });
  }

  private drawBulletList(items: string[], color: [number, number, number] = COLORS.text) {
    items.forEach((item) => {
      this.checkPageBreak(10);
      this.doc.setFillColor(...COLORS.primary);
      this.doc.circle(MARGIN + 3, this.y + 1.5, 1, "F");

      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(9);
      this.doc.setTextColor(...color);
      const lines = this.doc.splitTextToSize(item, CONTENT_WIDTH - 10);
      this.doc.text(lines, MARGIN + 8, this.y + 3);
      this.y += lines.length * 4.5 + 3;
    });
  }

  private drawNumberedList(items: string[]) {
    items.forEach((item, i) => {
      this.checkPageBreak(12);

      // Number circle
      this.doc.setFillColor(...COLORS.primary);
      this.doc.circle(MARGIN + 4, this.y + 2, 3, "F");
      this.doc.setFont("helvetica", "bold");
      this.doc.setFontSize(7);
      this.doc.setTextColor(...COLORS.white);
      this.doc.text(`${i + 1}`, MARGIN + 4, this.y + 3.2, { align: "center" });

      // Text
      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(9);
      this.doc.setTextColor(...COLORS.text);
      const lines = this.doc.splitTextToSize(item, CONTENT_WIDTH - 14);
      this.doc.text(lines, MARGIN + 10, this.y + 3);
      this.y += lines.length * 4.5 + 4;
    });
  }

  private drawInfoBox(
    text: string,
    bgColor: [number, number, number],
    borderColor: [number, number, number]
  ) {
    this.checkPageBreak(18);
    const lines = this.doc.splitTextToSize(text, CONTENT_WIDTH - 12);
    const boxHeight = lines.length * 4.5 + 8;

    this.doc.setFillColor(...bgColor);
    this.doc.roundedRect(MARGIN, this.y, CONTENT_WIDTH, boxHeight, 2, 2, "F");
    this.doc.setDrawColor(...borderColor);
    this.doc.setLineWidth(0.3);
    this.doc.roundedRect(MARGIN, this.y, CONTENT_WIDTH, boxHeight, 2, 2, "S");

    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(9);
    this.doc.setTextColor(...COLORS.text);
    this.doc.text(lines, MARGIN + 6, this.y + 6);
    this.y += boxHeight + 4;
  }

  private drawDoughnutChart(
    x: number,
    y: number,
    radius: number,
    segments: { value: number; color: [number, number, number]; label: string }[]
  ) {
    const total = segments.reduce((sum, s) => sum + s.value, 0);
    if (total === 0) return;

    let startAngle = -Math.PI / 2;
    const cx = x;
    const cy = y;
    const innerRadius = radius * 0.55;

    segments.forEach((seg) => {
      if (seg.value <= 0) return;
      const sweepAngle = (seg.value / total) * 2 * Math.PI;
      const endAngle = startAngle + sweepAngle;

      // Draw arc segment using filled polygon approximation
      this.doc.setFillColor(...seg.color);

      const points: number[][] = [];
      const steps = Math.max(20, Math.ceil(sweepAngle * 20));
      for (let i = 0; i <= steps; i++) {
        const angle = startAngle + (sweepAngle * i) / steps;
        points.push([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]);
      }
      for (let i = steps; i >= 0; i--) {
        const angle = startAngle + (sweepAngle * i) / steps;
        points.push([cx + Math.cos(angle) * innerRadius, cy + Math.sin(angle) * innerRadius]);
      }

      // Draw polygon
      if (points.length > 2) {
        this.doc.setLineWidth(0);
        // Use lines method for polygon
        const firstPoint = points[0];
        this.doc.moveTo(firstPoint[0], firstPoint[1]);
        for (let i = 1; i < points.length; i++) {
          this.doc.lineTo(points[i][0], points[i][1]);
        }
        this.doc.lineTo(firstPoint[0], firstPoint[1]);
        this.doc.fill();
      }

      startAngle = endAngle;
    });

    // Inner circle (white center)
    this.doc.setFillColor(...COLORS.white);
    this.doc.circle(cx, cy, innerRadius - 0.5, "F");

    // Legend
    let legendY = y - (segments.length * 5) / 2;
    const legendX = x + radius + 8;
    segments.forEach((seg) => {
      if (seg.value <= 0) return;
      this.doc.setFillColor(...seg.color);
      this.doc.rect(legendX, legendY - 2, 4, 4, "F");
      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(8);
      this.doc.setTextColor(...COLORS.text);
      const pct = ((seg.value / total) * 100).toFixed(1);
      this.doc.text(`${seg.label} (${pct}%)`, legendX + 6, legendY + 1);
      legendY += 7;
    });
  }

  private drawBarChart(
    x: number,
    y: number,
    width: number,
    height: number,
    items: { label: string; value: number; color: [number, number, number] }[]
  ) {
    if (items.length === 0) return;
    const maxVal = Math.max(...items.map((i) => i.value), 1);
    const barWidth = Math.min(20, (width - 10) / items.length - 4);
    const chartLeft = x + 10;
    const chartBottom = y + height;

    // Y-axis
    this.doc.setDrawColor(...COLORS.gray);
    this.doc.setLineWidth(0.2);
    this.doc.line(chartLeft, y, chartLeft, chartBottom);
    this.doc.line(chartLeft, chartBottom, x + width, chartBottom);

    items.forEach((item, i) => {
      const barHeight = (item.value / maxVal) * (height - 5);
      const bx = chartLeft + 5 + i * (barWidth + 4);
      const by = chartBottom - barHeight;

      this.doc.setFillColor(...item.color);
      this.doc.roundedRect(bx, by, barWidth, barHeight, 1, 1, "F");

      // Value on top
      this.doc.setFont("helvetica", "bold");
      this.doc.setFontSize(7);
      this.doc.setTextColor(...item.color);
      this.doc.text(`${item.value}%`, bx + barWidth / 2, by - 2, { align: "center" });

      // Label below
      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(6);
      this.doc.setTextColor(...COLORS.textLight);
      const label = item.label.length > 10 ? item.label.slice(0, 9) + "..." : item.label;
      this.doc.text(label, bx + barWidth / 2, chartBottom + 5, { align: "center" });
    });
  }

  private drawFooter() {
    const footerY = PAGE_HEIGHT - 30;

    this.doc.setDrawColor(...COLORS.gray);
    this.doc.setLineWidth(0.3);
    this.doc.line(MARGIN, footerY, PAGE_WIDTH - MARGIN, footerY);

    this.doc.setFont("helvetica", "italic");
    this.doc.setFontSize(7);
    this.doc.setTextColor(...COLORS.textLight);
    this.doc.text(
      "AVISO: Esta analise e baseada em padroes estatisticos e jurisprudencia historica. Nao constitui garantia de resultado nem substitui parecer juridico profissional.",
      PAGE_WIDTH / 2,
      footerY + 6,
      { align: "center", maxWidth: CONTENT_WIDTH }
    );

    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(8);
    this.doc.setTextColor(...COLORS.primary);
    this.doc.text("Juriscan - Inteligencia Juridica", PAGE_WIDTH / 2, footerY + 18, {
      align: "center",
    });
  }

  private renderPredictiveAnalysis(data: PredictiveAnalysisResult) {
    // Metrics row
    const cardWidth = CONTENT_WIDTH / 2 - 3;
    this.drawMetricCard(
      MARGIN,
      this.y,
      cardWidth,
      `${data.probabilidade_exito}%`,
      "Probabilidade de Exito",
      COLORS.primaryLight,
      COLORS.primary
    );
    const confColor =
      data.confianca === "alta"
        ? COLORS.success
        : data.confianca === "media"
          ? COLORS.warning
          : COLORS.danger;
    const confBg =
      data.confianca === "alta"
        ? COLORS.successLight
        : data.confianca === "media"
          ? COLORS.warningLight
          : COLORS.dangerLight;
    this.drawMetricCard(
      MARGIN + cardWidth + 6,
      this.y,
      cardWidth,
      data.confianca.toUpperCase(),
      "Nivel de Confianca",
      confBg,
      confColor
    );
    this.y += 35;

    // Executive summary
    this.drawSectionTitle("Resumo Executivo");
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(9);
    this.doc.setTextColor(...COLORS.text);
    const summaryLines = this.doc.splitTextToSize(data.resumo_executivo, CONTENT_WIDTH);
    this.checkPageBreak(summaryLines.length * 4.5 + 5);
    this.doc.text(summaryLines, MARGIN, this.y);
    this.y += summaryLines.length * 4.5 + 8;

    // Favorable factors
    this.drawSectionTitle("Fatores Favoraveis");
    this.drawBulletList(data.fatores_favoraveis, COLORS.success);
    this.y += 4;

    // Unfavorable factors
    this.drawSectionTitle("Fatores Desfavoraveis");
    this.drawBulletList(data.fatores_desfavoraveis, COLORS.danger);
    this.y += 4;

    // Recommendations
    this.drawSectionTitle("Recomendacoes Estrategicas");
    this.drawNumberedList(data.recomendacoes);
    this.y += 4;

    // Jurisprudence
    if (data.jurisprudencia.length > 0) {
      this.drawSectionTitle("Jurisprudencia Relevante");
      data.jurisprudencia.forEach((j) => {
        this.checkPageBreak(15);
        this.doc.setFillColor(...COLORS.background);
        const jText = `${j.tribunal} - ${j.numero}: ${j.resumo}`;
        const jLines = this.doc.splitTextToSize(jText, CONTENT_WIDTH - 10);
        const boxH = jLines.length * 4.5 + 6;
        this.doc.roundedRect(MARGIN, this.y, CONTENT_WIDTH, boxH, 1.5, 1.5, "F");
        this.doc.setFont("helvetica", "normal");
        this.doc.setFontSize(8);
        this.doc.setTextColor(...COLORS.text);
        this.doc.text(jLines, MARGIN + 5, this.y + 5);
        this.y += boxH + 3;
      });
      this.y += 4;
    }

    // Risks
    if (data.riscos.length > 0) {
      this.drawSectionTitle("Riscos Identificados");
      data.riscos.forEach((risco) => {
        this.drawInfoBox(risco, COLORS.warningLight, COLORS.warning);
      });
    }
  }

  private renderJurimetrics(data: JurimetricsResult) {
    // 4 metric cards
    const cw = (CONTENT_WIDTH - 12) / 4;
    this.drawMetricCard(MARGIN, this.y, cw, data.volume_total.toLocaleString(), "Processos");
    this.drawMetricCard(
      MARGIN + cw + 4,
      this.y,
      cw,
      `${data.taxa_procedencia}%`,
      "Procedentes",
      COLORS.successLight,
      COLORS.success
    );
    this.drawMetricCard(
      MARGIN + (cw + 4) * 2,
      this.y,
      cw,
      `${data.taxa_improcedencia}%`,
      "Improcedentes",
      COLORS.dangerLight,
      COLORS.danger
    );
    this.drawMetricCard(
      MARGIN + (cw + 4) * 3,
      this.y,
      cw,
      `${data.tempo_medio_sentenca_dias}`,
      "Dias ate Sentenca",
      COLORS.primaryLight,
      COLORS.primary
    );
    this.y += 36;

    // Distribution chart
    this.drawSectionTitle("Distribuicao de Resultados");
    this.checkPageBreak(55);
    this.drawDoughnutChart(MARGIN + 30, this.y + 22, 18, [
      { value: data.taxa_procedencia, color: COLORS.success, label: "Procedente" },
      { value: data.taxa_improcedencia, color: COLORS.danger, label: "Improcedente" },
      { value: data.taxa_parcial, color: COLORS.warning, label: "Parcial" },
      { value: data.taxa_acordo, color: COLORS.primary, label: "Acordo" },
    ]);

    // Bar chart on the right
    this.drawBarChart(MARGIN + 90, this.y, 75, 40, [
      { label: "Procedente", value: data.taxa_procedencia, color: COLORS.success },
      { label: "Improcedente", value: data.taxa_improcedencia, color: COLORS.danger },
      { label: "Parcial", value: data.taxa_parcial, color: COLORS.warning },
      { label: "Acordo", value: data.taxa_acordo, color: COLORS.primary },
    ]);
    this.y += 52;

    // National comparison
    this.drawSectionTitle("Comparativo Nacional");
    const compText = `${data.comparativo_nacional.acima_media ? "Acima" : "Abaixo"} da media nacional: ${data.comparativo_nacional.diferenca_percentual > 0 ? "+" : ""}${data.comparativo_nacional.diferenca_percentual}%`;
    const compBg = data.comparativo_nacional.acima_media ? COLORS.successLight : COLORS.warningLight;
    const compBorder = data.comparativo_nacional.acima_media ? COLORS.success : COLORS.warning;
    this.drawInfoBox(compText, compBg, compBorder);
    this.y += 4;

    // Additional stats
    this.drawSectionTitle("Estatisticas Adicionais");
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(9);
    this.doc.setTextColor(...COLORS.text);
    const stats = [
      `Tribunal: ${data.tribunal}`,
      `Periodo: ${data.periodo_analise.inicio} a ${data.periodo_analise.fim}`,
      `Taxa Parcial: ${data.taxa_parcial}%`,
      `Taxa de Acordo: ${data.taxa_acordo}%`,
      `Tempo Medio ate Transito: ${data.tempo_medio_transito_dias} dias`,
    ];
    if (data.valor_medio_condenacao) {
      stats.push(`Valor Medio de Condenacao: R$ ${data.valor_medio_condenacao.toLocaleString("pt-BR")}`);
    }
    this.drawBulletList(stats);
    this.y += 4;

    // Trends
    this.drawSectionTitle("Tendencias Identificadas");
    this.drawNumberedList(data.tendencias);
    this.y += 4;

    // Insights
    this.drawSectionTitle("Insights");
    data.insights.forEach((insight) => {
      this.drawInfoBox(insight, COLORS.primaryLight, COLORS.primary);
    });
  }

  private renderJudgeProfile(data: JudgeProfileResult) {
    // Judge info card
    this.checkPageBreak(30);
    this.doc.setFillColor(...COLORS.background);
    this.doc.roundedRect(MARGIN, this.y, CONTENT_WIDTH, 22, 2, 2, "F");
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(12);
    this.doc.setTextColor(...COLORS.text);
    this.doc.text(data.magistrado.nome, MARGIN + 6, this.y + 8);
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(9);
    this.doc.setTextColor(...COLORS.textLight);
    this.doc.text(
      `${data.magistrado.tribunal} - ${data.magistrado.vara_camara}  |  ${data.magistrado.tempo_atuacao_anos} anos de atuacao`,
      MARGIN + 6,
      this.y + 16
    );
    this.y += 30;

    // Stats cards
    const cw = (CONTENT_WIDTH - 12) / 4;
    this.drawMetricCard(MARGIN, this.y, cw, `${data.estatisticas.total_decisoes}`, "Decisoes");
    this.drawMetricCard(
      MARGIN + cw + 4,
      this.y,
      cw,
      `${data.estatisticas.taxa_procedencia}%`,
      "Procedencia",
      COLORS.successLight,
      COLORS.success
    );
    this.drawMetricCard(
      MARGIN + (cw + 4) * 2,
      this.y,
      cw,
      `${data.estatisticas.taxa_reforma}%`,
      "Reforma",
      COLORS.warningLight,
      COLORS.warning
    );
    this.drawMetricCard(
      MARGIN + (cw + 4) * 3,
      this.y,
      cw,
      `${data.estatisticas.tempo_medio_decisao_dias}`,
      "Dias p/ Decisao",
      COLORS.primaryLight,
      COLORS.primary
    );
    this.y += 36;

    // Tendency
    this.drawSectionTitle("Tendencia Identificada");
    const favLabel =
      data.tendencias.favorece === "autor"
        ? "o Autor"
        : data.tendencias.favorece === "reu"
          ? "o Reu"
          : "Neutro";
    const tendBg =
      data.tendencias.favorece === "autor"
        ? COLORS.successLight
        : data.tendencias.favorece === "reu"
          ? COLORS.warningLight
          : COLORS.background;
    const tendBorder =
      data.tendencias.favorece === "autor"
        ? COLORS.success
        : data.tendencias.favorece === "reu"
          ? COLORS.warning
          : COLORS.gray;
    this.drawInfoBox(
      `Favorece ${favLabel} com intensidade ${data.tendencias.intensidade}`,
      tendBg,
      tendBorder
    );
    this.y += 4;

    // Case types with bar chart
    if (data.tipos_caso_frequentes.length > 0) {
      this.drawSectionTitle("Tipos de Caso Mais Frequentes");
      // Horizontal bars
      data.tipos_caso_frequentes.forEach((tipo) => {
        this.checkPageBreak(10);
        const barMaxWidth = CONTENT_WIDTH - 50;
        const barWidth = (tipo.percentual / 100) * barMaxWidth;

        this.doc.setFont("helvetica", "normal");
        this.doc.setFontSize(8);
        this.doc.setTextColor(...COLORS.text);
        this.doc.text(tipo.tipo, MARGIN, this.y + 3);

        // Bar background
        this.doc.setFillColor(...COLORS.gray);
        this.doc.roundedRect(MARGIN + 40, this.y, barMaxWidth, 5, 1, 1, "F");

        // Bar value
        this.doc.setFillColor(...COLORS.primary);
        if (barWidth > 2) {
          this.doc.roundedRect(MARGIN + 40, this.y, barWidth, 5, 1, 1, "F");
        }

        // Percentage
        this.doc.setFont("helvetica", "bold");
        this.doc.setFontSize(8);
        this.doc.text(`${tipo.percentual}%`, MARGIN + 42 + barMaxWidth, this.y + 4);
        this.y += 9;
      });
      this.y += 4;
    }

    // Recommendations
    this.drawSectionTitle("Recomendacoes Estrategicas");
    this.drawNumberedList(data.recomendacoes_estrategicas);
  }

  generate(report: Report, result: ReportResult): Blob {
    this.drawHeader(report);

    switch (report.type) {
      case "PREDICTIVE_ANALYSIS":
        this.renderPredictiveAnalysis(result as PredictiveAnalysisResult);
        break;
      case "JURIMETRICS":
        this.renderJurimetrics(result as JurimetricsResult);
        break;
      case "RELATOR_PROFILE":
        this.renderJudgeProfile(result as JudgeProfileResult);
        break;
      default: {
        this.doc.setFont("helvetica", "normal");
        this.doc.setFontSize(10);
        this.doc.setTextColor(...COLORS.textLight);
        this.doc.text("Tipo de relatorio sem visualizacao PDF disponivel.", PAGE_WIDTH / 2, this.y, {
          align: "center",
        });
      }
    }

    // Add footer to all pages
    const totalPages = this.doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      this.drawFooter();
      // Page number
      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(7);
      this.doc.setTextColor(...COLORS.textLight);
      this.doc.text(`Pagina ${i} de ${totalPages}`, PAGE_WIDTH / 2, PAGE_HEIGHT - 10, {
        align: "center",
      });
    }

    return this.doc.output("blob");
  }
}

export function generatePDF(report: Report, result: ReportResult): Blob {
  const builder = new PDFBuilder();
  return builder.generate(report, result);
}
