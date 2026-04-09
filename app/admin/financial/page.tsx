"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  DollarSign, TrendingUp, Wallet, Receipt, UserMinus, Target,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import StatCard from "../components/StatCard";
import ChartCard from "../components/ChartCard";
import AdminDashboardSkeleton from "../components/AdminLoadingSkeleton";
import type { AdminFinancialData, AdminPayment } from "@/types/admin";

const PLAN_COLORS: Record<string, string> = {
  free: "#94A3B8",
  starter: "#3B82F6",
  pro: "#D4A843",
  business: "#0F1B2D",
};

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700",
  pending: "bg-yellow-100 text-yellow-700",
  failed: "bg-red-100 text-red-700",
};

function formatBRL(value: number): string {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-BR");
}

function translatePaymentMethod(method: string | null): string {
  if (!method) return "—";
  const map: Record<string, string> = {
    credit_card: "Cartao",
    boleto: "Boleto",
    pix: "Pix",
  };
  return map[method] || method;
}

function translateType(type: string): string {
  const map: Record<string, string> = {
    subscription: "Assinatura",
    credit_purchase: "Creditos avulsos",
  };
  return map[type] || type;
}

export default function AdminFinancialPage() {
  const router = useRouter();
  const [data, setData] = useState<AdminFinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/financial");
        if (res.status === 403) { router.push("/dashboard"); return; }
        if (res.status === 401) { router.push("/login"); return; }
        if (!res.ok) throw new Error("Erro ao carregar dados financeiros");
        const { data: financialData } = await res.json();
        setData(financialData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  if (loading) return <AdminDashboardSkeleton />;

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-red-500">{error || "Erro ao carregar"}</p>
      </div>
    );
  }

  const planDistData = Object.entries(data.revenueByPlan).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: Math.round(value * 100) / 100,
  }));

  const paymentsToShow = data.recentPayments.slice(0, 20);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
        <p className="text-sm text-gray-500">Receita, assinaturas e pagamentos</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard
          title="MRR"
          value={formatBRL(data.mrr)}
          subtitle={`${data.activeSubscriptions} assinaturas ativas`}
          icon={DollarSign}
          iconColor="text-[#D4A843]"
          borderColor="border-l-[#D4A843]"
        />
        <StatCard
          title="ARR"
          value={formatBRL(data.arr)}
          subtitle="Receita anual recorrente"
          icon={TrendingUp}
          iconColor="text-blue-500"
          borderColor="border-l-blue-500"
        />
        <StatCard
          title="Receita do Mes"
          value={formatBRL(data.revenueThisMonth)}
          subtitle="Mes atual"
          icon={Wallet}
          iconColor="text-emerald-500"
          borderColor="border-l-emerald-500"
        />
        <StatCard
          title="Ticket Medio"
          value={formatBRL(data.ticketMedio)}
          subtitle="Por usuario pagante"
          icon={Receipt}
          iconColor="text-purple-500"
          borderColor="border-l-purple-500"
        />
        <StatCard
          title="Churn Rate"
          value={`${data.churnRate}%`}
          subtitle="Cancelamentos no mes"
          icon={UserMinus}
          iconColor="text-red-500"
          borderColor="border-l-red-500"
        />
        <StatCard
          title="LTV Estimado"
          value={formatBRL(data.ltv)}
          subtitle="Lifetime value estimado"
          icon={Target}
          iconColor="text-[#0F1B2D]"
          borderColor="border-l-[#0F1B2D]"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Receita por Mes" subtitle="Assinaturas vs. avulso">
          {data.revenueByMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data.revenueByMonth}>
                <defs>
                  <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F1B2D" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0F1B2D" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorAvulso" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4A843" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#D4A843" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${v}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0F1B2D",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any, name: any) => [
                    formatBRL(Number(value)),
                    name === "subscription_revenue_brl" ? "Assinaturas" : "Avulso",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="subscription_revenue_brl"
                  stackId="1"
                  stroke="#0F1B2D"
                  fill="url(#colorSub)"
                  name="subscription_revenue_brl"
                />
                <Area
                  type="monotone"
                  dataKey="avulso_revenue_brl"
                  stackId="1"
                  stroke="#D4A843"
                  fill="url(#colorAvulso)"
                  name="avulso_revenue_brl"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-gray-400">
              Nenhum dado de receita disponivel
            </div>
          )}
        </ChartCard>

        <ChartCard title="Receita por Plano" subtitle="Distribuicao de MRR por plano">
          {planDistData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={planDistData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  dataKey="value"
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  label={({ name, value }: any) => `${name}: ${formatBRL(Number(value))}`}
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
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [formatBRL(Number(value)), "Receita"]}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-gray-400">
              Nenhuma assinatura ativa
            </div>
          )}
        </ChartCard>
      </div>

      {/* Recent Payments Table */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Pagamentos Recentes</h3>
        {paymentsToShow.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-3 font-medium">Data</th>
                  <th className="pb-3 font-medium">Valor (R$)</th>
                  <th className="pb-3 font-medium">Metodo</th>
                  <th className="pb-3 font-medium">Tipo</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {paymentsToShow.map((payment: AdminPayment) => (
                  <tr key={payment.id} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="py-3 text-gray-700">
                      {formatDate(payment.paid_at || payment.created_at)}
                    </td>
                    <td className="py-3 text-gray-900 font-medium">
                      {formatBRL(payment.amount_cents / 100)}
                    </td>
                    <td className="py-3 text-gray-600">
                      {translatePaymentMethod(payment.payment_method)}
                    </td>
                    <td className="py-3 text-gray-600">
                      {translateType(payment.type)}
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          STATUS_STYLES[payment.status] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center text-gray-400">
            Nenhum pagamento registrado
          </div>
        )}
      </div>
    </div>
  );
}
