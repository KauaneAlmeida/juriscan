import Link from "next/link";
import { UserPlus, Upload, Zap } from "lucide-react";

const steps = [
  {
    num: "01",
    Icon: UserPlus,
    titulo: "Crie sua conta gratuita",
    descricao:
      "Cadastre-se com e-mail, Google ou Apple. Você recebe 20 créditos para testar sem compromisso e sem cartão de crédito.",
  },
  {
    num: "02",
    Icon: Upload,
    titulo: "Envie seu caso ou documento",
    descricao:
      "Descreva a situação, cole o número do processo ou envie o PDF diretamente. A IA entende qualquer formato.",
  },
  {
    num: "03",
    Icon: Zap,
    titulo: "Receba análise estratégica completa",
    descricao:
      "Em minutos: probabilidade de êxito, riscos identificados, perfil do relator e próximos passos recomendados.",
  },
];

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="bg-[#0a131c] py-20 lg:py-[100px]">
      <div className="mx-auto max-w-[1100px] px-5 lg:px-6">
        <p className="mb-4 font-dm-sans text-[12px] font-semibold uppercase tracking-[2px] text-[#f5b800]">
          Como funciona
        </p>
        <h2 className="max-w-[680px] font-display text-[28px] font-bold leading-[1.2] text-white sm:text-[34px] lg:text-[40px]">
          Do cadastro à análise completa em{" "}
          <span className="text-[#f5b800]">menos de 2 minutos</span>.
        </h2>
        <p className="mt-4 max-w-[560px] font-dm-sans text-[16px] leading-[1.7] text-white/65 lg:text-[17px]">
          Sem instalação, sem configuração complexa, sem treinamento.
        </p>

        {/* Steps */}
        <div className="relative mt-16">
          {/* Linha conectora desktop */}
          <div
            aria-hidden="true"
            className="absolute left-[16.66%] right-[16.66%] top-[42px] hidden border-t border-dashed border-white/15 lg:block"
          />

          <div className="relative grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-8">
            {steps.map(({ num, Icon, titulo, descricao }) => (
              <div key={num} className="text-center">
                <p className="font-dm-sans text-[13px] font-bold tracking-[2px] text-[#f5b800]">
                  {num}
                </p>
                <div className="relative mx-auto mt-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#1a4fd6] text-white shadow-[0_8px_30px_rgba(26,79,214,0.45)] ring-4 ring-[#0a131c]">
                  <Icon className="h-7 w-7" strokeWidth={2} />
                </div>
                <h3 className="mt-5 font-dm-sans text-[18px] font-semibold text-white">
                  {titulo}
                </h3>
                <p className="mx-auto mt-2 max-w-[280px] font-dm-sans text-[15px] leading-[1.7] text-white/55">
                  {descricao}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex justify-center">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-[8px] bg-[#1a4fd6] px-7 py-[14px] font-dm-sans text-[15px] font-semibold text-white transition-colors hover:bg-[#1440b8]"
          >
            Começar agora gratuitamente →
          </Link>
        </div>
      </div>
    </section>
  );
}
