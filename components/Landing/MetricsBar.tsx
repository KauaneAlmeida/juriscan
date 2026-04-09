const stats = [
  { number: "+2.500", label: "análises realizadas" },
  { number: "+350", label: "advogados cadastrados" },
  { number: "4h → 18min", label: "tempo médio de análise", arrow: true },
  { number: "4.9/5", label: "avaliação dos usuários" },
];

export default function MetricsBar() {
  return (
    <section className="bg-[#0a131c] py-10">
      <div className="mx-auto max-w-[960px] px-5">
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`px-6 py-6 text-center lg:px-8 ${
                i < stats.length - 1 ? "lg:border-r lg:border-white/[0.08]" : ""
              } ${i % 2 === 0 ? "border-r border-white/[0.08] lg:border-r" : ""}`}
            >
              <div className="font-display text-[32px] font-bold leading-tight text-white lg:text-[36px]">
                {stat.arrow ? (
                  <>
                    <span className="text-[#ff4d4f]">4h</span>{" "}
                    <span className="text-[#f5b800]">→</span>{" "}
                    <span className="text-[#f5b800]">18min</span>
                  </>
                ) : (
                  stat.number
                )}
              </div>
              <div className="mt-1.5 font-dm-sans text-[13px] text-white/55">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
