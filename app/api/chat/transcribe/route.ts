import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getOpenAIWhisper } from "@/lib/ai/config";
import { deductCredits } from "@/services/credit.service";
import { CHAT_ATTACHMENT_LIMITS } from "@/types/chat";
import { CHAT_COSTS } from "@/lib/credits/costs";

// Force dynamic rendering for authenticated routes
export const dynamic = "force-dynamic";

// POST /api/chat/transcribe - Transcrever áudio usando Whisper
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Processar FormData
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return NextResponse.json(
        { success: false, error: "Nenhum arquivo de áudio enviado" },
        { status: 400 }
      );
    }

    // Validar tipo de arquivo
    const allowedTypes = CHAT_ATTACHMENT_LIMITS.allowedAudioTypes;
    if (!allowedTypes.includes(audioFile.type as never)) {
      return NextResponse.json(
        { success: false, error: `Tipo de áudio não suportado: ${audioFile.type}` },
        { status: 400 }
      );
    }

    // Validar tamanho (máximo 25MB para Whisper)
    const maxSize = 25 * 1024 * 1024;
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        { success: false, error: "Arquivo de áudio muito grande. Máximo: 25MB" },
        { status: 400 }
      );
    }

    // Deduzir créditos (1 crédito por transcrição)
    const creditResult = await deductCredits(
      supabase,
      user.id,
      CHAT_COSTS.audio_transcription,
      "Transcrição de áudio (Whisper)"
    );

    if (!creditResult.success) {
      return NextResponse.json(
        { success: false, error: "Créditos insuficientes" },
        { status: 402 }
      );
    }

    // Chamar OpenAI Whisper API
    const openai = getOpenAIWhisper();

    // Converter File para formato aceito pelo SDK
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "pt", // Português
      response_format: "text",
    });

    // Calcular duração aproximada baseada no tamanho (estimativa)
    // Áudio típico: ~1MB por minuto em boa qualidade
    const estimatedDuration = Math.round(audioFile.size / (1024 * 1024) * 60);

    return NextResponse.json({
      success: true,
      transcription: transcription,
      duration: estimatedDuration,
    });
  } catch (error) {
    console.error("Transcription error:", error);

    // Tratar erros específicos do OpenAI
    if (error instanceof Error) {
      if (error.message.includes("audio")) {
        return NextResponse.json(
          { success: false, error: "Erro ao processar áudio. Tente novamente." },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: "Erro interno ao transcrever áudio" },
      { status: 500 }
    );
  }
}
