import { jsPDF } from "jspdf";
import {
  formatExportDate,
  stripMarkdown,
  type MessageExportInput,
} from "./message-export";

const COLORS = {
  primary: [30, 64, 175] as [number, number, number],
  text: [31, 41, 55] as [number, number, number],
  textLight: [107, 114, 128] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  gray: [229, 231, 235] as [number, number, number],
};

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 20;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

class MessagePDFBuilder {
  private doc: jsPDF;
  private y = 0;
  private pageNumber = 1;

  constructor() {
    this.doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  }

  private checkPageBreak(needed: number) {
    if (this.y + needed > PAGE_HEIGHT - 25) {
      this.drawFooter();
      this.doc.addPage();
      this.pageNumber += 1;
      this.y = 25;
    }
  }

  private drawHeader(message: MessageExportInput) {
    // Faixa azul Juriscan
    this.doc.setFillColor(...COLORS.primary);
    this.doc.rect(0, 0, PAGE_WIDTH, 38, "F");

    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(22);
    this.doc.setTextColor(...COLORS.white);
    this.doc.text("JURISCAN", PAGE_WIDTH / 2, 16, { align: "center" });

    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(9);
    this.doc.setTextColor(147, 197, 253);
    this.doc.text(
      "Resposta do Assistente Juridico",
      PAGE_WIDTH / 2,
      25,
      { align: "center" }
    );

    this.doc.setFillColor(96, 165, 250);
    this.doc.rect(0, 38, PAGE_WIDTH, 1.5, "F");

    this.y = 50;

    if (message.conversationTitle) {
      this.doc.setFont("helvetica", "bold");
      this.doc.setFontSize(13);
      this.doc.setTextColor(...COLORS.text);
      const titleLines = this.doc.splitTextToSize(
        message.conversationTitle,
        CONTENT_WIDTH
      );
      this.doc.text(titleLines, PAGE_WIDTH / 2, this.y, { align: "center" });
      this.y += titleLines.length * 6 + 2;
    }

    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(9);
    this.doc.setTextColor(...COLORS.textLight);
    const meta = `Data: ${formatExportDate(message.createdAt)}  |  Exportado em ${formatExportDate(new Date().toISOString())}`;
    this.doc.text(meta, PAGE_WIDTH / 2, this.y, { align: "center" });
    this.y += 8;

    this.doc.setDrawColor(...COLORS.gray);
    this.doc.setLineWidth(0.3);
    this.doc.line(MARGIN, this.y, PAGE_WIDTH - MARGIN, this.y);
    this.y += 8;
  }

  private drawContent(content: string) {
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(11);
    this.doc.setTextColor(...COLORS.text);

    // Quebra em parágrafos para preservar respiro do texto
    const paragraphs = content.split(/\n{2,}/);

    for (const paragraph of paragraphs) {
      const text = paragraph.replace(/\n/g, " ").trim();
      if (!text) continue;

      const lines = this.doc.splitTextToSize(text, CONTENT_WIDTH);
      const blockHeight = lines.length * 5.2;

      this.checkPageBreak(blockHeight + 4);
      this.doc.text(lines, MARGIN, this.y);
      this.y += blockHeight + 4;
    }
  }

  private drawDisclaimer() {
    this.checkPageBreak(20);
    this.y += 4;
    this.doc.setDrawColor(...COLORS.gray);
    this.doc.setLineWidth(0.3);
    this.doc.line(MARGIN, this.y, PAGE_WIDTH - MARGIN, this.y);
    this.y += 4;

    this.doc.setFont("helvetica", "italic");
    this.doc.setFontSize(8);
    this.doc.setTextColor(...COLORS.textLight);
    const disclaimer =
      "Esta resposta foi produzida por IA e nao constitui aconselhamento juridico. " +
      "As decisoes processuais sao de responsabilidade exclusiva do advogado responsavel pelo caso.";
    const lines = this.doc.splitTextToSize(disclaimer, CONTENT_WIDTH);
    this.doc.text(lines, MARGIN, this.y);
    this.y += lines.length * 4;
  }

  private drawFooter() {
    const footerY = PAGE_HEIGHT - 15;
    this.doc.setDrawColor(...COLORS.gray);
    this.doc.setLineWidth(0.2);
    this.doc.line(MARGIN, footerY - 4, PAGE_WIDTH - MARGIN, footerY - 4);

    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(8);
    this.doc.setTextColor(...COLORS.textLight);
    this.doc.text("Juriscan - Inteligencia Juridica", MARGIN, footerY);
    this.doc.text(
      `Pagina ${this.pageNumber}`,
      PAGE_WIDTH - MARGIN,
      footerY,
      { align: "right" }
    );
  }

  build(message: MessageExportInput): Blob {
    this.drawHeader(message);
    this.drawContent(stripMarkdown(message.content));
    this.drawDisclaimer();
    this.drawFooter();
    return this.doc.output("blob");
  }
}

export function generateMessagePDF(message: MessageExportInput): Blob {
  return new MessagePDFBuilder().build(message);
}
