"use client";

import { useState } from "react";

type CategoryKey =
  | "all"
  | "preditiva"
  | "jurisprudencia"
  | "documentos"
  | "estrategia";

interface CategoryDef {
  key: Exclude<CategoryKey, "all">;
  label: string;
  /** Tailwind classes for the small pill rendered on each prompt card */
  badgeClass: string;
}

const CATEGORIES: CategoryDef[] = [
  {
    key: "preditiva",
    label: "⚡ Análise Preditiva",
    badgeClass: "bg-[#eff4ff] text-[#1a4fd6] dark:bg-[#1a4fd6]/15 dark:text-[#7aa6ff]",
  },
  {
    key: "jurisprudencia",
    label: "📚 Jurisprudência",
    badgeClass: "bg-[#f0fdf4] text-[#16a34a] dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  {
    key: "documentos",
    label: "📎 Documentos",
    badgeClass: "bg-[#faf5ff] text-[#7c3aed] dark:bg-[#7c3aed]/15 dark:text-[#b794f4]",
  },
  {
    key: "estrategia",
    label: "⚖️ Estratégia Processual",
    badgeClass: "bg-[#fffbeb] text-[#b45309] dark:bg-amber-500/15 dark:text-amber-300",
  },
];

interface PromptCard {
  category: Exclude<CategoryKey, "all">;
  title: string;
  description: string;
  prompt: string;
}

const PROMPTS: PromptCard[] = [
  {
    category: "preditiva",
    title: "Calcular probabilidade de êxito no TJSP",
    description: "Informe o tipo de ação e tribunal para análise estatística",
    prompt:
      "Quero calcular a probabilidade de êxito de uma ação de [tipo] no [tribunal]. Os fatos são: ",
  },
  {
    category: "preditiva",
    title: "Analisar estratégia para o próximo passo",
    description: "Recomendações baseadas no histórico do relator e da vara",
    prompt:
      "Analise a estratégia processual para o seguinte caso e me dê recomendações sobre os próximos passos: ",
  },
  {
    category: "jurisprudencia",
    title: "Buscar precedentes por tema",
    description: "Ex: responsabilidade civil, cobranças indevidas, danos morais",
    prompt:
      "Preciso de jurisprudência sobre [tema]. Busque precedentes no [tribunal] dos últimos 2 anos.",
  },
  {
    category: "jurisprudencia",
    title: "Comparar decisões de tribunais diferentes",
    description: "Veja como TJSP, STJ e STF têm decidido sobre o mesmo tema",
    prompt:
      "Compare como o TJSP e o STJ têm decidido sobre [tema]. Quero entender a tendência predominante.",
  },
  {
    category: "documentos",
    title: "Revisar petição ou contrato",
    description: "Anexe o PDF e receba análise de riscos e pontos críticos",
    prompt:
      "Vou anexar um documento para análise. Identifique os pontos críticos, riscos jurídicos e sugira melhorias.",
  },
  {
    category: "documentos",
    title: "Extrair prazos e obrigações de um contrato",
    description: "Lista automática de datas, multas e cláusulas importantes",
    prompt:
      "Analise o contrato que vou anexar e extraia: todos os prazos, multas, obrigações de cada parte e cláusulas que merecem atenção.",
  },
  {
    category: "estrategia",
    title: "Analisar perfil do relator",
    description: "Histórico de decisões do magistrado na vara específica",
    prompt:
      "Analise o perfil decisório do relator [nome] da [vara/tribunal]. Quero saber suas tendências em casos de [tipo de ação].",
  },
  {
    category: "estrategia",
    title: "Montar argumentação para recurso",
    description: "Estrutura argumentativa baseada em precedentes favoráveis",
    prompt:
      "Preciso estruturar argumentação para recurso em caso de [tipo]. A decisão de primeiro grau foi: ",
  },
];

interface ChatEmptyStateProps {
  /** Called when the user picks a prompt card. Should fill the input (not auto-send). */
  onSelectPrompt: (text: string) => void;
}

export default function ChatEmptyState({ onSelectPrompt }: ChatEmptyStateProps) {
  const [selected, setSelected] = useState<CategoryKey>("all");

  const visiblePrompts =
    selected === "all"
      ? PROMPTS
      : PROMPTS.filter((p) => p.category === selected);

  // Lookup table for badge styling on each card
  const badgeFor = (cat: Exclude<CategoryKey, "all">) =>
    CATEGORIES.find((c) => c.key === cat)?.badgeClass ?? "";
  const badgeLabelFor = (cat: Exclude<CategoryKey, "all">) =>
    CATEGORIES.find((c) => c.key === cat)?.label ?? "";

  return (
    <div className="mt-2">
      {/* Category chips */}
      <div className="px-2 sm:px-2 pt-2">
        <p className="mb-2 text-[12px] font-medium text-[#9ab0c8] dark:text-white/55">
          Filtrar por tipo de análise:
        </p>
        <div className="flex flex-wrap gap-2">
          <Chip
            label="Todos"
            isSelected={selected === "all"}
            onClick={() => setSelected("all")}
          />
          {CATEGORIES.map((cat) => (
            <Chip
              key={cat.key}
              label={cat.label}
              isSelected={selected === cat.key}
              onClick={() => setSelected(cat.key)}
            />
          ))}
        </div>
      </div>

      {/* Prompts grid */}
      <div className="px-2 sm:px-2 pt-4">
        <p className="mb-2.5 text-[12px] font-medium text-[#9ab0c8] dark:text-white/55">
          Escolha um ponto de partida ou escreva sua dúvida:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {visiblePrompts.map((p) => (
            <button
              key={p.title}
              type="button"
              onClick={() => onSelectPrompt(p.prompt)}
              className="group text-left bg-white dark:bg-white/[0.03] border border-[#e5e9ef] dark:border-white/[0.08] rounded-[9px] cursor-pointer transition-all duration-150 hover:border-[#1a4fd6] hover:bg-[#f8faff] dark:hover:bg-white/[0.06] focus:outline-none focus:border-[#1a4fd6] focus:bg-[#f8faff] dark:focus:bg-white/[0.06] py-3 px-3.5"
            >
              <span
                className={`${badgeFor(p.category)} inline-block rounded-full font-semibold mb-1.5 text-[10px] px-2 py-0.5 tracking-[0.2px]`}
              >
                {badgeLabelFor(p.category)}
              </span>
              <h3 className="mb-[3px] text-[13px] font-medium leading-[1.3] text-[#1a2435] dark:text-white">
                {p.title}
              </h3>
              <p className="text-[11.5px] leading-[1.4] text-[#9ab0c8] dark:text-white/55">
                {p.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface ChipProps {
  label: string;
  isSelected: boolean;
  onClick: () => void;
}

function Chip({ label, isSelected, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-colors ${
        isSelected
          ? "bg-[#1a4fd6] text-white border-[#1a4fd6]"
          : "bg-white text-[#4a5568] border-[#e5e9ef] hover:border-[#cbd5e0] dark:bg-white/[0.04] dark:text-white/70 dark:border-white/[0.08] dark:hover:border-white/[0.15]"
      }`}
      aria-pressed={isSelected}
    >
      {label}
    </button>
  );
}
