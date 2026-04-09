import { apiHandler, parseBody } from "@/lib/api/handler";
import { successResponse } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/auth";
import { addCredits } from "@/services/credit.service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const addCreditsSchema = z.object({
  amount: z.number().int().min(1).max(10000),
  reason: z.string().min(1).max(500),
});

export const POST = apiHandler(async (request, { params }) => {
  const adminUser = await requireAdmin();
  const { amount, reason } = await parseBody(request, addCreditsSchema);
  const userId = params.id;

  const admin = await createAdminClient();

  const result = await addCredits(
    admin,
    userId,
    amount,
    `[Admin] ${reason} (por ${adminUser.email})`,
    "ADJUSTMENT"
  );

  if (!result.success) {
    throw new Error(result.error || "Erro ao adicionar créditos");
  }

  return successResponse({
    newBalance: result.newBalance,
    message: `${amount} créditos adicionados com sucesso`,
  });
}, { rateLimit: false });
