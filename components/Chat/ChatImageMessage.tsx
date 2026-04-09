"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Download, ZoomIn, Loader2 } from "lucide-react";
import type { ChatAttachment } from "@/types/chat";

interface ChatImageMessageProps {
  attachment: ChatAttachment;
}

export default function ChatImageMessage({ attachment }: ChatImageMessageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <>
      {/* Thumbnail */}
      <div className="relative group max-w-xs rounded-lg overflow-hidden border border-gray-200 dark:border-white/[0.08]">
        {/* Loading skeleton */}
        {isLoading && (
          <div className="absolute inset-0 bg-gray-100 dark:bg-white/[0.04] flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-gray-400 dark:text-white/45 animate-spin" />
          </div>
        )}

        {/* Error state */}
        {hasError ? (
          <div className="w-full h-32 bg-gray-100 dark:bg-white/[0.04] flex items-center justify-center">
            <span className="text-sm text-gray-500 dark:text-white/55">Erro ao carregar imagem</span>
          </div>
        ) : (
          <Image
            src={attachment.url}
            alt={attachment.name}
            width={320}
            height={256}
            className={`max-w-full max-h-64 object-contain cursor-pointer transition-opacity ${
              isLoading ? "opacity-0" : "opacity-100"
            }`}
            onClick={() => setIsModalOpen(true)}
            onLoad={handleLoad}
            onError={handleError}
            unoptimized
          />
        )}

        {/* Overlay com ações */}
        {!isLoading && !hasError && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <button
              onClick={() => setIsModalOpen(true)}
              className="p-2 bg-white/90 hover:bg-white rounded-full mr-2"
              title="Ampliar"
            >
              <ZoomIn className="w-4 h-4 text-gray-700" />
            </button>
            <a
              href={attachment.url}
              download={attachment.name}
              className="p-2 bg-white/90 hover:bg-white rounded-full"
              title="Baixar"
            >
              <Download className="w-4 h-4 text-gray-700" />
            </a>
          </div>
        )}

        {/* Dimensões */}
        {attachment.metadata.width && attachment.metadata.height && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/50 text-white text-xs rounded">
            {attachment.metadata.width} × {attachment.metadata.height}
          </div>
        )}
      </div>

      {/* Modal de visualização ampliada */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          {/* Botão fechar */}
          <button
            onClick={() => setIsModalOpen(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Botão download */}
          <a
            href={attachment.url}
            download={attachment.name}
            onClick={(e) => e.stopPropagation()}
            className="absolute top-4 right-16 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white"
          >
            <Download className="w-6 h-6" />
          </a>

          {/* Imagem ampliada */}
          <Image
            src={attachment.url}
            alt={attachment.name}
            fill
            className="object-contain"
            onClick={(e) => e.stopPropagation()}
            unoptimized
          />

          {/* Nome do arquivo */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 text-white text-sm rounded-lg">
            {attachment.name}
          </div>
        </div>
      )}
    </>
  );
}
