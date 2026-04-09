"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { LoginCredentials, RegisterData } from "@/types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();
  const supabase = getSupabaseClient();

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch {
        // Session check failed, continue without user
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const signIn = async ({ email, password }: LoginCredentials) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      setUser(data.user);
      router.push("/dashboard");
      router.refresh();

      return { error: null };
    } catch {
      return { error: "Erro inesperado. Tente novamente." };
    }
  };

  const signUp = async ({ email, password, name, oab }: RegisterData) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            oab,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("sending confirmation") || msg.includes("email")) {
          return { error: "Nao foi possivel enviar o email de confirmacao. Verifique se o email esta correto e tente novamente em alguns minutos." };
        }
        return { error: error.message };
      }

      // Supabase returns a fake user with empty identities when the email
      // already exists (to prevent email enumeration). No email is sent.
      if (data.user && (!data.user.identities || data.user.identities.length === 0)) {
        return { error: "Este e-mail ja esta cadastrado. Tente fazer login ou recuperar a senha." };
      }

      // If email confirmation is required (new user)
      if (data.user && !data.session) {
        return {
          error: null,
          message: "Verifique seu email para confirmar o cadastro.",
        };
      }

      setUser(data.user);
      router.push("/dashboard");
      router.refresh();

      return { error: null };
    } catch {
      return { error: "Erro inesperado. Tente novamente." };
    }
  };

  const signOut = async () => {
    setIsSigningOut(true);

    try {
      // Signout server-side para limpar cookies HTTP-only corretamente
      await fetch("/auth/signout", { method: "POST" });
    } catch {
      // Fallback: tentar client-side
      await supabase.auth.signOut().catch(() => {});
    }

    setUser(null);
    // Hard redirect para enviar cookies limpos ao middleware
    window.location.href = "/login";
  };

  const resendConfirmation = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null, message: "Email de recuperação enviado." };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null, message: "Senha atualizada com sucesso." };
  };

  return {
    user,
    loading,
    isSigningOut,
    signIn,
    signUp,
    signOut,
    resendConfirmation,
    resetPassword,
    updatePassword,
    isAuthenticated: !!user,
  };
}
