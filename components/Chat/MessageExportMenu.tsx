"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Download,
  FileText,
  File,
  FileType,
  Hash,
  Loader2,
  Check,
  X,
} from "lucide-react";
import {
  sanitizeForFilename,
  type MessageExportInput,
} from "@/lib/export/message-export";
import { generateMessageTXT } from "@/lib/export/message-txt-generator";
import { generateMessageMD } from "@/lib/export/message-md-generator";

type ExportFormat = "pdf" | "docx" | "md" | "txt";
type ExportStatus = "idle" | "loading" | "success" | "error";

interface MessageExportMenuProps {
  message: MessageExportInput;
  /**
   * Texto curto usado para gerar o nome do arquivo
   * (geralmente o título da conversa). Se vazio, usamos "resposta".
   */
  filenameHint?: string | null;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const FORMATS: Array<{
  id: ExportFormat;
  label: string;
  description: string;
  icon: typeof FileText;
  color: string;
}> = [
  {
    id: "pdf",
    label: "PDF",
    description: "Documento estilizado para arquivar",
    icon: File,
    color: "text-red-500",
  },
  {
    id: "docx",
    label: "Word (.docx)",
    description: "Editar no Word ou Google Docs",
    icon: FileType,
    color: "text-blue-600",
  },
  {
    id: "md",
    label: "Markdown",
    description: "Notion, Obsidian, GitHub",
    icon: Hash,
    color: "text-purple-500",
  },
  {
    id: "txt",
    label: "Texto puro",
    description: "TXT simples para compartilhar",
    icon: FileText,
    color: "text-gray-500",
  },
];

export default function MessageExportMenu({
  message,
  filenameHint,
}: MessageExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<Record<ExportFormat, ExportStatus>>({
    pdf: "idle",
    docx: "idle",
    md: "idle",
    txt: "idle",
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      if (status[format] === "loading") return;

      setStatus((prev) => ({ ...prev, [format]: "loading" }));

      try {
        const baseName = sanitizeForFilename(filenameHint || "resposta");
        const filename = `juriscan_${baseName}.${format}`;

        let blob: Blob;
        if (format === "txt") {
          const text = generateMessageTXT(message);
          blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        } else if (format === "md") {
          const text = generateMessageMD(message);
          blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
        } else if (format === "pdf") {
          const { generateMessagePDF } = await import(
            "@/lib/export/message-pdf-generator"
          );
          blob = generateMessagePDF(message);
        } else {
          const { generateMessageDOCX } = await import(
            "@/lib/export/message-docx-generator"
          );
          blob = await generateMessageDOCX(message);
        }

        downloadBlob(blob, filename);

        setStatus((prev) => ({ ...prev, [format]: "success" }));
        setTimeout(() => {
          setStatus((prev) => ({ ...prev, [format]: "idle" }));
          setIsOpen(false);
        }, 1200);
      } catch (error) {
        console.error(`Message export ${format} error:`, error);
        setStatus((prev) => ({ ...prev, [format]: "error" }));
        setTimeout(() => {
          setStatus((prev) => ({ ...prev, [format]: "idle" }));
        }, 2500);
      }
    },
    [filenameHint, message, status]
  );

  const renderStatusIcon = (format: ExportFormat) => {
    switch (status[format]) {
      case "loading":
        return <Loader2 className="w-4 h-4 animate-spin text-gray-400" />;
      case "success":
        return <Check className="w-4 h-4 text-green-500" />;
      case "error":
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-xs text-gray-400 dark:text-white/45 hover:text-primary dark:hover:text-[#7aa6ff] transition-colors"
        aria-label="Exportar resposta"
        title="Exportar esta resposta"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Exportar</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 bottom-full mb-2 w-64 bg-white dark:bg-[#0f1923] rounded-lg shadow-lg border border-gray-200 dark:border-white/[0.08] py-1 z-50">
          {FORMATS.map((format) => (
            <button
              key={format.id}
              type="button"
              onClick={() => handleExport(format.id)}
              disabled={status[format.id] === "loading"}
              className="w-full px-4 py-2.5 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors disabled:opacity-50"
            >
              <format.icon className={`w-5 h-5 mt-0.5 ${format.color}`} />
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {format.label}
                </div>
                <div className="text-xs text-gray-500 dark:text-white/55">
                  {format.description}
                </div>
              </div>
              {renderStatusIcon(format.id)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
