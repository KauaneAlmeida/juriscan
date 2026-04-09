"use client";

import StarRating from "@/components/Feedback/StarRating";
import type { FeedbackFormData } from "@/types/feedback";

interface Props {
  data: FeedbackFormData;
  onChange: (updates: Partial<FeedbackFormData>) => void;
}

const RATINGS = [
  { key: "rating_chat_ia" as const, label: "Chat com IA Jurídica" },
  { key: "rating_analise_pdf" as const, label: "Análise de Documentos PDF" },
  { key: "rating_relatorios" as const, label: "Geração de Relatórios" },
  { key: "rating_jurimetria" as const, label: "Jurimetria" },
  { key: "rating_velocidade" as const, label: "Velocidade de Resposta" },
];

export default function Step2Features({ data, onChange }: Props) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-1">Avaliação por Funcionalidade</h2>
        <p className="text-sm text-gray-500 mb-6">Avalie cada funcionalidade que testou (pode deixar em branco as que não usou)</p>
      </div>

      <div className="space-y-4">
        {RATINGS.map((r) => (
          <StarRating
            key={r.key}
            label={r.label}
            value={data[r.key]}
            onChange={(v) => onChange({ [r.key]: v })}
          />
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Qual funcionalidade você mais gostou?
        </label>
        <input
          type="text"
          value={data.feature_mais_util}
          onChange={(e) => onChange({ feature_mais_util: e.target.value })}
          placeholder="Ex: Chat com IA, Análise de PDF..."
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Qual funcionalidade menos gostou ou não funcionou bem?
        </label>
        <input
          type="text"
          value={data.feature_menos_util}
          onChange={(e) => onChange({ feature_menos_util: e.target.value })}
          placeholder="Ex: Jurimetria, Relatórios..."
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          O que está faltando no Juriscan?
        </label>
        <input
          type="text"
          value={data.feature_faltando}
          onChange={(e) => onChange({ feature_faltando: e.target.value })}
          placeholder="Funcionalidade que gostaria de ver..."
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
        />
      </div>
    </div>
  );
}
