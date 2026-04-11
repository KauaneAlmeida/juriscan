import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  CHAT_ATTACHMENT_LIMITS,
  getAttachmentType,
  type ChatAttachment,
  type AttachmentMetadata,
} from "@/types/chat";
import { extractTextFromBuffer, truncateText } from "@/lib/document/extractor";
import { getOpenAIWhisper } from "@/lib/ai/config";
import { validateMagicBytes } from "@/lib/validation/file-magic";

// Force dynamic rendering for authenticated routes
export const dynamic = "force-dynamic";

// POST /api/upload/chat-attachment - Upload de arquivo para o chat
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
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Nenhum arquivo enviado" },
        { status: 400 }
      );
    }

    // Validar tipo de arquivo
    const attachmentType = getAttachmentType(file.type);
    if (!attachmentType) {
      return NextResponse.json(
        { success: false, error: `Tipo de arquivo não suportado: ${file.type}` },
        { status: 400 }
      );
    }

    // Validar magic bytes (conteúdo real do arquivo)
    const validMagic = await validateMagicBytes(file);
    if (!validMagic) {
      return NextResponse.json(
        { success: false, error: "O conteúdo do arquivo não corresponde ao tipo declarado" },
        { status: 400 }
      );
    }

    // Validar tamanho
    const maxSize =
      attachmentType === "image"
        ? CHAT_ATTACHMENT_LIMITS.maxImageSize
        : CHAT_ATTACHMENT_LIMITS.maxFileSize;

    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / 1024 / 1024);
      return NextResponse.json(
        { success: false, error: `Arquivo muito grande. Máximo: ${maxSizeMB}MB` },
        { status: 400 }
      );
    }

    // Ler o buffer do arquivo UMA VEZ para evitar problemas de stream consumido
    // (File streams do Next.js podem não ser re-lidos após o primeiro consumo)
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split(".").pop() || "";
    const baseName = file.name.replace(/\.[^/.]+$/, "").substring(0, 50);
    const safeName = baseName.replace(/[^a-zA-Z0-9-_]/g, "_");
    const fileName = `${safeName}_${timestamp}_${random}.${extension}`;
    const filePath = `${user.id}/${fileName}`;

    // Fazer upload para o Supabase Storage (usando buffer, não File)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("chat-attachments")
      .upload(filePath, fileBuffer, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { success: false, error: "Erro ao fazer upload do arquivo" },
        { status: 500 }
      );
    }

    // Gerar URL assinada (imagens: 24h, documentos/áudio: 1h)
    const urlExpiry = attachmentType === "image" ? 60 * 60 * 24 : 60 * 60;
    const { data: urlData } = await supabase.storage
      .from("chat-attachments")
      .createSignedUrl(uploadData.path, urlExpiry);

    if (!urlData?.signedUrl) {
      return NextResponse.json(
        { success: false, error: "Erro ao gerar URL do arquivo" },
        { status: 500 }
      );
    }

    // Extrair metadados baseados no tipo
    const metadata: AttachmentMetadata = {};

    // Extrair texto de documentos (PDF, DOCX, TXT)
    if (attachmentType === "file") {
      try {
        const { text, pageCount } = await extractTextFromBuffer(fileBuffer, file.type);

        if (text && text.length > 0) {
          // 50k chars ≈ 12.5k tokens ≈ 15-20 páginas de petição/contrato.
          // Cabe folgado nos 200k de contexto do Claude Opus 4.6 e cobre
          // a maioria dos documentos. Antes era 10k (≈ 3-4 páginas), o
          // que cortava texto demais e causava alucinação por falta de
          // contexto real do documento.
          metadata.extracted_text = truncateText(text, 50000);
          metadata.pages = pageCount;
        } else {
          console.warn("[chat-attachment] Texto extraído está vazio para:", file.name);
        }
      } catch (extractError) {
        console.error("[chat-attachment] Erro ao extrair texto de", file.name, ":", extractError);
        // Continua sem texto extraído - não bloqueia o upload
      }
    }

    // Transcrever áudio automaticamente com Whisper
    if (attachmentType === "audio") {
      try {
        const openai = getOpenAIWhisper();

        // Chamar Whisper API para transcrição
        const transcription = await openai.audio.transcriptions.create({
          file: file,
          model: "whisper-1",
          language: "pt", // Português
          response_format: "text",
        });

        if (transcription && transcription.length > 0) {
          metadata.transcription = transcription;
        }
      } catch (transcribeError) {
        console.error("[chat-attachment] Erro ao transcrever áudio:", transcribeError);
        // Continua sem transcrição - não bloqueia o upload
      }
    }

    // Montar resposta
    const attachment: ChatAttachment = {
      id: `att_${timestamp}_${random}`,
      type: attachmentType,
      name: file.name,
      url: urlData.signedUrl,
      size: file.size,
      mime_type: file.type,
      metadata,
    };

    console.log(`[chat-attachment] Upload completo: ${file.name} | tipo=${attachmentType} | extracted_text=${metadata.extracted_text ? metadata.extracted_text.length + ' chars' : 'NENHUM'} | pages=${metadata.pages || 'N/A'}`);

    return NextResponse.json({
      success: true,
      attachment,
    });
  } catch (error) {
    console.error("Upload handler error:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
