"use client";

import { Suspense, useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import AppShell from "@/components/AppShell";
import SettingsMenu, { menuItems } from "@/components/SettingsMenu";
import ThemeToggle from "@/components/ThemeToggle";
import ProfileSettings from "@/components/ProfileSettings";
import NotificationSettings from "@/components/NotificationSettings";
import SecuritySettings from "@/components/SecuritySettings";
import PlanSettings from "@/components/PlanSettings";
import PrivacySettings from "@/components/PrivacySettings";
import TermsSettings from "@/components/TermsSettings";
import { useTour } from "@/hooks/useTour";
import { useProfile } from "@/hooks/useProfile";
import { useBreakpoint } from "@/hooks/useMediaQuery";

const VALID_TABS = menuItems.map((m) => m.id);

export default function ConfiguracoesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-white dark:bg-[#0f1923]">
          <Loader2 className="w-8 h-8 animate-spin text-primary dark:text-[#7aa6ff]" />
        </div>
      }
    >
      <ConfiguracoesContent />
    </Suspense>
  );
}

function ConfiguracoesContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab");
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState(
    initialTab && VALID_TABS.includes(initialTab) ? initialTab : "perfil"
  );
  const [mobileSection, setMobileSection] = useState<string | null>(
    initialTab && VALID_TABS.includes(initialTab) ? initialTab : null
  );
  const { resetTour } = useTour();
  const { profile } = useProfile();
  const { isMobile } = useBreakpoint();

  const formatAcceptedDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "Data não registrada";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (isMobile) {
      setMobileSection(tabId);
    }
  };

  const handleMobileBack = () => {
    setMobileSection(null);
  };

  const renderSettingsContent = (tabId?: string) => {
    const tab = tabId || activeTab;
    switch (tab) {
      case "perfil":
        return <ProfileSettings />;
      case "notificacoes":
        return <NotificationSettings />;
      case "seguranca":
        return <SecuritySettings />;
      case "plano":
        return <PlanSettings />;
      case "privacidade":
        return <PrivacySettings userEmail={profile?.email} />;
      case "termos":
        return (
          <TermsSettings
            acceptedDate={formatAcceptedDate(profile?.terms_accepted_at)}
            onRestartTour={() => resetTour()}
          />
        );
      default:
        return null;
    }
  };

  const activeSectionLabel = menuItems.find((m) => m.id === mobileSection)?.label || "";

  if (!mounted) return null;

  // Mobile layout
  if (isMobile) {
    return (
      <AppShell>
        <main className="min-h-screen pb-24">
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-300 ease-in-out"
              style={{
                width: "200%",
                transform: mobileSection ? "translateX(-50%)" : "translateX(0)",
              }}
            >
              {/* Painel 1: Menu de opções */}
              <div className="w-1/2 p-4 sm:p-6">
                <div className="mb-6 flex items-start justify-between gap-3">
                  <div>
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white">Configurações</h1>
                    <p className="text-sm text-gray-500 dark:text-white/55 mt-1">
                      Gerencie suas preferências e dados da conta
                    </p>
                  </div>
                  <ThemeToggle />
                </div>
                <SettingsMenu activeTab={activeTab} onTabChange={handleTabChange} />
              </div>

              {/* Painel 2: Conteúdo da seção */}
              <div className="w-1/2">
                {/* Header com botão voltar */}
                <div className="sticky top-0 z-10 bg-white dark:bg-[#0f1923] border-b border-gray-200 dark:border-white/[0.08]">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <button
                      onClick={handleMobileBack}
                      className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-white/[0.06] transition-colors"
                      aria-label="Voltar"
                    >
                      <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-white/80" />
                    </button>
                    <h1 className="font-semibold text-gray-900 dark:text-white">
                      {activeSectionLabel}
                    </h1>
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="p-4">
                  <div className={
                    mobileSection === "perfil" || mobileSection === "notificacoes"
                      ? "bg-white dark:bg-white/[0.03] rounded-2xl border border-gray-100 dark:border-white/[0.08] shadow-sm p-4"
                      : ""
                  }>
                    {mobileSection && renderSettingsContent(mobileSection)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </AppShell>
    );
  }

  // Desktop layout (inalterado)
  return (
    <AppShell>
      <main className="p-4 sm:p-6">
        {/* Page Header */}
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">Configurações</h1>
            <p className="text-sm text-gray-500 dark:text-white/55 mt-1">
              Gerencie suas preferências e dados da conta
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* Settings Layout */}
        <div className="lg:flex lg:flex-row lg:gap-6">
          {/* Settings Menu */}
          <div className="w-full lg:w-auto flex-shrink-0 mb-6 lg:mb-0">
            <SettingsMenu activeTab={activeTab} onTabChange={handleTabChange} />
          </div>

          {/* Settings Content */}
          <div className={`min-w-0 lg:flex-1 ${
            activeTab === "perfil" || activeTab === "notificacoes"
              ? "bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.08] p-4 sm:p-6"
              : ""
          }`}>
            {renderSettingsContent()}
          </div>
        </div>
      </main>
    </AppShell>
  );
}
