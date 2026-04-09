import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cep: string }> }
) {
  const { cep } = await params;
  const digits = cep.replace(/\D/g, "");

  if (digits.length !== 8) {
    return NextResponse.json({ error: "CEP inválido" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
      next: { revalidate: 86400 },
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[CEP Proxy] Error:", error);
    return NextResponse.json({ error: "Erro ao buscar CEP" }, { status: 500 });
  }
}
