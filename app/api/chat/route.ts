import { NextResponse } from "next/server";
import { apiHandler, parseBody, InsufficientCreditsError, RATE_LIMITS } from "@/lib/api";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getClaude, AI_CONFIG, LEGAL_SYSTEM_PROMPT } from "@/lib/ai/config";
import { chatMessageSchema } from "@/lib/validation/schemas";
import { deductCredits } from "@/services/credit.service";
import { calculateChatCost } from "@/lib/credits/costs";
import { dbInsertAndSelect, dbInsert, dbUpdateQuery } from "@/lib/supabase/db";
import type { ChatAttachment } from "@/types/chat";
import { TONS_DE_RESPOSTA, type TomDeResposta } from "@/types/chatTone";
import { createAnalyzeCaseUseCase, type EnrichedContext } from "@/src/application/use-cases/chat/AnalyzeCaseUseCase";
import { CHAT_TOOLS } from "@/lib/chatTools";
import { buscarJurisprudencia } from "@/lib/datajud";
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

// Executa uma tool call do Claude e devolve o resultado serializado
// como string (Anthropic exige content do tool_result em string ou
// array de blocos). Cada tool tem seu proprio handler.
async function executeChatTool(
  toolName: string,
  toolInput: Record<string, unknown>
): Promise<string> {
  if (toolName === "buscar_jurisprudencia") {
    try {
      const dados = await buscarJurisprudencia({
        tema: String(toolInput.tema || ""),
        tribunal: String(toolInput.tribunal || ""),
        quantidade:
          typeof toolInput.quantidade === "number"
            ? toolInput.quantidade
            : undefined,
        dataInicio:
          typeof toolInput.dataInicio === "string"
            ? toolInput.dataInicio
            : undefined,
      });

      if (dados.resultados.length === 0) {
        return JSON.stringify({
          sucesso: false,
          mensagem: `Nenhuma decisao encontrada no ${dados.tribunal} sobre "${dados.tema}".`,
          sugestao:
            "Tente reformular o tema com palavras mais especificas ou consulte outro tribunal.",
        });
      }

      return JSON.stringify(
        {
          sucesso: true,
          tribunal: dados.tribunal,
          tema: dados.tema,
          totalEncontrado: dados.total,
          decisoes: dados.resultados.map((r, i) => ({
            numero: i + 1,
            processo: r.numeroProcesso,
            data: r.dataJulgamento,
            orgao: r.orgaoJulgador,
            relator: r.relator,
            classe: r.classe,
            ementa: r.ementa,
          })),
        },
        null,
        2
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      console.error("[chat] Tool buscar_jurisprudencia falhou:", message);
      return JSON.stringify({
        sucesso: false,
        erro: message,
        sugestao:
          "Informe ao usuario que houve erro ao consultar a base do CNJ e sugira que tente novamente em alguns instantes.",
      });
    }
  }

  return JSON.stringify({ erro: `Ferramenta desconhecida: ${toolName}` });
}

// POST /api/chat - Send message and get AI response with streaming
export const POST = apiHandler(async (request, { user }) => {
  const supabase = await createServerSupabaseClient();

  // Validate request body
  const { conversationId, message, attachments = [], tom } = await parseBody(
    request,
    chatMessageSchema
  );

  // Resolve a instrução do tom selecionado (default = formal)
  const tomConfig =
    TONS_DE_RESPOSTA.find((t) => t.id === (tom as TomDeResposta | undefined)) ??
    TONS_DE_RESPOSTA[0];
  const instrucaoTom = tomConfig.instrucao;

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
  // Flag que vira true assim que o cliente desconecta ou o controller
  // é fechado por qualquer motivo. Curto-circuita o loop de streaming
  // para evitar "Invalid state: Controller is already closed" e
  // para parar o consumo desnecessário de tokens do Claude.
  let streamClosed = false;

  // Detecta desconexão do cliente (ex: usuário fecha a aba, reader
  // cancelado pelo timeout do cliente). Quando isso acontece o loop
  // do Anthropic é interrompido cedo no próximo tick.
  request.signal.addEventListener("abort", () => {
    streamClosed = true;
  });

  const stream = new ReadableStream({
    async start(controller) {
      // Helper seguro pra enfileirar eventos SSE. Se o controller já
      // foi fechado (cliente desconectou), seta o flag e engole o erro
      // em vez de crashar o stream inteiro.
      const safeEnqueue = (data: string): boolean => {
        if (streamClosed) return false;
        try {
          controller.enqueue(encoder.encode(data));
          return true;
        } catch {
          streamClosed = true;
          return false;
        }
      };

      const safeClose = () => {
        if (streamClosed) return;
        streamClosed = true;
        try {
          controller.close();
        } catch {
          // já fechado
        }
      };

      try {
        // Send init event immediately so client gets conversationId early
        const initChunk = JSON.stringify({
          type: "init",
          conversationId: actualConversationId,
          creditCost,
        });
        safeEnqueue(`data: ${initChunk}\n\n`);

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
        const baseSystemPrompt = enrichedContext?.contexto_prompt
          ? LEGAL_SYSTEM_PROMPT + "\n\n" + enrichedContext.contexto_prompt
          : LEGAL_SYSTEM_PROMPT;

        // Concatena a instrução do tom no final, sem substituir o prompt base.
        const systemPrompt = `${baseSystemPrompt}

ESTILO DE RESPOSTA PARA ESTA MENSAGEM:
${instrucaoTom}`;

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

        // Call Anthropic Claude with streaming + tools.
        // O loop abaixo trata o ciclo de tool use: enquanto o Claude pedir
        // tool_use, executamos a tool, anexamos o resultado e fazemos uma
        // nova rodada — tudo dentro do mesmo SSE stream para o cliente.
        const claude = getClaude();
        const workingMessages: Anthropic.MessageParam[] = [...formattedMessages];

        // Limite defensivo de iteracoes para evitar loops infinitos caso
        // o modelo entre num ciclo de chamadas a tool. 4 e folgado: a
        // pratica esperada e 1 (sem tool) ou 2 (uma tool call).
        const MAX_TOOL_ITERATIONS = 4;
        let stopReason: Anthropic.Message["stop_reason"] | null = null;

        for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
          const anthropicStream = await claude.messages.create({
            model: AI_CONFIG.model,
            max_tokens: AI_CONFIG.maxTokens,
            temperature: AI_CONFIG.temperature,
            system: systemPrompt,
            messages: workingMessages,
            tools: CHAT_TOOLS,
            stream: true,
          });

          // Acumulamos os blocos de conteudo desta iteracao para
          // remontar a "assistant message" que vai entrar no historico
          // do proximo turno (necessario para o tool_use round-trip).
          const assistantBlocks: Anthropic.ContentBlock[] = [];
          // Mapa indice -> rascunho do tool_use sendo construido via deltas.
          const toolUseDrafts: Map<
            number,
            { id: string; name: string; jsonBuffer: string }
          > = new Map();
          let textBlockDraft = "";
          let textBlockIndex: number | null = null;
          stopReason = null;

          for await (const event of anthropicStream) {
            // Se o cliente desconectou, para de consumir tokens.
            if (streamClosed) break;
            if (event.type === "content_block_start") {
              if (event.content_block.type === "text") {
                textBlockIndex = event.index;
                textBlockDraft = "";
              } else if (event.content_block.type === "tool_use") {
                toolUseDrafts.set(event.index, {
                  id: event.content_block.id,
                  name: event.content_block.name,
                  jsonBuffer: "",
                });
              }
            } else if (event.type === "content_block_delta") {
              if (event.delta.type === "text_delta") {
                const text = event.delta.text;
                textBlockDraft += text;
                fullResponse += text;
                const data = JSON.stringify({
                  type: "chunk",
                  content: text,
                  conversationId: actualConversationId,
                });
                safeEnqueue(`data: ${data}\n\n`);
              } else if (event.delta.type === "input_json_delta") {
                const draft = toolUseDrafts.get(event.index);
                if (draft) {
                  draft.jsonBuffer += event.delta.partial_json;
                }
              }
            } else if (event.type === "content_block_stop") {
              if (textBlockIndex === event.index && textBlockDraft) {
                assistantBlocks.push({
                  type: "text",
                  text: textBlockDraft,
                  citations: null,
                } as Anthropic.TextBlock);
                textBlockDraft = "";
                textBlockIndex = null;
              } else if (toolUseDrafts.has(event.index)) {
                const draft = toolUseDrafts.get(event.index)!;
                let parsedInput: Record<string, unknown> = {};
                try {
                  parsedInput = draft.jsonBuffer
                    ? JSON.parse(draft.jsonBuffer)
                    : {};
                } catch (parseErr) {
                  console.error(
                    "[chat] Falha ao parsear tool input JSON:",
                    parseErr,
                    draft.jsonBuffer
                  );
                }
                assistantBlocks.push({
                  type: "tool_use",
                  id: draft.id,
                  name: draft.name,
                  input: parsedInput,
                } as Anthropic.ToolUseBlock);
              }
            } else if (event.type === "message_delta") {
              if (event.delta.stop_reason) {
                stopReason = event.delta.stop_reason;
              }
            }
          }

          // Se nenhuma tool foi chamada, a resposta esta completa.
          if (stopReason !== "tool_use") {
            break;
          }

          // Sinaliza ao cliente que estamos consultando dados — assim a
          // UI pode mostrar um indicador "buscando jurisprudencia..." em
          // vez de parecer travada enquanto a tool roda.
          const toolUseBlocks = assistantBlocks.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
          );
          for (const tb of toolUseBlocks) {
            const notice = JSON.stringify({
              type: "tool_use",
              tool: tb.name,
              conversationId: actualConversationId,
            });
            safeEnqueue(`data: ${notice}\n\n`);
          }

          // Anexa a mensagem do assistente (com tool_use) e roda as tools.
          workingMessages.push({
            role: "assistant",
            content: assistantBlocks,
          });

          const toolResults: Anthropic.ToolResultBlockParam[] = [];
          for (const tb of toolUseBlocks) {
            const result = await executeChatTool(
              tb.name,
              tb.input as Record<string, unknown>
            );
            toolResults.push({
              type: "tool_result",
              tool_use_id: tb.id,
              content: result,
            });
          }

          workingMessages.push({
            role: "user",
            content: toolResults,
          });

          // Loop continua para a proxima iteracao com os resultados.
        }

        if (stopReason === "tool_use") {
          console.warn(
            "[chat] Limite de iteracoes de tool use atingido sem resposta final"
          );
        }

        // Se a resposta foi cortada por limite de tokens, avisa o usuário
        // com um marker no final. Isso é streamado como chunk pra aparecer
        // em tempo real, e persistido junto com a resposta.
        if (stopReason === "max_tokens") {
          const marker =
            '\n\n---\n\n_⚠️ Resposta truncada por limite de tamanho. Peça "continue" para ver o restante._';
          fullResponse += marker;
          const markerChunk = JSON.stringify({
            type: "chunk",
            content: marker,
            conversationId: actualConversationId,
          });
          safeEnqueue(`data: ${markerChunk}\n\n`);
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
        safeEnqueue(`data: ${doneChunk}\n\n`);
        safeClose();
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

        // Persiste o que conseguimos streamar, mesmo em caso de falha.
        // Assim: (a) a UI pode recarregar e ver a resposta parcial;
        // (b) a mensagem do usuário não fica órfã sem contrapartida da IA;
        // (c) evita o bug de "a resposta some pra sempre" que acontecia
        // quando o stream morria antes do dbInsert.
        const partialContent = fullResponse.trim();
        const contentToPersist = partialContent
          ? `${partialContent}\n\n---\n\n⚠️ _${errorMessage}_`
          : `⚠️ ${errorMessage}`;

        try {
          await dbInsert(supabase, "messages", {
            conversation_id: actualConversationId,
            role: "ASSISTANT",
            content: contentToPersist,
            attachments: [],
            credits_cost: creditCost,
          });
          await dbUpdateQuery(supabase, "conversations", {
            updated_at: new Date().toISOString(),
          }).eq("id", actualConversationId!);
        } catch (persistError) {
          console.error("[chat] Falha ao persistir mensagem de erro:", persistError);
        }

        const errorChunk = JSON.stringify({
          type: "error",
          error: errorMessage,
          persistedContent: contentToPersist,
        });
        safeEnqueue(`data: ${errorChunk}\n\n`);
        safeClose();
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
