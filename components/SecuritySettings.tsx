"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, Shield } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function SecuritySettings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (newPassword.length < 8) {
      toast.error("A nova senha deve ter pelo menos 8 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    setIsChangingPassword(true);

    try {
      const supabase = getSupabaseClient();

      // Get user email for re-authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        throw new Error("Não foi possível obter o e-mail do usuário");
      }

      // Verify current password by attempting sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        toast.error("Senha atual incorreta");
        return;
      }

      // Update password using Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      // Reset form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Senha atualizada com sucesso!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao atualizar senha"
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-[#1a4fd6]/15 flex items-center justify-center">
          <Shield className="w-5 h-5 text-blue-600 dark:text-[#7aa6ff]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            Segurança da Conta
          </h2>
          <p className="text-sm text-gray-500 dark:text-white/55">
            Gerencie sua senha e configurações de segurança
          </p>
        </div>
      </div>

      {/* Password Section */}
      <div className="bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.08] p-6">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-4">
          Alterar Senha
        </h3>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {/* Current Password */}
          <div>
            <label
              htmlFor="currentPassword"
              className="block text-sm text-gray-600 dark:text-white/70 mb-1.5"
            >
              Senha atual
            </label>
            <div className="relative">
              <input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 px-4 pr-12 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary bg-white dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white dark:placeholder-white/40 dark:focus:border-[#1a4fd6]"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 text-gray-400 hover:text-gray-600 active:text-gray-800 dark:text-white/45 dark:hover:text-white/80 rounded-full transition-colors"
              >
                {showCurrentPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm text-gray-600 dark:text-white/70 mb-1.5"
            >
              Nova senha
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 px-4 pr-12 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary bg-white dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white dark:placeholder-white/40 dark:focus:border-[#1a4fd6]"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 text-gray-400 hover:text-gray-600 active:text-gray-800 dark:text-white/45 dark:hover:text-white/80 rounded-full transition-colors"
              >
                {showNewPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400 dark:text-white/40 mt-1">Mínimo de 8 caracteres</p>
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm text-gray-600 dark:text-white/70 mb-1.5"
            >
              Confirmar nova senha
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 px-4 pr-12 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary bg-white dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white dark:placeholder-white/40 dark:focus:border-[#1a4fd6]"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 text-gray-400 hover:text-gray-600 active:text-gray-800 dark:text-white/45 dark:hover:text-white/80 rounded-full transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={
              isChangingPassword ||
              !currentPassword ||
              !newPassword ||
              !confirmPassword
            }
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover dark:bg-[#1a4fd6] dark:hover:bg-[#1440b8] disabled:bg-gray-300 dark:disabled:bg-white/[0.1] disabled:cursor-not-allowed transition-colors"
          >
            {isChangingPassword ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Atualizando...
              </>
            ) : (
              "Atualizar senha"
            )}
          </button>
        </form>
      </div>

      {/* Info about other security features */}
      <div className="bg-gray-50 dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.08] p-4">
        <p className="text-sm text-gray-500 dark:text-white/60">
          Funcionalidades adicionais de segurança como autenticação de dois fatores
          e gerenciamento de sessões estarão disponíveis em breve.
        </p>
      </div>
    </div>
  );
}
