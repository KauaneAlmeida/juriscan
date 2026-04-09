// ===========================================
// Tipos para Chat com suporte a mídia
// ===========================================

export type AttachmentType = "file" | "image" | "audio";

export interface AttachmentMetadata {
  // Para arquivos (PDF, DOC)
  pages?: number;
  extracted_text?: string;

  // Para imagens
  width?: number;
  height?: number;

  // Para áudio
  duration?: number;
  transcription?: string;
}

export interface ChatAttachment {
  id: string;
  type: AttachmentType;
  name: string;
  url: string;
  size: number;
  mime_type: string;
  metadata: AttachmentMetadata;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  attachments: ChatAttachment[];
  credits_cost?: number | null;
  created_at: string;
}

export interface SendMessageInput {
  content: string;
  attachments?: PendingAttachment[];
}

// Attachment antes do upload (arquivo local)
export interface PendingAttachment {
  id: string;
  file: File;
  type: AttachmentType;
  preview?: string; // Data URL para imagens
  duration?: number; // Para áudio
  transcription?: string; // Para áudio após transcrição
}

// Estado do upload
export interface UploadProgress {
  id: string;
  progress: number; // 0-100
  status: "pending" | "uploading" | "completed" | "error";
  error?: string;
}

// ===========================================
// Audio Recorder Types
// ===========================================

export interface AudioRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  error: string | null;
}

export type AudioRecorderAction =
  | { type: "START_RECORDING" }
  | { type: "STOP_RECORDING"; payload: { blob: Blob; url: string } }
  | { type: "PAUSE_RECORDING" }
  | { type: "RESUME_RECORDING" }
  | { type: "RESET" }
  | { type: "UPDATE_DURATION"; payload: number }
  | { type: "SET_ERROR"; payload: string };

// ===========================================
// API Types
// ===========================================

export interface UploadAttachmentResponse {
  success: boolean;
  attachment?: ChatAttachment;
  error?: string;
}

export interface TranscribeAudioResponse {
  success: boolean;
  transcription?: string;
  duration?: number;
  error?: string;
}

// ===========================================
// Limites e validação
// ===========================================

export const CHAT_ATTACHMENT_LIMITS = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxImageSize: 5 * 1024 * 1024, // 5MB
  maxAudioDuration: 120, // 2 minutos
  maxAttachmentsPerMessage: 5,

  allowedFileTypes: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ],

  allowedImageTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],

  allowedAudioTypes: [
    "audio/webm",
    "audio/mp3",
    "audio/mpeg",
    "audio/ogg",
    "audio/wav",
  ],
} as const;

// Helper para determinar o tipo de attachment
export function getAttachmentType(mimeType: string): AttachmentType | null {
  if (CHAT_ATTACHMENT_LIMITS.allowedFileTypes.includes(mimeType as never)) {
    return "file";
  }
  if (CHAT_ATTACHMENT_LIMITS.allowedImageTypes.includes(mimeType as never)) {
    return "image";
  }
  if (CHAT_ATTACHMENT_LIMITS.allowedAudioTypes.includes(mimeType as never)) {
    return "audio";
  }
  return null;
}

// Validar attachment
export function validateAttachment(file: File): {
  valid: boolean;
  error?: string;
  type?: AttachmentType;
} {
  const type = getAttachmentType(file.type);

  if (!type) {
    return {
      valid: false,
      error: `Tipo de arquivo não suportado: ${file.type}`,
    };
  }

  const maxSize =
    type === "image"
      ? CHAT_ATTACHMENT_LIMITS.maxImageSize
      : CHAT_ATTACHMENT_LIMITS.maxFileSize;

  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / 1024 / 1024);
    return {
      valid: false,
      error: `Arquivo muito grande. Máximo: ${maxSizeMB}MB`,
    };
  }

  return { valid: true, type };
}

// Formatar tamanho de arquivo
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Formatar duração de áudio
export function formatAudioDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
