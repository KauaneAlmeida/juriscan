import { BookOpen, BarChart3, Search, Zap, Lock, Gavel } from "lucide-react";

const cards = [
  {
    Icon: BookOpen,
    titulo: "IA treinada no Direito brasileiro",
    descricao:
      "Compreende nuances do ordenamento jurídico nacional, de teses recursais a conflitos normativos, como nenhuma IA genérica consegue.",
  },
  {
    Icon: BarChart3,
    titulo: "Jurimetria baseada em decisões reais",
    descricao:
      "Calcula probabilidade de êxito a partir de padrões estatísticos de milhares de julgamentos. Não é estimativa, é dado.",
  },
  {
    Icon: Search,
    titulo: "Contexto completo do processo",
    descricao:
      "Processa petições, contratos e decisões inteiros sem perder informação. Nenhum detalhe relevante passa despercebido.",
  },
  {
    Icon: Zap,
    titulo: "Velocidade sem perder precisão",
    descricao:
      "Análises que levariam horas são entregues em minutos, com fundamentação sólida para sustentar qualquer decisão.",
  },
  {
    Icon: Lock,
    titulo: "Segurança com conformidade LGPD",
    descricao:
      "Dados processados com criptografia e conformidade total com a LGPD. Sigilo profissional garantido em todas as interações.",
  },
  {
    Icon: Gavel,
    titulo: "Perfil decisório de juízes e tribunais",
    descricao:
      "Identifique como determinado relator ou vara costuma decidir em casos semelhantes ao seu, antes de escolher a estratégia.",
  },
];

export default function WhyOpus() {
  return (
    <section className="bg-[#0a131c] py-20 lg:py-[100px]">
      <div className="mx-auto max-w-[1100px] px-5 lg:px-6">
        <p className="mb-4 font-dm-sans text-[12px] font-semibold uppercase tracking-[2px] text-[#f5b800]">
          O que nos diferencia
        </p>
        <h2 className="max-w-[640px] font-display text-[28px] font-bold leading-[1.2] text-white sm:text-[34px] lg:text-[40px]">
          Não é só IA. É{" "}
          <span className="text-[#f5b800]">jurimetria + IA + estratégia</span>{" "}
          trabalhando juntos.
        </h2>
        <p className="mt-4 max-w-[560px] font-dm-sans text-[16px] leading-[1.7] text-white/65 lg:text-[17px]">
          Enquanto outras ferramentas respondem perguntas, o Juriscan te diz o
          que fazer.
        </p>

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {cards.map(({ Icon, titulo, descricao }) => (
            <div
              key={titulo}
              className="rounded-[12px] border border-white/[0.08] bg-white/[0.03] p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#f5b800]/50 hover:bg-white/[0.05]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-[9px] bg-[#f5b800]/10 text-[#f5b800]">
                <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
              </div>
              <h3 className="mt-3.5 font-dm-sans text-[15px] font-semibold text-white">
                {titulo}
              </h3>
              <p className="mt-2 font-dm-sans text-[14px] leading-[1.6] text-white/55">
                {descricao}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
