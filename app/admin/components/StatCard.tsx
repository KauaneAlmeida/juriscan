"use client";

import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  borderColor?: string;
  trend?: { value: number; label: string };
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-blue-500",
  borderColor = "border-l-blue-500",
  trend,
}: StatCardProps) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border-l-4 ${borderColor} p-5 hover:shadow-md transition-shadow`}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center">
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <span className="text-sm text-gray-500 font-medium">{title}</span>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {(subtitle || trend) && (
        <div className="mt-1 flex items-center gap-1.5">
          {trend && (
            <span
              className={`text-sm font-medium ${
                trend.value >= 0 ? "text-emerald-600" : "text-red-500"
              }`}
            >
              {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%
            </span>
          )}
          {subtitle && <span className="text-sm text-gray-500">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
