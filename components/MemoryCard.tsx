"use client";

import { Brain, Sparkles } from "lucide-react";

interface MemoryMetric {
  value: string;
  label: string;
  sublabel: string;
}

interface MemoryCardProps {
  metrics: MemoryMetric[];
}

export default function MemoryCard({ metrics }: MemoryCardProps) {
  return (
    <div
      className="rounded-2xl p-6 mb-6"
      style={{
        background: "linear-gradient(135deg, #1C398E 0%, #2563EB 100%)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Brain className="w-6 h-6 text-white" />
        <div>
          <h3 className="text-lg font-semibold text-white">
            Memória Estratégica do Escritório
          </h3>
          <p className="text-sm text-[#DBEAFE]">
            Aprendizado contínuo baseado no seu histórico
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-6">
        {metrics.map((metric, index) => (
          <div key={index}>
            <p className="text-4xl font-bold text-white">{metric.value}</p>
            <p className="text-sm text-[#DBEAFE] mt-1">{metric.label}</p>
            <p className="text-xs text-[#93C5FD] mt-0.5">{metric.sublabel}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-start gap-2 mt-4 pt-4 border-t border-white/10">
        <Sparkles className="w-4 h-4 text-[#DBEAFE] mt-0.5 flex-shrink-0" />
        <p className="text-xs text-[#DBEAFE]">
          O nosso sistema está aprendendo continuamente com seu histórico para
          fornecer previsões mais precisas e recomendações personalizadas ao
          perfil do seu escritório.
        </p>
      </div>
    </div>
  );
}
