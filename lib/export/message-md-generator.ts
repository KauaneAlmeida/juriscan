import { formatExportDate, type MessageExportInput } from "./message-export";

/**
 * Gera um arquivo Markdown preservando a formatação original da resposta.
 * O conteúdo da IA já vem em markdown, então só adicionamos um cabeçalho
 * de metadata e um disclaimer no final.
 */
export function generateMessageMD(message: MessageExportInput): string {
  let md = "";

  md += `# Resposta do Assistente Jurídico — Juriscan\n\n`;

  if (message.conversationTitle) {
    md += `**Conversa:** ${message.conversationTitle}  \n`;
  }
  md += `**Data:** ${formatExportDate(message.createdAt)}  \n`;
  md += `**Exportado em:** ${formatExportDate(new Date().toISOString())}\n\n`;

  md += `---\n\n`;
  md += `${message.content.trim()}\n\n`;
  md += `---\n\n`;
  md += `> *Documento gerado pela plataforma Juriscan. Esta resposta foi produzida por IA e ` +
        `não constitui aconselhamento jurídico. As decisões processuais são de responsabilidade ` +
        `exclusiva do advogado responsável pelo caso.*\n`;

  return md;
}
