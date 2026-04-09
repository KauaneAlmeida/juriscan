"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Download,
  FileText,
  File,
  ChevronDown,
  Loader2,
  Check,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";

const PDFViewerModal = dynamic(() => import("./PDFViewerModal"), { ssr: false });
import type {
  Report,
  PredictiveAnalysisResult,
  JurimetricsResult,
  JudgeProfileResult,
} from "@/types/reports";
import { generateTXT } from "@/lib/export/txt-generator";

type ExportFormat = "txt" | "pdf";
type ExportStatus = "idle" | "loading" | "success" | "error";

type ReportResult =
  | PredictiveAnalysisResult
  | JurimetricsResult
  | JudgeProfileResult;

interface ExportDropdownProps {
  report: Report;
  result: ReportResult;
}

function sanitizeFilename(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 60);
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

export default function ExportDropdown({ report, result }: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<Record<ExportFormat, ExportStatus>>({
    txt: "idle",
    pdf: "idle",
  });
  const [pdfViewer, setPdfViewer] = useState<{ blob: Blob; filename: string } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      if (status[format] === "loading") return;

      setStatus((prev) => ({ ...prev, [format]: "loading" }));

      try {
        const filename = `${sanitizeFilename(report.title)}.${format}`;

        if (format === "txt") {
          const text = generateTXT(report, result);
          const blob = new Blob([text], {
            type: "text/plain;charset=utf-8",
          });
          downloadBlob(blob, filename);
        } else {
          // Dynamic import to avoid loading jspdf until needed
          const { generatePDF } = await import("@/lib/export/pdf-generator");
          const blob = generatePDF(report, result);
          setPdfViewer({ blob, filename });
          setIsOpen(false);
        }

        setStatus((prev) => ({ ...prev, [format]: "success" }));
        setTimeout(() => {
          setStatus((prev) => ({ ...prev, [format]: "idle" }));
          setIsOpen(false);
        }, 1500);
      } catch (error) {
        console.error(`Export ${format} error:`, error);
        setStatus((prev) => ({ ...prev, [format]: "error" }));
        setTimeout(() => {
          setStatus((prev) => ({ ...prev, [format]: "idle" }));
        }, 3000);
      }
    },
    [report, result, status]
  );

  const getStatusIcon = (format: ExportFormat) => {
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

  const formats = [
    {
      id: "pdf" as ExportFormat,
      label: "Exportar PDF",
      description: "Relatorio completo com graficos",
      icon: File,
      color: "text-red-500",
    },
    {
      id: "txt" as ExportFormat,
      label: "Exportar TXT",
      description: "Texto simples para compartilhar",
      icon: FileText,
      color: "text-blue-500",
    },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
      >
        <Download className="w-4 h-4" />
        <span>Exportar</span>
        <ChevronDown
          className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-60 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          {formats.map((format) => (
            <button
              key={format.id}
              onClick={() => handleExport(format.id)}
              disabled={status[format.id] === "loading"}
              className="w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <format.icon className={`w-5 h-5 mt-0.5 ${format.color}`} />
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-gray-900">
                  {format.label}
                </div>
                <div className="text-xs text-gray-500">
                  {format.description}
                </div>
              </div>
              {getStatusIcon(format.id)}
            </button>
          ))}
        </div>
      )}
      {pdfViewer && (
        <PDFViewerModal
          blob={pdfViewer.blob}
          filename={pdfViewer.filename}
          onClose={() => setPdfViewer(null)}
        />
      )}
    </div>
  );
}
