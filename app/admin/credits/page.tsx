"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { Coins, TrendingDown, BarChart3, AlertTriangle } from "lucide-react";
import StatCard from "../components/StatCard";
import ChartCard from "../components/ChartCard";
import AdminDashboardSkeleton from "../components/AdminLoadingSkeleton";
import type { AdminCreditStats } from "@/types/admin";

const TYPE_LABELS: Record<string, string> = {
  ANALYSIS_DEBIT: "Analises",
  REPORT_DEBIT: "Relatorios",
  CREDIT_PURCHASE: "Compras",
  MONTHLY_ALLOCATION: "Alocacao Mensal",
  REFUND: "Reembolsos",
  ADJUSTMENT: "Ajustes",
};

const TYPE_COLORS: Record<string, string> = {
  ANALYSIS_DEBIT: "#3B82F6",
  REPORT_DEBIT: "#D4A843",
  CREDIT_PURCHASE: "#10B981",
  MONTHLY_ALLOCATION: "#8B5CF6",
  REFUND: "#F59E0B",
  ADJUSTMENT: "#94A3B8",
};

const PLAN_BADGE_COLORS: Record<string, string> = {
  free: "bg-gray-100 text-gray-700",
  starter: "bg-blue-100 text-blue-700",
  pro: "bg-amber-100 text-amber-700",
  business: "bg-[#0F1B2D] text-white",
};

function formatDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${d}/${m}`;
}

export default function AdminCreditsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminCreditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/credits");
        if (res.status === 403) { router.push("/dashboard"); return; }
        if (res.status === 401) { router.push("/login"); return; }
        if (!res.ok) throw new Error("Erro ao carregar dados de creditos");
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

  const pieData = Object.entries(stats.consumptionByType).map(([type, value]) => ({
    name: TYPE_LABELS[type] || type,
    type,
    value,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pieLabel = ({ name, percent }: any) =>
    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Creditos & IA</h1>
        <p className="text-sm text-gray-500">Consumo, distribuicao e alertas de creditos</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Creditos em Circulacao"
          value={stats.totalCirculating.toLocaleString("pt-BR")}
          icon={Coins}
          iconColor="text-blue-500"
          borderColor="border-l-blue-500"
        />
        <StatCard
          title="Consumidos Hoje"
          value={stats.consumedToday.toLocaleString("pt-BR")}
          icon={TrendingDown}
          iconColor="text-red-500"
          borderColor="border-l-red-500"
        />
        <StatCard
          title="Media/Usuario/Dia"
          value={stats.avgPerUserPerDay}
          icon={BarChart3}
          iconColor="text-purple-500"
          borderColor="border-l-purple-500"
        />
        <StatCard
          title="Sem Creditos"
          value={stats.usersWithZeroCredits}
          icon={AlertTriangle}
          iconColor="text-amber-500"
          borderColor="border-l-amber-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Consumption */}
        <ChartCard title="Consumo Diario (30d)" subtitle="Creditos consumidos vs. adicionados">
          {stats.dailyConsumption.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={stats.dailyConsumption}>
                <defs>
                  <linearGradient id="colorConsumed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F87171" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F87171" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorAdded" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34D399" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#34D399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 11 }}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0F1B2D",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  labelFormatter={(label) => formatDate(String(label))}
                />
                <Area
                  type="monotone"
                  dataKey="consumed"
                  name="Consumidos"
                  stroke="#F87171"
                  fill="url(#colorConsumed)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="added"
                  name="Adicionados"
                  stroke="#34D399"
                  fill="url(#colorAdded)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-gray-400">
              Nenhum dado no periodo
            </div>
          )}
        </ChartCard>

        {/* Top 10 Consumers */}
        <ChartCard title="Top 10 Consumidores" subtitle="Ultimos 30 dias">
          {stats.topConsumers.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.topConsumers} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0F1B2D",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Bar
                  dataKey="total_consumed"
                  name="Creditos consumidos"
                  fill="#3B82F6"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-gray-400">
              Nenhum consumo registrado
            </div>
          )}
        </ChartCard>
      </div>

      {/* Consumption by Type */}
      <ChartCard title="Consumo por Tipo" subtitle="Distribuicao de uso de creditos nos ultimos 30 dias">
        {pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
                label={pieLabel}
              >
                {pieData.map((entry) => (
                  <Cell
                    key={entry.type}
                    fill={TYPE_COLORS[entry.type] || "#94A3B8"}
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
          <div className="h-[300px] flex items-center justify-center text-gray-400">
            Nenhum dado de consumo
          </div>
        )}
      </ChartCard>

      {/* Low Credit Alert */}
      {stats.lowCreditUsers.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-gray-800">
              Alerta: Usuarios com Poucos Creditos
            </h3>
            <span className="text-sm text-gray-500">
              ({stats.lowCreditUsers.length} usuarios com menos de 5 creditos)
            </span>
          </div>
          <div className="divide-y">
            {stats.lowCreditUsers.map((user) => (
              <div
                key={user.user_id}
                className="flex items-center justify-between py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-800">
                    {user.name}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      PLAN_BADGE_COLORS[user.current_plan] || PLAN_BADGE_COLORS.free
                    }`}
                  >
                    {user.current_plan.charAt(0).toUpperCase() + user.current_plan.slice(1)}
                  </span>
                </div>
                <span className="text-sm font-mono text-red-600">
                  {user.balance} credito{user.balance !== 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
