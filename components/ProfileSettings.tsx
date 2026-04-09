"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Mail, Phone, Building, Save, Loader2, Camera, X } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

const PRACTICE_AREA_SUGGESTIONS = [
  "Cível",
  "Trabalhista",
  "Tributário",
  "Penal",
  "Empresarial",
  "Família",
  "Previdenciário",
  "Ambiental",
  "Consumidor",
  "Administrativo",
  "Imobiliário",
  "Digital",
];

interface ProfileFormData {
  name: string;
  oab: string;
  email: string;
  phone: string;
  law_firm: string;
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function ProfileSettings() {
  const { profile, isLoading, updateProfile, isUpdating } = useProfile();
  const [formData, setFormData] = useState<ProfileFormData>({
    name: "",
    oab: "",
    email: "",
    phone: "",
    law_firm: "",
  });
  const [practiceAreas, setPracticeAreas] = useState<string[]>([]);
  const [areaInput, setAreaInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const areaInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Original data for dirty check
  const originalData = useMemo(() => {
    if (!profile) return null;
    return {
      name: profile.name || "",
      oab: profile.oab || "",
      phone: profile.phone || "",
      law_firm: profile.law_firm || "",
      practice_areas: profile.practice_areas || [],
      avatar_url: profile.avatar_url || null,
    };
  }, [profile]);

  const isDirty = useMemo(() => {
    if (!originalData) return false;
    return (
      formData.name !== originalData.name ||
      formData.phone !== originalData.phone ||
      formData.law_firm !== originalData.law_firm ||
      JSON.stringify(practiceAreas) !== JSON.stringify(originalData.practice_areas) ||
      avatarFile !== null
    );
  }, [formData, practiceAreas, avatarFile, originalData]);

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        oab: profile.oab || "",
        email: profile.email || "",
        phone: profile.phone || "",
        law_firm: profile.law_firm || "",
      });
      setPracticeAreas(profile.practice_areas || []);
    }
  }, [profile]);

  // Auto-dismiss save message
  useEffect(() => {
    if (saveMessage?.type === "success") {
      saveTimerRef.current = setTimeout(() => setSaveMessage(null), 3000);
    }
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [saveMessage]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        areaInputRef.current &&
        !areaInputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleChange = (field: keyof ProfileFormData, value: string) => {
    if (field === "phone") {
      setFormData((prev) => ({ ...prev, phone: formatPhone(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
    setSaveMessage(null);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setSaveMessage({ type: "error", text: "Por favor, selecione uma imagem." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSaveMessage({ type: "error", text: "A imagem deve ter no máximo 5MB." });
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setSaveMessage(null);
    // Reset file input so the same file can be selected again
    e.target.value = "";
  };

  // Practice area tag management
  const addArea = useCallback(
    (area: string) => {
      const trimmed = area.trim();
      if (trimmed && !practiceAreas.includes(trimmed)) {
        setPracticeAreas((prev) => [...prev, trimmed]);
      }
      setAreaInput("");
      setShowSuggestions(false);
      setSaveMessage(null);
    },
    [practiceAreas]
  );

  const removeArea = useCallback((area: string) => {
    setPracticeAreas((prev) => prev.filter((a) => a !== area));
    setSaveMessage(null);
  }, []);

  const handleAreaKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && areaInput.trim()) {
      e.preventDefault();
      addArea(areaInput);
    }
    if (e.key === "Backspace" && !areaInput && practiceAreas.length > 0) {
      removeArea(practiceAreas[practiceAreas.length - 1]);
    }
  };

  const filteredSuggestions = PRACTICE_AREA_SUGGESTIONS.filter(
    (s) =>
      !practiceAreas.includes(s) &&
      s.toLowerCase().includes(areaInput.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveMessage(null);

    try {
      let avatarUrl: string | undefined;

      // Upload avatar if changed (server-side via API route)
      if (avatarFile) {
        setIsUploadingAvatar(true);

        const uploadForm = new FormData();
        uploadForm.append("file", avatarFile);

        const uploadRes = await fetch("/api/upload/avatar", {
          method: "POST",
          body: uploadForm,
        });

        if (!uploadRes.ok) {
          const data = await uploadRes.json();
          throw new Error(data.error || "Erro ao enviar imagem");
        }

        const { url } = await uploadRes.json();
        avatarUrl = url;
        setIsUploadingAvatar(false);
      }

      await updateProfile({
        name: formData.name,
        phone: formData.phone || undefined,
        law_firm: formData.law_firm || undefined,
        practice_areas: practiceAreas.length > 0 ? practiceAreas : undefined,
        ...(avatarUrl !== undefined && { avatar_url: avatarUrl }),
      });

      setAvatarFile(null);
      setAvatarPreview(null);
      setSaveMessage({ type: "success", text: "Perfil atualizado com sucesso!" });
    } catch (error) {
      setIsUploadingAvatar(false);
      setSaveMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Erro ao salvar perfil",
      });
    }
  };

  const handleReset = () => {
    if (isDirty) {
      const confirmed = window.confirm(
        "Você tem alterações não salvas. Deseja descartá-las?"
      );
      if (!confirmed) return;
    }

    if (profile) {
      setFormData({
        name: profile.name || "",
        oab: profile.oab || "",
        email: profile.email || "",
        phone: profile.phone || "",
        law_firm: profile.law_firm || "",
      });
      setPracticeAreas(profile.practice_areas || []);
    }
    setAvatarFile(null);
    setAvatarPreview(null);
    setSaveMessage(null);
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary dark:text-[#7aa6ff]" />
      </div>
    );
  }

  const displayAvatar = avatarPreview || profile?.avatar_url;
  const isSaving = isUpdating || isUploadingAvatar;

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">
        Informações Pessoais
      </h2>

      {/* Avatar Section */}
      <div className="flex items-center gap-4 mb-6">
        <button
          type="button"
          onClick={handleAvatarClick}
          className="relative group w-16 h-16 rounded-full flex-shrink-0 overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-[#1a4fd6] focus:ring-offset-2 dark:focus:ring-offset-[#0f1923]"
          aria-label="Alterar foto de perfil"
        >
          {displayAvatar ? (
            <img
              src={displayAvatar}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-primary dark:bg-[#1a4fd6] flex items-center justify-center text-white text-2xl font-semibold">
              {getInitials(formData.name || "U")}
            </div>
          )}
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity">
            <Camera className="w-5 h-5 text-white" />
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleAvatarChange}
          className="hidden"
        />
        <div>
          <p className="text-sm font-medium text-gray-800 dark:text-white">
            {formData.name || "Usuário"}
          </p>
          <p className="text-sm text-gray-500 dark:text-white/55">{formData.email}</p>
          <button
            type="button"
            onClick={handleAvatarClick}
            className="text-xs text-primary hover:text-primary-hover active:text-primary-hover dark:text-[#7aa6ff] dark:hover:text-[#a8c3ff] mt-0.5 transition-colors"
          >
            Alterar foto
          </button>
        </div>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm transition-opacity ${
            saveMessage.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30"
              : "bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30"
          }`}
        >
          {saveMessage.text}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} aria-label="Formulário de perfil">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Nome Completo */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2"
            >
              Nome completo
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Seu nome completo"
              className="w-full h-11 px-4 bg-white border border-gray-200 rounded-[10px] text-sm text-gray-800 focus:outline-none focus:border-primary dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white dark:placeholder-white/40 dark:focus:border-[#1a4fd6]"
            />
          </div>

          {/* OAB (Read-only) */}
          <div>
            <label
              htmlFor="oab"
              className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2"
            >
              OAB
            </label>
            <input
              id="oab"
              type="text"
              value={formData.oab}
              readOnly
              disabled
              className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-[10px] text-sm text-gray-500 cursor-not-allowed dark:bg-white/[0.02] dark:border-white/[0.06] dark:text-white/45"
            />
          </div>

          {/* Email (Read-only) */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2"
            >
              E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 dark:text-white/40" />
              <input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="w-full h-11 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-[10px] text-sm text-gray-500 cursor-not-allowed dark:bg-white/[0.02] dark:border-white/[0.06] dark:text-white/45"
              />
            </div>
            <p className="text-xs text-gray-400 dark:text-white/40 mt-1">
              O e-mail não pode ser alterado
            </p>
          </div>

          {/* Telefone */}
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2"
            >
              Telefone
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 dark:text-white/40" />
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="(11) 99999-9999"
                maxLength={15}
                className="w-full h-11 pl-11 pr-4 bg-white border border-gray-200 rounded-[10px] text-sm text-gray-800 focus:outline-none focus:border-primary dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white dark:placeholder-white/40 dark:focus:border-[#1a4fd6]"
              />
            </div>
          </div>

          {/* Escritório */}
          <div className="md:col-span-2">
            <label
              htmlFor="law_firm"
              className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2"
            >
              Escritório/Empresa
            </label>
            <div className="relative">
              <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 dark:text-white/40" />
              <input
                id="law_firm"
                type="text"
                value={formData.law_firm}
                onChange={(e) => handleChange("law_firm", e.target.value)}
                placeholder="Nome do escritório"
                className="w-full h-11 pl-11 pr-4 bg-white border border-gray-200 rounded-[10px] text-sm text-gray-800 focus:outline-none focus:border-primary dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white dark:placeholder-white/40 dark:focus:border-[#1a4fd6]"
              />
            </div>
          </div>

          {/* Áreas de Atuação - Tags */}
          <div className="md:col-span-2">
            <label
              htmlFor="practice_areas"
              className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2"
            >
              Áreas de atuação
            </label>
            <div className="relative">
              <div
                className="min-h-[44px] flex flex-wrap items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-[10px] focus-within:border-primary dark:bg-white/[0.04] dark:border-white/[0.08] dark:focus-within:border-[#1a4fd6] cursor-text"
                onClick={() => areaInputRef.current?.focus()}
              >
                {practiceAreas.map((area) => (
                  <span
                    key={area}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full dark:bg-[#1a4fd6]/20 dark:text-[#7aa6ff]"
                  >
                    {area}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeArea(area);
                      }}
                      className="flex-shrink-0 w-4 h-4 flex items-center justify-center rounded-full hover:bg-primary/20 active:bg-primary/30 dark:hover:bg-[#1a4fd6]/30 transition-colors"
                      aria-label={`Remover ${area}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  ref={areaInputRef}
                  id="practice_areas"
                  type="text"
                  value={areaInput}
                  onChange={(e) => {
                    setAreaInput(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={handleAreaKeyDown}
                  placeholder={
                    practiceAreas.length === 0
                      ? "Digite e pressione Enter para adicionar"
                      : ""
                  }
                  className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm text-gray-800 placeholder-gray-400 dark:text-white dark:placeholder-white/40 py-0.5"
                />
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-auto dark:bg-[#1a2433] dark:border-white/[0.08]"
                >
                  {filteredSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => addArea(suggestion)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 dark:text-white/85 dark:hover:bg-white/[0.06] transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 dark:text-white/40 mt-1.5">
              Digite e pressione Enter, ou selecione das sugestões
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 mt-6 pt-6 border-t border-gray-100 dark:border-white/[0.06]">
          {isDirty && (
            <span className="text-xs text-amber-600 dark:text-amber-400 sm:mr-auto">
              Alterações não salvas
            </span>
          )}
          <button
            type="button"
            onClick={handleReset}
            disabled={isSaving}
            className="px-5 py-2.5 min-h-[44px] bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white/80 dark:hover:bg-white/[0.06] transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSaving || !isDirty}
            className="flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] bg-primary hover:bg-primary-hover active:bg-primary-hover dark:bg-[#1a4fd6] dark:hover:bg-[#1440b8] disabled:bg-gray-300 dark:disabled:bg-white/[0.1] disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-colors"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isUploadingAvatar
              ? "Enviando foto..."
              : isUpdating
                ? "Salvando..."
                : "Salvar alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}
