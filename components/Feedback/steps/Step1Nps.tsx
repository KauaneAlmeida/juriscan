"use client";

import NpsSelector from "@/components/Feedback/NpsSelector";
import StarRating from "@/components/Feedback/StarRating";
import type { FeedbackFormData } from "@/types/feedback";

interface Props {
  data: FeedbackFormData;
  onChange: (updates: Partial<FeedbackFormData>) => void;
}

const FACILIDADE_OPTIONS = [
  { value: "muito_facil", label: "Muito fácil" },
  { value: "facil", label: "Fácil" },
  { value: "neutro", label: "Neutro" },
  { value: "dificil", label: "Difícil" },
  { value: "muito_dificil", label: "Muito difícil" },
];

export default function Step1Nps({ data, onChange }: Props) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-1">Satisfação Geral</h2>
        <p className="text-sm text-gray-500 mb-6">Como está sendo sua experiência com o Juriscan?</p>
      </div>

      <NpsSelector
        value={data.nps_score}
        onChange={(v) => onChange({ nps_score: v })}
      />

      <div>
        <StarRating
          label="Avaliação geral da interface"
          value={data.rating_interface}
          onChange={(v) => onChange({ rating_interface: v })}
        />
      </div>

      <div>
        <p className="text-sm font-medium text-gray-800 mb-3">
          O Juriscan foi fácil de usar na primeira vez?
        </p>
        <div className="flex flex-wrap gap-2">
          {FACILIDADE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ facilidade_uso: opt.value })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                data.facilidade_uso === opt.value
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
          Conseguiu usar sem precisar de ajuda?
        </p>
        <div className="flex gap-3">
          {[true, false].map((val) => (
            <button
              key={String(val)}
              type="button"
              onClick={() => onChange({ primeiro_uso_intuitivo: val })}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                data.primeiro_uso_intuitivo === val
                  ? "bg-primary text-white ring-2 ring-primary/30"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {val ? "Sim" : "Não"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
