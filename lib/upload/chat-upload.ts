// ===========================================
// Utilitários de upload para chat attachments
// ===========================================

import { getSupabaseClient } from "@/lib/supabase/client";
import type { ChatAttachment, PendingAttachment } from "@/types/chat";

const BUCKET_NAME = "chat-attachments";

/**
 * Gera um nome único para o arquivo
 */
function generateFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split(".").pop() || "";
  const baseName = originalName.replace(/\.[^/.]+$/, "").substring(0, 50);
  const safeName = baseName.replace(/[^a-zA-Z0-9-_]/g, "_");
  return `${safeName}_${timestamp}_${random}.${extension}`;
}

/**
 * Faz upload de um arquivo para o Supabase Storage
 */
export async function uploadChatAttachment(
  userId: string,
  file: File
): Promise<{ data: { path: string; url: string } | null; error: string | null }> {
  const supabase = getSupabaseClient();

  const fileName = generateFileName(file.name);
  const filePath = `${userId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Upload error:", error);
    return { data: null, error: error.message };
  }

  // Gerar URL pública (ou signed URL se o bucket for privado)
  const { data: urlData } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(data.path, 60 * 60 * 24 * 7); // 7 dias

  if (!urlData?.signedUrl) {
    return { data: null, error: "Erro ao gerar URL do arquivo" };
  }

  return {
    data: {
      path: data.path,
      url: urlData.signedUrl,
    },
    error: null,
  };
}

/**
 * Deleta um arquivo do Supabase Storage
 */
export async function deleteChatAttachment(
  filePath: string
): Promise<{ error: string | null }> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (error) {
    console.error("Delete error:", error);
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Converte um arquivo para base64 (para preview de imagens)
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Redimensiona uma imagem antes do upload (para economizar banda)
 */
export async function resizeImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // Calcular novas dimensões mantendo aspect ratio
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      // Criar canvas e redimensionar
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Erro ao criar canvas"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Converter para blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Erro ao converter imagem"));
            return;
          }
          resolve(new File([blob], file.name, { type: "image/jpeg" }));
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => reject(new Error("Erro ao carregar imagem"));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Obtém dimensões de uma imagem
 */
export function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => reject(new Error("Erro ao carregar imagem"));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Obtém duração de um arquivo de áudio
 */
export function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.onloadedmetadata = () => {
      resolve(audio.duration);
      URL.revokeObjectURL(audio.src);
    };
    audio.onerror = () => reject(new Error("Erro ao carregar áudio"));
    audio.src = URL.createObjectURL(file);
  });
}

/**
 * Converte PendingAttachment para ChatAttachment após upload
 */
export function pendingToUploaded(
  pending: PendingAttachment,
  uploadResult: { path: string; url: string }
): ChatAttachment {
  return {
    id: pending.id,
    type: pending.type,
    name: pending.file.name,
    url: uploadResult.url,
    size: pending.file.size,
    mime_type: pending.file.type,
    metadata: {
      ...(pending.type === "image" && pending.preview
        ? { width: 0, height: 0 } // Será preenchido pelo backend
        : {}),
      ...(pending.type === "audio"
        ? {
            duration: pending.duration,
            transcription: pending.transcription,
          }
        : {}),
    },
  };
}
