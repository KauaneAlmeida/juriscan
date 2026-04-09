"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Zap,
  MessageSquareHeart,
  Activity,
  ArrowLeft,
  X,
  Menu,
} from "lucide-react";

const navSections = [
  {
    label: "Principal",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
      { icon: Users, label: "Usuários", href: "/admin/users" },
    ],
  },
  {
    label: "Negócio",
    items: [
      { icon: DollarSign, label: "Financeiro", href: "/admin/financial" },
      { icon: Zap, label: "Créditos & IA", href: "/admin/credits" },
    ],
  },
  {
    label: "Qualidade",
    items: [
      { icon: MessageSquareHeart, label: "Feedback Beta", href: "/admin/feedback" },
      { icon: Activity, label: "Sistema", href: "/admin/system" },
    ],
  },
];

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  const sidebarContent = (
    <aside className="h-full bg-[#0B1120] flex flex-col w-64">
      {/* Logo + Badge */}
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/logo_juriscan.png"
            alt="Juriscan"
            className="w-28 h-auto brightness-0 invert"
          />
          <span className="text-xs font-bold text-[#D4A843] bg-[#D4A843]/10 px-2 py-0.5 rounded">
            ADMIN
          </span>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-6 mt-2">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 px-3 mb-2">
              {section.label}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-[#D4A843]/10 text-white border-l-[3px] border-[#D4A843] -ml-px"
                        : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                    }`}
                  >
                    <item.icon className={`w-[18px] h-[18px] ${isActive ? "text-[#D4A843]" : ""}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-gray-400 text-sm hover:text-white transition-colors px-3 py-2.5 rounded-lg hover:bg-white/5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Juriscan</span>
        </Link>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar - fixed */}
      <div className="hidden lg:block fixed left-0 top-0 h-screen z-30">
        {sidebarContent}
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />
          <div className="relative h-full w-64">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}

/** Mobile header bar for admin */
export function AdminMobileHeader({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#0B1120] border-b border-white/10 flex items-center px-4 z-30">
      <button onClick={onMenuClick} className="text-white/80 hover:text-white">
        <Menu className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-2 ml-3">
        <img src="/logo_juriscan.png" alt="Juriscan" className="w-24 h-auto brightness-0 invert" />
        <span className="text-xs font-bold text-[#D4A843]">ADMIN</span>
      </div>
    </div>
  );
}
