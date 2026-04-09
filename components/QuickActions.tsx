"use client";

import {
  Plus,
  FileText,
  Scale,
  Users,
  TrendingUp,
  AlertCircle,
  LucideIcon,
} from "lucide-react";
import Link from "next/link";

interface QuickActionButton {
  icon: LucideIcon;
  label: string;
  href: string;
}

interface Insight {
  icon: LucideIcon;
  iconBackground: string;
  iconColor: string;
  title: string;
  titleColor: string;
  description: string;
}

const quickActionButtons: QuickActionButton[] = [
  { icon: Plus, label: "Nova Análise", href: "/chat" },
  { icon: FileText, label: "Gerar Relatório", href: "/relatorios" },
  { icon: Scale, label: "Jurimetria", href: "/jurimetria" },
  { icon: Users, label: "Análise Equipe", href: "/equipe" },
];

const insights: Insight[] = [
  {
    icon: TrendingUp,
    iconBackground: "#DCFCE7",
    iconColor: "#16A34A",
    title: "Alta taxa de sucesso identificada",
    titleColor: "#16A34A",
    description: "TJSP apresenta 73% de procedência em casos similares",
  },
  {
    icon: AlertCircle,
    iconBackground: "#FEF3C7",
    iconColor: "#D97706",
    title: "Atenção a prazos",
    titleColor: "#D97706",
    description: "3 processos com vencimento em até 5 dias",
  },
];

export default function QuickActions() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Execução Rápida
      </h3>

      {/* Quick Action Buttons Grid */}
      <div className="grid grid-cols-2 gap-3">
        {quickActionButtons.map((action, index) => (
          <Link
            key={index}
            href={action.href}
            className="flex flex-col items-center justify-center gap-2 p-5 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            <action.icon className="w-6 h-6 text-primary" />
            <span className="text-sm font-medium text-gray-700">
              {action.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Insights Section */}
      <div className="mt-5">
        <h4 className="text-sm font-semibold text-gray-800 mb-3">
          Insights Estratégicos
        </h4>
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div key={index} className="flex items-start gap-3">
              <div
                className="p-2 rounded-lg flex-shrink-0"
                style={{ backgroundColor: insight.iconBackground }}
              >
                <insight.icon
                  className="w-4 h-4"
                  style={{ color: insight.iconColor }}
                />
              </div>
              <div>
                <p
                  className="text-sm font-medium"
                  style={{ color: insight.titleColor }}
                >
                  {insight.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {insight.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
