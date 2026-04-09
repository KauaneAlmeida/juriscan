import { apiHandler, successResponse, parseBody, RATE_LIMITS, ValidationError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/server";
import { OAB } from "@/src/domain/value-objects/OAB";
import { z } from "zod";

export const dynamic = "force-dynamic";

const verifyOabSchema = z.object({
  oab: z.string().min(1, "Número de OAB é obrigatório"),
  currentUserId: z.string().uuid().optional(),
});

export const POST = apiHandler(
  async (request) => {
    const { oab: oabInput, currentUserId } = await parseBody(request, verifyOabSchema);

    // Validate format using OAB Value Object
    const oab = OAB.tryCreate(oabInput);
    if (!oab) {
      throw new ValidationError("Número de OAB inválido. Use o formato: UF + número (ex: SP123456)");
    }

    const compacto = oab.compacto();
    const formatted = oab.formatado();
    const seccional = oab.getNomeSeccional();

    // Check uniqueness
    const admin = await createAdminClient();
    let query = admin
      .from("profiles")
      .select("id")
      .eq("oab", compacto);

    if (currentUserId) {
      query = query.neq("id", currentUserId);
    }

    const { data: existing } = await query.limit(1);

    if (existing && existing.length > 0) {
      return successResponse({
        valid: false,
        error: "Este número de OAB já está cadastrado em outra conta",
      });
    }

    return successResponse({
      valid: true,
      formatted,
      compacto,
      seccional,
    });
  },
  { requireAuth: false, rateLimit: RATE_LIMITS.oabVerify }
);
