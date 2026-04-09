/**
 * Normaliza emails para detectar aliases e variações do mesmo endereço.
 *
 * - Gmail/Googlemail: remove pontos do local part e strip +alias
 * - Outlook/Hotmail/Live: strip +alias
 * - Outros provedores: strip +alias
 */

const GMAIL_DOMAINS = new Set(["gmail.com", "googlemail.com"]);

const OUTLOOK_DOMAINS = new Set([
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "outlook.com.br",
  "hotmail.com.br",
]);

export function normalizeEmail(email: string): string {
  const lower = email.toLowerCase().trim();
  const atIndex = lower.lastIndexOf("@");
  if (atIndex === -1) return lower;

  let localPart = lower.slice(0, atIndex);
  const domain = lower.slice(atIndex + 1);

  // Strip +alias for all providers
  const plusIndex = localPart.indexOf("+");
  if (plusIndex !== -1) {
    localPart = localPart.slice(0, plusIndex);
  }

  // Gmail: remove dots from local part & normalize domain
  if (GMAIL_DOMAINS.has(domain)) {
    localPart = localPart.replace(/\./g, "");
    return `${localPart}@gmail.com`;
  }

  // Outlook: just strip alias (already done above)
  if (OUTLOOK_DOMAINS.has(domain)) {
    return `${localPart}@${domain}`;
  }

  return `${localPart}@${domain}`;
}
