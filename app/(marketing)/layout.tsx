import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Juriscan — Inteligência Artificial para Advogados",
  description:
    "Analise processos em minutos com IA. Jurimetria preditiva, análise de documentos e relatórios automatizados para advogados brasileiros.",
  keywords:
    "IA jurídica, jurimetria, análise processual, inteligência artificial advogados, legal tech brasil",
  openGraph: {
    title: "Juriscan — Analise processos em minutos, não em horas",
    description:
      "IA de última geração para análise jurídica, jurimetria preditiva e geração de relatórios.",
    type: "website",
    url: "https://juriscan.io",
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
