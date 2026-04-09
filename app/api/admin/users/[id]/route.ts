import { apiHandler } from "@/lib/api/handler";
import { successResponse } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/auth";
import { NotFoundError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const GET = apiHandler(async (_request, { params }) => {
  await requireAdmin();
  const admin = await createAdminClient();
  const db = admin as any;
  const userId = params.id;

  const { data: profile, error } = await db
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !profile) throw new NotFoundError("Usuário");

  const [balanceRes, subsRes, txRes, convoRes, analysesRes, reportsRes] = await Promise.all([
    db.from("credit_balances").select("balance").eq("user_id", userId).single(),
    db.from("subscriptions").select("*, plans(name, slug, price_monthly)").eq("user_id", userId).maybeSingle(),
    db.from("credit_transactions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
    db.from("conversations").select("id", { count: "exact" }).eq("user_id", userId),
    db.from("analyses").select("id", { count: "exact" }).eq("user_id", userId),
    db.from("reports").select("id", { count: "exact" }).eq("user_id", userId),
  ]);

  let messagesCount = 0;
  const convoIds = ((convoRes.data || []) as any[]).map((c: any) => c.id);
  if (convoIds.length > 0) {
    const { count } = await db
      .from("messages")
      .select("id", { count: "exact", head: true })
      .in("conversation_id", convoIds)
      .eq("role", "USER");
    messagesCount = count || 0;
  }

  return successResponse({
    ...profile,
    credit_balance: balanceRes.data?.balance ?? 0,
    subscription: subsRes.data || null,
    recent_transactions: txRes.data || [],
    conversations_count: convoRes.count || 0,
    messages_count: messagesCount,
    analyses_count: analysesRes.count || 0,
    reports_count: reportsRes.count || 0,
  });
}, { rateLimit: false });
