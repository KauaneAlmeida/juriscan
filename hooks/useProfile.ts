"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Profile {
  id: string;
  email: string;
  name: string;
  oab: string | null;
  phone: string | null;
  avatar_url: string | null;
  law_firm: string | null;
  practice_areas: string[];
  role: string;
  status: string;
  terms_accepted_at: string | null;
  share_data_improvements: boolean;
  usage_analytics: boolean;
  created_at: string;
  updated_at: string;
}

interface ProfileUpdateData {
  name?: string;
  oab?: string;
  phone?: string;
  law_firm?: string;
  practice_areas?: string[];
  avatar_url?: string | null;
}

export function useProfile() {
  const queryClient = useQueryClient();

  // Fetch profile data
  const { data, isLoading, error, refetch } = useQuery<Profile>({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await fetch("/api/profile");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Erro ao buscar perfil");
      }
      const result = await response.json();
      return result.data.profile;
    },
  });

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: async (updateData: ProfileUpdateData) => {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Erro ao atualizar perfil");
      }

      const result = await response.json();
      return result.data.profile;
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(["profile"], profile);
    },
  });

  return {
    profile: data || null,
    isLoading,
    error,
    refetch,
    updateProfile: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
  };
}
