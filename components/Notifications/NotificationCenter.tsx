"use client";

import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CheckCheck,
  FileText,
  AlertTriangle,
  Coins,
  Sparkles,
  Info,
  BarChart3,
  Settings,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import type { Notification, NotificationType } from "@/types/database";

interface NotificationCenterProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClose: () => void;
  variant: "dropdown" | "fullscreen";
}

const typeConfig: Record<NotificationType, { icon: typeof Info; color: string }> = {
  analysis_completed: { icon: BarChart3, color: "text-blue-500" },
  report_generated: { icon: FileText, color: "text-green-500" },
  deadline_alert: { icon: AlertTriangle, color: "text-orange-500" },
  low_credits: { icon: Coins, color: "text-yellow-500" },
  product_update: { icon: Sparkles, color: "text-purple-500" },
  system: { icon: Info, color: "text-gray-500" },
};

export default function NotificationCenter({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onClose,
  variant,
}: NotificationCenterProps) {
  const isFullscreen = variant === "fullscreen";

  return (
    <div
      className={
        isFullscreen
          ? "flex flex-col h-full w-full bg-white dark:bg-[#0f1923]"
          : "w-80 sm:w-96 bg-white dark:bg-[#1a2433] rounded-xl shadow-2xl border border-gray-200 dark:border-white/[0.08] overflow-hidden"
      }
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between px-4 border-b border-gray-100 dark:border-white/[0.06] ${
          isFullscreen ? "py-4" : "py-3"
        }`}
        style={isFullscreen ? { paddingTop: "max(1rem, env(safe-area-inset-top))" } : undefined}
      >
        <div className="flex items-center gap-2">
          {isFullscreen && (
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/[0.06] -ml-1"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-white/80" />
            </button>
          )}
          <h3
            className={`font-semibold text-gray-800 dark:text-white ${
              isFullscreen ? "text-lg" : "text-sm"
            }`}
          >
            Notificações
          </h3>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-[#1a4fd6]/20 dark:text-[#7aa6ff] text-xs font-medium rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary-hover dark:text-[#7aa6ff] dark:hover:text-[#a8c3ff] transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span className={isFullscreen ? "" : "hidden sm:inline"}>Marcar lidas</span>
          </button>
        )}
      </div>

      {/* Notification List */}
      <div
        className={
          isFullscreen
            ? "flex-1 overflow-y-auto overscroll-contain"
            : "max-h-[400px] overflow-y-auto"
        }
      >
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <Info className="w-10 h-10 text-gray-300 dark:text-white/25 mb-3" />
            <p className="text-sm text-gray-500 dark:text-white/60">Nenhuma notificação</p>
            <p className="text-xs text-gray-400 dark:text-white/40 mt-1">
              Suas notificações aparecerão aqui
            </p>
          </div>
        ) : (
          notifications.map((notification) => {
            const config = typeConfig[notification.type] || typeConfig.system;
            const Icon = config.icon;

            return (
              <button
                key={notification.id}
                onClick={() => {
                  if (!notification.read) {
                    onMarkAsRead(notification.id);
                  }
                }}
                className={`w-full text-left px-4 hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-white/[0.04] dark:active:bg-white/[0.06] transition-colors border-b border-gray-50 last:border-b-0 dark:border-white/[0.04] ${
                  isFullscreen ? "py-4" : "py-3"
                } ${!notification.read ? "bg-blue-50/50 dark:bg-[#1a4fd6]/[0.08]" : ""}`}
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 relative mt-0.5">
                    <Icon className={`w-5 h-5 ${config.color}`} />
                    {!notification.read && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white dark:border-[#1a2433]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm ${
                        !notification.read
                          ? "font-semibold text-gray-900 dark:text-white"
                          : "font-medium text-gray-700 dark:text-white/75"
                      }`}
                    >
                      {notification.title}
                    </p>
                    <p
                      className={`text-xs text-gray-500 dark:text-white/55 mt-0.5 ${
                        isFullscreen ? "line-clamp-3" : "line-clamp-2"
                      }`}
                    >
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-white/40 mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div
        className={`border-t border-gray-100 dark:border-white/[0.06] px-4 ${
          isFullscreen ? "py-4" : "py-2.5"
        }`}
        style={isFullscreen ? { paddingBottom: "max(1rem, env(safe-area-inset-bottom))" } : undefined}
      >
        <Link
          href="/configuracoes?tab=notificacoes"
          onClick={onClose}
          className={`flex items-center justify-center gap-1.5 text-gray-500 hover:text-gray-700 dark:text-white/60 dark:hover:text-white transition-colors ${
            isFullscreen ? "text-sm" : "text-xs"
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          Configurar notificações
        </Link>
      </div>
    </div>
  );
}
