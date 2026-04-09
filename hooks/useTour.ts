"use client";

import { useContext } from "react";
import { TourContext, TourContextType } from "@/components/Tour/TourContext";

// Valores padrão para quando o context não está disponível (SSR)
const defaultTourContext: TourContextType = {
  isTourActive: false,
  currentStepIndex: 0,
  hasCompletedTour: false,
  startTour: () => {},
  endTour: () => {},
  nextStep: () => {},
  prevStep: () => {},
  goToStep: () => {},
  skipTour: () => {},
  resetTour: () => {},
  registerDrawerControl: () => {},
  unregisterDrawerControl: () => {},
  steps: [],
  currentStep: null,
  totalSteps: 0,
  isFirstStep: true,
  isLastStep: true,
};

export function useTour(): TourContextType {
  const context = useContext(TourContext);

  // Retornar valores padrão se o contexto não estiver disponível (SSR)
  if (!context) {
    return defaultTourContext;
  }

  return context;
}
