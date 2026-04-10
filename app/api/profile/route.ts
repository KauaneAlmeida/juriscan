import { apiHandler, successResponse, parseBody, ValidationError, ConflictError } from "@/lib/api";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { OAB } from "@/src/domain/value-objects/OAB";
import { z } from "zod";

// Force dynamic rendering for this route
export const dynamic = "force-dynamic";

// Schema for profile update
const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  oab: z.string().max(20).optional(),
  phone: z.string().max(20).optional(),
  law_firm: z.string().max(100).optional(),
  practice_areas: z.array(z.string()).optional(),
  avatar_url: z.string().url().max(500).optional().nullable(),
});

// GET /api/profile - Get user profile
export const GET = apiHandler(async (_request, { user }) => {
  const supabase = await createServerSupabaseClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  if (error) {
    throw new Error("Erro ao buscar perfil");
  }

  const response = successResponse({ profile });

  // Self-healing: if the DB confirms the user has an OAB but the
  // browser is missing the `has_oab` cookie (expired, new device,
  // cleared cookies), restore it here. This stops the middleware
  // from looping the user back to /completar-perfil and being
  // perceived as a logout.
  if (
    profile &&
    typeof (profile as { oab?: string | null }).oab === "string" &&
    (profile as { oab?: string | null }).oab !== ""
  ) {
    response.cookies.set("has_oab", "1", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  return response;
});

// PATCH /api/profile - Update user profile
export const PATCH = apiHandler(async (request, { user }) => {
  const supabase = await createServerSupabaseClient();

  const data = await parseBody(request, updateProfileSchema);

  // Build update object with only provided fields
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.oab !== undefined) {
    // Validate OAB format
    const oabObj = OAB.tryCreate(data.oab);
    if (!oabObj) {
      throw new ValidationError("Número de OAB inválido. Use o formato: UF + número (ex: SP123456)");
    }
    const compacto = oabObj.compacto();

    // Check uniqueness (exclude current user)
    const admin = await createAdminClient();
    const { data: existing } = await admin
      .from("profiles")
      .select("id")
      .eq("oab", compacto)
      .neq("id", user!.id)
      .limit(1);

    if (existing && existing.length > 0) {
      throw new ConflictError("Este número de OAB já está cadastrado em outra conta");
    }

    updateData.oab = compacto;
  }
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.law_firm !== undefined) updateData.law_firm = data.law_firm;
  if (data.practice_areas !== undefined) updateData.practice_areas = data.practice_areas;
  if (data.avatar_url !== undefined) updateData.avatar_url = data.avatar_url;

  const { data: profile, error } = await supabase
    .from("profiles")
    .update(updateData as never)
    .eq("id", user!.id)
    .select()
    .single();

  if (error) {
    throw new Error("Erro ao atualizar perfil");
  }

  // If OAB was updated, also sync to auth.users user_metadata server-side.
  // This ensures the JWT will include oab after a session refresh,
  // preventing the middleware from redirecting back to /completar-perfil.
  if (updateData.oab) {
    try {
      const adminForAuth = await createAdminClient();
      await adminForAuth.auth.admin.updateUserById(user!.id, {
        user_metadata: { oab: updateData.oab as string },
      });
    } catch (err) {
      // Non-blocking: profile is already saved, metadata sync is best-effort
      console.error("Failed to sync OAB to auth metadata:", err);
    }
  }

  const response = successResponse({ profile });

  // If we now know the user has an OAB persisted in the DB, set the
  // `has_oab` cookie server-side as a long-lived flag. The middleware
  // uses this cookie as a fallback when the JWT user_metadata hasn't
  // propagated yet (Supabase only re-issues the JWT on full re-login or
  // periodic refresh — admin.updateUserById alone doesn't push it to
  // active sessions). Without this fallback, sessions older than the
  // previous 24h cookie would be redirected to /completar-perfil and
  // the user perceives it as being logged out.
  if (
    profile &&
    typeof (profile as { oab?: string | null }).oab === "string" &&
    (profile as { oab?: string | null }).oab !== ""
  ) {
    response.cookies.set("has_oab", "1", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  return response;
});
