import Link from "next/link";

const productLinks = [
  { label: "Funcionalidades", href: "#funcionalidades" },
  { label: "Planos", href: "#planos" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Segurança", href: "#" },
];

const companyLinks = [
  { label: "Sobre", href: "#" },
  { label: "Blog", href: "#" },
  { label: "Contato", href: "#" },
  { label: "Termos de uso", href: "/terms" },
  { label: "Privacidade", href: "/privacy" },
];

export default function Footer() {
  return (
    <footer className="bg-[#070e16] pb-8 pt-12">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        {/* Top */}
        <div className="flex flex-wrap items-start justify-between gap-10">
          {/* Logo + tagline */}
          <div className="max-w-[280px]">
            <Link href="/" className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#1a4fd6] font-dm-sans text-[15px] font-bold text-white"
              >
                J
              </span>
              <span className="font-dm-sans text-[17px] font-semibold tracking-tight text-white">
                Juriscan
              </span>
            </Link>
            <p className="mt-3 font-dm-sans text-[14px] text-white/40">
              Inteligência jurídica com dados reais.
            </p>
          </div>

          {/* Links columns */}
          <div className="flex flex-wrap gap-12 sm:gap-16">
            <div>
              <p className="font-dm-sans text-[13px] font-semibold uppercase tracking-[1.5px] text-white/60">
                Produto
              </p>
              <ul className="mt-4 space-y-3">
                {productLinks.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="font-dm-sans text-[14px] text-white/40 transition-colors hover:text-white/80"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="font-dm-sans text-[13px] font-semibold uppercase tracking-[1.5px] text-white/60">
                Empresa
              </p>
              <ul className="mt-4 space-y-3">
                {companyLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="font-dm-sans text-[14px] text-white/40 transition-colors hover:text-white/80"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-white/[0.06] pt-6 sm:flex-row sm:items-center">
          <p className="font-dm-sans text-[13px] text-white/25">
            © 2025 Juriscan. Todos os direitos reservados.
          </p>
          <p className="font-dm-sans text-[13px] text-white/25">
            Feito com IA para advogados brasileiros
          </p>
        </div>
      </div>
    </footer>
  );
}
