import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitiza HTML removendo scripts e atributos perigosos.
 * Permite tags seguras de formatação (b, i, em, strong, p, br, ul, ol, li, a).
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br", "ul", "ol", "li", "a", "h1", "h2", "h3", "code", "pre"],
    ALLOWED_ATTR: ["href", "target", "rel"],
  });
}

/**
 * Remove todas as tags HTML, retornando apenas texto puro.
 */
export function sanitizeText(dirty: string): string {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
}
