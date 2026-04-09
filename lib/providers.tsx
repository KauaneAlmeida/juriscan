"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "sonner";
import { useState, useEffect, useCallback, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { TourProvider } from "@/components/Tour";
import { Tour } from "@/components/Tour";
import WelcomeModal from "@/components/WelcomeModal";
import { getSupabaseClient } from "@/lib/supabase/client";
import { ThemeProvider } from "@/lib/theme";

interface ProvidersProps {
  children: ReactNode;
}

// Rotas onde o modal de termos NÃO deve aparecer (páginas de autenticação)
const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password", "/auth/callback"];

// Wrapper que garante aceite de termos em qualquer página autenticada
function TermsGate({ children }: { children: ReactNode }) {
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const pathname = usePathname();

  // Função para verificar aceite de termos (banco + localStorage)
  const checkTermsAccepted = useCallback(async (uid: string): Promise<boolean> => {
    // Verificar localStorage primeiro (cache local)
    const localTerms = localStorage.getItem(`termsAccepted_${uid}`);
    if (localTerms === "true") {
      return true;
    }

    // Fallback: verificar localStorage antigo (sem userId) para migração
    const legacyTerms = localStorage.getItem("termsAccepted");
    if (legacyTerms === "true") {
      // Migrar para o novo formato
      localStorage.setItem(`termsAccepted_${uid}`, "true");
      localStorage.removeItem("termsAccepted");
      return true;
    }

    // Verificar no banco de dados
    try {
      const supabase = getSupabaseClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("terms_accepted_at")
        .eq("id", uid)
        .single<{ terms_accepted_at: string | null }>();

      if (profile?.terms_accepted_at) {
        // Sincronizar com localStorage
        localStorage.setItem(`termsAccepted_${uid}`, "true");
        return true;
      }
    } catch (error) {
      console.error("Erro ao verificar termos no banco:", error);
    }

    return false;
  }, []);

  // Verificação inicial e listener de auth
  useEffect(() => {
    const supabase = getSupabaseClient();
    let isMounted = true;

    const checkAuthAndTerms = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        // Usar window.location.pathname para evitar closure stale
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : pathname;
        const isAuthRoute = AUTH_ROUTES.some(route => currentPath.startsWith(route));

        if (!isMounted) return;

        if (session?.user) {
          setIsAuthenticated(true);
          setUserId(session.user.id);

          // Verificar termos
          const hasAcceptedTerms = await checkTermsAccepted(session.user.id);

          if (!isMounted) return;

          // Mostrar modal se: logado + não aceitou termos + não em rota de auth
          setShowTermsModal(!hasAcceptedTerms && !isAuthRoute);
        } else {
          setIsAuthenticated(false);
          setUserId(null);
          setShowTermsModal(false);
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
      } finally {
        if (isMounted) {
          setIsChecking(false);
        }
      }
    };

    checkAuthAndTerms();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        // Usar window.location.pathname para evitar closure stale
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : pathname;
        const isAuthRoute = AUTH_ROUTES.some(route => currentPath.startsWith(route));

        if (event === "SIGNED_IN" && session?.user) {
          setIsAuthenticated(true);
          setUserId(session.user.id);

          // Aguardar um momento para o profile ser criado pelo trigger
          await new Promise(resolve => setTimeout(resolve, 500));

          const hasAcceptedTerms = await checkTermsAccepted(session.user.id);

          if (!isMounted) return;

          // CORREÇÃO: Sempre setar o estado explicitamente
          setShowTermsModal(!hasAcceptedTerms && !isAuthRoute);
        } else if (event === "SIGNED_OUT") {
          setIsAuthenticated(false);
          setUserId(null);
          setShowTermsModal(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [pathname, checkTermsAccepted]);

  const handleAcceptTerms = useCallback(async () => {
    if (!userId) return;

    try {
      const supabase = getSupabaseClient();

      // Salvar no banco de dados
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("profiles") as any)
        .update({ terms_accepted_at: new Date().toISOString() })
        .eq("id", userId);

      // Salvar no localStorage (com userId para suportar múltiplos usuários)
      localStorage.setItem(`termsAccepted_${userId}`, "true");
    } catch (error) {
      console.error("Erro ao salvar aceite de termos:", error);
      // Mesmo com erro no banco, salvar localmente
      localStorage.setItem(`termsAccepted_${userId}`, "true");
    }

    setShowTermsModal(false);
  }, [userId]);

  // Não renderizar até verificar autenticação
  if (isChecking) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      {showTermsModal && isAuthenticated && <WelcomeModal onAccept={handleAcceptTerms} />}
    </>
  );
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // With SSR, we usually want to set some default staleTime
            // above 0 to avoid refetching immediately on the client
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TourProvider>
          <TermsGate>
            {children}
          </TermsGate>
          <Tour />
        </TourProvider>
        <Toaster position="top-right" richColors closeButton />
        <ReactQueryDevtools initialIsOpen={false} />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
