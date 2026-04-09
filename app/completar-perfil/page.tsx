"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";
import AuthLayout from "@/components/Auth/AuthLayout";
import OabInput from "@/components/Auth/OabInput";
import { cn } from "@/lib/utils/cn";

export default function CompletarPerfilPage() {
  const [oab, setOab] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const supabase = getSupabaseClient();

    // ABSOLUTE FALLBACK: show the form after 2s no matter what happens below.
    // This guarantees the spinner NEVER stays forever.
    const fallbackTimer = setTimeout(() => {
      if (mountedRef.current) setChecking(false);
    }, 2000);

    const checkProfile = async () => {
      try {
        // getSession() is local (reads cookies), should not hang
        const { data: { session } } = await supabase.auth.getSession();

        if (!mountedRef.current) return;

        // If session exists and user already has OAB in JWT → go to dashboard
        if (session?.user?.user_metadata?.oab) {
          clearTimeout(fallbackTimer);
          window.location.href = "/dashboard";
          return;
        }

        // Fallback: check DB via profile API.
        // Handles case where OAB was saved to DB but JWT metadata
        // wasn't updated yet (e.g. after a redirect loop).
        if (session) {
          try {
            const res = await fetch("/api/profile");
            if (res.ok) {
              const json = await res.json();
              if (json.data?.profile?.oab) {
                // DB has OAB — set cookie so middleware won't block, then redirect
                document.cookie = "has_oab=1; path=/; max-age=86400; SameSite=Lax";
                if (mountedRef.current) {
                  clearTimeout(fallbackTimer);
                  window.location.href = "/dashboard";
                  return;
                }
              }
            }
          } catch {
            // Non-blocking: if profile check fails, just show the form
          }
        }

        // No OAB (or no session) → show the form immediately
        if (mountedRef.current) {
          setChecking(false);
          clearTimeout(fallbackTimer);
        }
      } catch (err) {
        console.error("Erro ao verificar perfil:", err);
        // On error, show the form — never stay stuck
        if (mountedRef.current) setChecking(false);
        clearTimeout(fallbackTimer);
      }
    };

    checkProfile();

    return () => {
      mountedRef.current = false;
      clearTimeout(fallbackTimer);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oab) {
      setError("Numero de OAB e obrigatorio");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();

      // 1. Save OAB to profile via API
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oab }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.message || "Erro ao salvar OAB");
        setLoading(false);
        return;
      }

      // 2. Set cookie as synchronous fallback so middleware won't redirect
      // back to /completar-perfil even if JWT hasn't propagated yet.
      document.cookie = "has_oab=1; path=/; max-age=86400; SameSite=Lax";

      // 3. Best-effort: refresh session so JWT eventually includes oab
      await supabase.auth.refreshSession();

      // 4. Hard redirect — cookie guarantees middleware won't block
      window.location.href = "/dashboard";
    } catch {
      setError("Erro ao salvar. Tente novamente.");
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <AuthLayout title="Completar cadastro" subtitle="Verificando seus dados...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Completar cadastro"
      subtitle="Informe seu numero da OAB para continuar"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Desktop title */}
        <div className="hidden lg:block text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Completar cadastro</h1>
          <p className="mt-2 text-gray-500">
            O Juriscan e exclusivo para advogados. Informe seu numero da OAB para acessar a plataforma.
          </p>
        </div>

        {/* Mobile description */}
        <p className="lg:hidden text-sm text-gray-500 text-center animate-fade-in-up">
          O Juriscan e exclusivo para advogados. Informe seu numero da OAB para acessar a plataforma.
        </p>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm animate-shake">
            {error}
          </div>
        )}

        <div className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <OabInput
            onValidOab={setOab}
            disabled={loading}
          />
        </div>

        <div className="animate-fade-in-up pt-2" style={{ animationDelay: "200ms" }}>
          <button
            type="submit"
            disabled={loading || !oab}
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
                Salvando...
              </>
            ) : (
              "Continuar"
            )}
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
