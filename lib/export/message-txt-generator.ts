import {
  formatExportDate,
  stripMarkdown,
  type MessageExportInput,
} from "./message-export";

export function generateMessageTXT(message: MessageExportInput): string {
  const divider = "\u2550".repeat(60);
  const subDivider = "\u2500".repeat(60);
  let text = "";

  text += `${divider}\n`;
  text += `JURISCAN - RESPOSTA DO ASSISTENTE JURIDICO\n`;
  text += `${divider}\n\n`;

  if (message.conversationTitle) {
    text += `Conversa: ${message.conversationTitle}\n`;
  }
  text += `Data: ${formatExportDate(message.createdAt)}\n`;
  text += `Exportado em: ${formatExportDate(new Date().toISOString())}\n`;
  text += `\n${subDivider}\n\n`;

  text += `${stripMarkdown(message.content)}\n\n`;

  text += `${divider}\n`;
  text += `Documento gerado pela plataforma Juriscan.\n`;
  text += `Esta resposta foi produzida por IA e nao constitui aconselhamento\n`;
  text += `juridico. As decisoes processuais sao de responsabilidade exclusiva\n`;
  text += `do advogado responsavel pelo caso.\n`;
  text += `${divider}\n`;

  return text;
}
