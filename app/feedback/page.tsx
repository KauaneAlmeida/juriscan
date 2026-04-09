"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import AppShell from "@/components/AppShell";
import Step1Nps from "@/components/Feedback/steps/Step1Nps";
import Step2Features from "@/components/Feedback/steps/Step2Features";
import Step3Ai from "@/components/Feedback/steps/Step3Ai";
import Step4Pricing from "@/components/Feedback/steps/Step4Pricing";
import Step5Open from "@/components/Feedback/steps/Step5Open";
import { useFeedback, INITIAL_FORM_DATA } from "@/hooks/useFeedback";
import type { FeedbackFormData } from "@/types/feedback";

const STEPS = ["Satisfação", "Funcionalidades", "Qualidade da IA", "Pricing", "Feedback"];
const DRAFT_KEY = "juriscan_feedback_draft";

export default function FeedbackPage() {
  const router = useRouter();
  const { existingFeedback, isLoading, submitFeedback, isSubmitting } = useFeedback();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<FeedbackFormData>(INITIAL_FORM_DATA);

  // Load draft from localStorage or existing feedback
  useEffect(() => {
    if (existingFeedback) {
      setFormData({
        nps_score: existingFeedback.nps_score,
        rating_interface: existingFeedback.rating_interface,
        facilidade_uso: existingFeedback.facilidade_uso,
        primeiro_uso_intuitivo: existingFeedback.primeiro_uso_intuitivo,
        rating_chat_ia: existingFeedback.rating_chat_ia,
        rating_analise_pdf: existingFeedback.rating_analise_pdf,
        rating_relatorios: existingFeedback.rating_relatorios,
        rating_jurimetria: existingFeedback.rating_jurimetria,
        rating_velocidade: existingFeedback.rating_velocidade,
        feature_mais_util: existingFeedback.feature_mais_util || "",
        feature_menos_util: existingFeedback.feature_menos_util || "",
        feature_faltando: existingFeedback.feature_faltando || "",
        ia_qualidade: existingFeedback.ia_qualidade,
        ia_precisao: existingFeedback.ia_precisao,
        ia_comparacao: existingFeedback.ia_comparacao || "",
        preco_justo: existingFeedback.preco_justo,
        plano_interesse: existingFeedback.plano_interesse,
        valor_max_mensal: existingFeedback.valor_max_mensal,
        area_juridica: existingFeedback.area_juridica,
        tamanho_escritorio: existingFeedback.tamanho_escritorio,
        ponto_forte: existingFeedback.ponto_forte || "",
        ponto_fraco: existingFeedback.ponto_fraco || "",
        sugestao_melhoria: existingFeedback.sugestao_melhoria || "",
        depoimento: existingFeedback.depoimento || "",
        permite_depoimento: existingFeedback.permite_depoimento,
      });
      return;
    }

    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        setFormData(JSON.parse(draft));
      } catch {
        // ignore corrupted draft
      }
    }
  }, [existingFeedback]);

  // Save draft to localStorage
  useEffect(() => {
    if (!existingFeedback && !submitted) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
    }
  }, [formData, existingFeedback, submitted]);

  const handleChange = useCallback((updates: Partial<FeedbackFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const canAdvance = step === 0 ? formData.nps_score !== null : true;

  const handleSubmit = async () => {
    if (formData.nps_score === null) {
      toast.error("O NPS é obrigatório");
      setStep(0);
      return;
    }

    try {
      await submitFeedback(formData);
      localStorage.removeItem(DRAFT_KEY);
      setSubmitted(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar feedback");
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppShell>
    );
  }

  if (submitted) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh] p-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Obrigado pelo seu feedback!</h2>
            <p className="text-gray-500 mb-6">
              Sua opinião é fundamental para melhorarmos o Juriscan. Cada resposta nos ajuda a construir uma ferramenta melhor para advogados.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors"
            >
              Voltar ao Dashboard
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto p-4 sm:p-6 pb-32 sm:pb-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-800">
            {existingFeedback ? "Editar Feedback" : "Feedback Beta"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {existingFeedback ? "Atualize suas respostas" : "Leva apenas 3 minutos"}
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">
              Etapa {step + 1} de {STEPS.length}
            </span>
            <span className="text-xs text-gray-400">{STEPS[step]}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
          {step === 0 && <Step1Nps data={formData} onChange={handleChange} />}
          {step === 1 && <Step2Features data={formData} onChange={handleChange} />}
          {step === 2 && <Step3Ai data={formData} onChange={handleChange} />}
          {step === 3 && <Step4Pricing data={formData} onChange={handleChange} />}
          {step === 4 && <Step5Open data={formData} onChange={handleChange} />}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-6">
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 disabled:opacity-0 disabled:pointer-events-none transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canAdvance}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Próximo
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {isSubmitting ? "Enviando..." : "Enviar Feedback"}
            </button>
          )}
        </div>
      </div>
    </AppShell>
  );
}
