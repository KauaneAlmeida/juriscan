"use client";

import { useState, useEffect, useRef } from "react";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface NotificationPreferences {
  analises_concluidas: boolean;
  relatorios_gerados: boolean;
  prazos_processuais: boolean;
  creditos_baixos: boolean;
  novidades_atualizacoes: boolean;
  marketing_promocoes: boolean;
}

interface NotificationItem {
  id: keyof NotificationPreferences;
  title: string;
  description: string;
}

const notificationItems: NotificationItem[] = [
  {
    id: "analises_concluidas",
    title: "Análises concluídas",
    description: "Notificar quando uma análise for concluída",
  },
  {
    id: "relatorios_gerados",
    title: "Relatórios gerados",
    description: "Notificar quando um relatório estiver pronto",
  },
  {
    id: "prazos_processuais",
    title: "Prazos processuais",
    description: "Alertas sobre prazos importantes",
  },
  {
    id: "creditos_baixos",
    title: "Créditos baixos",
    description: "Avisar quando os créditos estiverem acabando",
  },
  {
    id: "novidades_atualizacoes",
    title: "Novidades e atualizações",
    description: "Receber informações sobre novos recursos",
  },
  {
    id: "marketing_promocoes",
    title: "Marketing e promoções",
    description: "Ofertas especiais e conteúdos exclusivos",
  },
];

const defaultPreferences: NotificationPreferences = {
  analises_concluidas: true,
  relatorios_gerados: true,
  prazos_processuais: true,
  creditos_baixos: true,
  novidades_atualizacoes: false,
  marketing_promocoes: false,
};

interface NotificationSettingsProps {
  onSave?: (preferences: NotificationPreferences) => void;
}

export default function NotificationSettings({
  onSave,
}: NotificationSettingsProps) {
  const [preferences, setPreferences] =
    useState<NotificationPreferences>(defaultPreferences);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const savedPrefsRef = useRef<NotificationPreferences>(defaultPreferences);

  // Fetch preferences on mount
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await fetch("/api/notifications/preferences");
        if (response.ok) {
          const result = await response.json();
          setPreferences(result.data.preferences);
          savedPrefsRef.current = result.data.preferences;
        }
      } catch {
        // Use defaults on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  const handleToggle = (id: keyof NotificationPreferences) => {
    setPreferences((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      setHasChanges(
        JSON.stringify(next) !== JSON.stringify(savedPrefsRef.current)
      );
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const response = await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Erro ao salvar preferências");
      }

      savedPrefsRef.current = { ...preferences };
      setHasChanges(false);
      toast.success("Preferências salvas com sucesso!");
      onSave?.(preferences);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao salvar preferências"
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary dark:text-[#7aa6ff]" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">
        Preferências de Notificação
      </h2>

      {/* Toggle List */}
      <div>
        {notificationItems.map((item, index) => (
          <div
            key={item.id}
            className={`flex items-center justify-between py-4 gap-4 ${
              index < notificationItems.length - 1
                ? "border-b border-gray-100 dark:border-white/[0.06]"
                : ""
            }`}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-white">{item.title}</p>
              <p className="text-sm text-gray-500 dark:text-white/55 mt-0.5">{item.description}</p>
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

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-100 dark:border-white/[0.06]">
        {hasChanges && (
          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
            Alterações não salvas
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover dark:bg-[#1a4fd6] dark:hover:bg-[#1440b8] disabled:bg-gray-300 dark:disabled:bg-white/[0.1] rounded-lg text-sm font-medium text-white transition-colors"
        >
          <Save className="w-4 h-4" />
          {isSaving ? "Salvando..." : "Salvar preferências"}
        </button>
      </div>
    </div>
  );
}
