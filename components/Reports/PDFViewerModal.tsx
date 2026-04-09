"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Download, Loader2, FileText } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerModalProps {
  blob: Blob;
  filename: string;
  onClose: () => void;
}

export default function PDFViewerModal({ blob, filename, onClose }: PDFViewerModalProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadDone, setDownloadDone] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [fileData, setFileData] = useState<{ data: ArrayBuffer } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Convert blob to ArrayBuffer for react-pdf and create download URL
  useEffect(() => {
    let cancelled = false;
    blob.arrayBuffer().then((buffer) => {
      if (!cancelled) setFileData({ data: buffer });
    });
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);
    return () => {
      cancelled = true;
      URL.revokeObjectURL(url);
    };
  }, [blob]);

  // Measure container width with ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Lock body scroll
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflow = "";
      window.scrollTo(0, scrollY);
    };
  }, []);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  }, []);

  const handleDownload = () => {
    if (!blobUrl) return;
    setIsDownloading(true);

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsDownloading(false);
    setDownloadDone(true);
    setTimeout(() => setDownloadDone(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-gray-900 flex flex-col">
      {/* Header */}
      <header
        className="flex items-center justify-between px-4 py-3 bg-gray-800 flex-shrink-0"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)" }}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <span className="text-sm font-medium text-white truncate">
            {filename}
          </span>
        </div>
        {numPages > 0 && (
          <span className="text-xs text-gray-400 flex-shrink-0 mx-2">
            {numPages} {numPages === 1 ? "pag." : "pags."}
          </span>
        )}
        <button
          onClick={onClose}
          className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white active:text-white rounded-lg hover:bg-gray-700 transition-colors"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* PDF Content */}
      <div ref={scrollRef} className="flex-1 overflow-auto bg-gray-200">
        <div ref={containerRef} className="w-full">
          {fileData && containerWidth > 0 ? (
            <Document
              file={fileData}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              }
              error={
                <div className="flex flex-col items-center justify-center py-20 text-gray-500 text-sm">
                  <FileText className="w-10 h-10 mb-2 text-gray-400" />
                  <span>Erro ao carregar PDF</span>
                </div>
              }
            >
              {Array.from(new Array(numPages), (_, index) => (
                <div key={`page_${index + 1}`} className="mb-2 last:mb-0">
                  <Page
                    pageNumber={index + 1}
                    width={containerWidth}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                </div>
              ))}
            </Document>
          ) : (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
        </div>
      </div>

      {/* Action Bar */}
      <div
        className="flex items-center gap-3 px-4 py-3 bg-white border-t border-gray-200 flex-shrink-0"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
      >
        <button
          onClick={onClose}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 min-h-[48px] rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 font-medium transition-colors"
        >
          <X className="w-5 h-5" />
          <span>Fechar</span>
        </button>
        <button
          onClick={handleDownload}
          disabled={isDownloading || !blobUrl}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 min-h-[48px] rounded-xl bg-primary text-white hover:bg-primary-hover active:bg-primary-hover disabled:opacity-50 font-medium transition-colors"
        >
          {isDownloading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Baixando...</span>
            </>
          ) : downloadDone ? (
            <span>Baixado!</span>
          ) : (
            <>
              <Download className="w-5 h-5" />
              <span>Baixar PDF</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
