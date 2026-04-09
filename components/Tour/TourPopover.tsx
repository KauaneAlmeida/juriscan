"use client";

import { useEffect, useState, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useTour } from "@/hooks/useTour";
import { findVisibleElement } from "./tourUtils";

type EffectivePlacement = "top" | "bottom" | "left" | "right";

interface PopoverPosition {
  top: number | "auto";
  left: number | "auto";
  bottom: number | "auto";
  right: number | "auto";
}

interface PositionState {
  position: PopoverPosition;
  placement: EffectivePlacement;
  isCentered: boolean;
  isMobileBottom: boolean;
}

const INITIAL_STATE: PositionState = {
  position: { top: 0, left: 0, bottom: "auto", right: "auto" },
  placement: "bottom",
  isCentered: false,
  isMobileBottom: false,
};

// Arrow component that points toward the target element
function Arrow({ placement, hidden }: { placement: EffectivePlacement; hidden?: boolean }) {
  if (hidden) return null;
  const baseClass = "absolute w-3 h-3 bg-white transform rotate-45";

  switch (placement) {
    case "right":
      return (
        <div
          className={`${baseClass} -left-1.5 top-1/2 -translate-y-1/2`}
          style={{ boxShadow: "-2px 2px 4px rgba(0, 0, 0, 0.1)" }}
        />
      );
    case "left":
      return (
        <div
          className={`${baseClass} -right-1.5 top-1/2 -translate-y-1/2`}
          style={{ boxShadow: "2px -2px 4px rgba(0, 0, 0, 0.1)" }}
        />
      );
    case "top":
      return (
        <div
          className={`${baseClass} -bottom-1.5 left-1/2 -translate-x-1/2`}
          style={{ boxShadow: "2px 2px 4px rgba(0, 0, 0, 0.1)" }}
        />
      );
    case "bottom":
      return (
        <div
          className={`${baseClass} -top-1.5 left-1/2 -translate-x-1/2`}
          style={{ boxShadow: "-2px -2px 4px rgba(0, 0, 0, 0.1)" }}
        />
      );
    default:
      return null;
  }
}

/**
 * Pick the best placement based on available viewport space.
 * Prefers the step's declared placement when it fits.
 */
function choosePlacement(
  rect: DOMRect,
  preferred: EffectivePlacement,
  popoverWidth: number,
  popoverHeight: number,
  offset: number,
  padding: number,
): EffectivePlacement {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const spaceTop = rect.top - padding;
  const spaceBottom = vh - rect.bottom - padding;
  const spaceLeft = rect.left - padding;
  const spaceRight = vw - rect.right - padding;

  const needed = popoverHeight + offset;
  const neededH = popoverWidth + offset;

  // Check if preferred placement fits
  switch (preferred) {
    case "top":
      if (spaceTop >= needed) return "top";
      break;
    case "bottom":
      if (spaceBottom >= needed) return "bottom";
      break;
    case "left":
      if (spaceLeft >= neededH) return "left";
      break;
    case "right":
      if (spaceRight >= neededH) return "right";
      break;
  }

  // Auto-pick: prefer vertical, then horizontal
  if (spaceBottom >= needed) return "bottom";
  if (spaceTop >= needed) return "top";
  if (spaceRight >= neededH) return "right";
  if (spaceLeft >= neededH) return "left";

  // Last resort: whichever vertical side has more room
  return spaceBottom >= spaceTop ? "bottom" : "top";
}

export function TourPopover() {
  const {
    isTourActive,
    currentStep,
    currentStepIndex,
    totalSteps,
    isFirstStep,
    isLastStep,
    nextStep,
    prevStep,
    skipTour,
  } = useTour();

  const [state, setState] = useState<PositionState>(INITIAL_STATE);
  const [isVisible, setIsVisible] = useState(false);

  const calculatePosition = useCallback(() => {
    if (!currentStep) return;

    const isMobile = window.innerWidth < 1024;

    // On mobile, when step requires drawer, use bottom-sheet positioning
    if (isMobile && currentStep.requiresDrawer) {
      setState({
        position: { top: "auto", left: 12, bottom: 12, right: 12 },
        placement: "bottom",
        isCentered: false,
        isMobileBottom: true,
      });
      return;
    }

    const targetElement = findVisibleElement(currentStep.target);

    // Fallback: center the popover when target element is not found
    if (!targetElement) {
      setState({
        position: { top: "auto", left: "auto", bottom: "auto", right: "auto" },
        placement: "bottom",
        isCentered: true,
        isMobileBottom: false,
      });
      return;
    }

    const rect = targetElement.getBoundingClientRect();

    // Extra safety: if the element has zero dimensions, center instead
    if (rect.width === 0 && rect.height === 0) {
      setState({
        position: { top: "auto", left: "auto", bottom: "auto", right: "auto" },
        placement: "bottom",
        isCentered: true,
        isMobileBottom: false,
      });
      return;
    }

    const popoverWidth = isMobile ? Math.min(320, window.innerWidth - 32) : 320;
    const popoverHeight = 160; // compact layout estimate
    const offset = 12;
    const padding = currentStep.spotlightPadding || 8;

    const placement = choosePlacement(
      rect,
      currentStep.placement as EffectivePlacement,
      popoverWidth,
      popoverHeight,
      offset,
      padding,
    );

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let top = 0;
    let left = 0;

    switch (placement) {
      case "top":
        top = rect.top - padding - popoverHeight - offset;
        left = rect.left + rect.width / 2 - popoverWidth / 2;
        break;
      case "bottom":
        top = rect.bottom + padding + offset;
        left = rect.left + rect.width / 2 - popoverWidth / 2;
        break;
      case "left":
        top = rect.top + rect.height / 2 - popoverHeight / 2;
        left = rect.left - padding - popoverWidth - offset;
        break;
      case "right":
        top = rect.top + rect.height / 2 - popoverHeight / 2;
        left = rect.right + padding + offset;
        break;
    }

    // Clamp to viewport
    if (left < 16) left = 16;
    if (left + popoverWidth > vw - 16) left = vw - popoverWidth - 16;
    if (top < 16) top = 16;
    if (top + popoverHeight > vh - 16) top = vh - popoverHeight - 16;

    setState({
      position: { top, left, bottom: "auto", right: "auto" },
      placement,
      isCentered: false,
      isMobileBottom: false,
    });
  }, [currentStep]);

  useEffect(() => {
    if (!isTourActive || !currentStep) {
      setIsVisible(false);
      return;
    }

    // Reset visibility on step change for smooth transition
    setIsVisible(false);

    // Wait a frame for the target element to render
    const timer = setTimeout(() => {
      calculatePosition();
      setIsVisible(true);
    }, 100);

    // Retry position calculation (e.g. after drawer opens with animation or page navigation)
    const retryTimers = [
      setTimeout(calculatePosition, 300),
      setTimeout(calculatePosition, 500),
      setTimeout(calculatePosition, 800),
      setTimeout(calculatePosition, 1200),
    ];

    window.addEventListener("resize", calculatePosition);
    window.addEventListener("scroll", calculatePosition, true);

    return () => {
      clearTimeout(timer);
      retryTimers.forEach(clearTimeout);
      window.removeEventListener("resize", calculatePosition);
      window.removeEventListener("scroll", calculatePosition, true);
    };
  }, [isTourActive, currentStep, calculatePosition]);

  if (!isTourActive || !currentStep) return null;

  const { position, placement, isCentered, isMobileBottom } = state;

  // Centered fallback (target not found)
  if (isCentered) {
    return (
      <div
        className={`fixed z-[95] bg-white shadow-2xl rounded-xl w-80 max-w-[calc(100vw-32px)] transition-all duration-300 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <PopoverContent
          currentStep={currentStep}
          currentStepIndex={currentStepIndex}
          totalSteps={totalSteps}
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
          nextStep={nextStep}
          prevStep={prevStep}
          skipTour={skipTour}
        />
      </div>
    );
  }

  return (
    <div
      className={`fixed z-[95] bg-white shadow-2xl transition-all duration-300 ${
        isMobileBottom
          ? "left-3 right-3 rounded-xl"
          : "w-80 rounded-xl"
      } ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
      style={{
        top: position.top === "auto" ? undefined : position.top,
        left: isMobileBottom ? undefined : (position.left === "auto" ? undefined : position.left),
        bottom: position.bottom === "auto" ? undefined : position.bottom,
        right: isMobileBottom ? undefined : (position.right === "auto" ? undefined : position.right),
      }}
    >
      {/* Arrow pointing toward the element (hidden in mobile bottom mode) */}
      <Arrow placement={placement} hidden={isMobileBottom} />

      <PopoverContent
        currentStep={currentStep}
        currentStepIndex={currentStepIndex}
        totalSteps={totalSteps}
        isFirstStep={isFirstStep}
        isLastStep={isLastStep}
        nextStep={nextStep}
        prevStep={prevStep}
        skipTour={skipTour}
      />
    </div>
  );
}

// Extracted content to avoid duplication between centered and positioned modes
function PopoverContent({
  currentStep,
  currentStepIndex,
  totalSteps,
  isFirstStep,
  isLastStep,
  nextStep,
  prevStep,
  skipTour,
}: {
  currentStep: { title: string; content: string };
  currentStepIndex: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
}) {
  return (
    <div className="p-3">
      {/* Header + close inline */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h3 className="text-sm font-semibold text-gray-900">{currentStep.title}</h3>
        <button
          onClick={skipTour}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded hover:bg-gray-100 flex-shrink-0 -mt-0.5 -mr-1"
          aria-label="Fechar tour"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content */}
      <p className="text-xs text-gray-600 leading-relaxed mb-3">
        {currentStep.content}
      </p>

      {/* Footer: progress + nav in one row */}
      <div className="flex items-center justify-between gap-2">
        {/* Progress dots */}
        <div className="flex items-center gap-1">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                index === currentStepIndex
                  ? "w-4 bg-primary"
                  : index < currentStepIndex
                  ? "w-1.5 bg-primary/40"
                  : "w-1.5 bg-gray-300"
              }`}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-1">
          {!isFirstStep && (
            <button
              onClick={prevStep}
              className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors rounded hover:bg-gray-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={nextStep}
            className="flex items-center gap-0.5 px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors whitespace-nowrap"
          >
            {isLastStep ? "Concluir" : "Próximo"}
            {!isLastStep && <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
