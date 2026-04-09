"use client";

import { useState, useEffect } from "react";
import { Loader2, AlertCircle, CheckCircle, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AuthLayout from "@/components/Auth/AuthLayout";
import AuthInput from "@/components/Auth/AuthInput";
import { cn } from "@/lib/utils/cn";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { updatePassword } = useAuth();
  const router = useRouter();

  // Verificar se há um código de recuperação na URL
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const error = hashParams.get("error");
    const errorDescription = hashParams.get("error_description");

    if (error) {
      setError(errorDescription || "Link de recuperação inválido ou expirado.");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!password || !confirmPassword) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    const result = await updatePassword(password);
    setLoading(false);

    if (result.error) {
      if (result.error.includes("same as")) {
        setError("A nova senha deve ser diferente da senha atual.");
      } else {
        setError(result.error);
      }
    } else {
      setSuccess("Senha atualizada com sucesso! Redirecionando...");
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    }
  };

  return (
    <AuthLayout
      title="Redefinir senha"
      subtitle="Digite sua nova senha"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Desktop title */}
        <div className="hidden lg:block text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Redefinir senha</h1>
          <p className="mt-2 text-gray-500">Digite sua nova senha</p>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600 text-sm animate-shake">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-700 text-sm animate-fade-in">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            {success}
          </div>
        )}

        {/* New Password */}
        <div className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <AuthInput
            label="Nova senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="w-5 h-5" />}
            showPasswordToggle
            autoComplete="new-password"
            disabled={loading || !!success}
          />
        </div>

        {/* Confirm Password */}
        <div className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <AuthInput
            label="Confirmar nova senha"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            icon={<Lock className="w-5 h-5" />}
            showPasswordToggle
            success={confirmPassword.length > 0 && password === confirmPassword}
            autoComplete="new-password"
            disabled={loading || !!success}
          />
        </div>

        {/* Submit */}
        <div className="animate-fade-in-up" style={{ animationDelay: "300ms" }}>
          <button
            type="submit"
            disabled={loading || !!success}
            className={cn(
              "w-full h-14 rounded-xl font-semibold text-white",
              "bg-gradient-to-r from-blue-600 to-blue-700",
              "hover:from-blue-700 hover:to-blue-800",
              "active:from-blue-800 active:to-blue-900",
              "transition-all duration-200",
              "sm:hover:scale-[1.02] sm:hover:shadow-lg sm:hover:shadow-blue-500/25",
              "active:scale-[0.98]",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
              "flex items-center justify-center gap-2"
            )}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Atualizando...
              </>
            ) : (
              "Atualizar senha"
            )}
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
