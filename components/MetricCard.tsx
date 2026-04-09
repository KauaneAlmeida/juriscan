"use client";

import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  icon: LucideIcon;
  iconBackground: string;
  iconColor: string;
  value: string;
  label: string;
  trend: {
    value: string;
    direction: "up" | "down";
    color: string;
  };
}

export default function MetricCard({
  icon: Icon,
  iconBackground,
  iconColor,
  value,
  label,
  trend,
}: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div
          className="p-2.5 rounded-[10px]"
          style={{ backgroundColor: iconBackground }}
        >
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
        </div>
        <span
          className="text-sm font-medium"
          style={{ color: trend.color }}
        >
          {trend.value}
        </span>
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold text-gray-800">{value}</p>
        <p className="text-sm text-gray-500 mt-1">{label}</p>
      </div>
    </div>
  );
}
