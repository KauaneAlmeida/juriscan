"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Search,
  Calendar,
  ArrowRight,
  Inbox,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import LegalDisclaimer from "@/components/LegalDisclaimer";
import ThemeToggle from "@/components/ThemeToggle";
import { useConversations } from "@/hooks/useConversations";

export default function HistoricoPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [deleteOneId, setDeleteOneId] = useState<string | null>(null);
  const { conversations, isLoading, deleteConversation, deleteAllConversations, isDeletingAll, isDeleting } = useConversations();

  const activeModal = showDeleteAllModal || deleteOneId !== null;

  const handleCloseModal = useCallback(() => {
    setShowDeleteAllModal(false);
    setDeleteOneId(null);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCloseModal();
    };
    if (activeModal) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [activeModal, handleCloseModal]);

  const deleteOneConv = conversations.find((c) => c.id === deleteOneId);

  // Filter conversations based on search query
  const filteredConversations = conversations.filter((conv) =>
    conv.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort by most recent first
  const sortedConversations = [...filteredConversations].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusClasses = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return {
          className:
            "bg-[#DCFCE7] text-[#16A34A] dark:bg-emerald-500/15 dark:text-emerald-300",
          label: "Ativa",
        };
      case "ARCHIVED":
        return {
          className:
            "bg-[#F3F4F6] text-[#6B7280] dark:bg-white/[0.06] dark:text-white/55",
          label: "Arquivada",
        };
      default:
        return {
          className:
            "bg-[#F3F4F6] text-[#6B7280] dark:bg-white/[0.06] dark:text-white/55",
          label: status,
        };
    }
  };

  return (
    <AppShell>
      <main className="p-4 sm:p-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
              Histórico de Conversas
            </h1>
            <p className="text-sm text-gray-500 dark:text-white/55 mt-1">
              Todas as suas consultas jurídicas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {conversations.length > 0 && (
              <button
                onClick={() => setShowDeleteAllModal(true)}
                className="flex items-center justify-center min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 gap-2 px-3 sm:px-4 py-2 border border-red-300 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 text-sm font-medium rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Excluir tudo</span>
              </button>
            )}
            <Link
              href="/chat"
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover dark:bg-[#1a4fd6] dark:hover:bg-[#1440b8] text-white text-sm font-medium rounded-lg transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Nova Consulta
            </Link>
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.08] p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-[#1a4fd6]/15 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-600 dark:text-[#7aa6ff]" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-white/55">Total de Conversas</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {isLoading ? "..." : conversations.length}
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div
            className="relative"
            // When the user has zero conversations, dim the search bar so it's
            // visually clear there's nothing to search yet.
            style={{ opacity: !isLoading && conversations.length === 0 ? 0.6 : 1 }}
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                !isLoading && conversations.length === 0
                  ? "Buscar por tema, número de processo, data..."
                  : "Buscar conversas..."
              }
              disabled={!isLoading && conversations.length === 0}
              className="w-full h-12 pl-12 pr-4 bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/40 rounded-lg text-base lg:text-sm focus:outline-none focus:border-primary dark:focus:border-[#1a4fd6] disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.08] p-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary dark:border-[#7aa6ff] border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500 dark:text-white/55">Carregando histórico...</p>
          </div>
        )}

        {/* Conversations List */}
        {!isLoading && sortedConversations.length > 0 && (
          <div className="bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.08] overflow-hidden">
            {sortedConversations.map((conv, index) => {
              const status = getStatusClasses(conv.status);
              return (
                <Link
                  key={conv.id}
                  href={`/chat?id=${conv.id}`}
                  className={`flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors ${
                    index !== sortedConversations.length - 1
                      ? "border-b border-gray-100 dark:border-white/[0.06]"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center flex-shrink-0 hidden sm:flex">
                      <MessageSquare className="w-5 h-5 text-gray-500 dark:text-white/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {conv.title || "Conversa sem título"}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-white/55">
                          <Calendar className="w-3 h-3" />
                          {formatDate(conv.updated_at)}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDeleteOneId(conv.id);
                      }}
                      className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-gray-400 dark:text-white/40 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/15 transition-colors"
                      title="Excluir conversa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ArrowRight className="w-5 h-5 text-gray-400 dark:text-white/40" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Empty State - search returned nothing (user has conversations, none match) */}
        {!isLoading &&
          sortedConversations.length === 0 &&
          conversations.length > 0 && (
            <div className="bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.08] p-12 text-center">
              <Inbox className="w-12 h-12 text-gray-300 dark:text-white/25 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-white/80 font-medium mb-1">
                Nenhuma conversa encontrada
              </p>
              <p className="text-gray-500 dark:text-white/55 text-sm">
                Não encontramos conversas com &quot;{searchQuery}&quot;
              </p>
            </div>
          )}

        {/* Empty State - true empty (user has zero conversations): educational version */}
        {!isLoading && conversations.length === 0 && (
          <div className="bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.08] flex flex-col items-center justify-center text-center p-10">
            {/* Top icon */}
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-[#eff4ff] dark:bg-[#1a4fd6]/15 mb-5">
              <MessageSquare className="w-7 h-7 text-[#1a4fd6] dark:text-[#7aa6ff]" />
            </div>

            {/* Title */}
            <h2 className="text-base font-semibold text-[#1a2435] dark:text-white mb-2">
              Seu histórico vai aparecer aqui
            </h2>

            {/* Explainer */}
            <p className="text-[13.5px] leading-[1.6] text-[#7a9ab8] dark:text-white/55 max-w-[340px] mb-5">
              Cada análise que você fizer ficará salva aqui com o resumo, a
              probabilidade de êxito calculada, os documentos vinculados e o
              histórico completo da conversa.
            </p>

            {/* Primary CTA */}
            <Link
              href="/chat"
              className="inline-flex items-center justify-center bg-[#1a4fd6] hover:bg-[#1640b8] text-white font-medium transition-colors text-sm px-5 py-2.5 rounded-lg mb-6"
            >
              Fazer minha primeira análise →
            </Link>

            {/* Educational preview block */}
            <div className="w-full text-left bg-[#f5f7fa] dark:bg-white/[0.04] dark:border dark:border-white/[0.06] rounded-[10px] px-5 py-4 max-w-[460px]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.5px] text-[#9ab0c8] dark:text-white/50 mb-3">
                Exemplo do que você verá aqui:
              </p>

              {/* MOCK DATA — these 3 items are static placeholders for the empty
                  state only. They are NOT fetched from Supabase and never appear
                  once the user has real conversations. */}
              {[
                {
                  primary: "Análise de ação de cobrança no TJSP",
                  secondary:
                    "78% probabilidade de êxito · 3 créditos gastos · há 2 dias",
                },
                {
                  primary: "Revisão de contrato de locação comercial",
                  secondary:
                    "4 cláusulas críticas identificadas · 3 créditos · há 5 dias",
                },
                {
                  primary:
                    "Jurisprudência: responsabilidade civil por danos morais",
                  secondary:
                    "24 precedentes encontrados · 2 créditos · há 1 semana",
                },
              ].map((item, idx, arr) => (
                <div
                  key={item.primary}
                  className={`flex items-center gap-2.5 py-2 ${
                    idx === arr.length - 1
                      ? ""
                      : "border-b border-[#e5e9ef] dark:border-white/[0.06]"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[#1a4fd6] dark:bg-[#7aa6ff]"
                  />
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium leading-[1.3] text-[#1a2435] dark:text-white">
                      {item.primary}
                    </p>
                    <p className="text-[11.5px] leading-[1.4] mt-0.5 text-[#9ab0c8] dark:text-white/50">
                      {item.secondary}
                    </p>
                  </div>
                </div>
              ))}

              {/* Retention badge */}
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs text-[#9ab0c8] dark:text-white/55">
                  Dados ficam salvos por
                </span>
                <span className="rounded-[10px] bg-[#eff4ff] text-[#1a4fd6] dark:bg-[#1a4fd6]/15 dark:text-[#7aa6ff] px-2 py-0.5 text-[11px] font-semibold">
                  12 meses
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Legal Disclaimer */}
        <LegalDisclaimer />

        {/* Delete One Confirmation Modal */}
        {deleteOneId && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={handleCloseModal}
          >
            <div
              className="bg-white dark:bg-[#1a2433] dark:border dark:border-white/[0.08] rounded-xl p-6 max-w-md w-full mx-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/15 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Excluir conversa
                </h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-white/70 mb-6">
                Tem certeza que deseja excluir a conversa{" "}
                <span className="font-medium text-gray-900 dark:text-white">
                  &quot;{deleteOneConv?.title || "Conversa sem título"}&quot;
                </span>
                ? Esta ação não pode ser desfeita.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 min-h-[44px] text-sm font-medium text-gray-700 dark:text-white/80 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    deleteConversation(deleteOneId);
                    setDeleteOneId(null);
                  }}
                  disabled={isDeleting}
                  className="px-4 py-2.5 min-h-[44px] text-sm font-medium text-white bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 rounded-lg transition-colors"
                >
                  {isDeleting ? "Excluindo..." : "Excluir"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete All Confirmation Modal */}
        {showDeleteAllModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={handleCloseModal}
          >
            <div
              className="bg-white dark:bg-[#1a2433] dark:border dark:border-white/[0.08] rounded-xl p-6 max-w-md w-full mx-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/15 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Excluir todo o histórico
                </h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-white/70 mb-6">
                Tem certeza que deseja excluir todas as suas conversas? Esta ação
                não pode ser desfeita e todas as {conversations.length} conversas
                serão removidas permanentemente.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 min-h-[44px] text-sm font-medium text-gray-700 dark:text-white/80 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    deleteAllConversations();
                    setShowDeleteAllModal(false);
                  }}
                  disabled={isDeletingAll}
                  className="px-4 py-2.5 min-h-[44px] text-sm font-medium text-white bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 rounded-lg transition-colors"
                >
                  {isDeletingAll ? "Excluindo..." : "Excluir Tudo"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AppShell>
  );
}
