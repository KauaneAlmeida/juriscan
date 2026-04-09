"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import DisclaimerModal from "./DisclaimerModal";

export default function LegalDisclaimer() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="mt-8 pt-4 border-t border-gray-200 dark:border-white/[0.08]">
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-white/55">
          <Info className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            Análises baseadas em jurimetria e dados históricos. Probabilidades
            estimadas, sem garantia de resultado.
          </span>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-primary hover:text-primary-hover active:text-primary-hover dark:text-[#7aa6ff] dark:hover:text-[#a8c3ff] underline font-medium whitespace-nowrap py-1"
          >
            Saiba mais
          </button>
        </div>
      </div>

      {isModalOpen && <DisclaimerModal onClose={() => setIsModalOpen(false)} />}
    </>
  );
}
