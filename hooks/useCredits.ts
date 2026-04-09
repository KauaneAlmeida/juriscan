"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: "purchase" | "subscription" | "usage" | "bonus" | "refund";
  description: string;
  created_at: string;
}

interface Subscription {
  id: string;
  user_id: string;
  pagarme_subscription_id: string;
  plan_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

interface CreditsData {
  balance: number;
  transactions: CreditTransaction[];
  subscription: Subscription | null;
}

export function useCredits() {
  const queryClient = useQueryClient();

  // Fetch credits data
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<CreditsData>({
    queryKey: ["credits"],
    queryFn: async () => {
      const response = await fetch("/api/credits");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Erro ao buscar créditos");
      }
      const result = await response.json();
      return result.data;
    },
  });

  // Deduct credits (for internal use when user uses a feature)
  const deductCredits = async () => {
    await queryClient.invalidateQueries({ queryKey: ["credits"] });
  };

  return {
    balance: data?.balance || 0,
    transactions: data?.transactions || [],
    subscription: data?.subscription || null,
    isLoading,
    error,
    refetch,
    deductCredits,
  };
}
