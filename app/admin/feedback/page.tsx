"use client";

import { useState, useEffect, Fragment } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import {
  TrendingUp, Users, Star, DollarSign,
  Download, Quote, Lightbulb, ChevronDown, ChevronUp,
  Brain, Target,
} from "lucide-react";
import StatCard from "../components/StatCard";
import ChartCard from "../components/ChartCard";
import type { FeedbackStats, BetaFeedback } from "@/types/feedback";

const COLORS = ["#1C398E", "#3B82F6", "#F59E0B", "#EF4444", "#10B981"];

const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: "#0F1B2D",
    border: "none",
    borderRadius: "8px",
    color: "#fff",
  },
};

const IA_QUALIDADE_LABELS: Record<string, string> = {
  excelente: "Excelente",
  boa: "Boa",
  regular: "Regular",
  ruim: "Ruim",
  pessima: "Pessima",
};

const IA_PRECISAO_LABELS: Record<string, string> = {
  muito_precisa: "Muito Precisa",
  precisa: "Precisa",
  razoavel: "Razoavel",
  imprecisa: "Imprecisa",
};

const QUALIDADE_COLORS: Record<string, string> = {
  excelente: "#10B981",
  boa: "#3B82F6",
  regular: "#F59E0B",
  ruim: "#EF4444",
  pessima: "#991B1B",
};

const PRECISAO_COLORS: Record<string, string> = {
  muito_precisa: "#10B981",
  precisa: "#3B82F6",
  razoavel: "#F59E0B",
  imprecisa: "#EF4444",
};

const FEATURE_LABELS: Record<string, string> = {
  chat_ia: "Chat IA",
  analise_pdf: "Analise PDF",
  relatorios: "Relatorios",
  jurimetria: "Jurimetria",
  interface: "Interface",
  velocidade: "Velocidade",
};

const PRICING_LABELS: Record<string, string> = {
  barato: "Barato",
  justo: "Justo",
  caro: "Caro",
  muito_caro: "Muito caro",
};

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  business: "Business",
  nenhum: "Nenhum",
};

function generateInsights(stats: FeedbackStats): string[] {
  const insights: string[] = [];

  // Best rated feature
  const ratings = Object.entries(stats.avgRatings).filter(
    ([, v]) => v !== null
  ) as [string, number][];

  if (ratings.length > 0) {
    const best = ratings.reduce((a, b) => (b[1] > a[1] ? b : a));
    insights.push(
      `Funcionalidade melhor avaliada: ${FEATURE_LABELS[best[0]] || best[0]} com nota media ${best[1]}.`
    );

    const worst = ratings.reduce((a, b) => (b[1] < a[1] ? b : a));
    insights.push(
      `Funcionalidade pior avaliada: ${FEATURE_LABELS[worst[0]] || worst[0]} com nota media ${worst[1]}.`
    );
  }

  // Pricing perception majority
  const pricingEntries = Object.entries(stats.pricingDistribution);
  if (pricingEntries.length > 0) {
    const majorityPricing = pricingEntries.reduce((a, b) =>
      b[1] > a[1] ? b : a
    );
    const pricingPct =
      stats.totalResponses > 0
        ? Math.round((majorityPricing[1] / stats.totalResponses) * 100)
        : 0;
    insights.push(
      `Percepcao de preco majoritaria: "${PRICING_LABELS[majorityPricing[0]] || majorityPricing[0]}" (${pricingPct}% dos respondentes).`
    );
  }

  // Most preferred plan
  const planEntries = Object.entries(stats.planDistribution);
  if (planEntries.length > 0) {
    const topPlan = planEntries.reduce((a, b) => (b[1] > a[1] ? b : a));
    const planPct =
      stats.totalResponses > 0
        ? Math.round((topPlan[1] / stats.totalResponses) * 100)
        : 0;
    insights.push(
      `Plano preferido: ${PLAN_LABELS[topPlan[0]] || topPlan[0]} com ${planPct}% de interesse.`
    );
  }

  return insights;
}

export default function AdminFeedbackPage() {
  const router = useRouter();
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [feedbacks, setFeedbacks] = useState<BetaFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/feedback");
        if (res.status === 403) {
          router.push("/dashboard");
          return;
        }
        if (!res.ok) throw new Error("Erro ao carregar dados");
        const result = await res.json();
        setStats(result.data.stats);
        setFeedbacks(result.data.feedbacks);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  const exportCsv = () => {
    window.open("/api/admin/feedback/export", "_blank");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-red-500">{error || "Erro ao carregar"}</p>
      </div>
    );
  }

  const ratingData = [
    { name: "Chat IA", value: stats.avgRatings.chat_ia },
    { name: "Analise PDF", value: stats.avgRatings.analise_pdf },
    { name: "Relatorios", value: stats.avgRatings.relatorios },
    { name: "Jurimetria", value: stats.avgRatings.jurimetria },
    { name: "Interface", value: stats.avgRatings.interface },
    { name: "Velocidade", value: stats.avgRatings.velocidade },
  ].filter((d) => d.value !== null);

  const pricingData = Object.entries(stats.pricingDistribution).map(
    ([name, value]) => ({
      name: PRICING_LABELS[name] || name,
      value,
    })
  );

  const planData = Object.entries(stats.planDistribution).map(
    ([name, value]) => ({
      name: PLAN_LABELS[name] || name,
      value,
    })
  );

  const iaQualidadeData = Object.entries(stats.iaQualidadeDistribution || {}).map(
    ([key, value]) => ({
      name: IA_QUALIDADE_LABELS[key] || key,
      value,
      fill: QUALIDADE_COLORS[key] || "#3B82F6",
    })
  );

  const iaPrecisaoData = Object.entries(stats.iaPrecisaoDistribution || {}).map(
    ([key, value]) => ({
      name: IA_PRECISAO_LABELS[key] || key,
      value,
      fill: PRECISAO_COLORS[key] || "#3B82F6",
    })
  );

  const insights = generateInsights(stats);

  const promoterPct =
    stats.totalResponses > 0
      ? Math.round(
          (stats.npsBreakdown.promoters / stats.totalResponses) * 100
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Feedback Beta Testers
          </h1>
          <p className="text-sm text-gray-500">
            Analise detalhada do feedback dos usuarios
          </p>
        </div>
        <button
          onClick={exportCsv}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="NPS Score"
          value={stats.npsScore}
          subtitle={
            stats.npsScore > 50
              ? "Excelente"
              : stats.npsScore > 0
                ? "Bom"
                : "Precisa melhorar"
          }
          icon={TrendingUp}
          iconColor="text-emerald-500"
          borderColor="border-l-emerald-500"
        />
        <StatCard
          title="Respostas"
          value={stats.totalResponses}
          subtitle="total de feedbacks"
          icon={Users}
          iconColor="text-blue-500"
          borderColor="border-l-blue-500"
        />
        <StatCard
          title="Promotores"
          value={`${promoterPct}%`}
          subtitle={`${stats.npsBreakdown.promoters} de ${stats.totalResponses}`}
          icon={Star}
          iconColor="text-amber-500"
          borderColor="border-l-amber-500"
        />
        <StatCard
          title="Valor Medio"
          value={
            stats.avgValorMensal ? `R$ ${stats.avgValorMensal}` : "\u2014"
          }
          subtitle="disposto a pagar/mes"
          icon={DollarSign}
          iconColor="text-green-500"
          borderColor="border-l-green-500"
        />
      </div>

      {/* NPS Breakdown */}
      <ChartCard title="Distribuicao NPS">
        <div className="space-y-3">
          {[
            {
              label: "Promotores (9-10)",
              value: stats.npsBreakdown.promoters,
              color: "bg-emerald-500",
            },
            {
              label: "Neutros (7-8)",
              value: stats.npsBreakdown.passives,
              color: "bg-amber-500",
            },
            {
              label: "Detratores (0-6)",
              value: stats.npsBreakdown.detractors,
              color: "bg-red-500",
            },
          ].map((item) => {
            const pct =
              stats.totalResponses > 0
                ? Math.round((item.value / stats.totalResponses) * 100)
                : 0;
            return (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-36">
                  {item.label}
                </span>
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 w-16 text-right">
                  {item.value} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </ChartCard>

      {/* Feature Ratings & Pricing Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {ratingData.length > 0 && (
          <ChartCard title="Media por Funcionalidade">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={ratingData} layout="vertical">
                <XAxis type="number" domain={[0, 5]} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="value" fill="#1C398E" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {pricingData.length > 0 && (
          <ChartCard title="Percepcao de Preco">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pricingData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                  label={({ name, percent }: any) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                >
                  {pricingData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      {/* AI Quality Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {iaQualidadeData.length > 0 && (
          <ChartCard
            title="Qualidade da IA"
            subtitle="Distribuicao de percepcao de qualidade"
          >
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-gray-500 font-medium">
                ia_qualidade
              </span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={iaQualidadeData} layout="vertical">
                <XAxis type="number" allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={90}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {iaQualidadeData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {iaPrecisaoData.length > 0 && (
          <ChartCard
            title="Precisao da IA"
            subtitle="Distribuicao de percepcao de precisao"
          >
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-indigo-500" />
              <span className="text-xs text-gray-500 font-medium">
                ia_precisao
              </span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={iaPrecisaoData} layout="vertical">
                <XAxis type="number" allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {iaPrecisaoData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      {/* Plan Distribution */}
      {planData.length > 0 && (
        <ChartCard title="Plano de Interesse">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={planData}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Testimonials */}
      {stats.authorizedTestimonials.length > 0 && (
        <ChartCard title="Depoimentos Autorizados">
          <div className="space-y-4">
            {stats.authorizedTestimonials.map((t, i) => (
              <div key={i} className="border-l-4 border-primary pl-4 py-2">
                <Quote className="w-5 h-5 text-gray-300 mb-1" />
                <p className="text-gray-700 text-sm italic">
                  &ldquo;{t.depoimento}&rdquo;
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  &mdash; {t.user_name}
                  {t.area_juridica ? `, ${t.area_juridica}` : ""}
                </p>
              </div>
            ))}
          </div>
        </ChartCard>
      )}

      {/* Insights Section */}
      {insights.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-gray-800">
              Insights Automaticos
            </h3>
          </div>
          <ul className="space-y-2">
            {insights.map((insight, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-gray-700"
              >
                <span className="text-amber-500 mt-0.5 shrink-0">&#8226;</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* All Feedbacks Table with Expandable Rows */}
      <ChartCard title={`Todos os Feedbacks (${feedbacks.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-3 pr-4 w-8"></th>
                <th className="pb-3 pr-4">Usuario</th>
                <th className="pb-3 pr-4">NPS</th>
                <th className="pb-3 pr-4">IA Qualidade</th>
                <th className="pb-3 pr-4">Preco</th>
                <th className="pb-3 pr-4">Plano</th>
                <th className="pb-3">Data</th>
              </tr>
            </thead>
            <tbody>
              {feedbacks.map((f) => {
                const isExpanded = expandedRow === f.id;
                const profileName = (
                  f as unknown as Record<string, unknown> & {
                    profiles?: { name?: string };
                  }
                ).profiles?.name;

                return (
                  <Fragment key={f.id}>
                    <tr
                      className="border-b last:border-0 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() =>
                        setExpandedRow(isExpanded ? null : f.id)
                      }
                    >
                      <td className="py-3 pr-2">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </td>
                      <td className="py-3 pr-4 text-gray-700">
                        {profileName || "\u2014"}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold text-white ${
                            f.nps_score >= 9
                              ? "bg-emerald-500"
                              : f.nps_score >= 7
                                ? "bg-amber-500"
                                : "bg-red-500"
                          }`}
                        >
                          {f.nps_score}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-600 capitalize">
                        {f.ia_qualidade?.replace("_", " ") || "\u2014"}
                      </td>
                      <td className="py-3 pr-4 text-gray-600 capitalize">
                        {f.preco_justo?.replace("_", " ") || "\u2014"}
                      </td>
                      <td className="py-3 pr-4 text-gray-600 capitalize">
                        {f.plano_interesse || "\u2014"}
                      </td>
                      <td className="py-3 text-gray-400 text-xs">
                        {new Date(f.created_at).toLocaleDateString("pt-BR")}
                      </td>
                    </tr>

                    {/* Expanded Row Details */}
                    {isExpanded && (
                      <tr className="bg-gray-50">
                        <td colSpan={7} className="px-4 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                            <DetailItem
                              label="IA Precisao"
                              value={f.ia_precisao?.replace(/_/g, " ")}
                            />
                            <DetailItem
                              label="IA Comparacao"
                              value={f.ia_comparacao}
                            />
                            <DetailItem
                              label="Facilidade de Uso"
                              value={f.facilidade_uso}
                            />
                            <DetailItem
                              label="Intuitivo no 1o uso"
                              value={
                                f.primeiro_uso_intuitivo === null
                                  ? null
                                  : f.primeiro_uso_intuitivo
                                    ? "Sim"
                                    : "Nao"
                              }
                            />
                            <DetailItem
                              label="Area Juridica"
                              value={f.area_juridica}
                            />
                            <DetailItem
                              label="Tamanho Escritorio"
                              value={f.tamanho_escritorio}
                            />
                            <DetailItem
                              label="Valor Max/Mes"
                              value={
                                f.valor_max_mensal
                                  ? `R$ ${f.valor_max_mensal}`
                                  : null
                              }
                            />
                            <DetailItem
                              label="Feature Mais Util"
                              value={f.feature_mais_util}
                            />
                            <DetailItem
                              label="Feature Menos Util"
                              value={f.feature_menos_util}
                            />
                            <DetailItem
                              label="Feature Faltando"
                              value={f.feature_faltando}
                            />
                            <DetailItem
                              label="Ponto Forte"
                              value={f.ponto_forte}
                            />
                            <DetailItem
                              label="Ponto Fraco"
                              value={f.ponto_fraco}
                            />
                            <DetailItem
                              label="Sugestao"
                              value={f.sugestao_melhoria}
                            />

                            {/* Ratings row */}
                            <div className="col-span-full">
                              <span className="text-gray-500 text-xs font-medium block mb-2">
                                Notas por Funcionalidade
                              </span>
                              <div className="flex flex-wrap gap-3">
                                {[
                                  {
                                    label: "Chat IA",
                                    val: f.rating_chat_ia,
                                  },
                                  {
                                    label: "Analise PDF",
                                    val: f.rating_analise_pdf,
                                  },
                                  {
                                    label: "Relatorios",
                                    val: f.rating_relatorios,
                                  },
                                  {
                                    label: "Jurimetria",
                                    val: f.rating_jurimetria,
                                  },
                                  {
                                    label: "Interface",
                                    val: f.rating_interface,
                                  },
                                  {
                                    label: "Velocidade",
                                    val: f.rating_velocidade,
                                  },
                                ].map((r) => (
                                  <span
                                    key={r.label}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-white border rounded-md text-xs"
                                  >
                                    <span className="text-gray-500">
                                      {r.label}:
                                    </span>
                                    <span className="font-semibold text-gray-800">
                                      {r.val ?? "\u2014"}
                                    </span>
                                  </span>
                                ))}
                              </div>
                            </div>

                            {f.depoimento && (
                              <div className="col-span-full border-t pt-3 mt-1">
                                <span className="text-gray-500 text-xs font-medium block mb-1">
                                  Depoimento
                                </span>
                                <p className="text-gray-700 italic text-sm">
                                  &ldquo;{f.depoimento}&rdquo;
                                </p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <span className="text-gray-500 text-xs font-medium">{label}</span>
      <p className="text-gray-800 capitalize">{value || "\u2014"}</p>
    </div>
  );
}
