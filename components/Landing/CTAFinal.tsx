import Link from "next/link";

export default function CTAFinal() {
  return (
    <section className="bg-[#0f1923] py-20 lg:py-[100px]">
      <div className="mx-auto max-w-[760px] px-5 text-center">
        <h2 className="font-display text-[34px] font-extrabold leading-[1.15] text-white sm:text-[42px] lg:text-[48px]">
          O futuro da advocacia
          <br />
          não é quem <span className="text-[#ff4d4f]">trabalha mais</span>.
          <br />
          É quem <span className="text-[#f5b800]">decide melhor</span>.
        </h2>
        <p className="mx-auto mt-6 max-w-[560px] font-dm-sans text-[16px] leading-[1.7] text-white/60 lg:text-[18px]">
          Junte-se a centenas de advogados que já tomam decisões com dados,
          não com feeling.
        </p>

        <div className="mt-10 flex justify-center">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-[8px] bg-[#1a4fd6] px-9 py-4 font-dm-sans text-[16px] font-semibold text-white transition-colors hover:bg-[#1440b8]"
          >
            Criar conta grátis agora
          </Link>
        </div>

        <p className="mt-5 font-dm-sans text-[13px] text-white/35">
          20 créditos gratuitos para começar&nbsp;&nbsp;•&nbsp;&nbsp;Sem cartão
          de crédito&nbsp;&nbsp;•&nbsp;&nbsp;Acesso imediato
        </p>
      </div>
    </section>
  );
}
