// Tipos compartilhados pelos geradores de exportação de uma única mensagem
// (resposta isolada do assistente jurídico) em PDF, Word, Markdown e TXT.

export interface MessageExportInput {
  /** Conteúdo da resposta da IA (pode conter markdown). */
  content: string;
  /** ISO timestamp em que a mensagem foi criada. */
  createdAt: string;
  /**
   * Título opcional da conversa de origem — usado apenas como referência
   * no cabeçalho do documento exportado, não no nome do arquivo.
   */
  conversationTitle?: string | null;
}

export function formatExportDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Sanitiza um pedaço de texto para ser usado como nome de arquivo seguro
 * em qualquer SO. Se o resultado for vazio, devolve "resposta".
 */
export function sanitizeForFilename(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 60) || "resposta"
  );
}

/**
 * Remove a sintaxe markdown mais comum, deixando texto plano.
 * Usado nos geradores PDF/TXT/DOCX onde queremos legibilidade
 * sem dependência de parser de markdown.
 */
export function stripMarkdown(md: string): string {
  return md
    // code fences ``` ... ```
    .replace(/```[\s\S]*?```/g, (block) =>
      block.replace(/```\w*\n?/g, "").replace(/```$/g, "")
    )
    // inline code `x`
    .replace(/`([^`]+)`/g, "$1")
    // bold **x** / __x__
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    // italic *x* / _x_
    .replace(/(^|\W)\*([^*\n]+)\*(?=\W|$)/g, "$1$2")
    .replace(/(^|\W)_([^_\n]+)_(?=\W|$)/g, "$1$2")
    // headings #
    .replace(/^#{1,6}\s+/gm, "")
    // links [text](url) -> text (url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    // images ![alt](url) -> alt
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    // bullets/quotes prefixes
    .replace(/^\s*[-*+]\s+/gm, "• ")
    .replace(/^\s*>\s?/gm, "")
    // horizontal rules
    .replace(/^-{3,}$/gm, "")
    .trim();
}
