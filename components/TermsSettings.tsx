"use client";

import { useState } from "react";
import {
  AlertCircle,
  FileText,
  Shield,
  Cookie,
  ChevronRight,
  CheckCircle,
  Play,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { GlassModal } from "@/components/ui/GlassModal";
import { TermosDeUsoContent } from "@/components/Legal/TermosDeUso";
import { PoliticaPrivacidadeContent } from "@/components/Legal/PoliticaPrivacidade";
import { PoliticaCookiesContent } from "@/components/Legal/PoliticaCookies";

type ModalType = "terms" | "privacy" | "cookies" | null;

interface DocumentLink {
  id: ModalType;
  label: string;
  icon: React.ElementType;
  modalTitle: string;
  modalSubtitle: string;
  modalIcon: React.ElementType;
}

const documentLinks: DocumentLink[] = [
  {
    id: "terms",
    label: "Termos de Uso da Plataforma",
    icon: FileText,
    modalTitle: "Termos de Uso",
    modalSubtitle: "Última atualização: 27/01/2026",
    modalIcon: FileText,
  },
  {
    id: "privacy",
    label: "Política de Privacidade (LGPD)",
    icon: Shield,
    modalTitle: "Política de Privacidade",
    modalSubtitle: "Em conformidade com a LGPD",
    modalIcon: Shield,
  },
  {
    id: "cookies",
    label: "Política de Cookies",
    icon: Cookie,
    modalTitle: "Política de Cookies",
    modalSubtitle: "Última atualização: 27/01/2026",
    modalIcon: Globe,
  },
];

const modalContent: Record<string, React.ReactNode> = {
  terms: <TermosDeUsoContent />,
  privacy: <PoliticaPrivacidadeContent />,
  cookies: <PoliticaCookiesContent />,
};

interface TermsSettingsProps {
  acceptedDate?: string;
  onViewDocument?: (documentId: string) => void;
  onRestartTour?: () => void;
}

export default function TermsSettings({
  acceptedDate = "14/01/2026",
  onViewDocument,
  onRestartTour,
}: TermsSettingsProps) {
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const handleRestartTour = () => {
    onRestartTour?.();
    toast.success("Tour reiniciado! Siga as instruções na tela.");
  };

  const handleViewDocument = (doc: DocumentLink) => {
    onViewDocument?.(doc.id!);
    setActiveModal(doc.id);
  };

  return (
    <div className="space-y-6">
      {/* Help Card */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 dark:bg-[#1a4fd6]/10 dark:border-[#1a4fd6]/30">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-100 dark:bg-[#1a4fd6]/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Play className="w-5 h-5 text-blue-600 dark:text-[#7aa6ff]" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-800 dark:text-white">
              Precisa de ajuda?
            </h3>
            <p className="text-sm text-gray-600 dark:text-white/70 mt-1">
              Reveja o tour guiado da plataforma a qualquer momento.
            </p>
            <button
              onClick={handleRestartTour}
              className="mt-4 px-5 py-2.5 bg-primary hover:bg-primary-hover dark:bg-[#1a4fd6] dark:hover:bg-[#1440b8] text-white text-sm font-medium rounded-lg transition-colors"
            >
              Rever tour da plataforma
            </button>
          </div>
        </div>
      </div>

      {/* About Analysis Section */}
      <div className="bg-white dark:bg-white/[0.03] rounded-2xl border border-gray-200 dark:border-white/[0.08] p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
          Sobre as Análises da Juriscan
        </h3>
        <p className="text-sm text-gray-500 dark:text-white/55 mb-5">
          Revise as informações importantes sobre a natureza das análises
          preditivas e relatórios gerados pela plataforma
        </p>

        {/* Info Callout */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 dark:bg-amber-500/10 dark:border-amber-500/30">
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-800 dark:text-white">
                Sobre as Análises Preditivas
              </h4>
              <p className="text-sm text-gray-600 dark:text-white/75 mt-2 leading-relaxed">
                As análises apresentadas são baseadas em dados estatísticos,
                jurisprudência e padrões históricos de decisões judiciais. Os
                resultados representam probabilidades e cenários estimados, não
                constituindo garantia de êxito ou previsão absoluta de resultado.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Terms and Privacy Documents */}
      <div className="bg-white dark:bg-white/[0.03] rounded-2xl border border-gray-200 dark:border-white/[0.08] p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-5">
          Termos de Uso e Política de Privacidade
        </h3>

        <div className="divide-y divide-gray-100 dark:divide-white/[0.06]">
          {documentLinks.map((doc) => (
            <button
              key={doc.id}
              onClick={() => handleViewDocument(doc)}
              className="w-full flex items-center justify-between py-4 group hover:bg-gray-50 dark:hover:bg-white/[0.04] -mx-2 px-2 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-100 dark:bg-white/[0.06] rounded-lg flex items-center justify-center group-hover:bg-primary/10 dark:group-hover:bg-[#1a4fd6]/20 transition-colors">
                  <doc.icon className="w-4 h-4 text-gray-500 dark:text-white/60 group-hover:text-primary dark:group-hover:text-[#7aa6ff] transition-colors" />
                </div>
                <span className="text-sm font-medium text-gray-800 dark:text-white">
                  {doc.label}
                </span>
              </div>
              <div className="flex items-center gap-2 text-primary dark:text-[#7aa6ff]">
                <span className="text-sm font-medium">Ver documento</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Terms Accepted Section */}
      <div className="bg-white dark:bg-white/[0.03] rounded-2xl border border-gray-200 dark:border-white/[0.08] p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-green-100 dark:bg-emerald-500/15 rounded-lg flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-white">
              Você aceitou os termos
            </h3>
            <p className="text-sm text-gray-600 dark:text-white/70 mt-2 leading-relaxed">
              Ao utilizar a plataforma, você confirmou compreender que as
              análises representam probabilidades estatísticas e não garantias de
              resultado. Esta concordância foi registrada em{" "}
              <span className="font-medium text-gray-800 dark:text-white">{acceptedDate}</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Modais Glassmorphism */}
      {documentLinks.map((doc) => (
        <GlassModal
          key={doc.id}
          isOpen={activeModal === doc.id}
          onClose={() => setActiveModal(null)}
          title={doc.modalTitle}
          subtitle={doc.modalSubtitle}
          icon={<doc.modalIcon className="w-5 h-5" />}
        >
          {modalContent[doc.id!]}
        </GlassModal>
      ))}
    </div>
  );
}
