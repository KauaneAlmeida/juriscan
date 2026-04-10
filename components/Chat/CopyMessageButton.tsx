"use client";

import { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";

interface CopyMessageButtonProps {
  /** Texto a ser copiado para a area de transferencia. */
  content: string;
}

/**
 * Botao discreto "Copiar" exibido no rodape do balao do assistente,
 * ao lado do menu de exportacao. Copia o conteudo da resposta da IA
 * para a area de transferencia e mostra um feedback visual breve.
 */
export default function CopyMessageButton({ content }: CopyMessageButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Falha ao copiar mensagem:", err);
      // Fallback para browsers antigos / contextos sem Clipboard API
      try {
        const textarea = document.createElement("textarea");
        textarea.value = content;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        // desiste silenciosamente
      }
    }
  }, [content]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-xs text-gray-400 dark:text-white/45 hover:text-primary dark:hover:text-[#7aa6ff] transition-colors"
      aria-label={copied ? "Copiado" : "Copiar resposta"}
      title={copied ? "Copiado!" : "Copiar resposta"}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-green-500" />
          <span className="text-green-500">Copiado</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          <span>Copiar</span>
        </>
      )}
    </button>
  );
}
