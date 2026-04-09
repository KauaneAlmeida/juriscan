"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle, X, Loader2 } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface PrivacyPreferences {
  share_data_improvements: boolean;
  usage_analytics: boolean;
}

interface PrivacyToggleItem {
  id: keyof PrivacyPreferences;
  title: string;
  description: string;
}

const privacyToggles: PrivacyToggleItem[] = [
  {
    id: "share_data_improvements",
    title: "Compartilhar dados para melhorias",
    description: "Dados anonimizados para aprimorar a IA",
  },
  {
    id: "usage_analytics",
    title: "Análise de uso",
    description: "Permitir coleta de dados de uso da plataforma",
  },
];

interface PrivacySettingsProps {
  userEmail?: string;
}

export default function PrivacySettings({
  userEmail = "advogado@email.com",
}: PrivacySettingsProps) {
  const router = useRouter();
  const [preferences, setPreferences] = useState<PrivacyPreferences>({
    share_data_improvements: true,
    usage_analytics: true,
  });
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportRequested, setExportRequested] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [deleteDataModalOpen, setDeleteDataModalOpen] = useState(false);
  const [deleteAccountModalOpen, setDeleteAccountModalOpen] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Load privacy preferences from API
  useEffect(() => {
    async function loadPreferences() {
      try {
        const res = await fetch("/api/privacy/preferences");
        if (!res.ok) throw new Error("Erro ao carregar preferências");
        const json = await res.json();
        setPreferences(json.data.preferences);
      } catch {
        // Keep defaults on error
      } finally {
        setIsLoadingPreferences(false);
      }
    }
    loadPreferences();
  }, []);

  const handleToggle = useCallback(async (id: keyof PrivacyPreferences) => {
    setPreferences((prev) => {
      const newValue = !prev[id];
      const updated = { ...prev, [id]: newValue };

      // Save to API
      fetch("/api/privacy/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [id]: newValue }),
      })
        .then((res) => {
          if (!res.ok) throw new Error();
          toast.success("Preferência atualizada");
        })
        .catch(() => {
          // Revert on error
          setPreferences((curr) => ({ ...curr, [id]: !newValue }));
          toast.error("Erro ao salvar preferência");
        });

      return updated;
    });
  }, []);

  const handleRequestExport = async () => {
    setIsExporting(true);
    setError(null);

    try {
      const response = await fetch("/api/privacy/export", {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Erro ao exportar dados");
      }

      const result = await response.json();

      // Download the data as JSON file
      const blob = new Blob([JSON.stringify(result.data.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `juriscan-dados-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportRequested(true);
      toast.success("Dados exportados com sucesso");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao exportar dados";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteData = async () => {
    if (confirmationInput !== "EXCLUIR DADOS") return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch("/api/privacy/data", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: confirmationInput }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Erro ao excluir dados");
      }

      setDeleteDataModalOpen(false);
      setConfirmationInput("");
      toast.success("Dados excluídos com sucesso");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao excluir dados";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmationInput !== userEmail) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch("/api/privacy/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: confirmationInput }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Erro ao excluir conta");
      }

      // Sign out locally and redirect
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();

      setDeleteAccountModalOpen(false);
      setConfirmationInput("");

      // Redirect to login
      router.push("/login");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao excluir conta";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const closeModals = () => {
    setDeleteDataModalOpen(false);
    setDeleteAccountModalOpen(false);
    setConfirmationInput("");
  };

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg p-4">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Data Privacy Section */}
      <div className="bg-white dark:bg-white/[0.03] rounded-2xl border border-gray-200 dark:border-white/[0.08] p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
          Privacidade dos Dados
        </h3>
        <p className="text-sm text-gray-500 dark:text-white/55 mb-5 leading-relaxed">
          Seus dados são criptografados e protegidos conforme a LGPD. Você tem
          controle total sobre suas informações.
        </p>

        {isLoadingPreferences ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400 dark:text-white/45" />
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-white/[0.06]">
            {privacyToggles.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-4 gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-white">{item.title}</p>
                  <p className="text-[13px] text-gray-500 dark:text-white/55 mt-1">
                    {item.description}
                  </p>
                </div>

                {/* Toggle Switch */}
                <button
                  role="switch"
                  aria-checked={preferences[item.id]}
                  aria-label={`Alternar ${item.title}`}
                  onClick={() => handleToggle(item.id)}
                  className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 ${
                    preferences[item.id]
                      ? "bg-primary dark:bg-[#1a4fd6]"
                      : "bg-gray-300 dark:bg-white/15"
                  }`}
                >
                  <span
                    className={`absolute left-0 top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                      preferences[item.id] ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Export Data Section */}
      <div className="bg-white dark:bg-white/[0.03] rounded-2xl border border-gray-200 dark:border-white/[0.08] p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
          Exportar Dados
        </h3>
        <p className="text-sm text-gray-500 dark:text-white/55 mb-4">
          Solicite uma cópia de todos os seus dados armazenados
        </p>

        {exportRequested ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-emerald-500/10 dark:border-emerald-500/30">
            <p className="text-sm text-green-700 dark:text-emerald-300">
              Solicitação enviada! Você receberá um e-mail quando seus dados
              estiverem prontos para download.
            </p>
          </div>
        ) : (
          <button
            onClick={handleRequestExport}
            disabled={isExporting}
            className="px-5 py-2.5 bg-white border border-gray-200 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white/85 dark:hover:bg-white/[0.06] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isExporting ? "Solicitando..." : "Solicitar exportação"}
          </button>
        )}
      </div>

      {/* Danger Zone Section */}
      <div className="bg-white dark:bg-red-500/[0.04] rounded-2xl border border-red-200 dark:border-red-500/30 p-6">
        <h3 className="text-lg font-semibold text-red-600 dark:text-red-300 mb-5">
          Zona de Perigo
        </h3>

        {/* Delete Data */}
        <div className="mb-6">
          <p className="text-sm font-semibold text-gray-800 dark:text-white">
            Excluir todos os dados
          </p>
          <p className="text-[13px] text-gray-500 dark:text-white/55 mt-1 mb-3">
            Remove permanentemente todos os seus dados, análises e relatórios
          </p>
          <button
            onClick={() => setDeleteDataModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-red-200 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 hover:border-red-300 dark:bg-transparent dark:border-red-500/40 dark:text-red-300 dark:hover:bg-red-500/10 dark:hover:border-red-500/60 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Excluir meus dados
          </button>
        </div>

        {/* Delete Account */}
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-white">Excluir conta</p>
          <p className="text-[13px] text-gray-500 dark:text-white/55 mt-1 mb-3">
            Encerra permanentemente sua conta e remove todos os dados
          </p>
          <button
            onClick={() => setDeleteAccountModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-sm font-medium text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Excluir conta permanentemente
          </button>
        </div>
      </div>

      {/* Delete Data Modal */}
      {deleteDataModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className="bg-white dark:bg-[#1a2433] dark:border dark:border-white/[0.08] rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-data-title"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-500/15 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <h4
                  id="delete-data-title"
                  className="text-lg font-semibold text-gray-800 dark:text-white"
                >
                  Excluir todos os dados
                </h4>
              </div>
              <button
                onClick={closeModals}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:text-white/45 dark:hover:text-white dark:hover:bg-white/[0.06] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-white/70 mb-4">
              Esta ação é irreversível. Todos os seus dados, análises,
              relatórios e histórico serão permanentemente removidos.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">
                Digite &quot;EXCLUIR DADOS&quot; para confirmar:
              </label>
              <input
                type="text"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder="EXCLUIR DADOS"
                className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-500 dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white dark:placeholder-white/40 dark:focus:border-red-500/70"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeModals}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white/85 dark:hover:bg-white/[0.06] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteData}
                disabled={confirmationInput !== "EXCLUIR DADOS" || isDeleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-sm font-medium text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 dark:disabled:bg-white/[0.1] disabled:cursor-not-allowed transition-colors"
              >
                {isDeleting ? "Excluindo..." : "Excluir dados"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {deleteAccountModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className="bg-white dark:bg-[#1a2433] dark:border dark:border-white/[0.08] rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-500/15 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <h4
                  id="delete-account-title"
                  className="text-lg font-semibold text-gray-800 dark:text-white"
                >
                  Excluir conta permanentemente
                </h4>
              </div>
              <button
                onClick={closeModals}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:text-white/45 dark:hover:text-white dark:hover:bg-white/[0.06] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-white/70 mb-4">
              Esta ação é irreversível. Sua conta será permanentemente excluída
              junto com todos os dados associados. Você perderá acesso a todos
              os recursos e créditos restantes.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">
                Digite seu e-mail para confirmar:
              </label>
              <input
                type="email"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder={userEmail}
                className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-500 dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white dark:placeholder-white/40 dark:focus:border-red-500/70"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeModals}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white/85 dark:hover:bg-white/[0.06] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={confirmationInput !== userEmail || isDeleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-sm font-medium text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 dark:disabled:bg-white/[0.1] disabled:cursor-not-allowed transition-colors"
              >
                {isDeleting ? "Excluindo..." : "Excluir minha conta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
