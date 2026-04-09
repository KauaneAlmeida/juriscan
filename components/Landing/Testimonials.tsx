import { Star } from "lucide-react";

const testimonials = [
  {
    texto:
      "O que eu levava uma tarde inteira para analisar, agora faço em 18 minutos. A jurimetria preditiva me dá uma vantagem estratégica concreta. Não é feeling, são dados reais de decisões anteriores.",
    nome: "Dr. Ricardo Mendes",
    cargo: "Advogado Trabalhista • OAB/SP",
    iniciais: "RM",
  },
  {
    texto:
      "Eu era cética com IA no Direito. O Juriscan me surpreendeu pela profundidade das análises. Os relatórios são tão detalhados que meus clientes acreditam que passei dias elaborando, quando levei minutos.",
    nome: "Dra. Ana Luísa Ferreira",
    cargo: "Advogada Cível • OAB/RJ",
    iniciais: "AF",
  },
  {
    texto:
      "Implementamos o Juriscan em todo o escritório. Produtividade do time aumentou 40% no primeiro mês. O plano Business se paga com um único caso por mês, e o retorno só cresce.",
    nome: "Dr. Marcos Oliveira",
    cargo: "Sócio-Diretor • Oliveira & Associados",
    iniciais: "MO",
  },
];

export default function Testimonials() {
  return (
    <section id="depoimentos" className="bg-[#0a131c] py-20 lg:py-[100px]">
      <div className="mx-auto max-w-[1100px] px-5 lg:px-6">
        <p className="mb-4 font-dm-sans text-[12px] font-semibold uppercase tracking-[2px] text-[#f5b800]">
          Quem já usa
        </p>
        <h2 className="font-display text-[28px] font-bold leading-[1.2] text-white sm:text-[34px] lg:text-[40px]">
          Advogados reais.{" "}
          <span className="text-[#f5b800]">Resultados reais.</span>
        </h2>

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {testimonials.map((t) => (
            <article
              key={t.nome}
              className="flex flex-col rounded-[16px] border border-white/[0.08] bg-white/[0.03] p-7"
            >
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-[14px] w-[14px] fill-[#f5b800] text-[#f5b800]"
                  />
                ))}
              </div>

              <p className="mt-4 flex-1 font-dm-sans text-[15px] italic leading-[1.8] text-white/85">
                &ldquo;{t.texto}&rdquo;
              </p>

              <hr className="my-5 border-white/[0.08]" />

              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[#1a4fd6] font-dm-sans text-[14px] font-bold text-white">
                  {t.iniciais}
                </div>
                <div>
                  <p className="font-dm-sans text-[14px] font-semibold text-white">
                    {t.nome}
                  </p>
                  <p className="font-dm-sans text-[13px] text-white/50">
                    {t.cargo}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
