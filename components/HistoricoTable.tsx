"use client";

import {
  Calendar,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Loader,
  Clock,
} from "lucide-react";

interface Analysis {
  id: number;
  dataHora: {
    date: string;
    time: string;
  };
  processo: {
    number: string;
    sub: string;
  };
  tipo: string;
  tribunal: {
    badge: string;
    background: string;
    color: string;
  };
  relator: string;
  predicao: {
    value: string;
    trend: "up" | "down";
    color: string;
  };
  confianca: {
    text: string;
    color: string;
  };
  status: {
    badge: string;
    type: "completed" | "processing" | "pending";
    background: string;
    color: string;
  };
}

interface HistoricoTableProps {
  analyses: Analysis[];
  onRowClick?: (id: number) => void;
}

export default function HistoricoTable({
  analyses,
  onRowClick,
}: HistoricoTableProps) {
  const getStatusIcon = (type: string) => {
    switch (type) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "processing":
        return <Loader className="w-4 h-4 animate-spin" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-primary">
              <th className="text-left text-sm font-semibold text-white px-4 py-3.5">
                Data/Hora
              </th>
              <th className="text-left text-sm font-semibold text-white px-4 py-3.5">
                Processo
              </th>
              <th className="text-left text-sm font-semibold text-white px-4 py-3.5">
                Tipo
              </th>
              <th className="text-left text-sm font-semibold text-white px-4 py-3.5">
                Tribunal
              </th>
              <th className="text-left text-sm font-semibold text-white px-4 py-3.5">
                Relator
              </th>
              <th className="text-left text-sm font-semibold text-white px-4 py-3.5">
                Predição
              </th>
              <th className="text-left text-sm font-semibold text-white px-4 py-3.5">
                Confiança
              </th>
              <th className="text-left text-sm font-semibold text-white px-4 py-3.5">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {analyses.map((analysis) => (
              <tr
                key={analysis.id}
                onClick={() => onRowClick?.(analysis.id)}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {/* Data/Hora */}
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-700">
                        {analysis.dataHora.date}
                      </p>
                      <p className="text-xs text-gray-400">
                        {analysis.dataHora.time}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Processo */}
                <td className="px-4 py-3.5">
                  <p className="text-sm font-medium text-gray-800">
                    {analysis.processo.number}
                  </p>
                  <p className="text-xs text-gray-400">
                    {analysis.processo.sub}
                  </p>
                </td>

                {/* Tipo */}
                <td className="px-4 py-3.5">
                  <p className="text-sm text-gray-700">{analysis.tipo}</p>
                </td>

                {/* Tribunal */}
                <td className="px-4 py-3.5">
                  <span
                    className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium"
                    style={{
                      backgroundColor: analysis.tribunal.background,
                      color: analysis.tribunal.color,
                    }}
                  >
                    {analysis.tribunal.badge}
                  </span>
                </td>

                {/* Relator */}
                <td className="px-4 py-3.5">
                  <p className="text-sm text-gray-700 truncate max-w-[140px]">
                    {analysis.relator}
                  </p>
                </td>

                {/* Predição */}
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5">
                    {analysis.predicao.trend === "up" ? (
                      <TrendingUp
                        className="w-4 h-4"
                        style={{ color: analysis.predicao.color }}
                      />
                    ) : (
                      <TrendingDown
                        className="w-4 h-4"
                        style={{ color: analysis.predicao.color }}
                      />
                    )}
                    <span
                      className="text-sm font-medium"
                      style={{ color: analysis.predicao.color }}
                    >
                      {analysis.predicao.value}
                    </span>
                  </div>
                </td>

                {/* Confiança */}
                <td className="px-4 py-3.5">
                  <span
                    className="text-sm font-medium"
                    style={{ color: analysis.confianca.color }}
                  >
                    {analysis.confianca.text}
                  </span>
                </td>

                {/* Status */}
                <td className="px-4 py-3.5">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium"
                    style={{
                      backgroundColor: analysis.status.background,
                      color: analysis.status.color,
                    }}
                  >
                    {getStatusIcon(analysis.status.type)}
                    {analysis.status.badge}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
