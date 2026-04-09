import Link from "next/link";
import { Check, X } from "lucide-react";

const rows = [
  {
    label: "Modelo de IA",
    juriscan: "IA líder global em raciocínio jurídico",
    outro: "Modelos genéricos ou desatualizados",
  },
  {
    label: "Capacidade de contexto",
    juriscan: "Processos inteiros analisados de uma vez",
    outro: "Janela limitada, perde detalhes em docs longos",
  },
  {
    label: "Foco no Direito brasileiro",
    juriscan: "Legislação, jurisprudência e doutrina BR",
    outro: "IA generalista sem foco no ordenamento nacional",
  },
  {
    label: "Jurimetria preditiva",
    juriscan: "Probabilidade de êxito com dados reais",
    outro: "Sem análise preditiva baseada em dados",
  },
  {
    label: "Relatórios profissionais",
    juriscan: "PDFs formatados prontos para o cliente",
    outro: "Respostas em texto simples sem estrutura",
  },
  {
    label: "Conformidade LGPD",
    juriscan: "Criptografia + LGPD + sigilo profissional",
    outro: "Sem garantias de conformidade com LGPD",
  },
];

export default function Comparison() {
  return (
    <section className="bg-[#0f1923] py-20 lg:py-[100px]">
      <div className="mx-auto max-w-[1100px] px-5 lg:px-6">
        <p className="mb-4 font-dm-sans text-[12px] font-semibold uppercase tracking-[2px] text-[#f5b800]">
          Comparativo
        </p>
        <h2 className="max-w-[640px] font-display text-[28px] font-bold leading-[1.2] text-white sm:text-[34px] lg:text-[40px]">
          Por que advogados estão{" "}
          <span className="text-[#f5b800]">trocando outras ferramentas</span>{" "}
          pelo Juriscan?
        </h2>

        {/* Tabela */}
        <div className="relative mt-16 pt-4">
          {/* Header */}
          <div className="grid grid-cols-[1.1fr_1.4fr_1.4fr] items-end gap-px text-left">
            <div />
            <div className="relative rounded-t-[10px] border-t-[3px] border-[#f5b800] bg-[#f5b800]/[0.08] px-5 py-3">
              <span className="absolute -top-3 left-5 inline-flex items-center rounded-[20px] bg-[#f5b800] px-2.5 py-1 font-dm-sans text-[10px] font-bold uppercase tracking-wide text-[#0a131c] shadow-[0_4px_12px_rgba(245,184,0,0.35)]">
                Recomendado
              </span>
              <p className="font-dm-sans text-[14px] font-bold text-white sm:text-[15px]">
                Juriscan
              </p>
            </div>
            <div className="px-5 py-3">
              <p className="font-dm-sans text-[14px] font-medium text-white/70 sm:text-[15px]">
                Outras ferramentas
              </p>
            </div>
          </div>

          {/* Rows */}
          <div className="border-t border-white/[0.06]">
            {rows.map((row, i) => (
              <div
                key={row.label}
                className={`grid grid-cols-[1.1fr_1.4fr_1.4fr] items-center gap-px ${
                  i % 2 === 0 ? "bg-white/[0.02]" : "bg-transparent"
                }`}
              >
                <div className="px-5 py-4 font-dm-sans text-[12px] text-white/70 sm:text-[13px]">
                  {row.label}
                </div>
                <div className="flex items-start gap-2 bg-[#f5b800]/[0.06] px-5 py-4">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" strokeWidth={2.5} />
                  <span className="font-dm-sans text-[13px] font-medium text-white sm:text-[14px]">
                    {row.juriscan}
                  </span>
                </div>
                <div className="flex items-start gap-2 px-5 py-4">
                  <X className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#ff4d4f]" strokeWidth={2.5} />
                  <span className="font-dm-sans text-[13px] text-white/65 sm:text-[14px]">
                    {row.outro}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 flex justify-center">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-[8px] bg-[#1a4fd6] px-7 py-[14px] font-dm-sans text-[15px] font-semibold text-white transition-colors hover:bg-[#1440b8]"
          >
            Testar grátis agora
          </Link>
        </div>
      </div>
    </section>
  );
}
