"use client";

import type { FeedbackFormData } from "@/types/feedback";

interface Props {
  data: FeedbackFormData;
  onChange: (updates: Partial<FeedbackFormData>) => void;
}

export default function Step5Open({ data, onChange }: Props) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-1">Feedback Aberto</h2>
        <p className="text-sm text-gray-500 mb-6">Suas palavras nos ajudam a construir um produto melhor</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Qual o maior ponto forte do Juriscan?
        </label>
        <textarea
          value={data.ponto_forte}
          onChange={(e) => onChange({ ponto_forte: e.target.value })}
          placeholder="O que mais te impressionou..."
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Qual o maior ponto fraco ou o que mais precisa melhorar?
        </label>
        <textarea
          value={data.ponto_fraco}
          onChange={(e) => onChange({ ponto_fraco: e.target.value })}
          placeholder="O que te frustrou ou pode melhorar..."
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Alguma sugestão específica de melhoria?
        </label>
        <textarea
          value={data.sugestao_melhoria}
          onChange={(e) => onChange({ sugestao_melhoria: e.target.value })}
          placeholder="Ideias, funcionalidades, melhorias..."
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-none"
        />
      </div>

      <div className="border-t border-gray-200 pt-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Gostaria de deixar um depoimento sobre sua experiência?
        </label>
        <p className="text-xs text-gray-400 mb-2">Podemos usar no site com sua autorização</p>
        <textarea
          value={data.depoimento}
          onChange={(e) => onChange({ depoimento: e.target.value })}
          placeholder="Conte como o Juriscan tem ajudado no seu dia a dia..."
          rows={4}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-none"
        />
        <label className="flex items-center gap-2 mt-3 cursor-pointer">
          <input
            type="checkbox"
            checked={data.permite_depoimento}
            onChange={(e) => onChange({ permite_depoimento: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30"
          />
          <span className="text-sm text-gray-600">
            Autorizo o uso do meu depoimento no site do Juriscan
          </span>
        </label>
      </div>
    </div>
  );
}
