"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  RefreshCw,
  Database,
  CreditCard,
  Brain,
  Globe,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import type { SystemHealthCheck } from "@/types/admin";
import type { LucideIcon } from "lucide-react";

const SERVICE_ICONS: Record<string, LucideIcon> = {
  Supabase: Database,
  "Pagar.me": CreditCard,
  OpenAI: Brain,
  Vercel: Globe,
};

const STATUS_CONFIG = {
  healthy: {
    dot: "bg-green-500",
    border: "border-l-green-500",
    label: "Operacional",
  },
  degraded: {
    dot: "bg-amber-500",
    border: "border-l-amber-500",
    label: "Degradado",
  },
  down: {
    dot: "bg-red-500",
    border: "border-l-red-500",
    label: "Indisponivel",
  },
};

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 5) return "agora mesmo";
  if (seconds < 60) return `ha ${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `ha ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  return `ha ${hours}h`;
}

export default function AdminSystemPage() {
  const router = useRouter();
  const [checks, setChecks] = useState<SystemHealthCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      try {
        const res = await fetch("/api/admin/system/health");
        if (res.status === 403) {
          router.push("/dashboard");
          return;
        }
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (!res.ok) throw new Error("Erro ao verificar servicos");
        const { data } = await res.json();
        setChecks(data.checks);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [router]
  );

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(() => fetchHealth(), 60000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const overallStatus = checks.some((c) => c.status === "down")
    ? "down"
    : checks.some((c) => c.status === "degraded")
      ? "degraded"
      : "healthy";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-gray-500 text-sm">Verificando servicos...</p>
      </div>
    );
  }

  if (error && checks.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sistema</h1>
          <p className="text-sm text-gray-500">
            Monitoramento de saude dos servicos
          </p>
        </div>
        <button
          onClick={() => fetchHealth(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Verificar Novamente
        </button>
      </div>

      {/* Overall Status Banner */}
      {checks.length > 0 && (
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
            overallStatus === "healthy"
              ? "bg-green-50 text-green-800 border border-green-200"
              : overallStatus === "degraded"
                ? "bg-amber-50 text-amber-800 border border-amber-200"
                : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {overallStatus === "healthy" && (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          )}
          {overallStatus === "degraded" && (
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          )}
          {overallStatus === "down" && (
            <XCircle className="w-5 h-5 text-red-600" />
          )}
          <span className="font-medium">
            {overallStatus === "healthy" &&
              "Todos os servicos operacionais"}
            {overallStatus === "degraded" &&
              "Alguns servicos com degradacao"}
            {overallStatus === "down" &&
              "Servicos com problemas detectados"}
          </span>
        </div>
      )}

      {/* Service Health Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {checks.map((check) => {
          const config = STATUS_CONFIG[check.status];
          const Icon = SERVICE_ICONS[check.service] || Globe;

          return (
            <div
              key={check.service}
              className={`bg-white rounded-xl border border-l-4 ${config.border} p-5 space-y-3`}
            >
              {/* Service name + icon */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5 text-gray-500" />
                  <span className="font-semibold text-gray-800">
                    {check.service}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${config.dot}`}
                  />
                  <span className="text-xs text-gray-500">
                    {config.label}
                  </span>
                </div>
              </div>

              {/* Latency */}
              <div className="text-sm text-gray-600">
                <span className="text-gray-400">Latencia: </span>
                <span className="font-mono">
                  {check.latency_ms !== null ? `${check.latency_ms}ms` : "\u2014"}
                </span>
              </div>

              {/* Error message */}
              {check.message && (
                <div className="text-xs text-red-600 bg-red-50 rounded px-2 py-1.5 break-words">
                  {check.message}
                </div>
              )}

              {/* Last checked */}
              <div className="text-xs text-gray-400">
                Verificado {formatRelativeTime(check.checked_at)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
