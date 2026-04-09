"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

interface TourStep {
  step: number;
  target: string;
  title: string;
  description: string;
}

interface TourPopoverProps {
  currentStep: number;
  totalSteps: number;
  steps: TourStep[];
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onClose: () => void;
  position?: {
    top?: number;
    left?: number | string;
    right?: number;
    bottom?: number;
    transform?: string;
  };
  useBlueButton?: boolean;
  isLastStep?: boolean;
  arrowPosition?: "left" | "bottom";
}

export default function TourPopover({
  currentStep,
  totalSteps,
  steps,
  onNext,
  onPrev,
  onSkip,
  onClose,
  position,
  useBlueButton = false,
  isLastStep = false,
  arrowPosition = "left",
}: TourPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const currentStepData = steps.find((s) => s.step === currentStep);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight") {
        onNext();
      } else if (e.key === "ArrowLeft") {
        onPrev();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onNext, onPrev]);

  if (!currentStepData) return null;

  return (
    <div
      ref={popoverRef}
      className="fixed z-50 w-[340px] bg-white rounded-xl"
      style={{
        top: position?.top,
        left: position?.left,
        right: position?.right,
        bottom: position?.bottom,
        transform: position?.transform,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      }}
      role="dialog"
      aria-labelledby="tour-title"
      aria-describedby="tour-description"
    >
      {/* Arrow */}
      {arrowPosition === "left" ? (
        <div
          className="absolute -left-2 top-6 w-4 h-4 bg-white rotate-45"
          style={{ boxShadow: "-2px 2px 4px rgba(0,0,0,0.05)" }}
        />
      ) : (
        <div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45"
          style={{ boxShadow: "2px 2px 4px rgba(0,0,0,0.05)" }}
        />
      )}

      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Fechar tour"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Body */}
      <div className="p-6 pb-2">
        <h3
          id="tour-title"
          className="text-lg font-semibold text-gray-800 mb-3"
        >
          {currentStepData.title}
        </h3>
        <p
          id="tour-description"
          className="text-sm text-gray-500 leading-relaxed"
        >
          {currentStepData.description}
        </p>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 flex items-center gap-4">
        {!isLastStep && (
          <button
            onClick={onSkip}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Pular tour
          </button>
        )}
        {currentStep > 1 && (
          <button
            onClick={onPrev}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Voltar
          </button>
        )}
        <button
          onClick={onNext}
          className={`ml-auto px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors ${
            useBlueButton || isLastStep
              ? "bg-[#3B82F6] hover:bg-[#2563EB]"
              : "bg-gray-800 hover:bg-gray-900"
          }`}
        >
          {isLastStep
            ? "Começar agora"
            : `Next (Step ${currentStep} of ${totalSteps})`}
        </button>
      </div>
    </div>
  );
}
