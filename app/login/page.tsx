"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail, Lock, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import AuthLayout from "@/components/Auth/AuthLayout";
import AuthInput from "@/components/Auth/AuthInput";
import SocialButton from "@/components/Auth/SocialButton";
import { cn } from "@/lib/utils/cn";
import { signInWithOAuth } from "@/lib/auth/oauth";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn } = useAuth();
  const searchParams = useSearchParams();

  // Capture OAuth error from callback redirect
  useEffect(() => {
    const oauthError = searchParams.get("error");
    if (oauthError) {
      setError(decodeURIComponent(oauthError));
      window.history.replaceState({}, "", "/login");
    }
  }, [searchParams]);

  const validate = () => {
    const errors: typeof fieldErrors = {};
    if (!email) errors.email = "E-mail e obrigatorio";
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = "E-mail invalido";
    if (!password) errors.password = "Senha e obrigatoria";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const result = await signIn({ email, password });

      if (result.error) {
        if (result.error.includes("Invalid login credentials")) {
          setError("E-mail ou senha incorretos.");
        } else if (result.error.includes("Email not confirmed")) {
          setError("Por favor, confirme seu e-mail antes de fazer login.");
        } else {
          setError(result.error);
        }
      }
    } catch {
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialLogin = async (provider: "google" | "apple") => {
    try {
      setError(null);
      await signInWithOAuth(provider);
    } catch (err: unknown) {
      const providerName = provider === "google" ? "Google" : "Apple";
      const message = err instanceof Error ? err.message : `Erro ao conectar com ${providerName}. Tente novamente.`;
      setError(message);
    }
  };

  return (
    <AuthLayout title="Bem-vindo de volta" subtitle="Entre para continuar sua analise">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Desktop title */}
        <div className="hidden lg:block text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Bem-vindo de volta</h1>
          <p className="mt-2 text-gray-500">Entre na sua conta para continuar</p>
        </div>

        {/* General error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600 text-sm animate-shake">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
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
            error={fieldErrors.email}
            autoComplete="email"
            disabled={isSubmitting}
          />
        </div>

        {/* Password */}
        <div className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <AuthInput
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="w-5 h-5" />}
            error={fieldErrors.password}
            showPasswordToggle
            autoComplete="current-password"
            disabled={isSubmitting}
          />
        </div>

        {/* Remember me + Forgot password */}
        <div className="flex items-center justify-between animate-fade-in-up" style={{ animationDelay: "300ms" }}>
          <label className="flex items-center gap-2.5 cursor-pointer py-2 pr-2 -ml-1">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">Lembrar-me</span>
          </label>

          <Link
            href="/forgot-password"
            className="text-sm text-blue-600 hover:text-blue-700 active:text-blue-800 font-medium py-2 pl-2"
          >
            Esqueceu a senha?
          </Link>
        </div>

        {/* Submit */}
        <div className="animate-fade-in-up" style={{ animationDelay: "400ms" }}>
          <button
            type="submit"
            disabled={isSubmitting}
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
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center gap-4 py-2 animate-fade-in-up" style={{ animationDelay: "500ms" }}>
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-sm text-gray-400">ou continue com</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Social buttons */}
        <div className="grid grid-cols-2 gap-3 animate-fade-in-up" style={{ animationDelay: "500ms" }}>
          <SocialButton provider="google" onClick={() => handleSocialLogin("google")} disabled={isSubmitting} />
          <SocialButton provider="apple" onClick={() => handleSocialLogin("apple")} disabled={isSubmitting} />
        </div>

        {/* Register link */}
        <p className="text-center text-gray-600 py-2 animate-fade-in-up" style={{ animationDelay: "600ms" }}>
          Nao tem uma conta?{" "}
          <Link href="/register" className="text-blue-600 hover:text-blue-700 active:text-blue-800 font-semibold">
            Criar conta
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
