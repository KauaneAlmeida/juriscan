// Regras de senha compartilhadas entre frontend e backend
export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_RULES = [
  { label: "8+ caracteres", test: (p: string) => p.length >= PASSWORD_MIN_LENGTH },
  { label: "Letra maiuscula", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Letra minuscula", test: (p: string) => /[a-z]/.test(p) },
  { label: "Um numero", test: (p: string) => /[0-9]/.test(p) },
];

export function isPasswordValid(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}
