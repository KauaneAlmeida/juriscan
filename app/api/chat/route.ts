import { NextResponse } from "next/server";
import { apiHandler, parseBody, InsufficientCreditsError, RATE_LIMITS } from "@/lib/api";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getClaude, AI_CONFIG, LEGAL_SYSTEM_PROMPT } from "@/lib/ai/config";
import { chatMessageSchema } from "@/lib/validation/schemas";
import { deductCredits } from "@/services/credit.service";
import { calculateChatCost } from "@/lib/credits/costs";
import { dbInsertAndSelect, dbInsert, dbUpdateQuery } from "@/lib/supabase/db";
import type { ChatAttachment } from "@/types/chat";
import { createAnalyzeCaseUseCase, type EnrichedContext } from "@/src/application/use-cases/chat/AnalyzeCaseUseCase";
import type Anthropic from "@anthropic-ai/sdk";

// Force dynamic rendering for authenticated routes
export const dynamic = "force-dynamic";

// Tipos para mensagens Anthropic
type AnthropicContentPart =
  | Anthropic.TextBlockParam
  | Anthropic.ImageBlockParam;

// Construir mensagem com attachments para Anthropic
function buildMessageContent(
  message: string,
  attachments: ChatAttachment[]
): string | AnthropicContentPart[] {
  // Se não há attachments, retornar apenas texto
  if (attachments.length === 0) {
    return message;
  }

  const parts: AnthropicContentPart[] = [];
  const imageParts: AnthropicContentPart[] = [];

  // Adicionar contexto de arquivos e áudio
  const contextParts: string[] = [];

  for (const att of attachments) {
    if (att.type === "file" && att.metadata?.extracted_text) {
      console.log(`[chat] Documento "${att.name}": ${att.metadata.extracted_text.length} chars de texto extraído`);
      contextParts.push(
        `[Conteúdo do documento "${att.name}"]:\n${att.metadata.extracted_text}`
      );
    } else if (att.type === "file") {
      console.warn(`[chat] Documento "${att.name}" SEM texto extraído. metadata:`, JSON.stringify(att.metadata));
      contextParts.push(
        `[O usuário enviou o documento "${att.name}" (${Math.round((att.size || 0) / 1024)}KB), mas o texto não pôde ser extraído automaticamente. Analise com base nas informações disponíveis e pergunte ao usuário sobre o conteúdo se necessário.]`
      );
    }

    if (att.type === "audio") {
      if (att.metadata.transcription) {
        contextParts.push(
          `[Transcrição do áudio enviado]:\n${att.metadata.transcription}`
        );
      } else {
        contextParts.push(
          `[O usuário enviou um áudio, mas não foi possível transcrevê-lo. Informe que você não conseguiu ouvir o áudio.]`
        );
      }
    }

    if (att.type === "image") {
      // Determine if URL is a base64 data URI or a regular URL
      if (att.url.startsWith("data:")) {
        // Extract base64 data and media type from data URI
        const match = att.url.match(/^data:(image\/[^;]+);base64,(.+)$/);
        if (match) {
          imageParts.push({
            type: "image",
            source: {
              type: "base64",
              media_type: match[1] as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
              data: match[2],
            },
          });
        }
      } else {
        imageParts.push({
          type: "image",
          source: {
            type: "url",
            url: att.url,
          },
        });
      }
    }
  }

  // Montar texto completo
  let fullText = message;
  if (contextParts.length > 0) {
    fullText = contextParts.join("\n\n---\n\n") + "\n\n---\n\n" + message;
  }

  // Se não há imagens, retornar apenas texto
  if (imageParts.length === 0) {
    return fullText;
  }

  // Texto PRIMEIRO, depois imagens
  parts.push({ type: "text", text: fullText });
  parts.push(...imageParts);

  return parts;
}

// POST /api/chat - Send message and get AI response with streaming
export const POST = apiHandler(async (request, { user }) => {
  const supabase = await createServerSupabaseClient();

  // Validate request body
  const { conversationId, message, attachments = [] } = await parseBody(
    request,
    chatMessageSchema
  );

  // Debug: logar attachments recebidos
  if (attachments.length > 0) {
    console.log(`[chat] Recebidos ${attachments.length} attachment(s):`,
      attachments.map((a: ChatAttachment) => ({
        name: a.name,
        type: a.type,
        hasExtractedText: !!a.metadata?.extracted_text,
        extractedTextLength: a.metadata?.extracted_text?.length || 0,
      }))
    );
  }

  // Calcular custo de créditos
  const creditCost = calculateChatCost(attachments as ChatAttachment[]);

  // Deduct credits with optimistic locking to prevent race conditions
  const creditResult = await deductCredits(
    supabase,
    user!.id,
    creditCost,
    attachments.length > 0
      ? `Mensagem de chat com ${attachments.length} anexo(s)`
      : "Mensagem de chat"
  );

  if (!creditResult.success) {
    throw new InsufficientCreditsError();
  }

  // Create or get conversation
  let actualConversationId = conversationId;

  if (!conversationId) {
    // Create new conversation
    const title = message.substring(0, 50) + (message.length > 50 ? "..." : "");
    const { data: newConv, error: convError } = await dbInsertAndSelect(
      supabase,
      "conversations",
      {
        user_id: user!.id,
        title: title || "Nova conversa",
        status: "ACTIVE",
      }
    );

    if (convError || !newConv) {
      throw new Error("Erro ao criar conversa");
    }

    actualConversationId = (newConv as { id: string }).id;
  }

  // Save user message with attachments
  await dbInsert(supabase, "messages", {
    conversation_id: actualConversationId,
    role: "USER",
    content: message,
    attachments: attachments,
    credits_cost: creditCost,
  });

  // Get conversation history for context (fast query, ~50-100ms)
  const { data: historyData } = await supabase
    .from("messages")
    .select("role, content, attachments")
    .eq("conversation_id", actualConversationId!)
    .order("created_at", { ascending: true })
    .limit(20);

  const history = (historyData || []) as {
    role: string;
    content: string;
    attachments?: ChatAttachment[];
  }[];

  // Create streaming response — send "init" immediately, then do heavy work inside the stream
  const encoder = new TextEncoder();
  let fullResponse = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send init event immediately so client gets conversationId early
        const initChunk = JSON.stringify({
          type: "init",
          conversationId: actualConversationId,
          creditCost,
        });
        controller.enqueue(encoder.encode(`data: ${initChunk}\n\n`));

        // Analisar última mensagem para extrair entidades e buscar dados jurídicos
        // This runs INSIDE the stream so it doesn't block the first SSE event
        let enrichedContext: EnrichedContext | null = null;
        try {
          const analyzeCaseUseCase = createAnalyzeCaseUseCase();
          const analysisResult = await analyzeCaseUseCase.execute({
            mensagem: message,
            userId: user!.id,
            conversationId: actualConversationId || undefined,
          });

          if (analysisResult.deve_usar_dados && analysisResult.contexto.contexto_prompt) {
            enrichedContext = analysisResult.contexto;
          }
        } catch {
          // Continua sem dados enriquecidos
        }

        // Format messages for Anthropic Claude
        const systemPrompt = enrichedContext?.contexto_prompt
          ? LEGAL_SYSTEM_PROMPT + "\n\n" + enrichedContext.contexto_prompt
          : LEGAL_SYSTEM_PROMPT;

        // Build messages array (Anthropic: no system message in array, only user/assistant)
        const formattedMessages: Anthropic.MessageParam[] = [];

        for (const msg of history) {
          const role = msg.role === "USER" ? "user" : "assistant";
          const content = buildMessageContent(
            msg.content,
            (msg.attachments || []) as ChatAttachment[]
          );
          formattedMessages.push({ role, content });
        }

        // Call Anthropic Claude with streaming (for await pattern for serverless compatibility)
        const claude = getClaude();
        const anthropicStream = await claude.messages.create({
          model: AI_CONFIG.model,
          max_tokens: AI_CONFIG.maxTokens,
          temperature: AI_CONFIG.temperature,
          system: systemPrompt,
          messages: formattedMessages,
          stream: true,
        });

        for await (const event of anthropicStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            const text = event.delta.text;
            fullResponse += text;

            // Send chunk to client
            const data = JSON.stringify({
              type: "chunk",
              content: text,
              conversationId: actualConversationId,
            });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
        }

        // Save assistant message to database
        await dbInsert(supabase, "messages", {
          conversation_id: actualConversationId,
          role: "ASSISTANT",
          content: fullResponse,
          attachments: [], // Assistant messages don't have attachments
          credits_cost: creditCost,
        });

        // Update conversation timestamp
        await dbUpdateQuery(supabase, "conversations", {
          updated_at: new Date().toISOString(),
        }).eq("id", actualConversationId!);

        // Send done message
        const doneChunk = JSON.stringify({
          type: "done",
          conversationId: actualConversationId,
        });
        controller.enqueue(encoder.encode(`data: ${doneChunk}\n\n`));
        controller.close();
      } catch (error) {
        console.error("Streaming error:", error instanceof Error ? { message: error.message, name: error.name, stack: error.stack } : error);

        let errorMessage = "Erro ao processar mensagem. Tente novamente.";
        const err = error as Record<string, unknown>;
        if (err?.code === "ETIMEDOUT" || err?.code === "ECONNABORTED" || err?.type === "request-timeout") {
          errorMessage = "O servidor demorou muito para responder. Tente novamente.";
        } else if (err?.status === 429) {
          errorMessage = "Muitas requisições. Aguarde alguns segundos e tente novamente.";
        } else if (err?.status === 503) {
          errorMessage = "Serviço temporariamente indisponível. Tente novamente em alguns instantes.";
        }

        const errorChunk = JSON.stringify({
          type: "error",
          error: errorMessage,
        });
        controller.enqueue(encoder.encode(`data: ${errorChunk}\n\n`));
        controller.close();
      }
    },
  });

  // Return SSE stream (not using successResponse since this is a special streaming response)
  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}, { rateLimit: RATE_LIMITS.chat });
