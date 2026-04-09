import { getSupabaseClient } from "@/lib/supabase/client";

export type OAuthProvider = "google" | "apple";

export async function signInWithOAuth(provider: OAuthProvider) {
  const supabase = getSupabaseClient();

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    throw new Error(error.message);
  }
}
