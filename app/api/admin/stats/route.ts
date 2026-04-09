import { apiHandler } from "@/lib/api/handler";
import { successResponse } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const GET = apiHandler(async () => {
  await requireAdmin();
  const admin = await createAdminClient();
  const db = admin as any; // bypass strict typing for tables not in Database type

  // Parallel queries for performance
  const [
    profilesRes,
    creditsRes,
    feedbackRes,
    subscriptionsRes,
    plansRes,
    recentTransactionsRes,
  ] = await Promise.all([
    db.from("profiles").select("id, created_at, last_login_at, current_plan, role, status"),
    db.from("credit_balances").select("balance"),
    db.from("beta_feedback").select("nps_score"),
    db.from("subscriptions").select("id, plan_id, status"),
    db.from("plans").select("id, slug, price_monthly"),
    db.from("credit_transactions")
      .select("amount, created_at")
      .lt("amount", 0)
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const profiles = (profilesRes.data || []) as any[];
  const credits = (creditsRes.data || []) as any[];
  const feedbacks = (feedbackRes.data || []) as any[];
  const subscriptions = ((subscriptionsRes.data || []) as any[]).filter((s: any) => s.status === "ACTIVE");
  const plans = (plansRes.data || []) as any[];
  const recentDebits = (recentTransactionsRes.data || []) as any[];

  const now = new Date();
  const _7dAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const _30dAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const _24hAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  // User counts
  const totalUsers = profiles.length;
  const newUsers7d = profiles.filter((p) => p.created_at >= _7dAgo).length;
  const newUsers30d = profiles.filter((p) => p.created_at >= _30dAgo).length;
  const activeUsers7d = profiles.filter((p) => p.last_login_at && p.last_login_at >= _7dAgo).length;
  const activeUsers24h = profiles.filter((p) => p.last_login_at && p.last_login_at >= _24hAgo).length;

  // Credits
  const totalCreditsRemaining = credits.reduce((sum, c) => sum + (c.balance || 0), 0);
  const avgCreditsRemaining = credits.length > 0 ? Math.round(totalCreditsRemaining / credits.length) : 0;
  const creditsConsumed30d = recentDebits.reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // NPS
  const npsScores = feedbacks.map((f) => f.nps_score as number);
  const promoters = npsScores.filter((s) => s >= 9).length;
  const detractors = npsScores.filter((s) => s <= 6).length;
  const npsScore = npsScores.length > 0
    ? Math.round(((promoters - detractors) / npsScores.length) * 100)
    : 0;
  const avgNps = npsScores.length > 0
    ? Math.round((npsScores.reduce((a, b) => a + b, 0) / npsScores.length) * 10) / 10
    : 0;

  // MRR
  const planMap = new Map(plans.map((p) => [p.id, p]));
  let mrr = 0;
  const subscriptionsByPlan: Record<string, number> = {};
  for (const sub of subscriptions) {
    const plan = planMap.get(sub.plan_id);
    if (plan) {
      mrr += Number(plan.price_monthly);
      const slug = plan.slug || "unknown";
      subscriptionsByPlan[slug] = (subscriptionsByPlan[slug] || 0) + 1;
    }
  }

  return successResponse({
    totalUsers,
    newUsers7d,
    newUsers30d,
    activeUsers7d,
    activeUsers24h,
    totalCreditsRemaining,
    avgCreditsRemaining,
    creditsConsumed30d,
    totalFeedbacks: feedbacks.length,
    npsScore,
    avgNps,
    activeSubscriptions: subscriptions.length,
    subscriptionsByPlan,
    mrr: Math.round(mrr * 100) / 100,
  });
}, { rateLimit: false });
