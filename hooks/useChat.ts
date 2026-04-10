"use client";

import { useState, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Message } from "./useConversations";
import type { ChatAttachment } from "@/types/chat";
import type { TomDeResposta } from "@/types/chatTone";
import { calculateChatCost } from "@/lib/credits/costs";

interface UseChatOptions {
  conversationId: string | null;
  onConversationCreated?: (id: string) => void;
}

interface StreamEvent {
  type: "init" | "chunk" | "done" | "error" | "tool_use";
  content?: string;
  conversationId?: string;
  creditCost?: number;
  error?: string;
  persistedContent?: string;
  tool?: string;
}

// Extensão do tipo Message para incluir attachments
interface MessageWithAttachments extends Message {
  attachments?: ChatAttachment[];
}

// 180s (3min). Respostas longas do Claude Opus 4.6 com tool_use
// (busca de jurisprudência) + análise podem facilmente passar de 60s.
// O limite anterior de 60s causava cancelamento no meio do streaming
// e resposta "parando" misteriosamente sem persistir nada.
const TIMEOUT_MS = 180000;

export function useChat({ conversationId, onConversationCreated }: UseChatOptions) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false); // Esperando primeiro chunk
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<MessageWithAttachments[]>([]);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);
  const lastMessageRef = useRef<{ content: string; attachments: ChatAttachment[]; tom?: TomDeResposta } | null>(null);
  const optimisticMessagesRef = useRef<MessageWithAttachments[]>([]);
  const queryClient = useQueryClient();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const sendMessage = useCallback(
    async (content: string, attachments: ChatAttachment[] = [], tom?: TomDeResposta) => {
      if ((!content.trim() && attachments.length === 0) || isStreaming) return;

      // Salvar para retry
      lastMessageRef.current = { content, attachments, tom };

      setError(null);
      setIsStreaming(true);
      setIsWaiting(true);
      setStreamingContent("");

      // Calcular custo otimista
      const optimisticCost = calculateChatCost(attachments);

      // Add user message to UI immediately
      const tempUserMessage: MessageWithAttachments = {
        id: `temp-${Date.now()}`,
        conversation_id: conversationId || "",
        role: "USER",
        content,
        attachments,
        credits_cost: optimisticCost,
        created_at: new Date().toISOString(),
      };

      // Add placeholder for assistant message
      const tempAssistantMessage: MessageWithAttachments = {
        id: `temp-assistant-${Date.now()}`,
        conversation_id: conversationId || "",
        role: "ASSISTANT",
        content: "",
        attachments: [],
        credits_cost: optimisticCost,
        created_at: new Date().toISOString(),
      };

      if (conversationId) {
        // Existing conversation: update React Query cache directly
        queryClient.setQueryData(
          ["conversation", conversationId],
          (old: { conversation: unknown; messages: MessageWithAttachments[] } | undefined) => {
            if (!old) return old;
            return {
              ...old,
              messages: [...old.messages, tempUserMessage, tempAssistantMessage],
            };
          }
        );
      } else {
        // New conversation: use optimistic messages buffer
        const msgs = [tempUserMessage, tempAssistantMessage];
        optimisticMessagesRef.current = msgs;
        setOptimisticMessages(msgs);
      }

      try {
        cancelledRef.current = false;

        // Timeout para evitar loading infinito — cancela o reader, não o fetch
        timeoutRef.current = setTimeout(() => {
          cancelledRef.current = true;
          readerRef.current?.cancel();
        }, TIMEOUT_MS);

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(conversationId && { conversationId }),
            message: content,
            attachments,
            ...(tom && { tom }),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error?.message || errorData.error || `Erro ${response.status}: Falha ao processar mensagem`
          );
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("Erro ao ler resposta do servidor");
        readerRef.current = reader;

        const decoder = new TextDecoder();
        let accumulatedContent = "";
        let newConversationId = conversationId;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const event: StreamEvent = JSON.parse(line.slice(6));

                if (event.type === "init" && event.conversationId) {
                  // Server created the conversation — seed React Query cache
                  newConversationId = event.conversationId;

                  // Atualizar credits_cost com o valor real do servidor
                  if (event.creditCost != null) {
                    const serverCost = event.creditCost;
                    const targetConvId = conversationId || newConversationId;
                    if (targetConvId) {
                      queryClient.setQueryData(
                        ["conversation", targetConvId],
                        (old: { conversation: unknown; messages: MessageWithAttachments[] } | undefined) => {
                          if (!old) return old;
                          const messages = old.messages.map(m =>
                            m.id.startsWith("temp-") ? { ...m, credits_cost: serverCost } : m
                          );
                          return { ...old, messages };
                        }
                      );
                    }
                    // Also update optimistic buffer
                    if (optimisticMessagesRef.current.length > 0) {
                      optimisticMessagesRef.current = optimisticMessagesRef.current.map(m => ({
                        ...m,
                        credits_cost: serverCost,
                      }));
                    }
                  }

                  if (!conversationId) {
                    // Transfer optimistic messages to React Query cache
                    const currentOptimistic = optimisticMessagesRef.current;
                    if (currentOptimistic.length > 0) {
                      queryClient.setQueryData(
                        ["conversation", newConversationId],
                        {
                          conversation: { id: newConversationId },
                          messages: currentOptimistic.map(m => ({
                            ...m,
                            conversation_id: newConversationId!,
                          })),
                        }
                      );
                    }

                    // Clear optimistic buffer
                    optimisticMessagesRef.current = [];
                    setOptimisticMessages([]);

                    onConversationCreated?.(newConversationId);
                  }
                }

                if (event.type === "chunk" && event.content) {
                  // Primeiro chunk recebido — sair do estado "waiting"
                  if (isWaiting || accumulatedContent === "") {
                    setIsWaiting(false);
                  }

                  accumulatedContent += event.content;
                  setStreamingContent(accumulatedContent);

                  // Update the assistant message in cache or optimistic buffer
                  const currentConvId = event.conversationId || newConversationId;
                  if (currentConvId) {
                    queryClient.setQueryData(
                      ["conversation", currentConvId],
                      (old: { conversation: unknown; messages: MessageWithAttachments[] } | undefined) => {
                        if (!old) return old;
                        const messages = [...old.messages];
                        const lastIndex = messages.length - 1;
                        if (messages[lastIndex]?.role === "ASSISTANT") {
                          messages[lastIndex] = {
                            ...messages[lastIndex],
                            content: accumulatedContent,
                          };
                        }
                        return { ...old, messages };
                      }
                    );
                  } else {
                    // Still no conversationId — update optimistic buffer
                    const updated = [...optimisticMessagesRef.current];
                    const lastIndex = updated.length - 1;
                    if (updated[lastIndex]?.role === "ASSISTANT") {
                      updated[lastIndex] = {
                        ...updated[lastIndex],
                        content: accumulatedContent,
                      };
                    }
                    optimisticMessagesRef.current = updated;
                    setOptimisticMessages(updated);
                  }
                }

                if (event.type === "done") {
                  newConversationId = event.conversationId || newConversationId;

                  // Fallback: if "init" was not received, handle conversationId here
                  if (newConversationId && newConversationId !== conversationId) {
                    const currentOptimistic = optimisticMessagesRef.current;
                    if (currentOptimistic.length > 0) {
                      queryClient.setQueryData(
                        ["conversation", newConversationId],
                        {
                          conversation: { id: newConversationId },
                          messages: currentOptimistic.map(m => ({
                            ...m,
                            conversation_id: newConversationId!,
                          })),
                        }
                      );
                      optimisticMessagesRef.current = [];
                      setOptimisticMessages([]);
                    }
                    onConversationCreated?.(newConversationId);
                  }

                  // Invalidate sidebar and credits — but NOT the conversation cache
                  // (it's already up-to-date from chunk-by-chunk updates)
                  queryClient.invalidateQueries({ queryKey: ["conversations"] });
                  queryClient.invalidateQueries({ queryKey: ["credits"] });
                }

                if (event.type === "error") {
                  throw new Error(event.error || "Erro durante streaming");
                }
              } catch (parseError) {
                // Re-throw if it's our error (not a JSON parse error)
                if (parseError instanceof Error && parseError.message !== "Unexpected end of JSON input" && !parseError.message.includes("JSON")) {
                  throw parseError;
                }
                // Ignore parse errors for incomplete chunks
              }
            }
          }
        }
      } catch (err) {
        // Clear optimistic messages on any error
        optimisticMessagesRef.current = [];
        setOptimisticMessages([]);

        // Id efetivo da conversa — pode ter sido criada antes do erro
        const effectiveConvId = conversationId;

        if (cancelledRef.current) {
          // Timeout ou cancelamento manual pelo usuário
          setError("A resposta demorou muito. Tente novamente.");
          if (effectiveConvId) {
            // Remove placeholder local e refetcha do banco (backend persistiu
            // a mensagem de erro no catch do stream, então o refetch traz ela).
            queryClient.setQueryData(
              ["conversation", effectiveConvId],
              (old: { conversation: unknown; messages: MessageWithAttachments[] } | undefined) => {
                if (!old) return old;
                const messages = old.messages.filter(
                  (m) => !(m.role === "ASSISTANT" && !m.content)
                );
                return { ...old, messages };
              }
            );
            queryClient.invalidateQueries({ queryKey: ["conversation", effectiveConvId] });
          }
          return;
        }
        console.error("Chat error:", err);
        setError(err instanceof Error ? err.message : "Erro desconhecido. Tente novamente.");

        // Remover mensagem placeholder vazia do assistente e refetchar pro cliente
        // sincronizar com o que o backend persistiu (resposta parcial + marker de erro).
        if (effectiveConvId) {
          queryClient.setQueryData(
            ["conversation", effectiveConvId],
            (old: { conversation: unknown; messages: MessageWithAttachments[] } | undefined) => {
              if (!old) return old;
              const messages = old.messages.filter(
                (m) => !(m.role === "ASSISTANT" && !m.content)
              );
              return { ...old, messages };
            }
          );
          queryClient.invalidateQueries({ queryKey: ["conversation", effectiveConvId] });
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
          queryClient.invalidateQueries({ queryKey: ["credits"] });
        }
      } finally {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        setIsStreaming(false);
        setIsWaiting(false);
        setStreamingContent("");
        readerRef.current = null;
        cancelledRef.current = false;
      }
    },
    [conversationId, isStreaming, isWaiting, onConversationCreated, queryClient]
  );

  const retry = useCallback(async () => {
    if (!lastMessageRef.current) return;
    setError(null);

    // Remover a mensagem do usuário anterior e placeholder do assistente
    if (conversationId) {
      queryClient.setQueryData(
        ["conversation", conversationId],
        (old: { conversation: unknown; messages: MessageWithAttachments[] } | undefined) => {
          if (!old) return old;
          // Remover as últimas mensagens temp (user + assistant vazio)
          const messages = old.messages.filter(
            (m) => !m.id.startsWith("temp-")
          );
          return { ...old, messages };
        }
      );
    }

    const { content, attachments, tom } = lastMessageRef.current;
    await sendMessage(content, attachments, tom);
  }, [conversationId, queryClient, sendMessage]);

  const cancelStream = useCallback(() => {
    cancelledRef.current = true;
    readerRef.current?.cancel();
  }, []);

  return {
    sendMessage,
    cancelStream,
    retry,
    clearError,
    isStreaming,
    isWaiting,
    streamingContent,
    error,
    optimisticMessages,
  };
}
