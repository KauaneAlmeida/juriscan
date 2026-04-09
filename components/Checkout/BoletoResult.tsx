"use client";

import { useState } from "react";
import { Copy, Check, FileText, Calendar } from "lucide-react";

interface BoletoResultProps {
  barcode: string;
  line: string;
  pdfUrl: string;
  dueAt: string;
}

export default function BoletoResult({
  barcode,
  line,
  pdfUrl,
  dueAt,
}: BoletoResultProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(line);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDueDate = new Date(dueAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Calendar className="w-4 h-4" />
        <span>Vencimento: {formattedDueDate}</span>
      </div>

      {barcode && (
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-xs text-gray-500 mb-2">Código de barras</p>
          <p className="font-mono text-sm text-gray-700 break-all">{barcode}</p>
        </div>
      )}

      <div>
        <p className="text-sm text-gray-500 mb-2">Linha digitável:</p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={line}
            className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 font-mono truncate"
          />
          <button
            onClick={handleCopy}
            className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-1.5 text-sm shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copiar
              </>
            )}
          </button>
        </div>
      </div>

      {pdfUrl && (
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <FileText className="w-4 h-4" />
          Baixar boleto em PDF
        </a>
      )}

      <p className="text-xs text-gray-400 text-center">
        O pagamento pode levar até 3 dias úteis para ser confirmado
      </p>
    </div>
  );
}
