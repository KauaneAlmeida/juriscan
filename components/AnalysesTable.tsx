"use client";

import Link from "next/link";
import { CheckCircle, Loader } from "lucide-react";

interface Analysis {
  processo: {
    number: string;
    sub: string;
  };
  tipo: string;
  tribunal: {
    badge: string;
    color: string;
  };
  predicao: {
    value: string;
    percentage: number;
    color: string;
  };
  prioridade: {
    badge: string;
    background: string;
    color: string;
  };
  status: {
    badge: string;
    background: string;
    color: string;
    type: "completed" | "processing";
  };
  actionText: string;
}

interface AnalysesTableProps {
  analyses: Analysis[];
}

export default function AnalysesTable({ analyses }: AnalysesTableProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Análises Estratégicas Recentes
        </h3>
        <Link
          href="/historico"
          className="text-sm text-[#3B82F6] hover:underline"
        >
          Ver histórico completo →
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                Processo
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                Tipo
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                Tribunal
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                Predição
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                Prioridade
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                Status
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                Ação
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {analyses.map((analysis, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                {/* Processo */}
                <td className="px-4 py-4">
                  <p className="text-sm font-medium text-gray-800">
                    {analysis.processo.number}
                  </p>
                  <p className="text-xs text-gray-500">
                    {analysis.processo.sub}
                  </p>
                </td>

                {/* Tipo */}
                <td className="px-4 py-4">
                  <p className="text-sm text-gray-700">{analysis.tipo}</p>
                </td>

                {/* Tribunal */}
                <td className="px-4 py-4">
                  <span
                    className="inline-flex items-center px-2 py-1 rounded text-xs font-medium text-white"
                    style={{ backgroundColor: analysis.tribunal.color }}
                  >
                    {analysis.tribunal.badge}
                  </span>
                </td>

                {/* Predição */}
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800">
                      {analysis.predicao.value}
                    </span>
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${analysis.predicao.percentage}%`,
                          backgroundColor: analysis.predicao.color,
                        }}
                      />
                    </div>
                  </div>
                </td>

                {/* Prioridade */}
                <td className="px-4 py-4">
                  <span
                    className="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
                    style={{
                      backgroundColor: analysis.prioridade.background,
                      color: analysis.prioridade.color,
                    }}
                  >
                    {analysis.prioridade.badge}
                  </span>
                </td>

                {/* Status */}
                <td className="px-4 py-4">
                  <span
                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
                    style={{
                      backgroundColor: analysis.status.background,
                      color: analysis.status.color,
                    }}
                  >
                    {analysis.status.type === "completed" ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <Loader className="w-3 h-3 animate-spin" />
                    )}
                    {analysis.status.badge}
                  </span>
                </td>

                {/* Ação */}
                <td className="px-4 py-4">
                  <Link
                    href="#"
                    className="text-sm text-[#3B82F6] hover:underline"
                  >
                    {analysis.actionText}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
