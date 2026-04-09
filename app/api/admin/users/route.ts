import { apiHandler } from "@/lib/api/handler";
import { paginatedResponse } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const GET = apiHandler(async (request) => {
  await requireAdmin();
  const admin = await createAdminClient();
  const db = admin as any;

  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search") || "";
  const planFilter = searchParams.get("plan") || "";
  const sortBy = searchParams.get("sort") || "created_at";
  const sortDir = searchParams.get("dir") === "asc";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "20")));
  const offset = (page - 1) * pageSize;

  let query = db
    .from("profiles")
    .select("id, email, name, avatar_url, oab, phone, law_firm, practice_areas, role, status, current_plan, created_at, last_login_at", { count: "exact" });

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  if (planFilter) {
    query = query.eq("current_plan", planFilter);
  }

  query = query
    .order(sortBy, { ascending: sortDir })
    .range(offset, offset + pageSize - 1);

  const { data: profiles, count, error } = await query;
  if (error) throw error;

  const profileList = (profiles || []) as any[];
  const userIds = profileList.map((p: any) => p.id);

  const [balancesRes, subsRes] = await Promise.all([
    userIds.length > 0
      ? db.from("credit_balances").select("user_id, balance").in("user_id", userIds)
      : Promise.resolve({ data: [] }),
    userIds.length > 0
      ? db.from("subscriptions").select("user_id, status").in("user_id", userIds)
      : Promise.resolve({ data: [] }),
  ]);

  const balanceMap = new Map(((balancesRes.data || []) as any[]).map((b: any) => [b.user_id, b.balance]));
  const subMap = new Map(((subsRes.data || []) as any[]).map((s: any) => [s.user_id, s.status]));

  const users = profileList.map((p: any) => ({
    ...p,
    credit_balance: balanceMap.get(p.id) ?? 0,
    subscription_status: subMap.get(p.id) ?? null,
    total_spent_cents: 0,
  }));

  return paginatedResponse(users, { page, pageSize, total: count || 0 });
}, { rateLimit: false });
