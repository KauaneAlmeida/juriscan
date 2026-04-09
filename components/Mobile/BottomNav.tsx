"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  LayoutDashboard,
  History,
  FileText,
  Settings,
} from "lucide-react";

const navItems = [
  { icon: MessageSquare, label: "Chat", href: "/chat" },
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: FileText, label: "Relatórios", href: "/relatorios" },
  { icon: History, label: "Histórico", href: "/historico" },
  { icon: Settings, label: "Config", href: "/configuracoes" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#0f1923] border-t border-gray-200 dark:border-white/[0.08]"
      style={{ paddingBottom: "var(--safe-area-bottom)" }}
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 min-w-0 flex-1 h-full touch-target ${
                isActive ? "text-primary dark:text-[#7aa6ff]" : "text-gray-400 dark:text-white/45"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
