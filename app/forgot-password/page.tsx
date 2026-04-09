"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import AuthLayout from "@/components/Auth/AuthLayout";
import AuthInput from "@/components/Auth/AuthInput";
import { cn } from "@/lib/utils/cn";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email) {
      setError("Por favor, informe seu e-mail.");
      return;
    }

    setLoading(true);
    const result = await resetPassword(email);
    setLoading(false);

    if (result.error) {
      if (result.error.includes("rate limit")) {
        setError("Muitas tentativas. Aguarde alguns minutos.");
      } else {
        setError(result.error);
      }
    } else {
      setSuccess(
        "Se o e-mail estiver cadastrado, voce recebera instrucoes para redefinir sua senha."
      );
    }
  };

  return (
    <AuthLayout
      title="Esqueceu a senha?"
      subtitle="Informe seu e-mail para recuperar"
      showBackButton
      onBack={() => router.push("/login")}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Desktop title */}
        <div className="hidden lg:block text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Esqueceu a senha?</h1>
          <p className="mt-2 text-gray-500">Informe seu e-mail para receber instrucoes</p>
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

        {/* Email */}
        <div className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <AuthInput
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="w-5 h-5" />}
            autoComplete="email"
            disabled={loading || !!success}
          />
        </div>

        {/* Submit */}
        <div className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <button
            type="submit"
            disabled={loading || !!success}
            className={cn(
              "w-full h-14 rounded-xl font-semibold text-white",
              "bg-gradient-to-r from-blue-600 to-blue-700",
              "hover:from-blue-700 hover:to-blue-800",
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
                Enviando...
              </>
            ) : (
              "Enviar instrucoes"
            )}
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
