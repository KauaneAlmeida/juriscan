import { apiHandler, successResponse, parseBody, NotFoundError } from "@/lib/api";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getReport, deleteReport, generateReport } from "@/services/report.service";
import { REPORT_COSTS } from "@/lib/credits/costs";
import { z } from "zod";
import type { ReportType } from "@/types/reports";

// Schema for generating a report
const generateReportSchema = z.object({
  action: z.literal("generate"),
});

// GET /api/reports/:id - Get a specific report
export const GET = apiHandler(async (_request, { params, user }) => {
  const supabase = await createServerSupabaseClient();
  const id = params.id;

  const { data, error } = await getReport(supabase, user!.id, id);

  if (error || !data) {
    throw new NotFoundError("Relatório não encontrado");
  }

  return successResponse({ report: data });
});

// POST /api/reports/:id - Generate report content
export const POST = apiHandler(async (request, { params, user }) => {
  const supabase = await createServerSupabaseClient();
  const id = params.id;

  await parseBody(request, generateReportSchema);

  // Get report to check type and calculate credits
  const { data: report, error: fetchError } = await getReport(supabase, user!.id, id);

  if (fetchError || !report) {
    throw new NotFoundError("Relatório não encontrado");
  }

  const creditsNeeded = REPORT_COSTS[report.type as ReportType] || 10;

  const { data, error } = await generateReport(supabase, user!.id, id, creditsNeeded);

  if (error) {
    throw new Error(error);
  }

  return successResponse({ report: data });
});

// DELETE /api/reports/:id - Delete a report
export const DELETE = apiHandler(async (_request, { params, user }) => {
  const supabase = await createServerSupabaseClient();
  const id = params.id;

  const { error } = await deleteReport(supabase, user!.id, id);

  if (error) {
    throw new Error(error);
  }

  return successResponse({ message: "Relatório excluído" });
});
