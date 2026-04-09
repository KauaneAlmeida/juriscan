"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Report, ReportType, CreateReportInput } from "@/types/reports";

interface ReportsData {
  reports: Report[];
}

interface ReportData {
  report: Report;
}

export function useReports(options?: {
  type?: ReportType;
  status?: string;
  limit?: number;
}) {
  const queryClient = useQueryClient();

  // Build query string
  const queryString = new URLSearchParams();
  if (options?.type) queryString.set("type", options.type);
  if (options?.status) queryString.set("status", options.status);
  if (options?.limit) queryString.set("limit", options.limit.toString());

  const queryKey = ["reports", options?.type, options?.status, options?.limit];

  // Fetch reports
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<ReportsData>({
    queryKey,
    queryFn: async () => {
      const url = `/api/reports${queryString.toString() ? `?${queryString}` : ""}`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Erro ao buscar relatórios");
      }
      const result = await response.json();
      return result.data;
    },
  });

  // Create report mutation
  const createMutation = useMutation({
    mutationFn: async (input: CreateReportInput) => {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Erro ao criar relatório");
      }

      const result = await response.json();
      return result.data.report as Report;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });

  // Delete report mutation
  const deleteMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Erro ao excluir relatório");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });

  return {
    reports: data?.reports || [],
    isLoading,
    error,
    refetch,
    createReport: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,
    deleteReport: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,
  };
}

export function useReport(reportId: string | null) {
  const queryClient = useQueryClient();

  // Fetch single report
  const { data, isLoading, error, refetch } = useQuery<ReportData>({
    queryKey: ["report", reportId],
    queryFn: async () => {
      if (!reportId) throw new Error("ID do relatório não fornecido");

      const response = await fetch(`/api/reports/${reportId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Erro ao buscar relatório");
      }
      const result = await response.json();
      return result.data;
    },
    enabled: !!reportId,
  });

  // Generate report mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!reportId) throw new Error("ID do relatório não fornecido");

      const response = await fetch(`/api/reports/${reportId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Erro ao gerar relatório");
      }

      const result = await response.json();
      return result.data.report as Report;
    },
    onSuccess: (report) => {
      queryClient.setQueryData(["report", reportId], { report });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["credits"] });
    },
  });

  return {
    report: data?.report || null,
    isLoading,
    error,
    refetch,
    generateReport: generateMutation.mutateAsync,
    isGenerating: generateMutation.isPending,
    generateError: generateMutation.error,
  };
}
