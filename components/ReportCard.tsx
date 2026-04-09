"use client";

import {
  MessageSquare,
  FileText,
  Building,
  Calendar,
  HardDrive,
  TrendingUp,
  TrendingDown,
  Download,
  Eye,
  Share2,
  RefreshCw,
  Upload,
  Search,
  Layers,
  LucideIcon,
} from "lucide-react";

interface Badge {
  text: string;
  background: string;
  color: string;
}

interface ReportDetail {
  icon: string;
  label?: string;
  value?: string;
  badge?: Badge;
  color?: string;
}

interface Report {
  id: number;
  title: string;
  badges: Badge[];
  origin: {
    icon: string;
    label: string;
    value: string;
    subValue: string;
  };
  details: ReportDetail[];
  downloadColor?: string;
}

interface ReportCardProps {
  report: Report;
  onDownload?: (id: number) => void;
  onView?: (id: number) => void;
  onShare?: (id: number) => void;
  onNewVersion?: (id: number) => void;
}

const iconMap: Record<string, LucideIcon> = {
  MessageSquare,
  FileText,
  Building,
  Calendar,
  HardDrive,
  TrendingUp,
  TrendingDown,
  Upload,
  Search,
  Layers,
};

export default function ReportCard({
  report,
  onDownload,
  onView,
  onShare,
  onNewVersion,
}: ReportCardProps) {
  const OriginIcon = iconMap[report.origin.icon] || MessageSquare;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-800 mb-2">
          {report.title}
        </h3>
        <div className="flex flex-wrap gap-2">
          {report.badges.map((badge, index) => (
            <span
              key={index}
              className="px-2 py-1 rounded-md text-xs font-medium"
              style={{ backgroundColor: badge.background, color: badge.color }}
            >
              {badge.text}
            </span>
          ))}
        </div>
      </div>

      {/* Origin */}
      <div className="flex items-start gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
        <OriginIcon className="w-5 h-5 text-gray-400 mt-0.5" />
        <div>
          <p className="text-xs text-gray-500">{report.origin.label}</p>
          <p className="text-sm text-gray-700">{report.origin.value}</p>
          <p className="text-xs text-gray-400">{report.origin.subValue}</p>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {report.details.map((detail, index) => {
          const DetailIcon = iconMap[detail.icon] || FileText;
          return (
            <div key={index} className="flex items-center gap-2">
              <DetailIcon
                className="w-4 h-4"
                style={{ color: detail.color || "#9CA3AF" }}
              />
              {detail.badge ? (
                <span
                  className="px-2 py-0.5 rounded text-xs font-medium"
                  style={{
                    backgroundColor: detail.badge.background,
                    color: detail.badge.color,
                  }}
                >
                  {detail.badge.text}
                </span>
              ) : detail.label ? (
                <span className="text-xs text-gray-600">
                  {detail.label}{" "}
                  <span style={{ color: detail.color }}>{detail.value}</span>
                </span>
              ) : (
                <span className="text-xs text-gray-600">{detail.value}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
        <button
          onClick={() => onDownload?.(report.id)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-colors"
          style={{ backgroundColor: report.downloadColor || "#1C398E" }}
        >
          <Download className="w-4 h-4" />
          Download
        </button>
        <button
          onClick={() => onView?.(report.id)}
          className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors"
          aria-label="Visualizar relatório"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={() => onShare?.(report.id)}
          className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors"
          aria-label="Compartilhar relatório"
        >
          <Share2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onNewVersion?.(report.id)}
          className="flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-gray-500 text-sm transition-colors ml-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="hidden sm:inline">Gerar Nova Versão</span>
        </button>
      </div>
    </div>
  );
}
