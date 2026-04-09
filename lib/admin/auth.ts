import { createAdminClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { AuthError, ForbiddenError } from "@/lib/api/errors";
import type { User } from "@supabase/supabase-js";

const ADMIN_EMAILS = ["danieltiol777@gmail.com"];

/**
 * Verify current user is an admin. For use in API routes.
 * Returns the authenticated user if admin, throws otherwise.
 */
export async function requireAdmin(): Promise<User> {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AuthError("Não autenticado");
  }

  // Check role in profiles table
  const admin = await createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (admin as any)
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if ((profile as { role?: string })?.role !== "ADMIN" && !ADMIN_EMAILS.includes(user.email || "")) {
    throw new ForbiddenError("Acesso restrito a administradores");
  }

  return user;
}

/**
 * Check if user is admin. For use in Server Components (pages).
 * Returns { user, isAdmin } without throwing.
 */
export async function checkAdmin(): Promise<{ user: User | null; isAdmin: boolean }> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { user: null, isAdmin: false };

    const admin = await createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (admin as any)
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = (profile as { role?: string })?.role === "ADMIN" || ADMIN_EMAILS.includes(user.email || "");
    return { user, isAdmin };
  } catch {
    return { user: null, isAdmin: false };
  }
}
