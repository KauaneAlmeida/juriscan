"use client";

import { LucideIcon } from "lucide-react";

interface TemplateCardProps {
  icon: LucideIcon;
  iconBackground: string;
  iconColor: string;
  title: string;
  description: string;
  onClick?: () => void;
}

export default function TemplateCard({
  icon: Icon,
  iconBackground,
  iconColor,
  title,
  description,
  onClick,
}: TemplateCardProps) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 p-4 text-left hover:border-blue-500 transition-colors w-full"
    >
      <div className="flex items-start gap-3">
        <div
          className="p-2.5 rounded-[10px]"
          style={{ backgroundColor: iconBackground }}
        >
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        </div>
      </div>
    </button>
  );
}
