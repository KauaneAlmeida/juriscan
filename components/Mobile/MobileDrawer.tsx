"use client";

import { useEffect, useRef, useCallback } from "react";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Prevent closing via overlay click or swipe (used during tour) */
  preventClose?: boolean;
}

export default function MobileDrawer({ isOpen, onClose, children, preventClose = false }: MobileDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const isDraggingRef = useRef(false);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.overflow = "hidden";
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflow = "";
      window.scrollTo(0, parseInt(scrollY || "0") * -1);
    }
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on ESC (unless prevented during tour)
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !preventClose) onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
    }
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose, preventClose]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = e.touches[0].clientX;
    isDraggingRef.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDraggingRef.current || !drawerRef.current) return;
    currentXRef.current = e.touches[0].clientX;
    const diff = startXRef.current - currentXRef.current;
    // Only allow dragging left (to close)
    if (diff > 0) {
      drawerRef.current.style.transform = `translateX(-${diff}px)`;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isDraggingRef.current || !drawerRef.current) return;
    isDraggingRef.current = false;
    const diff = startXRef.current - currentXRef.current;

    if (diff > 80 && !preventClose) {
      onClose();
    }
    drawerRef.current.style.transform = "";
  }, [onClose, preventClose]);

  if (!isOpen) return null;

  return (
    <div className="lg:hidden">
      {/* Overlay - covers entire screen */}
      <div
        className="fixed inset-0 z-40 bg-black/50 animate-fade-in"
        onClick={preventClose ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Drawer panel - fixed to left edge */}
      {/* When tour is active (preventClose), raise z-index above tour overlay (z-90) but below popover (z-95) */}
      <div
        ref={drawerRef}
        className={`fixed top-0 left-0 bottom-0 w-[280px] max-w-[85vw] shadow-2xl animate-slide-left ${
          preventClose ? "z-[92]" : "z-50"
        }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegação"
      >
        {children}
      </div>
    </div>
  );
}
