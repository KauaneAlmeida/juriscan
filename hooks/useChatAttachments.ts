"use client";

import { useState, useCallback } from "react";
import {
  type PendingAttachment,
  type ChatAttachment,
  type UploadProgress,
  validateAttachment,
  CHAT_ATTACHMENT_LIMITS,
} from "@/types/chat";
import { CHAT_COSTS } from "@/lib/credits/costs";
import { fileToBase64 } from "@/lib/upload/chat-upload";

interface UseChatAttachmentsReturn {
  // Estado
  attachments: PendingAttachment[];
  uploadProgress: Map<string, UploadProgress>;
  isUploading: boolean;
  error: string | null;

  // Ações
  addAttachment: (file: File) => Promise<void>;
  addAudioAttachment: (blob: Blob, duration: number) => void;
  removeAttachment: (id: string) => void;
  clearAttachments: () => void;
  uploadAttachments: () => Promise<ChatAttachment[]>;
  transcribeAudio: (id: string) => Promise<string | null>;
  updateTranscription: (id: string, transcription: string) => void;

  // Custo total em créditos
  totalCost: number;
}

export function useChatAttachments(): UseChatAttachmentsReturn {
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Map<string, UploadProgress>>(
    new Map()
  );
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calcular custo total em créditos
  const totalCost = attachments.reduce((sum: number, att) => {
    switch (att.type) {
      case "image":
        return sum + CHAT_COSTS.with_image - CHAT_COSTS.text_message;
      case "file":
        return sum + CHAT_COSTS.with_document - CHAT_COSTS.text_message;
      case "audio":
        return sum + CHAT_COSTS.with_audio - CHAT_COSTS.text_message;
      default:
        return sum;
    }
  }, CHAT_COSTS.text_message as number);

  // Adicionar arquivo
  const addAttachment = useCallback(async (file: File) => {
    setError(null);

    // Verificar limite de anexos
    if (attachments.length >= CHAT_ATTACHMENT_LIMITS.maxAttachmentsPerMessage) {
      setError(`Máximo de ${CHAT_ATTACHMENT_LIMITS.maxAttachmentsPerMessage} anexos por mensagem`);
      return;
    }

    // Validar arquivo
    const validation = validateAttachment(file);
    if (!validation.valid) {
      setError(validation.error || "Arquivo inválido");
      return;
    }

    const id = `pending_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Gerar preview para imagens
    let preview: string | undefined;
    if (validation.type === "image") {
      try {
        preview = await fileToBase64(file);
      } catch (e) {
        console.error("Error generating preview:", e);
      }
    }

    const newAttachment: PendingAttachment = {
      id,
      file,
      type: validation.type!,
      preview,
    };

    setAttachments((prev) => [...prev, newAttachment]);
  }, [attachments.length]);

  // Adicionar áudio gravado
  const addAudioAttachment = useCallback((blob: Blob, duration: number) => {
    setError(null);

    // Verificar limite de anexos
    if (attachments.length >= CHAT_ATTACHMENT_LIMITS.maxAttachmentsPerMessage) {
      setError(`Máximo de ${CHAT_ATTACHMENT_LIMITS.maxAttachmentsPerMessage} anexos por mensagem`);
      return;
    }

    const id = `pending_audio_${Date.now()}`;
    const file = new File([blob], `audio_${Date.now()}.webm`, { type: "audio/webm" });

    const newAttachment: PendingAttachment = {
      id,
      file,
      type: "audio",
      duration,
    };

    setAttachments((prev) => [...prev, newAttachment]);
  }, [attachments.length]);

  // Remover anexo
  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== id));
    setUploadProgress((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  // Limpar todos os anexos
  const clearAttachments = useCallback(() => {
    setAttachments([]);
    setUploadProgress(new Map());
    setError(null);
  }, []);

  // Transcrever áudio
  const transcribeAudio = useCallback(async (id: string): Promise<string | null> => {
    const attachment = attachments.find((att) => att.id === id);
    if (!attachment || attachment.type !== "audio") {
      return null;
    }

    try {
      const formData = new FormData();
      formData.append("audio", attachment.file);

      const response = await fetch("/api/chat/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || "Erro ao transcrever áudio");
        return null;
      }

      // Atualizar attachment com transcrição
      setAttachments((prev) =>
        prev.map((att) =>
          att.id === id ? { ...att, transcription: data.transcription } : att
        )
      );

      return data.transcription;
    } catch (error) {
      console.error("Transcription error:", error);
      setError("Erro ao transcrever áudio");
      return null;
    }
  }, [attachments]);

  // Atualizar transcrição manualmente
  const updateTranscription = useCallback((id: string, transcription: string) => {
    setAttachments((prev) =>
      prev.map((att) =>
        att.id === id ? { ...att, transcription } : att
      )
    );
  }, []);

  // Fazer upload de todos os anexos
  const uploadAttachments = useCallback(async (): Promise<ChatAttachment[]> => {
    if (attachments.length === 0) return [];

    setIsUploading(true);
    setError(null);

    const uploaded: ChatAttachment[] = [];

    // Inicializar progresso
    const initialProgress = new Map<string, UploadProgress>();
    attachments.forEach((att) => {
      initialProgress.set(att.id, {
        id: att.id,
        progress: 0,
        status: "pending",
      });
    });
    setUploadProgress(initialProgress);

    for (const attachment of attachments) {
      try {
        // Atualizar status para uploading
        setUploadProgress((prev) => {
          const next = new Map(prev);
          next.set(attachment.id, {
            id: attachment.id,
            progress: 0,
            status: "uploading",
          });
          return next;
        });

        const formData = new FormData();
        formData.append("file", attachment.file);

        const response = await fetch("/api/upload/chat-attachment", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Erro no upload");
        }

        // Adicionar metadados extras
        const chatAttachment: ChatAttachment = {
          ...data.attachment,
          metadata: {
            ...data.attachment.metadata,
            ...(attachment.duration && { duration: attachment.duration }),
            ...(attachment.transcription && { transcription: attachment.transcription }),
          },
        };

        uploaded.push(chatAttachment);

        // Atualizar status para completed
        setUploadProgress((prev) => {
          const next = new Map(prev);
          next.set(attachment.id, {
            id: attachment.id,
            progress: 100,
            status: "completed",
          });
          return next;
        });
      } catch (error) {
        console.error("Upload error:", error);

        // Atualizar status para error
        setUploadProgress((prev) => {
          const next = new Map(prev);
          next.set(attachment.id, {
            id: attachment.id,
            progress: 0,
            status: "error",
            error: error instanceof Error ? error.message : "Erro no upload",
          });
          return next;
        });
      }
    }

    setIsUploading(false);
    return uploaded;
  }, [attachments]);

  return {
    attachments,
    uploadProgress,
    isUploading,
    error,
    addAttachment,
    addAudioAttachment,
    removeAttachment,
    clearAttachments,
    uploadAttachments,
    transcribeAudio,
    updateTranscription,
    totalCost,
  };
}
