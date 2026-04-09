import { apiHandler } from "@/lib/api/handler";
import { successResponse } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const GET = apiHandler(async (request) => {
  await requireAdmin();
  const admin = await createAdminClient();
  const db = admin as any;

  const months = parseInt(request.nextUrl.searchParams.get("months") || "6");

  // Active subscriptions with plan info for MRR
  const { data: activeSubs } = await db
    .from("subscriptions")
    .select("id, user_id, status, plan_id, plans(name, slug, price_monthly)")
    .eq("status", "ACTIVE");

  const subs = (activeSubs || []) as any[];
  const mrr = subs.reduce((sum: number, s: any) => {
    return sum + (s.plans ? Number(s.plans.price_monthly) : 0);
  }, 0);

  // Payment history
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const { data: payments } = await db
    .from("payment_history")
    .select("*")
    .gte("created_at", startDate.toISOString())
    .order("created_at", { ascending: false });

  const paymentRows = (payments || []) as any[];

  // Monthly revenue aggregation
  const monthlyRevenue: Record<string, { subscription: number; avulso: number; count: number }> = {};
  for (const p of paymentRows) {
    if (p.status !== "paid") continue;
    const month = (p.paid_at || p.created_at).substring(0, 7);
    if (!monthlyRevenue[month]) monthlyRevenue[month] = { subscription: 0, avulso: 0, count: 0 };
    monthlyRevenue[month].count++;
    const amountBrl = p.amount_cents / 100;
    if (p.type === "credit_purchase") {
      monthlyRevenue[month].avulso += amountBrl;
    } else {
      monthlyRevenue[month].subscription += amountBrl;
    }
  }

  const revenueByMonth = Object.entries(monthlyRevenue)
    .map(([month, data]) => ({
      month,
      total_revenue_brl: Math.round((data.subscription + data.avulso) * 100) / 100,
      subscription_revenue_brl: Math.round(data.subscription * 100) / 100,
      avulso_revenue_brl: Math.round(data.avulso * 100) / 100,
      total_payments: data.count,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Current month revenue
  const currentMonth = new Date().toISOString().substring(0, 7);
  const currentMonthData = monthlyRevenue[currentMonth] || { subscription: 0, avulso: 0, count: 0 };
  const revenueThisMonth = currentMonthData.subscription + currentMonthData.avulso;

  // Revenue by plan
  const revenueByPlan: Record<string, number> = {};
  for (const sub of subs) {
    if (sub.plans) {
      const slug = sub.plans.slug || "unknown";
      revenueByPlan[slug] = (revenueByPlan[slug] || 0) + Number(sub.plans.price_monthly);
    }
  }

  // Churn
  const { data: canceledSubs } = await db
    .from("subscriptions")
    .select("id")
    .eq("status", "CANCELED")
    .gte("updated_at", `${currentMonth}-01`);

  const canceledCount = canceledSubs?.length || 0;
  const totalAtStart = subs.length + canceledCount;
  const churnRate = totalAtStart > 0 ? Math.round((canceledCount / totalAtStart) * 10000) / 100 : 0;

  // Ticket médio
  const payingUsersThisMonth = new Set(
    paymentRows.filter((p: any) => p.status === "paid" && (p.paid_at || p.created_at).startsWith(currentMonth)).map((p: any) => p.user_id)
  ).size;
  const ticketMedio = payingUsersThisMonth > 0 ? Math.round((revenueThisMonth / payingUsersThisMonth) * 100) / 100 : 0;

  return successResponse({
    mrr: Math.round(mrr * 100) / 100,
    arr: Math.round(mrr * 12 * 100) / 100,
    revenueThisMonth: Math.round(revenueThisMonth * 100) / 100,
    ticketMedio,
    churnRate,
    ltv: churnRate > 0 ? Math.round((ticketMedio / (churnRate / 100)) * 100) / 100 : 0,
    activeSubscriptions: subs.length,
    revenueByMonth,
    revenueByPlan,
    recentPayments: paymentRows.slice(0, 50),
  });
}, { rateLimit: false });
