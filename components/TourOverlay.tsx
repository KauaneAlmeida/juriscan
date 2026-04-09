"use client";

interface TourOverlayProps {
  isActive: boolean;
}

export default function TourOverlay({ isActive }: TourOverlayProps) {
  if (!isActive) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 z-40 pointer-events-none"
      aria-hidden="true"
    />
  );
}
