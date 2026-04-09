"use client";

import type { FeedbackFormData } from "@/types/feedback";

interface Props {
  data: FeedbackFormData;
  onChange: (updates: Partial<FeedbackFormData>) => void;
}

const QUALIDADE_OPTIONS = [
  { value: "excelente", label: "Excelente" },
  { value: "boa", label: "Boa" },
  { value: "regular", label: "Regular" },
  { value: "ruim", label: "Ruim" },
  { value: "pessima", label: "Péssima" },
];

const PRECISAO_OPTIONS = [
  { value: "muito_precisa", label: "Muito precisas" },
  { value: "precisa", label: "Precisas" },
  { value: "razoavel", label: "Razoáveis" },
  { value: "imprecisa", label: "Imprecisas" },
  { value: "muito_imprecisa", label: "Muito imprecisas" },
];

export default function Step3Ai({ data, onChange }: Props) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-1">Qualidade da IA</h2>
        <p className="text-sm text-gray-500 mb-6">Como você avalia as respostas e análises geradas pela IA?</p>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-800 mb-3">
          Como você avalia a qualidade das respostas da IA?
        </p>
        <div className="flex flex-wrap gap-2">
          {QUALIDADE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ ia_qualidade: opt.value })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                data.ia_qualidade === opt.value
                  ? "bg-primary text-white ring-2 ring-primary/30"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-800 mb-3">
          As análises jurídicas foram precisas e confiáveis?
        </p>
        <div className="flex flex-wrap gap-2">
          {PRECISAO_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ ia_precisao: opt.value })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                data.ia_precisao === opt.value
                  ? "bg-primary text-white ring-2 ring-primary/30"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Você usa outras ferramentas de IA no trabalho? Como o Juriscan se compara?
        </label>
        <textarea
          value={data.ia_comparacao}
          onChange={(e) => onChange({ ia_comparacao: e.target.value })}
          placeholder="Ex: Uso ChatGPT, mas o Juriscan é mais preciso para análise jurídica..."
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-none"
        />
      </div>
    </div>
  );
}
