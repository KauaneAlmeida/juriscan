"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Download,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  Plus,
  MessageSquare,
  FileText,
  BarChart3,
  BookOpen,
  CreditCard,
  User,
  Mail,
  Phone,
  Building2,
  Scale,
} from "lucide-react";
import { TableSkeleton } from "../components/AdminLoadingSkeleton";
import type {
  AdminUser,
  AdminUserDetail,
  AdminCreditTransaction,
} from "@/types/admin";

/* ─── Types ────────────────────────────────────────────────────────────────── */

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

type SortField = "name" | "email" | "current_plan" | "credit_balance" | "created_at" | "last_login_at";
type SortDir = "asc" | "desc";

/* ─── Constants ────────────────────────────────────────────────────────────── */

const PLAN_BADGE: Record<string, string> = {
  free: "bg-gray-100 text-gray-700",
  starter: "bg-blue-100 text-blue-700",
  pro: "bg-amber-100 text-amber-700",
  business: "bg-[#0F1B2D] text-white",
};

const PLAN_OPTIONS = [
  { label: "Todos", value: "" },
  { label: "Free", value: "free" },
  { label: "Starter", value: "starter" },
  { label: "Pro", value: "pro" },
  { label: "Business", value: "business" },
];

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function relativeDate(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  if (diffDays < 30) return `${diffDays}d atrás`;
  return date.toLocaleDateString("pt-BR");
}

function avatarFallback(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0][0]?.toUpperCase() || "?";
}

function formatTransactionType(type: string): string {
  const map: Record<string, string> = {
    CONSUMPTION: "Consumo",
    MONTHLY_RESET: "Reset Mensal",
    ADJUSTMENT: "Ajuste Manual",
    PURCHASE: "Compra",
    BONUS: "Bônus",
    REFUND: "Reembolso",
  };
  return map[type] || type;
}

/* ─── Main Page Component ──────────────────────────────────────────────────── */

export default function AdminUsersPage() {
  const router = useRouter();

  // List state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  // Detail modal
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<AdminUserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Add credits modal
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditReason, setCreditReason] = useState("");
  const [creditSubmitting, setCreditSubmitting] = useState(false);
  const [creditMessage, setCreditMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Debounce ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Search debounce ─────────────────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  // ── Fetch users ─────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "20",
        sort: sortBy,
        dir: sortDir,
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (planFilter) params.set("plan", planFilter);

      const res = await fetch(`/api/admin/users?${params}`);
      if (res.status === 403) { router.push("/dashboard"); return; }
      if (res.status === 401) { router.push("/login"); return; }
      if (!res.ok) throw new Error("Erro ao carregar usuários");

      const json = await res.json();
      setUsers(json.data);
      setPagination(json.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, sortDir, debouncedSearch, planFilter, router]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ── Fetch user detail ───────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedUserId) {
      setUserDetail(null);
      return;
    }
    let cancelled = false;
    async function load() {
      setDetailLoading(true);
      try {
        const res = await fetch(`/api/admin/users/${selectedUserId}`);
        if (!res.ok) throw new Error("Erro ao carregar detalhes");
        const { data } = await res.json();
        if (!cancelled) setUserDetail(data);
      } catch {
        if (!cancelled) setUserDetail(null);
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [selectedUserId]);

  // ── Sort handler ────────────────────────────────────────────────────────
  function handleSort(field: SortField) {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
    setPage(1);
  }

  // ── CSV export ──────────────────────────────────────────────────────────
  function exportCsv() {
    if (!users.length) return;
    const headers = ["Nome", "Email", "Plano", "Créditos", "Cadastro", "Último Acesso"];
    const rows = users.map((u) => [
      u.name || "",
      u.email,
      u.current_plan || "free",
      String(u.credit_balance),
      u.created_at ? new Date(u.created_at).toLocaleDateString("pt-BR") : "",
      u.last_login_at ? new Date(u.last_login_at).toLocaleDateString("pt-BR") : "",
    ]);
    const csv = [
      headers.join(","),
      ...rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `usuarios_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Add credits ─────────────────────────────────────────────────────────
  async function handleAddCredits() {
    if (!selectedUserId || !creditAmount || !creditReason) return;
    const amount = parseInt(creditAmount);
    if (isNaN(amount) || amount < 1 || amount > 10000) {
      setCreditMessage({ type: "error", text: "Quantidade deve ser entre 1 e 10.000" });
      return;
    }
    setCreditSubmitting(true);
    setCreditMessage(null);
    try {
      const res = await fetch(`/api/admin/users/${selectedUserId}/credits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, reason: creditReason }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error?.message || "Erro ao adicionar créditos");
      }
      const { data } = await res.json();
      setCreditMessage({ type: "success", text: data.message || `${amount} créditos adicionados` });
      setCreditAmount("");
      setCreditReason("");
      // Refresh the detail
      if (userDetail) {
        setUserDetail({ ...userDetail, credit_balance: data.newBalance });
      }
      // Refresh list
      fetchUsers();
    } catch (err) {
      setCreditMessage({ type: "error", text: err instanceof Error ? err.message : "Erro desconhecido" });
    } finally {
      setCreditSubmitting(false);
    }
  }

  // ── Sort header component ──────────────────────────────────────────────
  function SortHeader({ field, children }: { field: SortField; children: React.ReactNode }) {
    const active = sortBy === field;
    return (
      <th
        className="pb-3 pr-4 cursor-pointer select-none hover:text-gray-700 transition-colors"
        onClick={() => handleSort(field)}
      >
        <span className="inline-flex items-center gap-1">
          {children}
          {active ? (
            sortDir === "asc" ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 opacity-30" />
          )}
        </span>
      </th>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
        <button
          onClick={exportCsv}
          disabled={!users.length}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          {PLAN_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {pagination && (
          <span className="text-sm text-gray-500 whitespace-nowrap">
            {pagination.total} usuário{pagination.total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={8} />
      ) : users.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Nenhum usuário encontrado</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500 text-xs uppercase tracking-wider">
                  <SortHeader field="name">Nome</SortHeader>
                  <SortHeader field="email">Email</SortHeader>
                  <SortHeader field="current_plan">Plano</SortHeader>
                  <SortHeader field="credit_balance">Créditos</SortHeader>
                  <SortHeader field="created_at">Cadastro</SortHeader>
                  <SortHeader field="last_login_at">Último Acesso</SortHeader>
                  <th className="pb-3 pr-4">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b last:border-0 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedUserId(u.id)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {u.avatar_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={u.avatar_url}
                            alt={u.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                            {avatarFallback(u.name)}
                          </div>
                        )}
                        <span className="font-medium text-gray-900 truncate max-w-[180px]">
                          {u.name || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-gray-600 truncate max-w-[200px]">{u.email}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${PLAN_BADGE[u.current_plan] || PLAN_BADGE.free}`}>
                        {u.current_plan || "free"}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-gray-700 font-medium tabular-nums">
                      {u.credit_balance.toLocaleString("pt-BR")}
                    </td>
                    <td className="py-3 pr-4 text-gray-500">{relativeDate(u.created_at)}</td>
                    <td className="py-3 pr-4 text-gray-500">{relativeDate(u.last_login_at)}</td>
                    <td className="py-3 pr-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedUserId(u.id); }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Ver detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <span className="text-sm text-gray-500">
                Página {pagination.page} de {pagination.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={!pagination.hasMore}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Próxima
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── User Detail Modal ────────────────────────────────────────────── */}
      {selectedUserId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => { setSelectedUserId(null); setShowCreditsModal(false); setCreditMessage(null); }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {detailLoading || !userDetail ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Modal Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {userDetail.avatar_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={userDetail.avatar_url}
                        alt={userDetail.name}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-lg font-semibold text-gray-600">
                        {avatarFallback(userDetail.name)}
                      </div>
                    )}
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">{userDetail.name || "Sem nome"}</h2>
                      <p className="text-sm text-gray-500">{userDetail.email}</p>
                      <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${PLAN_BADGE[userDetail.current_plan] || PLAN_BADGE.free}`}>
                        {userDetail.current_plan || "free"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => { setSelectedUserId(null); setShowCreditsModal(false); setCreditMessage(null); }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Profile Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {userDetail.oab && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Scale className="w-4 h-4 text-gray-400" />
                      <span>OAB: {userDetail.oab}</span>
                    </div>
                  )}
                  {userDetail.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{userDetail.phone}</span>
                    </div>
                  )}
                  {userDetail.law_firm && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span>{userDetail.law_firm}</span>
                    </div>
                  )}
                  {userDetail.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{userDetail.email}</span>
                    </div>
                  )}
                </div>

                {/* Subscription */}
                {userDetail.subscription && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Assinatura
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Plano:</span>{" "}
                        <span className="font-medium">{userDetail.subscription.plans?.name || "—"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Status:</span>{" "}
                        <span className={`font-medium capitalize ${userDetail.subscription.status === "active" ? "text-emerald-600" : "text-gray-600"}`}>
                          {userDetail.subscription.status}
                        </span>
                      </div>
                      {userDetail.subscription.current_period_end && (
                        <div className="col-span-2">
                          <span className="text-gray-500">Período até:</span>{" "}
                          <span className="font-medium">
                            {new Date(userDetail.subscription.current_period_end).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Credits + Activity */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="bg-blue-50 rounded-xl p-3 text-center col-span-2 sm:col-span-1">
                    <div className="text-2xl font-bold text-blue-700">{userDetail.credit_balance.toLocaleString("pt-BR")}</div>
                    <div className="text-xs text-blue-600 mt-0.5">Créditos</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-lg font-bold text-gray-700">
                      <MessageSquare className="w-4 h-4" />
                      {userDetail.conversations_count}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">Conversas</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-lg font-bold text-gray-700">
                      <BookOpen className="w-4 h-4" />
                      {userDetail.messages_count}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">Mensagens</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-lg font-bold text-gray-700">
                      <FileText className="w-4 h-4" />
                      {userDetail.analyses_count}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">Análises</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-lg font-bold text-gray-700">
                      <BarChart3 className="w-4 h-4" />
                      {userDetail.reports_count}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">Relatórios</div>
                  </div>
                </div>

                {/* Add Credits Button */}
                <button
                  onClick={() => { setShowCreditsModal(true); setCreditMessage(null); }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Créditos
                </button>

                {/* Recent Transactions */}
                {userDetail.recent_transactions.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Transações Recentes</h3>
                    <div className="space-y-2 max-h-52 overflow-y-auto">
                      {userDetail.recent_transactions.map((tx: AdminCreditTransaction) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between text-sm border border-gray-100 rounded-lg px-3 py-2"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                tx.amount > 0
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-red-100 text-red-700"
                              }`}>
                                {formatTransactionType(tx.type)}
                              </span>
                              <span className="text-gray-500 truncate text-xs">{tx.description}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 ml-3 shrink-0">
                            <span className={`font-medium tabular-nums ${tx.amount > 0 ? "text-emerald-600" : "text-red-600"}`}>
                              {tx.amount > 0 ? "+" : ""}{tx.amount}
                            </span>
                            <span className="text-gray-400 text-xs">
                              {new Date(tx.created_at).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dates */}
                <div className="flex items-center gap-6 text-xs text-gray-400 pt-2 border-t">
                  <span>Cadastro: {userDetail.created_at ? new Date(userDetail.created_at).toLocaleDateString("pt-BR") : "—"}</span>
                  <span>Último acesso: {userDetail.last_login_at ? new Date(userDetail.last_login_at).toLocaleDateString("pt-BR") : "—"}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Add Credits Modal ────────────────────────────────────────────── */}
      {showCreditsModal && selectedUserId && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onClick={() => { setShowCreditsModal(false); setCreditMessage(null); }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Adicionar Créditos</h3>
              <button
                onClick={() => { setShowCreditsModal(false); setCreditMessage(null); }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {userDetail && (
              <p className="text-sm text-gray-500">
                Usuário: <span className="font-medium text-gray-700">{userDetail.name || userDetail.email}</span>
                {" "}— Saldo atual: <span className="font-medium text-blue-600">{userDetail.credit_balance.toLocaleString("pt-BR")}</span>
              </p>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
              <input
                type="number"
                min={1}
                max={10000}
                placeholder="Ex: 100"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
              <input
                type="text"
                placeholder="Ex: Compensação por erro no sistema"
                value={creditReason}
                onChange={(e) => setCreditReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            {creditMessage && (
              <div className={`text-sm px-3 py-2 rounded-lg ${
                creditMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              }`}>
                {creditMessage.text}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => { setShowCreditsModal(false); setCreditMessage(null); }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddCredits}
                disabled={creditSubmitting || !creditAmount || !creditReason}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creditSubmitting ? "Adicionando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
