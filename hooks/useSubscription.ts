"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useSubscription() {
  const queryClient = useQueryClient();

  const invalidateCredits = () =>
    queryClient.invalidateQueries({ queryKey: ["credits"] });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/pagarme/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Erro ao cancelar assinatura");
      }

      return response.json();
    },
    onSuccess: () => invalidateCredits(),
  });

  const upgradeMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await fetch("/api/pagarme/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Erro ao atualizar plano");
      }

      return response.json();
    },
    onSuccess: () => invalidateCredits(),
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async (cardToken: string) => {
      const response = await fetch("/api/pagarme/update-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardToken }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Erro ao atualizar pagamento");
      }

      return response.json();
    },
  });

  return {
    cancel: cancelMutation.mutate,
    isCanceling: cancelMutation.isPending,
    upgrade: upgradeMutation.mutate,
    isUpgrading: upgradeMutation.isPending,
    updatePayment: updatePaymentMutation.mutate,
    isUpdatingPayment: updatePaymentMutation.isPending,
    invalidateCredits,
  };
}
