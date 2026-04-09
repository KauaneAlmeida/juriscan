import { apiHandler, successResponse, parseBody } from "@/lib/api";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listReports, createReport } from "@/services/report.service";
import { z } from "zod";
import type { ReportType, CreateReportInput } from "@/types/reports";

// Schema for creating a report
const createReportSchema = z.object({
  type: z.enum([
    "PREDICTIVE_ANALYSIS",
    "JURIMETRICS",
    "RELATOR_PROFILE",
    "EXECUTIVE_SUMMARY",
    "CUSTOM",
  ]),
  title: z.string().min(1).max(200),
  parameters: z.record(z.string(), z.any()),
});

// GET /api/reports - List user's reports
export const GET = apiHandler(async (request, { user }) => {
  const supabase = await createServerSupabaseClient();
  const { searchParams } = new URL(request.url);

  const type = searchParams.get("type") as ReportType | null;
  const status = searchParams.get("status");
  const limit = searchParams.get("limit");
  const offset = searchParams.get("offset");

  const { data, error } = await listReports(supabase, user!.id, {
    type: type || undefined,
    status: status || undefined,
    limit: limit ? parseInt(limit) : 20,
    offset: offset ? parseInt(offset) : 0,
  });

  if (error) {
    throw new Error(error);
  }

  return successResponse({ reports: data });
});

// POST /api/reports - Create a new report
export const POST = apiHandler(async (request, { user }) => {
  const supabase = await createServerSupabaseClient();

  const input = await parseBody(request, createReportSchema);

  const { data, error } = await createReport(supabase, user!.id, {
    type: input.type,
    title: input.title,
    parameters: input.parameters as CreateReportInput["parameters"],
  });

  if (error) {
    throw new Error(error);
  }

  return successResponse({ report: data });
});
