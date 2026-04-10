import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";
import {
  formatExportDate,
  stripMarkdown,
  type MessageExportInput,
} from "./message-export";

/**
 * Constrói parágrafos do corpo a partir da mensagem (markdown stripado).
 * Cada bloco separado por linha em branco vira um parágrafo independente,
 * e bullets `• ` viram parágrafos com marcador.
 */
function buildBodyParagraphs(content: string): Paragraph[] {
  const stripped = stripMarkdown(content);
  const paragraphs = stripped.split(/\n{2,}/);

  const result: Paragraph[] = [];
  for (const block of paragraphs) {
    const lines = block.split(/\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    for (const line of lines) {
      const isBullet = line.startsWith("• ");
      const text = isBullet ? line.slice(2) : line;
      result.push(
        new Paragraph({
          spacing: { after: 160 },
          bullet: isBullet ? { level: 0 } : undefined,
          children: [new TextRun({ text, size: 22 })],
        })
      );
    }
  }

  if (result.length === 0) {
    result.push(
      new Paragraph({
        children: [new TextRun({ text: "(sem conteudo)", italics: true, size: 22 })],
      })
    );
  }

  return result;
}

export async function generateMessageDOCX(
  message: MessageExportInput
): Promise<Blob> {
  const headerParagraphs: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_1,
      children: [
        new TextRun({
          text: "JURISCAN",
          bold: true,
          color: "1E40AF",
          size: 36,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: "Resposta do Assistente Juridico",
          color: "6B7280",
          size: 20,
        }),
      ],
    }),
  ];

  if (message.conversationTitle) {
    headerParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: message.conversationTitle,
            bold: true,
            size: 26,
          }),
        ],
      })
    );
  }

  headerParagraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 320 },
      children: [
        new TextRun({
          text: `Data: ${formatExportDate(message.createdAt)}  |  Exportado em ${formatExportDate(new Date().toISOString())}`,
          color: "6B7280",
          size: 18,
        }),
      ],
    })
  );

  const bodyParagraphs = buildBodyParagraphs(message.content);

  const disclaimerParagraph = new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 320 },
    children: [
      new TextRun({
        text:
          "Esta resposta foi produzida por IA e nao constitui aconselhamento juridico. " +
          "As decisoes processuais sao de responsabilidade exclusiva do advogado responsavel pelo caso.",
        italics: true,
        color: "6B7280",
        size: 16,
      }),
    ],
  });

  const doc = new Document({
    creator: "Juriscan",
    title: "Resposta do Assistente Juridico",
    sections: [
      {
        properties: {},
        children: [...headerParagraphs, ...bodyParagraphs, disclaimerParagraph],
      },
    ],
  });

  return Packer.toBlob(doc);
}
