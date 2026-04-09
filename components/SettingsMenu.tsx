"use client";

import {
  User,
  Bell,
  Shield,
  CreditCard,
  Lock,
  Info,
  ChevronRight,
  LucideIcon,
} from "lucide-react";

interface MenuItem {
  id: string;
  icon: LucideIcon;
  label: string;
  description: string;
}

export const menuItems: MenuItem[] = [
  { id: "perfil", icon: User, label: "Perfil", description: "Informações pessoais e foto" },
  { id: "notificacoes", icon: Bell, label: "Notificações", description: "Preferências de alertas" },
  { id: "seguranca", icon: Shield, label: "Segurança", description: "Senha e autenticação" },
  { id: "plano", icon: CreditCard, label: "Plano e Créditos", description: "Assinatura e consumo" },
  { id: "privacidade", icon: Lock, label: "Dados e Privacidade", description: "LGPD e seus dados" },
  { id: "termos", icon: Info, label: "Termos e Disclaimers", description: "Documentos legais" },
];

interface SettingsMenuProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function SettingsMenu({
  activeTab,
  onTabChange,
}: SettingsMenuProps) {
  return (
    <nav
      aria-label="Menu de configurações"
    >
      {/* Mobile: lista vertical estilo iOS */}
      <div className="lg:hidden">
        <div className="bg-white dark:bg-white/[0.03] rounded-2xl overflow-hidden border border-gray-100 dark:border-white/[0.08] shadow-sm">
          {menuItems.map((item, index) => {
            const isLast = index === menuItems.length - 1;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-4 text-left transition-colors active:bg-gray-50 dark:active:bg-white/[0.06] ${
                  !isLast ? "border-b border-gray-100 dark:border-white/[0.06]" : ""
                }`}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 dark:bg-[#1a4fd6]/15 flex-shrink-0">
                  <item.icon className="w-5 h-5 text-primary dark:text-[#7aa6ff]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white">{item.label}</p>
                  <p className="text-sm text-gray-500 dark:text-white/55 truncate">{item.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 dark:text-white/40 flex-shrink-0" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop: vertical sidebar menu */}
      <div className="hidden lg:block w-[220px] bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.08] p-2 h-fit">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-white dark:bg-[#1a4fd6]"
                  : "text-gray-700 hover:bg-gray-100 dark:text-white/80 dark:hover:bg-white/[0.06]"
              }`}
            >
              <item.icon
                className={`w-5 h-5 ${
                  isActive
                    ? "text-white"
                    : "text-gray-500 dark:text-white/50"
                }`}
              />
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
