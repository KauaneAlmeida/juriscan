import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative -mt-16 overflow-hidden bg-[#0f1923] pb-20 pt-[164px] lg:pb-24 lg:pt-[184px]">
      {/* Background image — cobre também a área da Navbar */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60"
        style={{ backgroundImage: "url('/backgorund.jpg')" }}
      />
      {/* Overlay para contraste do texto */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-[#0f1923]/40 via-[#0f1923]/30 to-[#0f1923]"
      />
      {/* Vinheta radial focando o centro onde está o texto */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 55% at center, rgba(15,25,35,0.75) 0%, rgba(15,25,35,0.4) 50%, transparent 80%)",
        }}
      />

      <div className="relative mx-auto max-w-[820px] px-5 text-center">
        {/* Blur localizado atrás do conteúdo */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[120%] w-[110%] -translate-x-1/2 -translate-y-1/2 rounded-[40px] bg-[#0f1923]/30 backdrop-blur-md"
        />
        {/* Badge */}
        <div className="mb-7 inline-flex items-center gap-2 rounded-[20px] border border-white/15 bg-white/[0.06] px-4 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="font-dm-sans text-[13px] text-white/70">
            Jurimetria preditiva para o Direito brasileiro
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-display text-[40px] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[48px] lg:text-[56px]">
          Seu concorrente já sabe
          <br />
          a chance de ganhar esse caso.
          <br />
          Você ainda está no{" "}
          <span className="relative inline-block text-[#ff4d4f]">
            feeling.
            <span
              aria-hidden="true"
              className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-[#ff4d4f]"
            />
          </span>
        </h1>

        {/* Subheadline */}
        <p className="mx-auto mt-6 max-w-[600px] font-dm-sans text-[16px] leading-[1.7] text-white/85 lg:text-[18px]">
          O Juriscan analisa padrões de decisão por juiz e tribunal, calcula
          probabilidade real de êxito e entrega estratégia fundamentada para
          você decidir com dados, não intuição.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3.5">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-[8px] bg-[#1a4fd6] px-7 py-[14px] font-dm-sans text-[15px] font-semibold text-white transition-colors hover:bg-[#1440b8]"
          >
            Ver minha probabilidade de êxito grátis
          </Link>
          <a
            href="#como-funciona"
            className="inline-flex items-center justify-center rounded-[8px] border border-white/25 bg-transparent px-6 py-[14px] font-dm-sans text-[15px] font-medium text-white/80 transition-colors hover:bg-white/[0.06]"
          >
            Ver como funciona
          </a>
        </div>

        {/* Garantias */}
        <p className="mt-5 font-dm-sans text-[13px] text-white/40">
          Sem cartão de crédito&nbsp;&nbsp;•&nbsp;&nbsp;Comece em 2 minutos&nbsp;&nbsp;•&nbsp;&nbsp;Cancele quando quiser
        </p>
      </div>
    </section>
  );
}
