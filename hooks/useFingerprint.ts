"use client";

import { useState, useEffect } from "react";

export function useFingerprint(): string | null {
  const [visitorId, setVisitorId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadFingerprint() {
      try {
        const FingerprintJS = await import("@fingerprintjs/fingerprintjs");
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        if (!cancelled) {
          setVisitorId(result.visitorId);
        }
      } catch {
        // Fingerprint is optional — fail silently
      }
    }

    loadFingerprint();

    return () => {
      cancelled = true;
    };
  }, []);

  return visitorId;
}
