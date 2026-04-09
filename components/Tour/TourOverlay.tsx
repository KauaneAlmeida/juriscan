"use client";

import { useEffect, useState, useCallback } from "react";
import { useTour } from "@/hooks/useTour";
import { findVisibleElement } from "./tourUtils";

interface SpotlightPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function TourOverlay() {
  const { isTourActive, currentStep } = useTour();
  const [spotlightPosition, setSpotlightPosition] =
    useState<SpotlightPosition | null>(null);

  const updateSpotlightPosition = useCallback(() => {
    if (!currentStep) {
      setSpotlightPosition(null);
      return;
    }

    const targetElement = findVisibleElement(currentStep.target);
    if (!targetElement) {
      setSpotlightPosition(null);
      return;
    }

    const rect = targetElement.getBoundingClientRect();
    const padding = currentStep.spotlightPadding || 8;

    setSpotlightPosition({
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    });
  }, [currentStep]);

  useEffect(() => {
    if (!isTourActive) {
      setSpotlightPosition(null);
      return;
    }

    updateSpotlightPosition();

    // Retry finding target element (e.g. after drawer opens with animation or page navigation)
    const retryTimers = [
      setTimeout(updateSpotlightPosition, 100),
      setTimeout(updateSpotlightPosition, 300),
      setTimeout(updateSpotlightPosition, 500),
      setTimeout(updateSpotlightPosition, 800),
      setTimeout(updateSpotlightPosition, 1200),
    ];

    // Atualizar posição em resize e scroll
    window.addEventListener("resize", updateSpotlightPosition);
    window.addEventListener("scroll", updateSpotlightPosition, true);

    return () => {
      retryTimers.forEach(clearTimeout);
      window.removeEventListener("resize", updateSpotlightPosition);
      window.removeEventListener("scroll", updateSpotlightPosition, true);
    };
  }, [isTourActive, updateSpotlightPosition]);

  if (!isTourActive) return null;

  const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;
  const isMobileDrawerStep = isMobile && !!currentStep?.requiresDrawer;

  // On mobile drawer steps: full-screen overlay + highlight on target inside drawer
  if (isMobileDrawerStep) {
    return (
      <>
        {/* Dark overlay behind the drawer (z-90 < drawer z-92) */}
        <div className="fixed inset-0 bg-black/40 z-[90] pointer-events-none transition-opacity duration-300" />

        {/* Highlight on target element, above the drawer (z-93 > drawer z-92) */}
        {spotlightPosition && (
          <div
            className="fixed rounded-lg z-[93] pointer-events-none transition-all duration-300"
            style={{
              top: spotlightPosition.top,
              left: spotlightPosition.left,
              width: spotlightPosition.width,
              height: spotlightPosition.height,
            }}
          >
            {/* Solid visible ring on dark background */}
            <div
              className="absolute inset-0 rounded-lg border-2 border-white/80"
              style={{
                boxShadow: `
                  0 0 0 3px rgba(59, 130, 246, 0.9),
                  inset 0 0 0 0 rgba(255, 255, 255, 0.1),
                  0 0 20px 4px rgba(59, 130, 246, 0.5),
                  0 0 40px 8px rgba(59, 130, 246, 0.25)
                `,
              }}
            />
            {/* Semi-transparent white background to make the item stand out */}
            <div className="absolute inset-0 rounded-lg bg-white/10" />
          </div>
        )}
      </>
    );
  }

  // No spotlight target found — show a plain dim overlay so the centered popover still looks good
  if (!spotlightPosition) {
    return (
      <div className="fixed inset-0 bg-black/30 z-[90] pointer-events-none transition-opacity duration-300" />
    );
  }

  // Estilo do overlay - escurecimento suave (30% opacity, sem blur)
  const overlayClass = "fixed bg-black/30 z-[90] pointer-events-none transition-all duration-300";

  return (
    <>
      {/* Overlay escuro suave usando divs separadas */}
      {/* Top overlay */}
      <div
        className={`${overlayClass} left-0 right-0 top-0`}
        style={{ height: Math.max(0, spotlightPosition.top) }}
      />
      {/* Bottom overlay */}
      <div
        className={`${overlayClass} left-0 right-0 bottom-0`}
        style={{ top: spotlightPosition.top + spotlightPosition.height }}
      />
      {/* Left overlay */}
      <div
        className={overlayClass}
        style={{
          top: spotlightPosition.top,
          height: spotlightPosition.height,
          width: Math.max(0, spotlightPosition.left),
          left: 0,
        }}
      />
      {/* Right overlay */}
      <div
        className={overlayClass}
        style={{
          top: spotlightPosition.top,
          height: spotlightPosition.height,
          left: spotlightPosition.left + spotlightPosition.width,
          right: 0,
        }}
      />

      {/* Highlight elegante do elemento ativo - glow azul suave */}
      <div
        className="fixed rounded-lg z-[91] pointer-events-none transition-all duration-300"
        style={{
          top: spotlightPosition.top,
          left: spotlightPosition.left,
          width: spotlightPosition.width,
          height: spotlightPosition.height,
          boxShadow: `
            0 0 0 2px rgba(59, 130, 246, 0.8),
            0 0 20px 4px rgba(59, 130, 246, 0.3),
            0 0 40px 8px rgba(59, 130, 246, 0.15)
          `,
        }}
      />
    </>
  );
}
