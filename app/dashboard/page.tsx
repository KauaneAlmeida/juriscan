"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Scale,
  Zap,
  FileText,
  BookOpen,
  Paperclip,
  ArrowRight,
  CreditCard,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import LegalDisclaimer from "@/components/LegalDisclaimer";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useCredits } from "@/hooks/useCredits";
import { useConversations } from "@/hooks/useConversations";
import { useReports } from "@/hooks/useReports";
import { PLANS } from "@/lib/pagarme/config";

const ONBOARDING_KEY = "juriscan_onboarding_dismissed";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { balance, subscription, isLoading: creditsLoading } = useCredits();
  const { conversations, isLoading: convsLoading } = useConversations();
  const { reports, isLoading: reportsLoading } = useReports();

  const [onboardingDismissed, setOnboardingDismissed] = useState(true);

  // Read localStorage on mount (client-side only to avoid SSR mismatch)
  useEffect(() => {
    setOnboardingDismissed(
      typeof window !== "undefined" &&
        localStorage.getItem(ONBOARDING_KEY) === "true"
    );
  }, []);

  const dismissOnboarding = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(ONBOARDING_KEY, "true");
    }
    setOnboardingDismissed(true);
  };

  // First name only, with sensible fallbacks
  const fullName =
    profile?.name ||
    (user?.user_metadata?.name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "";
  const firstName = fullName ? fullName.split(" ")[0] : "advogado(a)";

  // Plan name from the existing PLANS map (defaults to "Gratuito")
  const currentPlanId = subscription?.plan_id || "free";
  const planName =
    PLANS[currentPlanId as keyof typeof PLANS]?.name || PLANS.free.name;

  const totalConversations = conversations.length;
  const totalReports = reports.length;
  const approxAnalyses = Math.floor(balance / 5);

  const showOnboarding = !onboardingDismissed && totalConversations === 0;

  return (
    <AppShell>
      <main className="p-4 sm:p-6 max-w-6xl mx-auto">
        {/* 1. TOPBAR */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
              Bem-vindo de volta, {firstName}
            </h1>
            <p className="text-sm text-gray-500 dark:text-white/55 mt-1">
              {creditsLoading ? (
                <span className="inline-block h-4 w-56 bg-gray-200 dark:bg-white/[0.08] rounded animate-pulse align-middle" />
              ) : (
                <>
                  Você tem <span className="font-semibold text-gray-700 dark:text-white">{balance}</span> créditos disponíveis
                  {" · "}
                  Plano <span className="font-semibold text-gray-700 dark:text-white">{planName}</span>
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => router.push("/chat")}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1a3a8f] hover:bg-[#15306f] dark:bg-[#1a4fd6] dark:hover:bg-[#1440b8] text-white text-sm font-semibold rounded-lg transition-colors shadow-sm whitespace-nowrap"
            >
              <MessageSquare className="w-4 h-4" />
              Nova Consulta
            </button>
          </div>
        </div>

        {/* 2. ONBOARDING CARD */}
        {showOnboarding && (
          <div
            className="rounded-xl mb-6 text-white"
            style={{
              background: "linear-gradient(135deg, #1a4fd6 0%, #1a3a8f 100%)",
              padding: "20px 24px",
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                <Scale className="w-6 h-6" />
              </div>

              {/* Text + steps */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base sm:text-lg">
                  Configure sua conta em 3 passos
                </h3>
                <p className="text-blue-100 text-sm mt-1">
                  Complete o perfil, faça sua primeira análise e explore os relatórios estratégicos.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  {/* Step 1 - completed */}
                  <span
                    className="w-2.5 h-2.5 rounded-full bg-emerald-400"
                    aria-label="Conta criada"
                  />
                  {/* Step 2 - active */}
                  <span
                    className="w-2.5 h-2.5 rounded-full bg-white ring-2 ring-white/40"
                    aria-label="Primeira análise"
                  />
                  {/* Step 3 - future */}
                  <span
                    className="w-2.5 h-2.5 rounded-full bg-white/20"
                    aria-label="Primeiro relatório"
                  />
                </div>
              </div>

              {/* Action */}
              <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1.5">
                <button
                  type="button"
                  onClick={() => router.push("/chat")}
                  className="bg-white text-[#1a3a8f] hover:bg-blue-50 font-semibold px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors"
                >
                  Fazer análise →
                </button>
                <button
                  type="button"
                  onClick={dismissOnboarding}
                  className="text-blue-200 hover:text-white text-xs underline-offset-2 hover:underline transition-colors"
                >
                  Pular guia
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Card 1 - Credits */}
          {creditsLoading ? (
            <StatSkeleton />
          ) : (
            <button
              type="button"
              onClick={() => router.push("/configuracoes?tab=plano")}
              className="text-left bg-white dark:bg-white/[0.03] border border-[#e5e9ef] dark:border-white/[0.08] rounded-[10px] px-[18px] py-4 cursor-pointer transition-colors hover:border-[#1a3a8f] dark:hover:border-[#1a4fd6] focus:outline-none focus:ring-2 focus:ring-[#1a3a8f]/20 dark:focus:ring-[#1a4fd6]/30"
            >
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-white/55 font-medium">
                <CreditCard className="w-3.5 h-3.5" />
                Créditos disponíveis
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1.5">{balance}</p>
              <p className="text-xs text-gray-500 dark:text-white/55 mt-1">
                ≈ {approxAnalyses} análises preditivas
              </p>
            </button>
          )}

          {/* Card 2 - Conversations */}
          {convsLoading ? (
            <StatSkeleton />
          ) : (
            <button
              type="button"
              onClick={() => router.push("/historico")}
              className="text-left bg-white dark:bg-white/[0.03] border border-[#e5e9ef] dark:border-white/[0.08] rounded-[10px] px-[18px] py-4 cursor-pointer transition-colors hover:border-[#1a3a8f] dark:hover:border-[#1a4fd6] focus:outline-none focus:ring-2 focus:ring-[#1a3a8f]/20 dark:focus:ring-[#1a4fd6]/30"
            >
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-white/55 font-medium">
                <MessageSquare className="w-3.5 h-3.5" />
                Conversas
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1.5">
                {totalConversations}
              </p>
              <p className="text-xs text-gray-500 dark:text-white/55 mt-1">
                {totalConversations === 0
                  ? "Inicie sua primeira análise"
                  : "Ver histórico completo"}
              </p>
            </button>
          )}

          {/* Card 3 - Reports */}
          {reportsLoading ? (
            <StatSkeleton />
          ) : (
            <button
              type="button"
              onClick={() => router.push("/relatorios")}
              className="text-left bg-white dark:bg-white/[0.03] border border-[#e5e9ef] dark:border-white/[0.08] rounded-[10px] px-[18px] py-4 cursor-pointer transition-colors hover:border-[#1a3a8f] dark:hover:border-[#1a4fd6] focus:outline-none focus:ring-2 focus:ring-[#1a3a8f]/20 dark:focus:ring-[#1a4fd6]/30"
            >
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-white/55 font-medium">
                <FileText className="w-3.5 h-3.5" />
                Relatórios
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1.5">{totalReports}</p>
              <p className="text-xs text-gray-500 dark:text-white/55 mt-1">
                {totalReports === 0
                  ? "Gere análises em PDF"
                  : "Ver todos os relatórios"}
              </p>
            </button>
          )}
        </div>

        {/* 4. QUICK ACTIONS */}
        <h2 className="text-xs font-semibold text-gray-500 dark:text-white/55 uppercase tracking-wide mb-3">
          O que você quer fazer agora?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <QuickActionCard
            icon={<Zap className="w-5 h-5 text-blue-600 dark:text-[#7aa6ff]" />}
            iconBg="bg-blue-100 dark:bg-[#1a4fd6]/15"
            title="Análise Rápida de Processo"
            description="Digite o número ou descreva o caso. A IA calcula probabilidade de êxito."
            badge="5 créditos"
            badgeClass="bg-blue-50 text-blue-700 dark:bg-[#1a4fd6]/15 dark:text-[#7aa6ff]"
            onClick={() => router.push("/chat")}
          />

          <QuickActionCard
            icon={<FileText className="w-5 h-5 text-purple-600 dark:text-[#b794f4]" />}
            iconBg="bg-purple-100 dark:bg-[#7c3aed]/15"
            title="Gerar Relatório PDF"
            description="Análise preditiva completa, perfil do relator ou jurimetria por tribunal."
            badge="3–5 créditos"
            badgeClass="bg-purple-50 text-purple-700 dark:bg-[#7c3aed]/15 dark:text-[#b794f4]"
            onClick={() => router.push("/relatorios")}
          />

          <QuickActionCard
            icon={<BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
            iconBg="bg-emerald-100 dark:bg-emerald-500/15"
            title="Pesquisa Jurisprudencial"
            description="Encontre precedentes relevantes para fortalecer sua argumentação."
            badge="2 créditos"
            badgeClass="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
            onClick={() => router.push("/chat?tipo=jurisprudencia")}
          />

          <QuickActionCard
            icon={<Paperclip className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
            iconBg="bg-amber-100 dark:bg-amber-500/15"
            title="Analisar Documento"
            description="Envie um PDF ou DOCX. A IA extrai riscos, prazos e pontos críticos."
            badge="3 créditos"
            badgeClass="bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
            onClick={() => router.push("/chat?tipo=documento")}
          />
        </div>

        <LegalDisclaimer />
      </main>
    </AppShell>
  );
}

/* ---------- helpers ---------- */

function StatSkeleton() {
  return (
    <div className="bg-white dark:bg-white/[0.03] border border-[#e5e9ef] dark:border-white/[0.08] rounded-[10px] px-[18px] py-4">
      <div className="h-3 w-24 bg-gray-200 dark:bg-white/[0.08] rounded animate-pulse" />
      <div className="h-8 w-16 bg-gray-200 dark:bg-white/[0.08] rounded animate-pulse mt-2" />
      <div className="h-3 w-32 bg-gray-200 dark:bg-white/[0.08] rounded animate-pulse mt-2" />
    </div>
  );
}

interface QuickActionCardProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  badge: string;
  badgeClass: string;
  onClick: () => void;
}

function QuickActionCard({
  icon,
  iconBg,
  title,
  description,
  badge,
  badgeClass,
  onClick,
}: QuickActionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left bg-white dark:bg-white/[0.03] border border-[#e5e9ef] dark:border-white/[0.08] rounded-[10px] p-4 cursor-pointer transition-all hover:border-[#1a3a8f] dark:hover:border-[#1a4fd6] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#1a3a8f]/20 dark:focus:ring-[#1a4fd6]/30"
    >
      <div className="flex items-start gap-3">
        <div
          className={`${iconBg} w-[38px] h-[38px] rounded-[9px] flex items-center justify-center flex-shrink-0`}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base leading-tight">
              {title}
            </h3>
            <ArrowRight className="w-4 h-4 text-gray-400 dark:text-white/45 group-hover:text-[#1a3a8f] dark:group-hover:text-[#7aa6ff] transition-colors flex-shrink-0 mt-0.5" />
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-white/60 mt-1 leading-relaxed">
            {description}
          </p>
          <span
            className={`${badgeClass} inline-block mt-2 text-[11px] font-semibold px-2 py-0.5 rounded-full`}
          >
            {badge}
          </span>
        </div>
      </div>
    </button>
  );
}
