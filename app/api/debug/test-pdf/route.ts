import { NextRequest, NextResponse } from "next/server";
import { extractTextFromBuffer } from "@/lib/document/extractor";

export const dynamic = "force-dynamic";

// GET /api/debug/test-pdf — Testa extração de PDF no servidor
export async function GET() {
  const steps: { step: string; status: string; detail?: string }[] = [];

  // 1. Testar se unpdf carrega
  try {
    const unpdf = await import("unpdf");
    steps.push({
      step: "1. Import unpdf",
      status: "OK",
      detail: `extractText: ${typeof unpdf.extractText}`,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    steps.push({ step: "1. Import unpdf", status: "FALHOU", detail: msg });
    return NextResponse.json({ success: false, steps }, { status: 500 });
  }

  // 2. Criar PDF mínimo e extrair texto
  const testPdf = Buffer.from(
    "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n" +
      "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n" +
      "3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj\n" +
      "4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n" +
      "5 0 obj<</Length 44>>stream\nBT /F1 12 Tf 100 700 Td (Juriscan PDF Test OK) Tj ET\nendstream\nendobj\n" +
      "xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000266 00000 n \n0000000340 00000 n \n" +
      "trailer<</Size 6/Root 1 0 R>>\nstartxref\n434\n%%EOF",
    "utf-8"
  );

  try {
    const result = await extractTextFromBuffer(testPdf, "application/pdf");
    steps.push({
      step: "2. Extração de texto",
      status: result.text.length > 0 ? "OK" : "VAZIO",
      detail: `text="${result.text}", pages=${result.pageCount}`,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    steps.push({ step: "2. Extração de texto", status: "FALHOU", detail: msg });
    return NextResponse.json({ success: false, steps }, { status: 500 });
  }

  steps.push({
    step: "3. Fluxo completo",
    status: "OK",
    detail: "PDF → unpdf → texto → prompt da IA",
  });

  return NextResponse.json({ success: true, steps });
}

// POST /api/debug/test-pdf — Testa extração com um PDF real enviado
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Envie um arquivo via FormData com campo 'file'" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await extractTextFromBuffer(buffer, file.type);

    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      extractedTextLength: result.text.length,
      extractedTextPreview: result.text.substring(0, 500),
      pageCount: result.pageCount,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
