"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { BetaFeedback, FeedbackFormData } from "@/types/feedback";

const INITIAL_FORM_DATA: FeedbackFormData = {
  nps_score: null,
  rating_interface: null,
  facilidade_uso: null,
  primeiro_uso_intuitivo: null,
  rating_chat_ia: null,
  rating_analise_pdf: null,
  rating_relatorios: null,
  rating_jurimetria: null,
  rating_velocidade: null,
  feature_mais_util: "",
  feature_menos_util: "",
  feature_faltando: "",
  ia_qualidade: null,
  ia_precisao: null,
  ia_comparacao: "",
  preco_justo: null,
  plano_interesse: null,
  valor_max_mensal: null,
  area_juridica: null,
  tamanho_escritorio: null,
  ponto_forte: "",
  ponto_fraco: "",
  sugestao_melhoria: "",
  depoimento: "",
  permite_depoimento: false,
};

export { INITIAL_FORM_DATA };

export function useFeedback() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<BetaFeedback | null>({
    queryKey: ["beta-feedback"],
    queryFn: async () => {
      const res = await fetch("/api/feedback");
      if (!res.ok) throw new Error("Erro ao buscar feedback");
      const result = await res.json();
      return result.data.feedback;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (formData: FeedbackFormData) => {
      const payload = {
        ...formData,
        nps_score: formData.nps_score!,
        feature_mais_util: formData.feature_mais_util || undefined,
        feature_menos_util: formData.feature_menos_util || undefined,
        feature_faltando: formData.feature_faltando || undefined,
        ia_comparacao: formData.ia_comparacao || undefined,
        ponto_forte: formData.ponto_forte || undefined,
        ponto_fraco: formData.ponto_fraco || undefined,
        sugestao_melhoria: formData.sugestao_melhoria || undefined,
        depoimento: formData.depoimento || undefined,
      };

      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || "Erro ao enviar feedback");
      }

      const result = await res.json();
      return result.data.feedback;
    },
    onSuccess: (feedback) => {
      queryClient.setQueryData(["beta-feedback"], feedback);
    },
  });

  return {
    existingFeedback: data ?? null,
    isLoading,
    error,
    submitFeedback: submitMutation.mutateAsync,
    isSubmitting: submitMutation.isPending,
    submitError: submitMutation.error,
  };
}
