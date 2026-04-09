"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/Mobile/MobileHeader";
import BottomNav from "@/components/Mobile/BottomNav";
import MobileDrawer from "@/components/Mobile/MobileDrawer";
import { useTour } from "@/hooks/useTour";

interface AppShellProps {
  children: React.ReactNode;
  /** Hide bottom nav (e.g. for chat page with its own input area) */
  hideBottomNav?: boolean;
}

export default function AppShell({ children, hideBottomNav = false }: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { registerDrawerControl, unregisterDrawerControl, isTourActive, currentStep } = useTour();
  const tourNeedsDrawer = isTourActive && !!currentStep?.requiresDrawer;

  // Register drawer control so the tour can open/close the drawer
  useEffect(() => {
    registerDrawerControl({
      open: () => setDrawerOpen(true),
      close: () => setDrawerOpen(false),
    });
    return () => unregisterDrawerControl();
  }, [registerDrawerControl, unregisterDrawerControl]);

  // When drawer is closed by user during tour (swipe/ESC/overlay click),
  // don't interfere — the tour sync effect will re-open if needed on next step
  const handleDrawerClose = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0f1923]">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Header */}
      <MobileHeader onMenuClick={() => setDrawerOpen(true)} />

      {/* Mobile Drawer with Sidebar inside */}
      <MobileDrawer
        isOpen={drawerOpen}
        onClose={handleDrawerClose}
        preventClose={tourNeedsDrawer}
      >
        <Sidebar
          onItemClick={isTourActive ? undefined : () => setDrawerOpen(false)}
          embedded
        />
      </MobileDrawer>

      {/* Main content area */}
      <div
        className={`lg:ml-[220px] min-h-screen pt-14 lg:pt-0 ${
          hideBottomNav ? "" : "pb-20 lg:pb-0"
        }`}
      >
        {children}
      </div>

      {/* Bottom Nav */}
      {!hideBottomNav && <BottomNav />}
    </div>
  );
}
