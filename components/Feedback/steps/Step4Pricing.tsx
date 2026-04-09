"use client";

import type { FeedbackFormData } from "@/types/feedback";

interface Props {
  data: FeedbackFormData;
  onChange: (updates: Partial<FeedbackFormData>) => void;
}

const PRECO_OPTIONS = [
  { value: "barato", label: "Barato" },
  { value: "justo", label: "Justo" },
  { value: "caro", label: "Caro" },
  { value: "muito_caro", label: "Muito caro" },
];

const PLANO_OPTIONS = [
  { value: "free", label: "Free (grátis)" },
  { value: "starter", label: "Starter — R$ 69/mês" },
  { value: "pro", label: "Pro — R$ 129/mês", popular: true },
  { value: "business", label: "Business — R$ 299/mês" },
  { value: "nenhum", label: "Nenhum (não assinaria)" },
];

const AREAS = [
  "Trabalhista", "Civil", "Criminal", "Tributário", "Empresarial",
  "Previdenciário", "Família", "Ambiental", "Digital", "Administrativo",
];

const TAMANHO_OPTIONS = [
  { value: "solo", label: "Advocacia solo" },
  { value: "2_5", label: "2-5 pessoas" },
  { value: "6_15", label: "6-15 pessoas" },
  { value: "16_50", label: "16-50 pessoas" },
  { value: "50_plus", label: "50+ pessoas" },
];

export default function Step4Pricing({ data, onChange }: Props) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-1">Pricing e Perfil</h2>
        <p className="text-sm text-gray-500 mb-6">Nos ajude a entender o valor percebido e seu perfil profissional</p>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-800 mb-3">Considerando os planos, o preço é:</p>
        <div className="flex flex-wrap gap-2">
          {PRECO_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ preco_justo: opt.value })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                data.preco_justo === opt.value
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
        <p className="text-sm font-medium text-gray-800 mb-3">Qual plano escolheria?</p>
        <div className="space-y-2">
          {PLANO_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ plano_interesse: opt.value })}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${
                data.plano_interesse === opt.value
                  ? "bg-primary text-white ring-2 ring-primary/30"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {opt.label}
              {"popular" in opt && opt.popular && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  data.plano_interesse === opt.value ? "bg-white/20" : "bg-amber-100 text-amber-700"
                }`}>
                  Mais popular
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Valor máximo mensal que pagaria (R$)
        </label>
        <input
          type="number"
          min={0}
          max={10000}
          value={data.valor_max_mensal ?? ""}
          onChange={(e) => onChange({ valor_max_mensal: e.target.value ? Number(e.target.value) : null })}
          placeholder="Ex: 150"
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Área de atuação principal
        </label>
        <select
          value={data.area_juridica ?? ""}
          onChange={(e) => onChange({ area_juridica: e.target.value || null })}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none bg-white"
        >
          <option value="">Selecione...</option>
          {AREAS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
          <option value="Outro">Outro</option>
        </select>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-800 mb-3">Tamanho do escritório</p>
        <div className="flex flex-wrap gap-2">
          {TAMANHO_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ tamanho_escritorio: opt.value })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                data.tamanho_escritorio === opt.value
                  ? "bg-primary text-white ring-2 ring-primary/30"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
