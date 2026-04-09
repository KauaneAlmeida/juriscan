"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Mail, Lock, Loader2, AlertCircle, Check, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useFingerprint } from "@/hooks/useFingerprint";
import AuthLayout from "@/components/Auth/AuthLayout";
import AuthInput from "@/components/Auth/AuthInput";
import OabInput from "@/components/Auth/OabInput";
import PasswordStrength from "@/components/Auth/PasswordStrength";
import SocialButton from "@/components/Auth/SocialButton";
import { cn } from "@/lib/utils/cn";
import { signInWithOAuth } from "@/lib/auth/oauth";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [oab, setOab] = useState<string | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signUp, resendConfirmation } = useAuth();
  const fingerprint = useFingerprint();

  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleValidOab = useCallback((value: string | null) => {
    setOab(value);
    setFieldErrors((prev) => prev.oab ? { ...prev, oab: "" } : prev);
  }, []);

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!fullName.trim()) errors.fullName = "Nome e obrigatorio";
    if (!email) errors.email = "E-mail e obrigatorio";
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = "E-mail invalido";
    if (!oab) errors.oab = "Numero de OAB e obrigatorio";
    if (!password) errors.password = "Senha e obrigatoria";
    else if (password.length < 8) errors.password = "Minimo 8 caracteres";
    if (password !== confirmPassword) errors.confirmPassword = "As senhas nao coincidem";
    if (!acceptTerms) errors.acceptTerms = "Voce deve aceitar os termos";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!validate()) return;

    // Pre-validation anti-abuse
    try {
      const validateRes = await fetch("/api/auth/validate-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          fingerprint: fingerprint || undefined,
        }),
      });
      const validateData = await validateRes.json();

      if (validateData.data && !validateData.data.allowed) {
        const reason = validateData.data.reason;
        const messages: Record<string, string> = {
          EMAIL_DISPOSABLE: "E-mails temporarios nao sao permitidos. Use um e-mail permanente.",
          EMAIL_ALREADY_USED: "Este e-mail ja esta associado a uma conta existente.",
          IP_RATE_LIMIT: "Muitas tentativas de cadastro. Aguarde algumas horas e tente novamente.",
          FINGERPRINT_RATE_LIMIT: "Muitas contas criadas deste dispositivo. Aguarde e tente novamente.",
        };
        setError(messages[reason] || "Cadastro nao permitido. Tente novamente mais tarde.");
        return;
      }
    } catch {
      // Fail-open: if validation API fails, proceed with signup
    }

    setIsSubmitting(true);
    try {
      const result = await signUp({ email, password, name: fullName, oab: oab! });

      if (result.error) {
        if (result.error.includes("already registered")) {
          setError("Este e-mail ja esta cadastrado.");
        } else if (result.error.includes("invalid email")) {
          setError("E-mail invalido.");
        } else if (result.error.includes("password")) {
          setError("A senha deve ter pelo menos 8 caracteres.");
        } else if (
          result.error.toLowerCase().includes("rate limit") ||
          result.error.toLowerCase().includes("email rate limit") ||
          result.error.includes("over_email_send_rate_limit")
        ) {
          setError("Muitas tentativas. Aguarde alguns minutos e tente novamente.");
        } else {
          setError(result.error);
        }
      } else if (result.message) {
        setSuccess(result.message);
      }
    } catch {
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendMsg(null);
    const result = await resendConfirmation(email);
    setResending(false);
    if (result.error) {
      if (result.error.toLowerCase().includes("rate") || result.error.toLowerCase().includes("limit")) {
        setResendMsg("Aguarde alguns minutos antes de reenviar.");
      } else {
        setResendMsg(result.error);
      }
    } else {
      setResendMsg("Email reenviado! Verifique sua caixa de entrada e spam.");
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
    <AuthLayout
      title="Criar conta"
      subtitle="Comece sua analise juridica com IA"
      showBackButton
      onBack={() => router.push("/login")}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Desktop title */}
        <div className="hidden lg:block text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Criar conta</h1>
          <p className="mt-2 text-gray-500">Comece sua jornada com analise juridica avancada</p>
        </div>

        {/* General error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600 text-sm animate-shake">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Success — full confirmation screen */}
        {success && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-6 bg-green-50 border border-green-200 rounded-xl text-center space-y-3">
              <Mail className="w-10 h-10 text-green-600 mx-auto" />
              <h2 className="text-lg font-semibold text-gray-900">Verifique seu email</h2>
              <p className="text-sm text-gray-600">
                Enviamos um link de confirmacao para <strong className="text-gray-900">{email}</strong>
              </p>
              <div className="text-xs text-gray-500 space-y-1">
                <p>Nao recebeu? Verifique a pasta de <strong>spam/lixo eletronica</strong>.</p>
                <p>O email pode levar ate 2 minutos para chegar.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className={cn(
                "w-full py-3 rounded-xl text-sm font-medium border-2 transition-all duration-200",
                "border-gray-200 text-gray-700 hover:bg-gray-50",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "flex items-center justify-center gap-2"
              )}
            >
              {resending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Reenviando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Reenviar email de confirmacao
                </>
              )}
            </button>

            {resendMsg && (
              <p className={cn(
                "text-xs text-center",
                resendMsg.includes("reenviado") ? "text-green-600" : "text-red-500"
              )}>
                {resendMsg}
              </p>
            )}

            <p className="text-center text-sm text-gray-500">
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Voltar para o login
              </Link>
            </p>
          </div>
        )}

        {/* Form fields — hidden after successful signup */}
        {!success && <><div className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <AuthInput
            label="Nome completo"
            type="text"
            value={fullName}
            onChange={(e) => { setFullName(e.target.value); clearFieldError("fullName"); }}
            icon={<User className="w-5 h-5" />}
            error={fieldErrors.fullName}
            autoComplete="name"
            disabled={isSubmitting || !!success}
          />
        </div>

        {/* Email */}
        <div className="animate-fade-in-up" style={{ animationDelay: "150ms" }}>
          <AuthInput
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); clearFieldError("email"); }}
            icon={<Mail className="w-5 h-5" />}
            error={fieldErrors.email}
            autoComplete="email"
            disabled={isSubmitting || !!success}
          />
        </div>

        {/* OAB */}
        <div className="animate-fade-in-up" style={{ animationDelay: "175ms" }}>
          <OabInput
            onValidOab={handleValidOab}
            error={fieldErrors.oab}
            disabled={isSubmitting || !!success}
          />
        </div>

        {/* Password */}
        <div className="animate-fade-in-up" style={{ animationDelay: "225ms" }}>
          <AuthInput
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); clearFieldError("password"); }}
            icon={<Lock className="w-5 h-5" />}
            error={fieldErrors.password}
            showPasswordToggle
            autoComplete="new-password"
            disabled={isSubmitting || !!success}
          />
          <PasswordStrength password={password} />
        </div>

        {/* Confirm Password */}
        <div className="animate-fade-in-up" style={{ animationDelay: "275ms" }}>
          <AuthInput
            label="Confirmar senha"
            type="password"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); clearFieldError("confirmPassword"); }}
            icon={<Lock className="w-5 h-5" />}
            error={fieldErrors.confirmPassword}
            success={confirmPassword.length > 0 && password === confirmPassword}
            showPasswordToggle
            autoComplete="new-password"
            disabled={isSubmitting || !!success}
          />
        </div>

        {/* Terms */}
        <div className="animate-fade-in-up" style={{ animationDelay: "325ms" }}>
          <label className="flex items-start gap-3 cursor-pointer">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => { setAcceptTerms(e.target.checked); clearFieldError("acceptTerms"); }}
                className="sr-only"
                disabled={isSubmitting || !!success}
              />
              <div
                className={cn(
                  "w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center",
                  acceptTerms ? "bg-blue-600 border-blue-600" : "border-gray-300 bg-white",
                  fieldErrors.acceptTerms && "border-red-500"
                )}
              >
                {acceptTerms && <Check className="w-3 h-3 text-white" />}
              </div>
            </div>
            <span className="text-sm text-gray-600">
              Li e aceito os{" "}
              <Link href="/terms" className="text-blue-600 hover:underline">
                Termos de Uso
              </Link>{" "}
              e a{" "}
              <Link href="/privacy" className="text-blue-600 hover:underline">
                Politica de Privacidade
              </Link>
            </span>
          </label>
          {fieldErrors.acceptTerms && (
            <p className="mt-1 text-sm text-red-500">{fieldErrors.acceptTerms}</p>
          )}
        </div>

        {/* Submit */}
        <div className="animate-fade-in-up pt-2" style={{ animationDelay: "375ms" }}>
          <button
            type="submit"
            disabled={isSubmitting || !!success}
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
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Criando conta...
              </>
            ) : (
              "Criar conta"
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center gap-4 py-2 animate-fade-in-up" style={{ animationDelay: "425ms" }}>
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-sm text-gray-400">ou</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Social */}
        <div className="grid grid-cols-2 gap-3 animate-fade-in-up" style={{ animationDelay: "450ms" }}>
          <SocialButton provider="google" onClick={() => handleSocialLogin("google")} disabled={isSubmitting || !!success} />
          <SocialButton provider="apple" onClick={() => handleSocialLogin("apple")} disabled={isSubmitting || !!success} />
        </div>

        {/* Login link */}
        <p className="text-center text-gray-600 animate-fade-in-up" style={{ animationDelay: "525ms" }}>
          Ja tem uma conta?{" "}
          <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
            Fazer login
          </Link>
        </p>
        </>}
      </form>
    </AuthLayout>
  );
}
