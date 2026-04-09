"use client";

import { Brain, BarChart3, Users, FileText, Settings, Trash2, Eye, Loader2 } from "lucide-react";
import type { Report, ReportType } from "@/types/reports";

const typeConfig: Record<ReportType, { icon: typeof Brain; color: string; bgColor: string }> = {
  PREDICTIVE_ANALYSIS: {
    icon: Brain,
    color: "text-blue-600 dark:text-[#7aa6ff]",
    bgColor: "bg-blue-100 dark:bg-[#1a4fd6]/15",
  },
  JURIMETRICS: {
    icon: BarChart3,
    color: "text-purple-600 dark:text-[#b794f4]",
    bgColor: "bg-purple-100 dark:bg-[#7c3aed]/15",
  },
  RELATOR_PROFILE: {
    icon: Users,
    color: "text-green-600 dark:text-emerald-400",
    bgColor: "bg-green-100 dark:bg-emerald-500/15",
  },
  EXECUTIVE_SUMMARY: {
    icon: FileText,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-500/15",
  },
  CUSTOM: {
    icon: Settings,
    color: "text-gray-600 dark:text-white/70",
    bgColor: "bg-gray-100 dark:bg-white/[0.06]",
  },
};

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  DRAFT: {
    label: "Rascunho",
    color: "text-gray-600 dark:text-white/70",
    bgColor: "bg-gray-100 dark:bg-white/[0.06]",
  },
  GENERATING: {
    label: "Gerando...",
    color: "text-blue-600 dark:text-[#7aa6ff]",
    bgColor: "bg-blue-100 dark:bg-[#1a4fd6]/15",
  },
  COMPLETED: {
    label: "Concluído",
    color: "text-green-600 dark:text-emerald-300",
    bgColor: "bg-green-100 dark:bg-emerald-500/15",
  },
  FAILED: {
    label: "Falhou",
    color: "text-red-600 dark:text-red-300",
    bgColor: "bg-red-100 dark:bg-red-500/15",
  },
};

const typeLabels: Record<ReportType, string> = {
  PREDICTIVE_ANALYSIS: "Análise Preditiva",
  JURIMETRICS: "Jurimetria",
  RELATOR_PROFILE: "Perfil de Relator",
  EXECUTIVE_SUMMARY: "Resumo Executivo",
  CUSTOM: "Personalizado",
};

interface ReportCardProps {
  report: Report;
  onView: (report: Report) => void;
  onDelete: (reportId: string) => void;
  isDeleting?: boolean;
}

export default function ReportCard({ report, onView, onDelete, isDeleting }: ReportCardProps) {
  const config = typeConfig[report.type] || typeConfig.CUSTOM;
  const status = statusConfig[report.status] || statusConfig.DRAFT;
  const Icon = config.icon;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.08] p-5 hover:shadow-md dark:hover:border-white/[0.15] transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.bgColor} ${status.color}`}>
          {status.label}
        </span>
      </div>

      {/* Title & Type */}
      <h3 className="font-semibold text-gray-800 dark:text-white mb-1 line-clamp-2">{report.title}</h3>
      <p className="text-sm text-gray-500 dark:text-white/55 mb-3">{typeLabels[report.type]}</p>

      {/* Date & Credits */}
      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-white/45 mb-4">
        <span>{formatDate(report.created_at)}</span>
        {report.credits_used > 0 && <span>{report.credits_used} créditos</span>}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onView(report)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[44px] bg-primary hover:bg-primary-hover active:bg-primary-hover dark:bg-[#1a4fd6] dark:hover:bg-[#1440b8] text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Eye className="w-4 h-4" />
          Ver
        </button>
        <button
          onClick={() => onDelete(report.id)}
          disabled={isDeleting}
          className="px-3 py-2 min-w-[44px] min-h-[44px] flex items-center justify-center bg-white border border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-200 dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white/70 dark:hover:text-red-400 dark:hover:border-red-500/40 rounded-lg transition-colors disabled:opacity-50"
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
