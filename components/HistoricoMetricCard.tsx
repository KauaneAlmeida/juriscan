"use client";

import { LucideIcon } from "lucide-react";

interface HistoricoMetricCardProps {
  icon: LucideIcon;
  iconColor: string;
  value: string;
  label: string;
}

export default function HistoricoMetricCard({
  icon: Icon,
  iconColor,
  value,
  label,
}: HistoricoMetricCardProps) {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200 flex items-center gap-4">
      <Icon className="w-6 h-6" style={{ color: iconColor }} />
      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}
