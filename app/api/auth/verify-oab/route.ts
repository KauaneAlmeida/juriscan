import { apiHandler, successResponse, parseBody, RATE_LIMITS, ValidationError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/server";
import { OAB } from "@/src/domain/value-objects/OAB";
import { z } from "zod";

export const dynamic = "force-dynamic";

const verifyOabSchema = z.object({
  oab: z.string().min(1, "Número de OAB é obrigatório"),
  currentUserId: z.string().uuid().optional(),
});

// Verificar OAB no Cadastro Nacional de Advogados (CNA) da OAB
async function verificarNoCNA(
  inscricao: string,
  uf: string
): Promise<{ found: boolean; nome?: string; tipo?: string }> {
  // Step 1: GET page to obtain CSRF token + cookies
  const pageRes = await fetch("https://cna.oab.org.br/", {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; Juriscan/1.0)" },
  });

  const html = await pageRes.text();

  // Extract CSRF token from HTML
  const tokenMatch = html.match(
    /name="__RequestVerificationToken"[^>]*value="([^"]*)"/
  );
  if (!tokenMatch) {
    throw new Error("CNA: não foi possível obter token de verificação");
  }
  const csrfToken = tokenMatch[1];

  // Extract cookies
  let cookieString = "";
  if (typeof pageRes.headers.getSetCookie === "function") {
    cookieString = pageRes.headers
      .getSetCookie()
      .map((c: string) => c.split(";")[0])
      .join("; ");
  } else {
    const setCookie = pageRes.headers.get("set-cookie");
    if (setCookie) {
      cookieString = setCookie
        .split(",")
        .map((c: string) => c.trim().split(";")[0])
        .join("; ");
    }
  }

  // Step 2: POST search request
  const searchRes = await fetch("https://cna.oab.org.br/Home/Search", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookieString,
      "User-Agent": "Mozilla/5.0 (compatible; Juriscan/1.0)",
    },
    body: new URLSearchParams({
      __RequestVerificationToken: csrfToken,
      IsMobile: "false",
      Insc: inscricao,
      Uf: uf,
      TipoInsc: "1",
      NomeAdvo: "",
    }).toString(),
  });

  const result = await searchRes.json();

  if (result.Success && Array.isArray(result.Data) && result.Data.length > 0) {
    const advogado = result.Data[0];
    return {
      found: true,
      nome: advogado.Nome,
      tipo: advogado.TipoInscOab,
    };
  }

  return { found: false };
}

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
    const numero = parseInt(oab.getNumero(), 10).toString(); // Sem zeros à esquerda
    const uf = oab.getUF();

    // Verificar no CNA (Cadastro Nacional de Advogados)
    const cnaResult = await verificarNoCNA(numero, uf);
    if (!cnaResult.found) {
      return successResponse({
        valid: false,
        error: "Número de OAB não encontrado no Cadastro Nacional de Advogados",
      });
    }

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
      nomeAdvogado: cnaResult.nome,
      tipoInscricao: cnaResult.tipo,
    });
  },
  { requireAuth: false, rateLimit: RATE_LIMITS.oabVerify }
);
