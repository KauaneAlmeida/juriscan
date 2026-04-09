import { apiHandler } from "@/lib/api/handler";
import { successResponse } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const GET = apiHandler(async () => {
  await requireAdmin();
  const admin = await createAdminClient();

  const now = new Date();
  const today = now.toISOString().substring(0, 10);
  const _30dAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [balancesRes, todayDebitsRes, last30dTxRes, zeroBalanceRes] = await Promise.all([
    (admin as any).from("credit_balances").select("user_id, balance"),
    (admin as any).from("credit_transactions").select("amount").lt("amount", 0).gte("created_at", `${today}T00:00:00`),
    (admin as any).from("credit_transactions").select("user_id, amount, type, created_at").gte("created_at", _30dAgo),
    (admin as any).from("credit_balances").select("user_id", { count: "exact" }).eq("balance", 0),
  ]);

  const balances = (balancesRes.data || []) as Array<{ user_id: string; balance: number }>;
  const totalCirculating = balances.reduce((sum: number, b) => sum + b.balance, 0);
  const consumedToday = ((todayDebitsRes.data || []) as Array<{ amount: number }>).reduce((sum: number, t) => sum + Math.abs(t.amount), 0);
  const usersWithZeroCredits = zeroBalanceRes.count || 0;

  // Daily consumption (last 30 days)
  const txs = (last30dTxRes.data || []) as Array<{ user_id: string; amount: number; type: string; created_at: string }>;
  const dailyMap: Record<string, { consumed: number; added: number }> = {};
  for (const tx of txs) {
    const date = tx.created_at.substring(0, 10);
    if (!dailyMap[date]) dailyMap[date] = { consumed: 0, added: 0 };
    if (tx.amount < 0) {
      dailyMap[date].consumed += Math.abs(tx.amount);
    } else {
      dailyMap[date].added += tx.amount;
    }
  }
  const dailyConsumption = Object.entries(dailyMap)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Average per user per day
  const totalDays = dailyConsumption.length || 1;
  const totalConsumed30d = dailyConsumption.reduce((s, d) => s + d.consumed, 0);
  const activeConsumers = new Set(txs.filter((t) => t.amount < 0).map((t) => t.user_id)).size;
  const avgPerUserPerDay = activeConsumers > 0
    ? Math.round((totalConsumed30d / totalDays / activeConsumers) * 10) / 10
    : 0;

  // Top 10 consumers
  const consumerMap: Record<string, number> = {};
  for (const tx of txs) {
    if (tx.amount < 0) {
      consumerMap[tx.user_id] = (consumerMap[tx.user_id] || 0) + Math.abs(tx.amount);
    }
  }
  const topConsumerIds = Object.entries(consumerMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  let topConsumers = topConsumerIds.map(([id, total]) => ({ user_id: id, total_consumed: total, name: "\u2014", email: "" }));
  if (topConsumerIds.length > 0) {
    const { data: names } = await (admin as any)
      .from("profiles")
      .select("id, name, email")
      .in("id", topConsumerIds.map(([id]: [string, number]) => id));
    const nameMap = new Map(((names || []) as Array<{ id: string; name: string; email: string }>).map((n) => [n.id, n]));
    topConsumers = topConsumerIds.map(([id, total]) => ({
      user_id: id,
      total_consumed: total,
      name: nameMap.get(id)?.name || "\u2014",
      email: nameMap.get(id)?.email || "",
    }));
  }

  // Consumption by type
  const consumptionByType: Record<string, number> = {};
  for (const tx of txs) {
    if (tx.amount < 0) {
      const type = tx.type || "OTHER";
      consumptionByType[type] = (consumptionByType[type] || 0) + Math.abs(tx.amount);
    }
  }

  // Low credit users (< 5 credits, > 0)
  const lowCreditUserIds = balances.filter((b) => b.balance > 0 && b.balance < 5).map((b) => b.user_id);
  let lowCreditUsers: Array<{ user_id: string; balance: number; name: string; current_plan: string }> = [];
  if (lowCreditUserIds.length > 0) {
    const { data: profiles } = await (admin as any)
      .from("profiles")
      .select("id, name, current_plan")
      .in("id", lowCreditUserIds);
    const balanceMap = new Map(balances.map((b) => [b.user_id, b.balance]));
    lowCreditUsers = ((profiles || []) as Array<{ id: string; name: string; current_plan: string }>).map((p) => ({
      user_id: p.id,
      balance: balanceMap.get(p.id) || 0,
      name: p.name,
      current_plan: p.current_plan || "free",
    }));
  }

  return successResponse({
    totalCirculating,
    consumedToday,
    avgPerUserPerDay,
    usersWithZeroCredits,
    dailyConsumption,
    topConsumers,
    consumptionByType,
    lowCreditUsers,
  });
}, { rateLimit: false });
