import Link from "next/link";
import { Check } from "lucide-react";

type Plan = {
  nome: string;
  publico: string;
  preco: string;
  features: string[];
  cta: string;
  ctaHref: string;
  destaque?: boolean;
};

const plans: Plan[] = [
  {
    nome: "Starter",
    publico: "Para advogados autônomos",
    preco: "R$69",
    features: [
      "100 créditos por mês",
      "Chat jurídico com IA",
      "Análise de documentos PDF",
      "Histórico de conversas",
    ],
    cta: "Começar agora",
    ctaHref: "/register",
  },
  {
    nome: "Pro",
    publico: "Para escritórios em crescimento",
    preco: "R$129",
    features: [
      "300 créditos por mês",
      "Tudo do Starter",
      "Relatórios em PDF",
      "Jurimetria avançada",
      "Análises preditivas",
      "Suporte prioritário",
    ],
    cta: "Começar agora",
    ctaHref: "/register",
    destaque: true,
  },
  {
    nome: "Business",
    publico: "Para escritórios de médio e grande porte",
    preco: "R$299",
    features: [
      "800 créditos por mês",
      "Tudo do Pro",
      "Análises em lote",
      "API de integração",
      "Gerente de conta dedicado",
      "SLA de suporte",
    ],
    cta: "Falar com consultor",
    ctaHref: "/register",
  },
];

export default function Pricing() {
  return (
    <section id="planos" className="bg-[#0f1923] py-20 lg:py-[100px]">
      <div className="mx-auto max-w-[1100px] px-5 lg:px-6">
        <p className="mb-4 text-center font-dm-sans text-[12px] font-semibold uppercase tracking-[2px] text-[#f5b800]">
          Planos
        </p>
        <h2 className="mx-auto max-w-[680px] text-center font-display text-[28px] font-bold leading-[1.2] text-white sm:text-[34px] lg:text-[40px]">
          Menos que o valor de{" "}
          <span className="text-[#f5b800]">uma hora do seu trabalho</span>. Com
          potencial de economizar dezenas todo mês.
        </h2>
        <p className="mx-auto mt-4 max-w-[560px] text-center font-dm-sans text-[16px] leading-[1.6] text-white/55 lg:text-[17px]">
          Planos flexíveis que se pagam na primeira análise economizada.
        </p>

        <div className="mx-auto mt-14 grid max-w-[1000px] grid-cols-1 gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const isPro = !!plan.destaque;
            return (
              <div
                key={plan.nome}
                className={`relative flex flex-col rounded-[16px] border-[1.5px] p-8 ${
                  isPro
                    ? "border-[#f5b800] bg-[#f5b800]/[0.04] shadow-[0_20px_60px_rgba(245,184,0,0.12)]"
                    : "border-white/[0.08] bg-white/[0.03]"
                }`}
              >
                {isPro && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-[20px] bg-[#f5b800] px-4 py-1 font-dm-sans text-[12px] font-bold text-[#0a131c]">
                    Mais popular
                  </span>
                )}

                <p
                  className={`font-dm-sans text-[14px] font-semibold uppercase tracking-[1px] ${
                    isPro ? "text-[#f5b800]" : "text-[#7aa6ff]"
                  }`}
                >
                  {plan.nome}
                </p>
                <p className="mt-2 font-dm-sans text-[13px] text-white/50">
                  {plan.publico}
                </p>

                <div className="mt-5 flex items-end gap-1.5">
                  <span className="font-display text-[44px] font-bold leading-none text-white">
                    {plan.preco}
                  </span>
                  <span className="pb-1 font-dm-sans text-[14px] text-white/50">
                    /mês
                  </span>
                </div>

                <hr className="my-6 border-white/[0.08]" />

                <ul className="flex-1 space-y-0">
                  {plan.features.map((feat, i) => (
                    <li
                      key={feat}
                      className={`flex items-start gap-2.5 py-2 font-dm-sans text-[14px] text-white/80 ${
                        i < plan.features.length - 1
                          ? "border-b border-white/[0.05]"
                          : ""
                      }`}
                    >
                      <Check
                        className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                          isPro ? "text-[#f5b800]" : "text-[#7aa6ff]"
                        }`}
                        strokeWidth={2.5}
                      />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.ctaHref}
                  className={`mt-6 block w-full rounded-[8px] px-5 py-3 text-center font-dm-sans text-[15px] font-semibold transition-colors ${
                    isPro
                      ? "bg-[#f5b800] text-[#0a131c] hover:bg-[#e0a800]"
                      : "border-[1.5px] border-white/15 bg-transparent text-white hover:border-[#f5b800] hover:text-[#f5b800]"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            );
          })}
        </div>

        <p className="mx-auto mt-10 max-w-[640px] text-center font-dm-sans text-[14px] text-white/50">
          Precisa de mais? Créditos avulsos disponíveis por{" "}
          <span className="text-[#f5b800]">R$1,29/unidade</span>, use quando
          precisar, sem mensalidade adicional.
        </p>
      </div>
    </section>
  );
}
