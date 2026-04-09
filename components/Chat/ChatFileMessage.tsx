"use client";

import { FileText, Download, ExternalLink, CheckCircle2 } from "lucide-react";
import type { ChatAttachment } from "@/types/chat";
import { formatFileSize } from "@/types/chat";

interface ChatFileMessageProps {
  attachment: ChatAttachment;
}

export default function ChatFileMessage({ attachment }: ChatFileMessageProps) {
  const isPdf = attachment.mime_type === "application/pdf";
  const hasExtractedText = !!attachment.metadata.extracted_text;

  return (
    <div className="flex items-center gap-3 p-3 bg-white dark:bg-white/[0.04] rounded-lg border border-gray-200 dark:border-white/[0.08] hover:border-gray-300 dark:hover:border-white/[0.15] transition-colors max-w-xs">
      {/* Ícone */}
      <div className="w-10 h-10 bg-amber-100 dark:bg-amber-500/15 rounded-lg flex items-center justify-center flex-shrink-0">
        <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 dark:text-white truncate" title={attachment.name}>
          {attachment.name}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-white/55">
            {formatFileSize(attachment.size)}
          </span>
          {attachment.metadata.pages && (
            <span className="text-xs text-gray-500 dark:text-white/55">
              • {attachment.metadata.pages} páginas
            </span>
          )}
        </div>

        {/* Indicador de análise */}
        {hasExtractedText && (
          <div className="flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3 h-3 text-green-500 dark:text-emerald-400" />
            <span className="text-xs text-green-600 dark:text-emerald-300">Analisado pela IA</span>
          </div>
        )}
      </div>

      {/* Ações */}
      <div className="flex items-center gap-1">
        {/* Preview (PDF) */}
        {isPdf && (
          <a
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-gray-400 dark:text-white/45 hover:text-blue-600 dark:hover:text-[#7aa6ff] hover:bg-blue-50 dark:hover:bg-[#1a4fd6]/15 rounded-lg transition-colors"
            title="Abrir PDF"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}

        {/* Download */}
        <a
          href={attachment.url}
          download={attachment.name}
          className="p-2 text-gray-400 dark:text-white/45 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors"
          title="Baixar arquivo"
        >
          <Download className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
