"use client";

import { Menu, Coins } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import NotificationBell from "@/components/Notifications/NotificationBell";
import ThemeToggle from "@/components/ThemeToggle";

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export default function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  const { balance, isLoading } = useCredits();

  return (
    <header
      className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white dark:bg-[#0f1923] border-b border-gray-200 dark:border-white/[0.08]"
      style={{ paddingTop: "var(--safe-area-top)" }}
    >
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onMenuClick}
            className="p-2 -ml-2 text-gray-500 dark:text-white/65 hover:text-gray-700 dark:hover:text-white touch-target flex items-center justify-center"
            aria-label="Abrir menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <img
            src="/logo_juriscan.png"
            alt="Juriscan"
            className="w-32 h-auto"
          />
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <NotificationBell iconClassName="text-gray-500 dark:text-white/65" />
          <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-white/65">
            <Coins className="w-4 h-4 text-yellow-500" />
            <span>{isLoading ? "..." : balance}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
