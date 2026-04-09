"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
}

export function GlassModal({
  isOpen,
  onClose,
  title,
  icon,
  subtitle,
  children,
}: GlassModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && handleClose()}
      className={cn(
        "fixed inset-0 z-50",
        "flex items-center justify-center p-4",
        "bg-slate-900/60 backdrop-blur-sm",
        "animate-fade-in"
      )}
    >
      <div
        role="dialog"
        aria-labelledby="glass-modal-title"
        className={cn(
          "relative w-full max-w-2xl max-h-[85vh]",
          "flex flex-col",
          "rounded-2xl overflow-hidden",
          // Glassmorphism
          "bg-white/[0.07] backdrop-blur-xl",
          "border border-white/[0.12]",
          "shadow-[0_8px_32px_rgba(0,0,0,0.3)]",
          // Animation
          "animate-modal-up"
        )}
      >
        {/* Brilho superior sutil */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                "bg-blue-500/20 text-blue-400",
                "border border-blue-400/20"
              )}
            >
              {icon}
            </div>
            <div>
              <h2
                id="glass-modal-title"
                className="text-lg font-semibold text-white"
              >
                {title}
              </h2>
              {subtitle && (
                <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              "text-slate-400 hover:text-white",
              "hover:bg-white/10 transition-all duration-200"
            )}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Divider */}
        <div className="mx-6 h-px bg-white/10" />

        {/* Content com scroll */}
        <div
          className={cn(
            "flex-1 overflow-y-auto p-6",
            "text-slate-300 text-sm leading-relaxed",
            "glass-scrollbar"
          )}
        >
          {children}
        </div>

        {/* Footer */}
        <div className="p-6 pt-4">
          <div className="h-px bg-white/10 mb-4" />
          <button
            onClick={handleClose}
            className={cn(
              "w-full py-3 rounded-xl font-medium",
              "bg-blue-600/80 hover:bg-blue-600 text-white",
              "backdrop-blur-sm border border-blue-500/30",
              "transition-all duration-200",
              "hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
            )}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
