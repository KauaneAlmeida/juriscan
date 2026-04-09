"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Message {
  id: string;
  conversation_id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  credits_cost?: number | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string | null;
  status: "ACTIVE" | "ARCHIVED" | "DELETED";
  created_at: string;
  updated_at: string;
}

interface ConversationsData {
  conversations: Conversation[];
}

interface ConversationWithMessages {
  conversation: Conversation;
  messages: Message[];
}

export function useConversations() {
  const queryClient = useQueryClient();

  // Fetch all conversations
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<ConversationsData>({
    queryKey: ["conversations"],
    queryFn: async () => {
      const response = await fetch("/api/conversations");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Erro ao buscar conversas");
      }
      const result = await response.json();
      return result.data;
    },
  });

  // Create new conversation
  const createMutation = useMutation({
    mutationFn: async (title?: string) => {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Erro ao criar conversa");
      }

      const result = await response.json();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  // Update conversation
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      title,
      status,
    }: {
      id: string;
      title?: string;
      status?: string;
    }) => {
      const response = await fetch(`/api/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Erro ao atualizar conversa");
      }

      const result = await response.json();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  // Delete conversation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/conversations/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Erro ao deletar conversa");
      }

      const result = await response.json();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  // Delete all conversations
  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/conversations", {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Erro ao excluir conversas");
      }

      const result = await response.json();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  return {
    conversations: data?.conversations || [],
    isLoading,
    error,
    refetch,
    createConversation: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateConversation: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteConversation: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    deleteAllConversations: deleteAllMutation.mutate,
    isDeletingAll: deleteAllMutation.isPending,
  };
}

export function useConversation(conversationId: string | null) {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery<ConversationWithMessages>({
    queryKey: ["conversation", conversationId],
    queryFn: async () => {
      if (!conversationId) throw new Error("No conversation ID");
      const response = await fetch(`/api/conversations/${conversationId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Erro ao buscar conversa");
      }
      const result = await response.json();
      return result.data;
    },
    enabled: !!conversationId,
  });

  const addMessage = useCallback(
    (message: Message) => {
      queryClient.setQueryData<ConversationWithMessages>(
        ["conversation", conversationId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            messages: [...old.messages, message],
          };
        }
      );
    },
    [conversationId, queryClient]
  );

  const updateLastMessage = useCallback(
    (content: string) => {
      queryClient.setQueryData<ConversationWithMessages>(
        ["conversation", conversationId],
        (old) => {
          if (!old || old.messages.length === 0) return old;
          const messages = [...old.messages];
          const lastIndex = messages.length - 1;
          messages[lastIndex] = {
            ...messages[lastIndex],
            content: messages[lastIndex].content + content,
          };
          return { ...old, messages };
        }
      );
    },
    [conversationId, queryClient]
  );

  return {
    conversation: data?.conversation || null,
    messages: data?.messages || [],
    isLoading,
    error,
    refetch,
    addMessage,
    updateLastMessage,
  };
}
