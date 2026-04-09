"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    pergunta: "O Juriscan substitui o trabalho do advogado?",
    resposta:
      "Não. O Juriscan é uma ferramenta de apoio estratégico. Ele processa dados, identifica padrões e sugere direções, mas a decisão final, a argumentação e o relacionamento com o cliente são sempre seus. Você continua sendo o advogado. Só que mais rápido e mais embasado.",
  },
  {
    pergunta: "Meus documentos e dados de clientes estão seguros?",
    resposta:
      "Sim. Todos os dados são processados com criptografia ponta a ponta e em total conformidade com a LGPD. Seus documentos não são usados para treinar modelos nem compartilhados com terceiros. Sigilo profissional garantido em todas as interações.",
  },
  {
    pergunta: "A jurimetria preditiva é confiável?",
    resposta:
      "A jurimetria calcula probabilidades com base em padrões estatísticos de decisões reais. Não é uma previsão garantida. É uma ferramenta de apoio à decisão, não uma certeza absoluta. Usada corretamente, aumenta significativamente a assertividade estratégica.",
  },
  {
    pergunta: "Posso cancelar a qualquer momento?",
    resposta:
      "Sim. Sem fidelidade, sem multa. Você cancela quando quiser diretamente pelo painel da conta. Os créditos do mês atual continuam disponíveis até o fim do período contratado.",
  },
  {
    pergunta: "Quantas análises posso fazer com cada plano?",
    resposta:
      "Depende do tipo de análise. Uma análise preditiva completa custa 5 créditos. Uma pesquisa de jurisprudência custa 2 créditos. Com o plano Starter (100 créditos), você faz até 20 análises preditivas ou 50 pesquisas por mês. O plano Pro (300 créditos) triplica essa capacidade.",
  },
  {
    pergunta: "O Juriscan funciona para todas as áreas do Direito?",
    resposta:
      "Sim. O sistema foi treinado com jurisprudência e legislação de múltiplas áreas: trabalhista, cível, tributário, penal, consumidor, família e mais. Quanto mais contexto você fornece sobre o caso, mais precisa é a análise.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-[#0f1923] py-20 lg:py-[100px]">
      <div className="mx-auto max-w-[1100px] px-5 lg:px-6">
        <p className="mb-4 font-dm-sans text-[12px] font-semibold uppercase tracking-[2px] text-[#f5b800]">
          Dúvidas frequentes
        </p>
        <h2 className="max-w-[600px] font-display text-[28px] font-bold leading-[1.2] text-white sm:text-[34px] lg:text-[40px]">
          Tudo que você precisa saber{" "}
          <span className="text-[#f5b800]">antes de começar</span>.
        </h2>

        <div className="mx-auto mt-14 max-w-[720px]">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={faq.pergunta} className="border-b border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${i}`}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors hover:text-[#f5b800]"
                >
                  <span
                    className={`font-dm-sans text-[16px] font-semibold ${
                      isOpen ? "text-[#f5b800]" : "text-white"
                    }`}
                  >
                    {faq.pergunta}
                  </span>
                  <span
                    aria-hidden="true"
                    className="flex h-6 w-6 flex-shrink-0 items-center justify-center text-[#f5b800]"
                  >
                    {isOpen ? (
                      <Minus className="h-5 w-5" strokeWidth={2.5} />
                    ) : (
                      <Plus className="h-5 w-5" strokeWidth={2.5} />
                    )}
                  </span>
                </button>
                <div
                  id={`faq-panel-${i}`}
                  role="region"
                  className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="pb-5 pr-10 font-dm-sans text-[15px] leading-[1.8] text-white/65">
                      {faq.resposta}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
