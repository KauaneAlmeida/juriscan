import { Clock, BarChart3, User2, FileText } from "lucide-react";

const dores = [
  {
    titulo:
      "Horas lendo dezenas de PDFs sem saber o que realmente importa",
    consequencia: "Tempo perdido sem chegar à informação decisiva",
  },
  {
    titulo:
      "Previsão de resultados baseada em experiência, não em dados",
    consequencia: "Decisões estratégicas feitas no escuro",
  },
  {
    titulo:
      "Relatórios que consomem dias de trabalho para serem produzidos",
    consequencia: "Cliente esperando, você sobrecarregado",
  },
  {
    titulo:
      "Sem visibilidade sobre o perfil decisório do juiz ou do tribunal",
    consequencia: "Estratégia processual sem embasamento estatístico",
  },
];

const beneficios = [
  {
    Icon: Clock,
    titulo: "Análise em minutos, não em horas",
    descricao:
      "Processos completos analisados em segundos. O que levava uma tarde agora leva 18 minutos.",
  },
  {
    Icon: BarChart3,
    titulo: "Probabilidade real de êxito",
    descricao:
      "Calculada a partir de padrões estatísticos de milhares de decisões judiciais reais, não intuição.",
  },
  {
    Icon: User2,
    titulo: "Perfil decisório do relator",
    descricao:
      "Saiba como determinado juiz ou vara costuma decidir antes de escolher sua estratégia.",
  },
  {
    Icon: FileText,
    titulo: "Relatórios prontos para o cliente",
    descricao:
      "Análises profissionais formatadas e fundamentadas, prontas para enviar sem horas de redação.",
  },
];

export default function ProblemSolution() {
  return (
    <>
      {/* SEÇÃO 3 — PROBLEMA */}
      <section className="bg-[#0a131c] py-20 lg:py-[100px]">
        <div className="mx-auto max-w-[1100px] px-5 lg:px-6">
          <p className="mb-4 font-dm-sans text-[12px] font-semibold uppercase tracking-[2px] text-[#ff4d4f]">
            Por que isso acontece
          </p>
          <h2 className="max-w-[640px] font-display text-[28px] font-bold leading-[1.2] text-white sm:text-[34px] lg:text-[40px]">
            Você não <span className="text-[#ff4d4f]">perde casos</span> por
            falta de conhecimento. Perde por falta da{" "}
            <span className="text-[#f5b800]">informação certa</span>, na hora
            certa.
          </h2>

          <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
            {/* Coluna esquerda */}
            <div>
              <p className="mb-8 font-dm-sans text-[16px] leading-[1.8] text-white/65 lg:text-[17px]">
                Todo advogado já passou por isso: horas lendo PDFs sem saber o
                que realmente importa, tentando prever decisões no &ldquo;feeling&rdquo;,
                criando relatórios que consomem dias. E no final, ainda fica a
                dúvida: será que esse caso vale a pena?
              </p>

              <ul className="space-y-5">
                {dores.map((dor) => (
                  <li key={dor.titulo} className="flex items-start gap-3.5">
                    <span
                      aria-hidden="true"
                      className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#ff4d4f]/10 text-[#ff4d4f]"
                    >
                      <svg
                        viewBox="0 0 14 14"
                        className="h-3 w-3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      >
                        <path d="M2 2 L12 12 M12 2 L2 12" />
                      </svg>
                    </span>
                    <div>
                      <p className="font-dm-sans text-[15px] font-medium text-white">
                        {dor.titulo}
                      </p>
                      <p className="mt-1 font-dm-sans text-[13px] text-white/45">
                        {dor.consequencia}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Coluna direita — card */}
            <aside className="rounded-[16px] border border-[#ff4d4f]/30 bg-[#ff4d4f]/[0.04] p-7 shadow-[0_20px_60px_rgba(255,77,79,0.08)]">
              <p className="font-dm-sans text-[12px] font-semibold uppercase tracking-[1px] text-[#ff4d4f]">
                Custo real do tempo perdido
              </p>
              <div className="mt-3 font-display text-[56px] font-extrabold leading-none text-white lg:text-[64px]">
                ~8h
              </div>
              <p className="mt-2 font-dm-sans text-[14px] text-white/50">
                por semana em análise manual
              </p>

              <hr className="my-6 border-white/10" />

              <ul className="space-y-2.5 font-dm-sans text-[14px] text-white/75">
                <li>
                  Em um mês:{" "}
                  <span className="font-semibold text-white">~32 horas</span>
                </li>
                <li>
                  Em um ano:{" "}
                  <span className="font-semibold text-white">~384 horas</span>
                </li>
                <li className="pt-2 font-bold text-[#ff4d4f]">
                  = 48 dias de trabalho perdidos
                </li>
              </ul>

              <a
                href="#como-funciona"
                className="mt-5 inline-block font-dm-sans text-[13px] font-medium text-[#f5b800] hover:underline"
              >
                Veja quanto você ganha de volta →
              </a>
            </aside>
          </div>
        </div>
      </section>

      {/* SEÇÃO 4 — SOLUÇÃO */}
      <section className="bg-[#0f1923] py-20 lg:py-[100px]">
        <div className="mx-auto max-w-[1100px] px-5 lg:px-6">
          <p className="mb-4 font-dm-sans text-[12px] font-semibold uppercase tracking-[2px] text-[#f5b800]">
            A virada
          </p>
          <h2 className="max-w-[600px] font-display text-[28px] font-bold leading-[1.2] text-white sm:text-[34px] lg:text-[40px]">
            O Juriscan transforma dados jurídicos em{" "}
            <span className="text-[#f5b800]">vantagem estratégica</span>.
          </h2>
          <p className="mt-6 max-w-[560px] font-dm-sans text-[16px] leading-[1.7] text-white/65 lg:text-[18px]">
            Não é só responder perguntas. É te dizer o que fazer, com base em
            padrões reais de decisão de milhares de processos.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {beneficios.map(({ Icon, titulo, descricao }) => (
              <div
                key={titulo}
                className="rounded-[12px] border border-white/[0.08] bg-white/[0.03] p-6 transition-colors hover:border-[#f5b800]/40"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#f5b800]/10 text-[#f5b800]">
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <h3 className="mt-4 font-dm-sans text-[15px] font-semibold text-white">
                  {titulo}
                </h3>
                <p className="mt-2 font-dm-sans text-[14px] leading-[1.6] text-white/55">
                  {descricao}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-12 text-center font-dm-sans text-[17px] font-semibold text-white lg:text-[18px]">
            Você deixa de ser{" "}
            <span className="text-[#ff4d4f]">operacional</span>. Passa a ser{" "}
            <span className="text-[#f5b800]">estratégico</span>.
          </p>
        </div>
      </section>
    </>
  );
}
