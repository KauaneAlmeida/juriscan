"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { useTour } from "@/hooks/useTour";

interface WelcomeModalProps {
  onAccept: () => void | Promise<void>;
}

const infoItems = [
  {
    title: "Natureza das Análises Preditivas",
    description: (
      <>
        As análises apresentadas pela Juriscan são baseadas em{" "}
        <strong className="text-gray-800">padrões históricos</strong> de decisões
        judiciais. Os resultados representam{" "}
        <strong className="text-gray-800">probabilidades e cenários estimados</strong>,
        calculados a partir de bancos de dados jurisprudenciais.
      </>
    ),
  },
  {
    title: "Limitações e Responsabilidade",
    description: (
      <>
        As análises{" "}
        <strong className="text-gray-800">não constituem garantia de êxito</strong>,
        aconselhamento jurídico definitivo ou previsão absoluta de resultado. Cada
        caso possui particularidades fáticas, probatórias e jurídicas que podem
        influenciar significativamente o desfecho processual.
      </>
    ),
  },
  {
    title: "Ferramenta de Apoio à Decisão",
    description: (
      <>
        A Juriscan é uma{" "}
        <strong className="text-gray-800">ferramenta de apoio à decisão estratégica</strong>,
        desenvolvida para auxiliar advogados na análise de cenários e tendências. A
        análise jurídica completa, a estratégia processual e as decisões finais são
        de{" "}
        <strong className="text-gray-800">
          responsabilidade exclusiva do advogado responsável
        </strong>{" "}
        pelo caso.
      </>
    ),
  },
  {
    title: "Uso Profissional Responsável",
    description: (
      <>
        Recomendamos que os dados e análises sejam utilizados como{" "}
        <strong className="text-gray-800">insumo complementar</strong> ao
        conhecimento jurídico, experiência profissional e análise detalhada das
        especificidades de cada caso concreto.
      </>
    ),
  },
];

export default function WelcomeModal({ onAccept }: WelcomeModalProps) {
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { startTour, hasCompletedTour } = useTour();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAccept = async () => {
    if (isTermsAccepted && !isSubmitting) {
      setIsSubmitting(true);

      // Chamar callback do TermsGate que salva no banco e localStorage
      await onAccept();

      // Iniciar tour automaticamente se nunca foi completado
      // O tour será iniciado após um delay para garantir que o modal fechou
      if (!hasCompletedTour) {
        setTimeout(() => startTour(), 600);
      }
    }
  };

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-[600px] max-w-[90vw] max-h-[90vh] bg-white dark:bg-[#1a2433] dark:border dark:border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        role="dialog"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        {/* Header */}
        <div
          className="p-6"
          style={{
            background: "linear-gradient(135deg, #1C398E 0%, #193CB8 100%)",
          }}
        >
          <h2
            id="modal-title"
            className="text-white text-2xl font-semibold"
          >
            Bem-vindo à Juriscan
          </h2>
          <p className="text-light-blue text-sm mt-1">
            Plataforma de Jurimetria e Análise Estratégica
          </p>
        </div>

        {/* Body */}
        <div
          id="modal-description"
          className="p-6 overflow-y-auto flex-1"
          style={{ maxHeight: "calc(90vh - 300px)" }}
        >
          {/* Alert Box */}
          <div className="bg-gray-50 dark:bg-white/[0.04] rounded-xl p-4 mb-6">
            <h3 className="text-gray-800 dark:text-white font-semibold">
              Informação Importante sobre as Análises
            </h3>
            <p className="text-gray-500 dark:text-white/60 text-sm mt-1">
              Antes de utilizar a plataforma, é fundamental compreender a
              natureza e as limitações das análises fornecidas.
            </p>
          </div>

          {/* Info Items */}
          <div className="space-y-5">
            {infoItems.map((item, index) => (
              <div key={index}>
                <h4 className="text-gray-800 dark:text-white font-semibold text-sm">
                  {item.title}
                </h4>
                <p className="text-gray-600 dark:text-white/75 text-sm mt-1 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 dark:border-white/[0.08] dark:bg-white/[0.03]">
          {/* Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isTermsAccepted}
              onChange={(e) => setIsTermsAccepted(e.target.checked)}
              className="w-5 h-5 mt-0.5 rounded border-gray-300 text-primary focus:ring-primary dark:border-white/15 dark:bg-white/[0.06] dark:checked:bg-[#1a4fd6]"
              aria-required="true"
            />
            <span className="text-gray-600 dark:text-white/75 text-sm leading-5">
              Li e compreendi que as análises representam probabilidades
              estatísticas e não garantias de resultado. Estou ciente de que as
              decisões estratégicas e jurídicas são de minha responsabilidade
              profissional.
            </span>
          </label>

          {/* Submit Button */}
          <button
            onClick={handleAccept}
            disabled={!isTermsAccepted || isSubmitting}
            className={`w-full h-12 mt-4 rounded-button flex items-center justify-center gap-2 text-white font-medium transition-colors ${
              isTermsAccepted && !isSubmitting
                ? "bg-primary hover:bg-primary-hover dark:bg-[#1a4fd6] dark:hover:bg-[#1440b8]"
                : "bg-gray-400 cursor-not-allowed dark:bg-white/10"
            }`}
          >
            <Check className="w-5 h-5" />
            <span>{isSubmitting ? "Salvando..." : "Aceitar termos"}</span>
          </button>

          {/* Disclaimer */}
          <p className="text-gray-400 dark:text-white/45 text-xs text-center mt-4">
            Esta mensagem será exibida apenas uma vez. Você pode revisar estas
            informações a qualquer momento nas Configurações.
          </p>
        </div>
      </div>
    </div>
  );
}
