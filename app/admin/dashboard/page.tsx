"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users, Activity, DollarSign, Star, Zap, CreditCard,
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from "recharts";
import StatCard from "../components/StatCard";
import ChartCard from "../components/ChartCard";
import AdminDashboardSkeleton from "../components/AdminLoadingSkeleton";
import type { AdminDashboardStats } from "@/types/admin";

const PLAN_COLORS: Record<string, string> = {
  free: "#94A3B8",
  starter: "#3B82F6",
  pro: "#D4A843",
  business: "#0F1B2D",
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/stats");
        if (res.status === 403) { router.push("/dashboard"); return; }
        if (res.status === 401) { router.push("/login"); return; }
        if (!res.ok) throw new Error("Erro ao carregar métricas");
        const { data } = await res.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  if (loading) return <AdminDashboardSkeleton />;

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-red-500">{error || "Erro ao carregar"}</p>
      </div>
    );
  }

  const activationRate = stats.totalUsers > 0
    ? Math.round((stats.activeUsers7d / stats.totalUsers) * 100)
    : 0;

  const planDistData = Object.entries(stats.subscriptionsByPlan).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  const npsLabel = stats.npsScore > 50 ? "Excelente" : stats.npsScore > 0 ? "Bom" : "Precisa melhorar";
  const npsColor = stats.npsScore > 50 ? "text-emerald-600" : stats.npsScore > 0 ? "text-amber-600" : "text-red-600";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Visão geral do Juriscan</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard
          title="Usuários Totais"
          value={stats.totalUsers}
          subtitle={`+${stats.newUsers7d} últimos 7 dias`}
          icon={Users}
          iconColor="text-blue-500"
          borderColor="border-l-blue-500"
        />
        <StatCard
          title="Ativos (7 dias)"
          value={stats.activeUsers7d}
          subtitle={`${activationRate}% taxa de ativação`}
          icon={Activity}
          iconColor="text-emerald-500"
          borderColor="border-l-emerald-500"
        />
        <StatCard
          title="MRR"
          value={`R$ ${stats.mrr.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          subtitle={`${stats.activeSubscriptions} assinaturas ativas`}
          icon={DollarSign}
          iconColor="text-[#D4A843]"
          borderColor="border-l-[#D4A843]"
        />
        <StatCard
          title="NPS Score"
          value={stats.npsScore}
          subtitle={npsLabel}
          icon={Star}
          iconColor={npsColor}
          borderColor={stats.npsScore > 50 ? "border-l-emerald-500" : stats.npsScore > 0 ? "border-l-amber-500" : "border-l-red-500"}
        />
        <StatCard
          title="Créditos Consumidos (30d)"
          value={stats.creditsConsumed30d}
          subtitle={`média ${stats.avgCreditsRemaining}/usuário restante`}
          icon={Zap}
          iconColor="text-purple-500"
          borderColor="border-l-purple-500"
        />
        <StatCard
          title="Assinaturas Ativas"
          value={stats.activeSubscriptions}
          subtitle={Object.entries(stats.subscriptionsByPlan).map(([k, v]) => `${v} ${k}`).join(" · ") || "Nenhuma"}
          icon={CreditCard}
          iconColor="text-[#0F1B2D]"
          borderColor="border-l-[#0F1B2D]"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Distribuição de Planos" subtitle="Assinantes ativos por plano">
          {planDistData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={planDistData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  dataKey="value"
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  label={({ name, value }: any) => `${name}: ${value}`}
                >
                  {planDistData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={PLAN_COLORS[entry.name.toLowerCase()] || "#94A3B8"}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0F1B2D",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">
              Nenhuma assinatura ativa
            </div>
          )}
        </ChartCard>

        <ChartCard title="Resumo NPS" subtitle={`${stats.totalFeedbacks} respostas de feedback`}>
          <div className="flex flex-col items-center justify-center h-[250px]">
            <div className={`text-6xl font-bold ${npsColor}`}>{stats.npsScore}</div>
            <div className="text-lg text-gray-500 mt-2">{npsLabel}</div>
            <div className="text-sm text-gray-400 mt-4">
              {stats.totalFeedbacks} feedbacks recebidos · Média {stats.avgNps?.toFixed(1) || "—"}
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
