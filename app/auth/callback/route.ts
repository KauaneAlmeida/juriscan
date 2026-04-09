import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { normalizeEmail } from "@/lib/security/email-normalization";
import { OAB } from "@/src/domain/value-objects/OAB";

// Prefixos de rotas internas permitidas para redirecionamento pós-auth
const SAFE_REDIRECT_PREFIXES = [
  "/dashboard",
  "/chat",
  "/settings",
  "/relatorios",
  "/processos",
  "/jurimetrics",
  "/profile",
  "/completar-perfil",
];

function isSafeRedirect(path: string): boolean {
  // Deve começar com / e NÃO com // (protocol-relative URL)
  if (!path.startsWith("/") || path.startsWith("//")) return false;
  // Bloquear tentativas de encoding como /\evil.com
  if (path.includes("\\")) return false;
  // Deve corresponder a um prefixo interno conhecido
  return SAFE_REDIRECT_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const safeRedirect = isSafeRedirect(next) ? next : "/dashboard";

  // Handle OAuth provider errors (e.g. user cancelled consent)
  const oauthError = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (oauthError) {
    const message = errorDescription || "Erro ao fazer login com provedor externo";
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(message)}`
    );
  }

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent("Falha ao trocar código de autenticação. Tente novamente.")}`
      );
    }

    if (data.user) {
      // Update avatar_url from OAuth provider metadata if not set yet
      const metadata = data.user.user_metadata;
      const avatarUrl = metadata?.avatar_url || metadata?.picture;

      if (avatarUrl) {
        await supabase
          .from("profiles")
          .update({ avatar_url: avatarUrl } as never)
          .eq("id", data.user.id)
          .is("avatar_url", null);
      }

      // Grant welcome credits (idempotent — only grants once)
      try {
        const admin = await createAdminClient();

        // Set email_normalized if not set yet
        if (data.user.email) {
          const normalized = normalizeEmail(data.user.email);
          await admin
            .from("profiles")
            .update({ email_normalized: normalized } as never)
            .eq("id", data.user.id)
            .is("email_normalized", null);
        }

        // Sync OAB from user_metadata to profiles (don't overwrite existing)
        const metadataOab = metadata?.oab;
        if (metadataOab) {
          const oabObj = OAB.tryCreate(metadataOab);
          if (oabObj) {
            await admin
              .from("profiles")
              .update({ oab: oabObj.compacto() } as never)
              .eq("id", data.user.id)
              .is("oab", null);
          }
        }

        // Grant 20 welcome credits via RPC
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (admin as any).rpc("grant_welcome_credits", {
          p_user_id: data.user.id,
        });
      } catch {
        // Non-blocking: credits can be granted later if this fails
        console.error("Failed to grant welcome credits for user:", data.user.id);
      }

      // Redirect OAuth users without OAB to complete profile
      if (!metadata?.oab) {
        try {
          const adminCheck = await createAdminClient();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: profile } = await (adminCheck as any)
            .from("profiles")
            .select("oab")
            .eq("id", data.user.id)
            .single();

          if (!profile?.oab) {
            return NextResponse.redirect(`${origin}/completar-perfil`);
          }
        } catch {
          // Non-blocking: if check fails, redirect to complete profile to be safe
          return NextResponse.redirect(`${origin}/completar-perfil`);
        }
      }

      return NextResponse.redirect(`${origin}${safeRedirect}`);
    }
  }

  // Return the user to login with error
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("Erro ao autenticar. Tente novamente.")}`
  );
}
