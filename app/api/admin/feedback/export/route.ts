/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiHandler } from "@/lib/api/handler";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export const GET = apiHandler(async () => {
  await requireAdmin();
  const admin = await createAdminClient();

  const { data: feedbacks } = await (admin as any)
    .from("beta_feedback")
    .select("*, profiles:user_id(name, email)")
    .order("created_at", { ascending: false });

  if (!feedbacks || feedbacks.length === 0) {
    return new NextResponse("Nenhum feedback encontrado", { status: 404 });
  }

  const headers = Object.keys(feedbacks[0]);
  const csvRows = [
    headers.join(","),
    ...feedbacks.map((f: Record<string, unknown>) =>
      headers.map((h) => {
        const val = f[h];
        const str = val === null || val === undefined ? "" : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      }).join(",")
    ),
  ];

  return new NextResponse(csvRows.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="feedback_beta_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}, { rateLimit: false });
