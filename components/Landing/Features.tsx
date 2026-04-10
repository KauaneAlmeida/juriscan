import {
  Bot,
  User,
  FileText,
  Search,
  Star,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Gavel,
  ArrowUp,
  Paperclip,
} from "lucide-react";

type Feature = {
  badge: string;
  badgeBg: string;
  badgeText: string;
  titulo: string;
  descricao: string;
  Mock: React.ComponentType;
};

/* ----------------------- MOCK 1 — Chat Jurídico ----------------------- */
function ChatMock() {
  return (
    <div className="flex h-full flex-col gap-3 rounded-[12px] bg-[#0a131c]/60 p-5 font-dm-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1a4fd6]">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </span>
          <span className="text-[13px] font-semibold text-white">Juriscan IA</span>
        </div>
        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
          Online
        </span>
      </div>

      {/* Mensagem usuário */}
      <div className="flex justify-end gap-2">
        <div className="max-w-[75%] rounded-[14px] rounded-br-[4px] bg-[#1a4fd6] px-3.5 py-2 text-[12px] leading-[1.5] text-white">
          Analise o risco de prescrição neste caso de revisão de aposentadoria.
        </div>
        <span className="mt-auto flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
          <User className="h-3 w-3 text-white/70" />
        </span>
      </div>

      {/* Mensagem IA */}
      <div className="flex gap-2">
        <span className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#1a4fd6]">
          <Bot className="h-3 w-3 text-white" />
        </span>
        <div className="max-w-[80%] rounded-[14px] rounded-bl-[4px] bg-white/[0.06] px-3.5 py-2.5 text-[12px] leading-[1.6] text-white/85">
          O prazo decadencial para revisão é de <span className="font-semibold text-[#f5b800]">10 anos</span>{" "}
          (Lei 8.213/91, art. 103). No caso, ainda restam{" "}
          <span className="font-semibold text-emerald-400">2 anos e 4 meses</span>.
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded bg-emerald-400/10 px-1.5 py-0.5 text-[10px] text-emerald-400">
              ✓ Dentro do prazo
            </span>
            <span className="rounded bg-[#f5b800]/10 px-1.5 py-0.5 text-[10px] text-[#f5b800]">
              STJ Tema 975
            </span>
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="mt-auto flex items-center gap-2 rounded-[10px] border border-white/[0.08] bg-white/[0.03] px-3 py-2">
        <Paperclip className="h-3.5 w-3.5 text-white/40" />
        <span className="flex-1 text-[11px] text-white/35">Pergunte algo sobre o caso...</span>
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#1a4fd6]">
          <ArrowUp className="h-3 w-3 text-white" />
        </span>
      </div>
    </div>
  );
}

/* ----------------------- MOCK 2 — Análise PDF ----------------------- */
function PdfMock() {
  return (
    <div className="flex h-full gap-3 rounded-[12px] bg-[#0a131c]/60 p-4 font-dm-sans">
      {/* Página PDF */}
      <div className="flex h-full w-[42%] flex-col rounded-[8px] bg-white/[0.04] p-3">
        <div className="mb-2 flex items-center gap-1.5">
          <FileText className="h-3 w-3 text-[#7c3aed]" />
          <span className="text-[10px] font-medium text-white/70">peticao_inicial.pdf</span>
        </div>
        <div className="space-y-1">
          <div className="h-1 w-full rounded bg-white/15" />
          <div className="h-1 w-[85%] rounded bg-white/15" />
          <div className="h-1 w-full rounded bg-[#f5b800]/60 ring-1 ring-[#f5b800]/40" />
          <div className="h-1 w-[70%] rounded bg-[#f5b800]/60 ring-1 ring-[#f5b800]/40" />
          <div className="h-1 w-full rounded bg-white/15" />
          <div className="h-1 w-[90%] rounded bg-white/15" />
          <div className="h-1 w-[60%] rounded bg-white/15" />
          <div className="h-1 w-full rounded bg-[#ff4d4f]/60 ring-1 ring-[#ff4d4f]/40" />
          <div className="h-1 w-[80%] rounded bg-white/15" />
          <div className="h-1 w-full rounded bg-white/15" />
          <div className="h-1 w-[75%] rounded bg-white/15" />
        </div>
        <div className="mt-auto flex items-center justify-between pt-2 text-[9px] text-white/40">
          <span>Pág 3 / 47</span>
          <span>2.4 MB</span>
        </div>
      </div>

      {/* Insights extraídos */}
      <div className="flex flex-1 flex-col gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">
          Pontos extraídos
        </p>

        <div className="rounded-[8px] border border-[#f5b800]/30 bg-[#f5b800]/[0.06] p-2.5">
          <div className="flex items-start gap-1.5">
            <CheckCircle2 className="mt-0.5 h-3 w-3 flex-shrink-0 text-[#f5b800]" />
            <div>
              <p className="text-[10px] font-semibold text-[#f5b800]">Tese principal</p>
              <p className="mt-0.5 text-[10px] leading-[1.4] text-white/75">
                Revisão da vida toda (Tema 1102 STF)
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[8px] border border-[#ff4d4f]/30 bg-[#ff4d4f]/[0.06] p-2.5">
          <div className="flex items-start gap-1.5">
            <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0 text-[#ff4d4f]" />
            <div>
              <p className="text-[10px] font-semibold text-[#ff4d4f]">Risco identificado</p>
              <p className="mt-0.5 text-[10px] leading-[1.4] text-white/75">
                Prazo decadencial em 14 meses
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[8px] border border-emerald-400/25 bg-emerald-500/[0.06] p-2.5">
          <div className="flex items-start gap-1.5">
            <Sparkles className="mt-0.5 h-3 w-3 flex-shrink-0 text-emerald-400" />
            <div>
              <p className="text-[10px] font-semibold text-emerald-400">Sugestão</p>
              <p className="mt-0.5 text-[10px] leading-[1.4] text-white/75">
                Citar AgRg no AREsp 1.892.345
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------- MOCK 3 — Jurimetria ----------------------- */
function JurimetriaMock() {
  return (
    <div className="flex h-full flex-col gap-3 rounded-[12px] bg-[#0a131c]/60 p-5 font-dm-sans">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">
          Probabilidade de êxito
        </p>
        <span className="rounded bg-emerald-400/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-400">
          ALTA
        </span>
      </div>

      {/* Gauge */}
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 flex-shrink-0">
          <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
            <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
            <circle
              cx="40"
              cy="40"
              r="32"
              fill="none"
              stroke="#10b981"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="201"
              strokeDashoffset="46"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-[22px] font-bold text-white">77%</span>
          </div>
        </div>
        <div className="flex-1 space-y-1.5">
          <div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-white/65">Procedente</span>
              <span className="font-semibold text-emerald-400">77%</span>
            </div>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full w-[77%] rounded-full bg-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-white/65">Parcial</span>
              <span className="font-semibold text-[#f5b800]">15%</span>
            </div>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full w-[15%] rounded-full bg-[#f5b800]" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-white/65">Improcedente</span>
              <span className="font-semibold text-[#ff4d4f]">8%</span>
            </div>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full w-[8%] rounded-full bg-[#ff4d4f]" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats base */}
      <div className="mt-auto grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-3">
        <div>
          <p className="font-display text-[14px] font-bold text-white">2.847</p>
          <p className="text-[9px] text-white/45">decisões analisadas</p>
        </div>
        <div>
          <p className="font-display text-[14px] font-bold text-white">±4.2%</p>
          <p className="text-[9px] text-white/45">margem de erro</p>
        </div>
        <div>
          <p className="font-display text-[14px] font-bold text-[#f5b800]">8.4mo</p>
          <p className="text-[9px] text-white/45">tempo estimado</p>
        </div>
      </div>
    </div>
  );
}

/* ----------------------- MOCK 4 — Relatórios PDF ----------------------- */
function RelatoriosMock() {
  return (
    <div className="flex h-full items-center justify-center gap-3 rounded-[12px] bg-[#0a131c]/60 p-5 font-dm-sans">
      {/* PDF 1 — atrás */}
      <div className="relative h-full max-h-[200px] w-[42%] -rotate-3 rounded-[6px] border border-white/[0.08] bg-white/[0.04] p-2.5 shadow-lg">
        <div className="mb-1.5 h-1.5 w-[60%] rounded bg-[#f5b800]/60" />
        <div className="space-y-1">
          <div className="h-0.5 w-full rounded bg-white/15" />
          <div className="h-0.5 w-[85%] rounded bg-white/15" />
          <div className="h-0.5 w-[90%] rounded bg-white/15" />
          <div className="h-0.5 w-[70%] rounded bg-white/15" />
        </div>
        <div className="mt-2 h-6 rounded bg-white/[0.05]" />
      </div>

      {/* PDF 2 — na frente, principal */}
      <div className="relative h-full max-h-[220px] w-[55%] rotate-2 rounded-[8px] border border-[#f5b800]/30 bg-white/[0.06] p-3 shadow-[0_20px_50px_rgba(245,184,0,0.15)]">
        {/* Header */}
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[8px] font-semibold uppercase tracking-wider text-[#f5b800]">
            Relatório Jurídico
          </span>
          <FileText className="h-3 w-3 text-[#f5b800]" />
        </div>

        {/* Título */}
        <div className="mb-2 h-2 w-[80%] rounded bg-white/35" />
        <div className="mb-3 h-1 w-[55%] rounded bg-white/15" />

        {/* Conteúdo */}
        <div className="space-y-1">
          <div className="h-0.5 w-full rounded bg-white/15" />
          <div className="h-0.5 w-[95%] rounded bg-white/15" />
          <div className="h-0.5 w-[88%] rounded bg-white/15" />
        </div>

        {/* Card destaque */}
        <div className="mt-2 rounded bg-emerald-400/10 p-1.5">
          <div className="mb-0.5 h-0.5 w-[40%] rounded bg-emerald-400/70" />
          <div className="h-0.5 w-[80%] rounded bg-white/20" />
        </div>

        {/* Mais texto */}
        <div className="mt-2 space-y-1">
          <div className="h-0.5 w-full rounded bg-white/15" />
          <div className="h-0.5 w-[70%] rounded bg-white/15" />
        </div>

        {/* Assinatura */}
        <div className="mt-3 border-t border-white/[0.08] pt-1.5">
          <div className="h-0.5 w-[35%] rounded bg-[#f5b800]/50" />
        </div>
      </div>
    </div>
  );
}

/* ----------------------- MOCK 5 — Pesquisa Jurisprudência ----------------------- */
function PesquisaMock() {
  return (
    <div className="flex h-full flex-col gap-3 rounded-[12px] bg-[#0a131c]/60 p-5 font-dm-sans">
      {/* Search bar */}
      <div className="flex items-center gap-2 rounded-[8px] border border-white/[0.08] bg-white/[0.03] px-3 py-2">
        <Search className="h-3.5 w-3.5 text-white/40" />
        <span className="flex-1 text-[11px] text-white/70">dano moral consumidor banco</span>
        <span className="rounded bg-[#f5b800]/15 px-1.5 py-0.5 text-[9px] font-semibold text-[#f5b800]">
          STJ
        </span>
      </div>

      {/* Resultados */}
      <div className="flex flex-1 flex-col gap-2 overflow-hidden">
        <div className="rounded-[8px] border border-emerald-400/25 bg-emerald-400/[0.04] p-2.5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[10px] font-semibold text-emerald-400">REsp 1.987.234/SP</p>
            <span className="rounded bg-emerald-400/15 px-1 py-0.5 text-[8px] font-bold text-emerald-400">
              98% match
            </span>
          </div>
          <p className="mt-1 text-[9px] leading-[1.4] text-white/65">
            Reconhecida responsabilidade objetiva do banco. Indenização majorada para R$ 15.000.
          </p>
        </div>

        <div className="rounded-[8px] border border-white/[0.08] bg-white/[0.02] p-2.5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[10px] font-semibold text-white/85">REsp 1.842.901/RJ</p>
            <span className="rounded bg-emerald-400/15 px-1 py-0.5 text-[8px] font-bold text-emerald-400">
              92% match
            </span>
          </div>
          <p className="mt-1 text-[9px] leading-[1.4] text-white/65">
            Súmula 297 STJ. Aplicação do CDC aos contratos bancários consolidada.
          </p>
        </div>

        <div className="rounded-[8px] border border-white/[0.08] bg-white/[0.02] p-2.5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[10px] font-semibold text-white/85">REsp 1.756.123/MG</p>
            <span className="rounded bg-[#f5b800]/15 px-1 py-0.5 text-[8px] font-bold text-[#f5b800]">
              87% match
            </span>
          </div>
          <p className="mt-1 text-[9px] leading-[1.4] text-white/65">
            Quantum indenizatório. Critérios de razoabilidade e proporcionalidade.
          </p>
        </div>
      </div>

      <p className="text-[9px] text-white/40">
        <span className="font-semibold text-white/65">+247 precedentes</span> encontrados em 1.2s
      </p>
    </div>
  );
}

/* ----------------------- MOCK 6 — Perfil Decisório ----------------------- */
function RelatorMock() {
  return (
    <div className="flex h-full flex-col gap-3 rounded-[12px] bg-[#0a131c]/60 p-5 font-dm-sans">
      {/* Header relator */}
      <div className="flex items-center gap-3 border-b border-white/[0.06] pb-3">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#1a4fd6]">
          <Gavel className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-[12px] font-semibold text-white">Min. Carlos Andrade</p>
          <p className="text-[10px] text-white/50">3ª Turma · STJ</p>
          <div className="mt-0.5 flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-2 w-2 ${
                  i < 4 ? "fill-[#f5b800] text-[#f5b800]" : "fill-white/15 text-white/15"
                }`}
              />
            ))}
            <span className="ml-1 text-[9px] text-white/50">previsibilidade</span>
          </div>
        </div>
      </div>

      {/* Tendências */}
      <div className="space-y-2">
        <div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-white/70">Provê recurso do consumidor</span>
            <span className="font-semibold text-emerald-400">68%</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full w-[68%] rounded-full bg-emerald-400" />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-white/70">Majoração de indenização</span>
            <span className="font-semibold text-[#f5b800]">54%</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full w-[54%] rounded-full bg-[#f5b800]" />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-white/70">Acolhe tese de prescrição</span>
            <span className="font-semibold text-[#ff4d4f]">22%</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full w-[22%] rounded-full bg-[#ff4d4f]" />
          </div>
        </div>
      </div>

      {/* Insight */}
      <div className="mt-auto rounded-[8px] border border-[#f5b800]/25 bg-[#f5b800]/[0.05] p-2.5">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-[#f5b800]">
          💡 Insight estratégico
        </p>
        <p className="mt-1 text-[10px] leading-[1.4] text-white/75">
          Relator favorece teses consumeristas. Reforce argumento de hipossuficiência.
        </p>
      </div>
    </div>
  );
}

const features: Feature[] = [
  {
    badge: "Chat com IA",
    badgeBg: "bg-[#1a4fd6]/15",
    badgeText: "text-[#7aa6ff]",
    titulo: "Chat Jurídico com IA",
    descricao:
      "Faça perguntas, envie documentos e receba análises fundamentadas em segundos. A IA entende o contexto completo do seu caso, não apenas palavras-chave isoladas.",
    Mock: ChatMock,
  },
  {
    badge: "Documentos",
    badgeBg: "bg-[#7c3aed]/15",
    badgeText: "text-[#b794f4]",
    titulo: "Análise de Documentos em PDF",
    descricao:
      "Envie petições, contratos e decisões. A IA extrai pontos críticos, identifica riscos jurídicos e sugere estratégias sem perder nenhum detalhe, mesmo em documentos extensos.",
    Mock: PdfMock,
  },
  {
    badge: "Jurimetria",
    badgeBg: "bg-[#10b981]/15",
    badgeText: "text-[#34d399]",
    titulo: "Jurimetria Preditiva",
    descricao:
      "Saiba suas chances reais de êxito antes de decidir. Nossa análise é baseada em padrões estatísticos de milhares de decisões judiciais reais, não em intuição.",
    Mock: JurimetriaMock,
  },
  {
    badge: "Relatórios",
    badgeBg: "bg-[#f5b800]/15",
    badgeText: "text-[#f5b800]",
    titulo: "Relatórios Automatizados em PDF",
    descricao:
      "Gere análises completas com fundamentação legal e recomendações estratégicas. Prontas para enviar ao cliente, sem horas de redação manual.",
    Mock: RelatoriosMock,
  },
  {
    badge: "Pesquisa",
    badgeBg: "bg-white/[0.06]",
    badgeText: "text-white/70",
    titulo: "Pesquisa de Jurisprudência",
    descricao:
      "Encontre precedentes filtrados por tribunal, matéria e resultado. A IA identifica os mais favoráveis ao seu caso e explica por quê são relevantes.",
    Mock: PesquisaMock,
  },
  {
    badge: "Relatores",
    badgeBg: "bg-[#ff4d4f]/15",
    badgeText: "text-[#ff7a7c]",
    titulo: "Perfil Decisório de Relatores",
    descricao:
      "Saiba como determinado juiz ou relator costuma decidir em casos como o seu. Informação estratégica que muda a abordagem antes mesmo de protocolar.",
    Mock: RelatorMock,
  },
];

export default function Features() {
  return (
    <section id="funcionalidades" className="bg-[#0f1923] py-20 lg:py-[100px]">
      <div className="mx-auto max-w-[1100px] px-5 lg:px-6">
        <p className="mb-4 font-dm-sans text-[12px] font-semibold uppercase tracking-[2px] text-[#f5b800]">
          O que você pode fazer
        </p>
        <h2 className="max-w-[640px] font-display text-[28px] font-bold leading-[1.2] text-white sm:text-[34px] lg:text-[40px]">
          Tudo que você precisa para{" "}
          <span className="text-[#f5b800]">dominar seus casos</span>.
        </h2>

        <div className="mt-16 space-y-16 lg:space-y-24">
          {features.map((feature, i) => {
            const reverse = i % 2 === 1;
            const { Mock } = feature;
            return (
              <div
                key={feature.titulo}
                className={`grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16 ${
                  reverse ? "lg:[&>*:first-child]:order-2" : ""
                }`}
              >
                {/* Texto */}
                <div>
                  <span
                    className={`inline-flex items-center rounded-[20px] px-3 py-1 font-dm-sans text-[12px] font-semibold ${feature.badgeBg} ${feature.badgeText}`}
                  >
                    {feature.badge}
                  </span>
                  <h3 className="mt-4 font-dm-sans text-[22px] font-semibold text-white">
                    {feature.titulo}
                  </h3>
                  <p className="mt-3 font-dm-sans text-[16px] leading-[1.8] text-white/65">
                    {feature.descricao}
                  </p>
                  <a
                    href="#planos"
                    className="mt-4 inline-block font-dm-sans text-[14px] font-medium text-[#f5b800] hover:underline"
                  >
                    Saiba mais →
                  </a>
                </div>

                {/* Mock visual — em mobile, sem overflow-hidden e sem
                    aspect-ratio: o conteúdo dita a altura, nada é cortado.
                    Em desktop, volta ao aspect-[16/10] fixo e bonito. */}
                <div className="min-h-[340px] rounded-[16px] border border-white/[0.08] bg-white/[0.02] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.4)] lg:aspect-[16/10] lg:min-h-0 lg:overflow-hidden">
                  <Mock />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
