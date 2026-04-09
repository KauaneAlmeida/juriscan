"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import DisclaimerModal from "./DisclaimerModal";

export default function LegalDisclaimerInline() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 dark:text-white/45 mt-2 px-2">
        <Info className="w-3 h-3 flex-shrink-0" />
        <span className="text-center">
          Análises preditivas baseadas em jurimetria.
        </span>
        <button
          onClick={() => setIsModalOpen(true)}
          className="text-primary hover:text-primary-hover active:text-primary-hover dark:text-[#7aa6ff] dark:hover:text-[#a8c3ff] underline font-medium whitespace-nowrap py-1"
        >
          Saiba mais
        </button>
      </div>

      {isModalOpen && <DisclaimerModal onClose={() => setIsModalOpen(false)} />}
    </>
  );
}
