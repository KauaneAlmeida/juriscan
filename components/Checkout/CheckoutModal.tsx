"use client";

import { useEffect, useRef, useState } from "react";
import { X, CheckCircle, Loader2 } from "lucide-react";
import CheckoutForm from "./CheckoutForm";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "subscription" | "credits";
  planId?: string;
  creditPackageId?: string;
  title: string;
  onSuccess?: () => void | Promise<unknown>;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  mode,
  planId,
  creditPackageId,
  title,
  onSuccess,
}: CheckoutModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isProcessingSuccess, setIsProcessingSuccess] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setIsProcessingSuccess(false);
      setShowSuccess(false);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
      return () => window.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {showSuccess ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <CheckCircle className="w-12 h-12 text-green-500" />
              <p className="text-lg font-semibold text-gray-800">Pagamento confirmado!</p>
              <p className="text-sm text-gray-500">
                {mode === "credits"
                  ? "Seus créditos foram adicionados com sucesso."
                  : "Seu plano foi atualizado com sucesso."}
              </p>
            </div>
          ) : isProcessingSuccess ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-gray-500">Atualizando seu plano...</p>
            </div>
          ) : (
            <CheckoutForm
              mode={mode}
              planId={planId}
              creditPackageId={creditPackageId}
              onSuccess={async () => {
                setIsProcessingSuccess(true);
                try {
                  await onSuccess?.();
                } catch {
                  // refetch error is non-fatal
                }
                setIsProcessingSuccess(false);
                setShowSuccess(true);
                setTimeout(() => {
                  onClose();
                }, 1500);
              }}
              onError={() => {
                // Errors are shown inline in CheckoutForm
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
