"use client";

import Image from "next/image";
import { X, FileText, Image as ImageIcon, Mic, Loader2 } from "lucide-react";
import type { PendingAttachment, UploadProgress } from "@/types/chat";
import { formatFileSize, formatAudioDuration } from "@/types/chat";

interface ChatAttachmentPreviewProps {
  attachments: PendingAttachment[];
  uploadProgress: Map<string, UploadProgress>;
  isUploading: boolean;
  onRemove: (id: string) => void;
  onTranscribe?: (id: string) => void;
}

export default function ChatAttachmentPreview({
  attachments,
  uploadProgress,
  isUploading,
  onRemove,
  onTranscribe,
}: ChatAttachmentPreviewProps) {
  if (attachments.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-white/[0.04] rounded-t-xl border border-b-0 border-gray-200 dark:border-white/[0.08]">
      {attachments.map((attachment) => {
        const progress = uploadProgress.get(attachment.id);
        const isUploadingThis = progress?.status === "uploading";
        const hasError = progress?.status === "error";

        return (
          <div
            key={attachment.id}
            className={`relative flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
              hasError
                ? "bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/30"
                : "bg-white border-gray-200 hover:border-gray-300 dark:bg-white/[0.04] dark:border-white/[0.08] dark:hover:border-white/[0.15]"
            }`}
          >
            {/* Ícone por tipo */}
            {attachment.type === "image" && attachment.preview ? (
              <Image
                src={attachment.preview}
                alt={attachment.file.name}
                width={40}
                height={40}
                className="w-10 h-10 object-cover rounded"
                unoptimized
              />
            ) : attachment.type === "image" ? (
              <div className="w-10 h-10 bg-blue-100 dark:bg-[#1a4fd6]/20 rounded flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-blue-600 dark:text-[#7aa6ff]" />
              </div>
            ) : attachment.type === "audio" ? (
              <div className="w-10 h-10 bg-purple-100 dark:bg-[#7c3aed]/20 rounded flex items-center justify-center">
                <Mic className="w-5 h-5 text-purple-600 dark:text-[#b794f4]" />
              </div>
            ) : (
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-500/15 rounded flex items-center justify-center">
                <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0 max-w-[150px]">
              <p className="text-sm font-medium text-gray-700 dark:text-white/90 truncate">
                {attachment.type === "audio"
                  ? `Áudio (${formatAudioDuration(attachment.duration || 0)})`
                  : attachment.file.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-white/50">
                {hasError
                  ? progress?.error || "Erro"
                  : formatFileSize(attachment.file.size)}
              </p>

              {/* Transcrição para áudio */}
              {attachment.type === "audio" && attachment.transcription && (
                <p className="text-xs text-gray-600 dark:text-white/60 truncate mt-0.5">
                  &quot;{attachment.transcription.substring(0, 30)}...&quot;
                </p>
              )}
            </div>

            {/* Botão de transcrever (para áudio sem transcrição) */}
            {attachment.type === "audio" &&
              !attachment.transcription &&
              onTranscribe &&
              !isUploading && (
                <button
                  onClick={() => onTranscribe(attachment.id)}
                  className="text-xs text-purple-600 dark:text-[#b794f4] hover:text-purple-700 dark:hover:text-[#cdb4ff] underline"
                >
                  Transcrever
                </button>
              )}

            {/* Loading indicator */}
            {isUploadingThis && (
              <Loader2 className="w-4 h-4 text-primary dark:text-[#7aa6ff] animate-spin" />
            )}

            {/* Progress bar */}
            {isUploadingThis && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-white/10 rounded-b-lg overflow-hidden">
                <div
                  className="h-full bg-primary dark:bg-[#1a4fd6] transition-all"
                  style={{ width: `${progress?.progress || 0}%` }}
                />
              </div>
            )}

            {/* Botão de remover */}
            {!isUploading && (
              <button
                onClick={() => onRemove(attachment.id)}
                className="p-1 text-gray-400 dark:text-white/40 hover:text-red-500 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-white/[0.06]"
                aria-label="Remover anexo"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
