"use client";

import { TourOverlay } from "./TourOverlay";
import { TourPopover } from "./TourPopover";

export function Tour() {
  return (
    <>
      <TourOverlay />
      <TourPopover />
    </>
  );
}

export { TourProvider } from "./TourProvider";
export { TourContext } from "./TourContext";
export type { TourStep, TourContextType } from "./TourContext";
