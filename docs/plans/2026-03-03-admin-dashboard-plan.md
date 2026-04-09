# Admin Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a complete admin dashboard at `/admin` with business metrics, user management, financial analytics, credit monitoring, feedback analysis, and system health.

**Architecture:** Separate admin layout with its own sidebar, independent from user AppShell. All API routes use `apiHandler()` + admin role check via shared `requireAdmin()` helper. Data fetched via `createAdminClient()` (service role key, bypasses RLS).

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, Recharts, Supabase, lucide-react

---

## Phase 1: Foundation (Layout + Auth + Shared Components)

### Task 1: Create admin auth helper

**Files:**
- Create: `lib/admin/auth.ts`

**Step 1: Create the admin auth helper**

```typescript
// lib/admin/auth.ts
import { createAdminClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { AuthError, ForbiddenError } from "@/lib/api/errors";
import type { User } from "@supabase/supabase-js";

const ADMIN_EMAILS = ["danieltiol777@gmail.com"];

/**
 * Verify current user is an admin. For use in API routes.
 * Returns the authenticated user if admin, throws otherwise.
 */
export async function requireAdmin(): Promise<User> {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AuthError("Não autenticado");
  }

  // Check role in profiles table
  const admin = await createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "ADMIN" && !ADMIN_EMAILS.includes(user.email || "")) {
    throw new ForbiddenError("Acesso restrito a administradores");
  }

  return user;
}

/**
 * Check if user is admin. For use in Server Components (pages).
 * Returns { user, isAdmin } without throwing.
 */
export async function checkAdmin(): Promise<{ user: User | null; isAdmin: boolean }> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { user: null, isAdmin: false };

    const admin = await createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.role === "ADMIN" || ADMIN_EMAILS.includes(user.email || "");
    return { user, isAdmin };
  } catch {
    return { user: null, isAdmin: false };
  }
}
```

**Step 2: Verify the file has no TypeScript errors**

Run: `npx tsc --noEmit lib/admin/auth.ts 2>&1 | head -20`

**Step 3: Commit**

```bash
git add lib/admin/auth.ts
git commit -m "feat(admin): add admin auth helper with role check"
```

---

### Task 2: Create admin types

**Files:**
- Create: `types/admin.ts`

**Step 1: Create admin-specific TypeScript types**

```typescript
// types/admin.ts

export interface AdminDashboardStats {
  totalUsers: number;
  newUsers7d: number;
  newUsers30d: number;
  activeUsers24h: number;
  activeUsers7d: number;
  totalCreditsRemaining: number;
  avgCreditsRemaining: number;
  totalFeedbacks: number;
  avgNps: number;
  activeSubscriptions: number;
  subscriptionsByPlan: Record<string, number>;
  mrr: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  oab: string | null;
  phone: string | null;
  law_firm: string | null;
  practice_areas: string[];
  role: string;
  status: string;
  current_plan: string;
  created_at: string;
  last_login_at: string | null;
  credit_balance: number;
  total_spent_cents: number;
  subscription_status: string | null;
}

export interface AdminUserDetail extends AdminUser {
  conversations_count: number;
  messages_count: number;
  analyses_count: number;
  reports_count: number;
  recent_transactions: AdminCreditTransaction[];
  payment_history: AdminPayment[];
}

export interface AdminCreditTransaction {
  id: string;
  type: string;
  amount: number;
  balance: number;
  description: string;
  created_at: string;
}

export interface AdminPayment {
  id: string;
  amount_cents: number;
  status: string;
  payment_method: string | null;
  type: string;
  paid_at: string | null;
  created_at: string;
}

export interface AdminRevenueStats {
  month: string;
  total_payments: number;
  total_revenue_brl: number;
  subscription_revenue_brl: number;
  avulso_revenue_brl: number;
}

export interface AdminCreditStats {
  totalCirculating: number;
  consumedToday: number;
  avgPerUserPerDay: number;
  usersWithZeroCredits: number;
  dailyConsumption: Array<{ date: string; consumed: number; added: number }>;
  topConsumers: Array<{ user_id: string; name: string; email: string; total_consumed: number }>;
  consumptionByType: Record<string, number>;
}

export interface SystemHealthCheck {
  service: string;
  status: "healthy" | "degraded" | "down";
  latency_ms: number | null;
  message: string | null;
  checked_at: string;
}
```

**Step 2: Commit**

```bash
git add types/admin.ts
git commit -m "feat(admin): add admin TypeScript types"
```

---

### Task 3: Create shared admin UI components

**Files:**
- Create: `app/admin/components/StatCard.tsx`
- Create: `app/admin/components/ChartCard.tsx`
- Create: `app/admin/components/AdminLoadingSkeleton.tsx`

**Step 1: Create StatCard component**

```tsx
// app/admin/components/StatCard.tsx
"use client";

import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  borderColor?: string;
  trend?: { value: number; label: string };
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-blue-500",
  borderColor = "border-l-blue-500",
  trend,
}: StatCardProps) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border-l-4 ${borderColor} p-5 hover:shadow-md transition-shadow`}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <span className="text-sm text-gray-500 font-medium">{title}</span>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {(subtitle || trend) && (
        <div className="mt-1 flex items-center gap-1.5">
          {trend && (
            <span
              className={`text-sm font-medium ${
                trend.value >= 0 ? "text-emerald-600" : "text-red-500"
              }`}
            >
              {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%
            </span>
          )}
          {subtitle && <span className="text-sm text-gray-500">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Create ChartCard component**

```tsx
// app/admin/components/ChartCard.tsx
"use client";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export default function ChartCard({ title, subtitle, children, className = "" }: ChartCardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-800">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}
```

**Step 3: Create loading skeleton components**

```tsx
// app/admin/components/AdminLoadingSkeleton.tsx
"use client";

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border-l-4 border-l-gray-200 p-5 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-lg bg-gray-200" />
        <div className="h-4 w-24 bg-gray-200 rounded" />
      </div>
      <div className="h-9 w-20 bg-gray-200 rounded mb-1" />
      <div className="h-4 w-32 bg-gray-200 rounded" />
    </div>
  );
}

export function ChartSkeleton({ height = "h-64" }: { height?: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-5 animate-pulse">
      <div className="h-5 w-40 bg-gray-200 rounded mb-4" />
      <div className={`${height} bg-gray-100 rounded-lg`} />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-5 animate-pulse">
      <div className="h-5 w-40 bg-gray-200 rounded mb-4" />
      <div className="space-y-3">
        <div className="h-10 bg-gray-100 rounded" />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-50 rounded" />
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add app/admin/components/StatCard.tsx app/admin/components/ChartCard.tsx app/admin/components/AdminLoadingSkeleton.tsx
git commit -m "feat(admin): add shared UI components (StatCard, ChartCard, skeletons)"
```

---

### Task 4: Create AdminSidebar component

**Files:**
- Create: `app/admin/components/AdminSidebar.tsx`

**Step 1: Create the sidebar**

```tsx
// app/admin/components/AdminSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Zap,
  MessageSquareHeart,
  Activity,
  ArrowLeft,
  X,
  Menu,
} from "lucide-react";

const navSections = [
  {
    label: "Principal",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
      { icon: Users, label: "Usuários", href: "/admin/users" },
    ],
  },
  {
    label: "Negócio",
    items: [
      { icon: DollarSign, label: "Financeiro", href: "/admin/financial" },
      { icon: Zap, label: "Créditos & IA", href: "/admin/credits" },
    ],
  },
  {
    label: "Qualidade",
    items: [
      { icon: MessageSquareHeart, label: "Feedback Beta", href: "/admin/feedback" },
      { icon: Activity, label: "Sistema", href: "/admin/system" },
    ],
  },
];

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  const sidebarContent = (
    <aside className="h-full bg-[#0B1120] flex flex-col w-64">
      {/* Logo + Badge */}
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/logo_juriscan.png"
            alt="Juriscan"
            className="w-28 h-auto brightness-0 invert"
          />
          <span className="text-xs font-bold text-[#D4A843] bg-[#D4A843]/10 px-2 py-0.5 rounded">
            ADMIN
          </span>
        </div>
        {/* Mobile close button */}
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-6 mt-2">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 px-3 mb-2">
              {section.label}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-[#D4A843]/10 text-white border-l-[3px] border-[#D4A843] -ml-px"
                        : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                    }`}
                  >
                    <item.icon className={`w-[18px] h-[18px] ${isActive ? "text-[#D4A843]" : ""}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-gray-400 text-sm hover:text-white transition-colors px-3 py-2.5 rounded-lg hover:bg-white/5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Juriscan</span>
        </Link>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar - fixed */}
      <div className="hidden lg:block fixed left-0 top-0 h-screen z-30">
        {sidebarContent}
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />
          <div className="relative h-full w-64">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}

/** Mobile header bar for admin */
export function AdminMobileHeader({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#0B1120] border-b border-white/10 flex items-center px-4 z-30">
      <button onClick={onMenuClick} className="text-white/80 hover:text-white">
        <Menu className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-2 ml-3">
        <img src="/logo_juriscan.png" alt="Juriscan" className="w-24 h-auto brightness-0 invert" />
        <span className="text-xs font-bold text-[#D4A843]">ADMIN</span>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/admin/components/AdminSidebar.tsx
git commit -m "feat(admin): add AdminSidebar with navigation sections"
```

---

### Task 5: Create admin layout

**Files:**
- Create: `app/admin/layout.tsx`
- Create: `app/admin/page.tsx`

**Step 1: Create the admin layout**

```tsx
// app/admin/layout.tsx
"use client";

import { useState } from "react";
import AdminSidebar, { AdminMobileHeader } from "./components/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <AdminMobileHeader onMenuClick={() => setSidebarOpen(true)} />
      <main className="lg:ml-64 pt-14 lg:pt-0 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
```

**Step 2: Create the admin index page (redirect)**

```tsx
// app/admin/page.tsx
import { redirect } from "next/navigation";

export default function AdminPage() {
  redirect("/admin/dashboard");
}
```

**Step 3: Verify build works**

Run: `npm run build 2>&1 | tail -30`
Expected: No errors related to admin files

**Step 4: Commit**

```bash
git add app/admin/layout.tsx app/admin/page.tsx
git commit -m "feat(admin): add admin layout with sidebar and redirect"
```

---

## Phase 2: Dashboard Overview + Stats API

### Task 6: Create admin stats API route

**Files:**
- Create: `app/api/admin/stats/route.ts`

**Step 1: Create the dashboard stats API**

```typescript
// app/api/admin/stats/route.ts
import { apiHandler } from "@/lib/api/handler";
import { successResponse } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export const GET = apiHandler(async () => {
  await requireAdmin();
  const admin = await createAdminClient();

  // Parallel queries for performance
  const [
    profilesRes,
    creditsRes,
    feedbackRes,
    subscriptionsRes,
    plansRes,
    recentTransactionsRes,
  ] = await Promise.all([
    // All profiles with timestamps
    admin.from("profiles").select("id, created_at, last_login_at, current_plan, role, status"),
    // Credit balances
    admin.from("credit_balances").select("balance"),
    // Feedback
    admin.from("beta_feedback").select("nps_score"),
    // Active subscriptions
    admin.from("subscriptions").select("id, plan_id, status"),
    // Plans for price lookup
    admin.from("plans").select("id, slug, price_monthly"),
    // Recent credit debits (30 days)
    admin.from("credit_transactions")
      .select("amount, created_at")
      .lt("amount", 0)
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const profiles = profilesRes.data || [];
  const credits = creditsRes.data || [];
  const feedbacks = feedbackRes.data || [];
  const subscriptions = (subscriptionsRes.data || []).filter((s) => s.status === "ACTIVE");
  const plans = plansRes.data || [];
  const recentDebits = recentTransactionsRes.data || [];

  const now = new Date();
  const _7dAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const _30dAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const _24hAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  // User counts
  const totalUsers = profiles.length;
  const newUsers7d = profiles.filter((p) => p.created_at >= _7dAgo).length;
  const activeUsers7d = profiles.filter((p) => p.last_login_at && p.last_login_at >= _7dAgo).length;
  const activeUsers24h = profiles.filter((p) => p.last_login_at && p.last_login_at >= _24hAgo).length;

  // Credits
  const totalCreditsRemaining = credits.reduce((sum, c) => sum + (c.balance || 0), 0);
  const avgCreditsRemaining = credits.length > 0
    ? Math.round(totalCreditsRemaining / credits.length)
    : 0;

  // Credits consumed last 30d
  const creditsConsumed30d = recentDebits.reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // NPS
  const npsScores = feedbacks.map((f) => f.nps_score);
  const promoters = npsScores.filter((s) => s >= 9).length;
  const detractors = npsScores.filter((s) => s <= 6).length;
  const npsScore = npsScores.length > 0
    ? Math.round(((promoters - detractors) / npsScores.length) * 100)
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
    activeUsers7d,
    activeUsers24h,
    totalCreditsRemaining,
    avgCreditsRemaining,
    creditsConsumed30d,
    totalFeedbacks: feedbacks.length,
    npsScore,
    activeSubscriptions: subscriptions.length,
    subscriptionsByPlan,
    mrr: Math.round(mrr * 100) / 100,
  });
}, { rateLimit: false });
```

**Step 2: Commit**

```bash
git add app/api/admin/stats/route.ts
git commit -m "feat(admin): add dashboard stats API route"
```

---

### Task 7: Create admin dashboard page

**Files:**
- Create: `app/admin/dashboard/page.tsx`

**Step 1: Create the dashboard page**

```tsx
// app/admin/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users, Activity, DollarSign, Star, Zap, CreditCard,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import StatCard from "../components/StatCard";
import ChartCard from "../components/ChartCard";
import AdminDashboardSkeleton from "../components/AdminLoadingSkeleton";
import type { AdminDashboardStats } from "@/types/admin";

const PLAN_COLORS: Record<string, string> = {
  free: "#94A3B8",
  starter: "#3B82F6",
  pro: "#D4A843",
  business: "#0F1B2D",
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/stats");
        if (res.status === 403) { router.push("/dashboard"); return; }
        if (res.status === 401) { router.push("/login"); return; }
        if (!res.ok) throw new Error("Erro ao carregar métricas");
        const { data } = await res.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  if (loading) return <AdminDashboardSkeleton />;

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-red-500">{error || "Erro ao carregar"}</p>
      </div>
    );
  }

  const activationRate = stats.totalUsers > 0
    ? Math.round((stats.activeUsers7d / stats.totalUsers) * 100)
    : 0;

  const planDistData = Object.entries(stats.subscriptionsByPlan).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  const npsLabel = stats.npsScore > 50 ? "Excelente" : stats.npsScore > 0 ? "Bom" : "Precisa melhorar";
  const npsColor = stats.npsScore > 50 ? "text-emerald-600" : stats.npsScore > 0 ? "text-amber-600" : "text-red-600";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Visão geral do Juriscan</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard
          title="Usuários Totais"
          value={stats.totalUsers}
          subtitle={`+${stats.newUsers7d} últimos 7 dias`}
          icon={Users}
          iconColor="text-blue-500"
          borderColor="border-l-blue-500"
        />
        <StatCard
          title="Ativos (7 dias)"
          value={stats.activeUsers7d}
          subtitle={`${activationRate}% taxa de ativação`}
          icon={Activity}
          iconColor="text-emerald-500"
          borderColor="border-l-emerald-500"
        />
        <StatCard
          title="MRR"
          value={`R$ ${stats.mrr.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          subtitle={`${stats.activeSubscriptions} assinaturas ativas`}
          icon={DollarSign}
          iconColor="text-[#D4A843]"
          borderColor="border-l-[#D4A843]"
        />
        <StatCard
          title="NPS Score"
          value={stats.npsScore}
          subtitle={npsLabel}
          icon={Star}
          iconColor={npsColor}
          borderColor={stats.npsScore > 50 ? "border-l-emerald-500" : stats.npsScore > 0 ? "border-l-amber-500" : "border-l-red-500"}
        />
        <StatCard
          title="Créditos Consumidos (30d)"
          value={(stats as Record<string, unknown>).creditsConsumed30d as number || 0}
          subtitle={`média ${stats.avgCreditsRemaining}/usuário restante`}
          icon={Zap}
          iconColor="text-purple-500"
          borderColor="border-l-purple-500"
        />
        <StatCard
          title="Assinaturas Ativas"
          value={stats.activeSubscriptions}
          subtitle={Object.entries(stats.subscriptionsByPlan).map(([k, v]) => `${v} ${k}`).join(" · ") || "Nenhuma"}
          icon={CreditCard}
          iconColor="text-[#0F1B2D]"
          borderColor="border-l-[#0F1B2D]"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan Distribution */}
        <ChartCard title="Distribuição de Planos" subtitle="Assinantes ativos por plano">
          {planDistData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={planDistData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {planDistData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={PLAN_COLORS[entry.name.toLowerCase()] || "#94A3B8"}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0F1B2D",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">
              Nenhuma assinatura ativa
            </div>
          )}
        </ChartCard>

        {/* Quick Stats / NPS Summary */}
        <ChartCard title="Resumo NPS" subtitle={`${stats.totalFeedbacks} respostas de feedback`}>
          <div className="flex flex-col items-center justify-center h-[250px]">
            <div className={`text-6xl font-bold ${npsColor}`}>{stats.npsScore}</div>
            <div className="text-lg text-gray-500 mt-2">{npsLabel}</div>
            <div className="text-sm text-gray-400 mt-4">
              {stats.totalFeedbacks} feedbacks recebidos · Média NPS {stats.avgNps?.toFixed(1) || "—"}
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
```

**Step 2: Run build to verify**

Run: `npm run build 2>&1 | tail -20`

**Step 3: Commit**

```bash
git add app/admin/dashboard/page.tsx
git commit -m "feat(admin): add dashboard overview page with stat cards and charts"
```

---

## Phase 3: Users Page

### Task 8: Create admin users API routes

**Files:**
- Create: `app/api/admin/users/route.ts`
- Create: `app/api/admin/users/[id]/route.ts`
- Create: `app/api/admin/users/[id]/credits/route.ts`

**Step 1: Create users list API**

```typescript
// app/api/admin/users/route.ts
import { apiHandler } from "@/lib/api/handler";
import { successResponse, paginatedResponse } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export const GET = apiHandler(async (request) => {
  await requireAdmin();
  const admin = await createAdminClient();

  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search") || "";
  const planFilter = searchParams.get("plan") || "";
  const sortBy = searchParams.get("sort") || "created_at";
  const sortDir = searchParams.get("dir") === "asc" ? true : false;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "20")));
  const offset = (page - 1) * pageSize;

  // Build query
  let query = admin
    .from("profiles")
    .select("id, email, name, avatar_url, oab, phone, law_firm, practice_areas, role, status, current_plan, created_at, last_login_at", { count: "exact" });

  // Search filter
  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  // Plan filter
  if (planFilter) {
    query = query.eq("current_plan", planFilter);
  }

  // Sort + paginate
  query = query
    .order(sortBy, { ascending: sortDir })
    .range(offset, offset + pageSize - 1);

  const { data: profiles, count, error } = await query;
  if (error) throw error;

  // Get credit balances for these users
  const userIds = (profiles || []).map((p) => p.id);
  const { data: balances } = await admin
    .from("credit_balances")
    .select("user_id, balance")
    .in("user_id", userIds.length > 0 ? userIds : ["__none__"]);

  const balanceMap = new Map((balances || []).map((b) => [b.user_id, b.balance]));

  // Get subscription status
  const { data: subs } = await admin
    .from("subscriptions")
    .select("user_id, status")
    .in("user_id", userIds.length > 0 ? userIds : ["__none__"]);

  const subMap = new Map((subs || []).map((s) => [s.user_id, s.status]));

  const users = (profiles || []).map((p) => ({
    ...p,
    credit_balance: balanceMap.get(p.id) ?? 0,
    subscription_status: subMap.get(p.id) ?? null,
    total_spent_cents: 0, // Will be populated when payment_history exists
  }));

  return paginatedResponse(users, {
    page,
    pageSize,
    total: count || 0,
  });
}, { rateLimit: false });
```

**Step 2: Create user detail API**

```typescript
// app/api/admin/users/[id]/route.ts
import { apiHandler } from "@/lib/api/handler";
import { successResponse } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/auth";
import { NotFoundError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

export const GET = apiHandler(async (_request, { params }) => {
  await requireAdmin();
  const admin = await createAdminClient();
  const userId = params.id;

  // Profile
  const { data: profile, error } = await admin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !profile) throw new NotFoundError("Usuário");

  // Parallel queries
  const [balanceRes, subsRes, txRes, convoRes, analysesRes, reportsRes] = await Promise.all([
    admin.from("credit_balances").select("balance").eq("user_id", userId).single(),
    admin.from("subscriptions").select("*, plans(name, slug, price_monthly)").eq("user_id", userId).single(),
    admin.from("credit_transactions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
    admin.from("conversations").select("id", { count: "exact" }).eq("user_id", userId),
    admin.from("analyses").select("id", { count: "exact" }).eq("user_id", userId),
    admin.from("reports").select("id", { count: "exact" }).eq("user_id", userId),
  ]);

  // Message count via conversations
  const convoIds = (convoRes.data || []).map((c) => c.id);
  let messagesCount = 0;
  if (convoIds.length > 0) {
    const { count } = await admin
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
```

**Step 3: Create add credits API**

```typescript
// app/api/admin/users/[id]/credits/route.ts
import { apiHandler, parseBody } from "@/lib/api/handler";
import { successResponse } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/auth";
import { addCredits } from "@/services/credit.service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const addCreditsSchema = z.object({
  amount: z.number().int().min(1).max(10000),
  reason: z.string().min(1).max(500),
});

export const POST = apiHandler(async (request, { params }) => {
  const adminUser = await requireAdmin();
  const { amount, reason } = await parseBody(request, addCreditsSchema);
  const userId = params.id;

  const admin = await createAdminClient();

  const result = await addCredits(
    admin,
    userId,
    amount,
    `[Admin] ${reason} (por ${adminUser.email})`,
    "ADJUSTMENT"
  );

  if (!result.success) {
    throw new Error(result.error || "Erro ao adicionar créditos");
  }

  return successResponse({
    newBalance: result.newBalance,
    message: `${amount} créditos adicionados com sucesso`,
  });
}, { rateLimit: false });
```

**Step 4: Commit**

```bash
git add app/api/admin/users/route.ts app/api/admin/users/[id]/route.ts app/api/admin/users/[id]/credits/route.ts
git commit -m "feat(admin): add users API routes (list, detail, add credits)"
```

---

### Task 9: Create admin users page

**Files:**
- Create: `app/admin/users/page.tsx`

**Step 1: Create the users page**

This is a large client component with search, filters, sortable table, user detail modal, and add credits modal. The component fetches from `/api/admin/users` with query params for search/filter/sort/pagination.

Key features:
- Search input with 300ms debounce (name or email)
- Plan filter dropdown (All, Free, Starter, Pro, Business)
- Sortable columns (click header to toggle sort)
- Pagination controls (20 per page)
- Click row to open user detail modal (fetches `/api/admin/users/[id]`)
- "Adicionar Créditos" button in detail modal opens credit modal
- CSV export button

The full component code should be implemented following the existing patterns in `app/admin/feedback/page.tsx` — client component with `useEffect` fetch, loading/error states, and Recharts for any mini-charts in the detail modal.

**Step 2: Commit**

```bash
git add app/admin/users/page.tsx
git commit -m "feat(admin): add users management page with search, filters, modals"
```

---

## Phase 4: Financial Page

### Task 10: Create payment_history SQL migration

**Files:**
- Create: `supabase/migrations/payment_history.sql`

**Step 1: Create the migration file**

```sql
-- supabase/migrations/payment_history.sql
-- Payment history table for financial tracking

CREATE TABLE IF NOT EXISTS public.payment_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pagarme_charge_id TEXT,
  amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_history_user ON public.payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON public.payment_history(status);
CREATE INDEX IF NOT EXISTS idx_payment_history_paid_at ON public.payment_history(paid_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_history_type ON public.payment_history(type);

-- RLS: No client access (admin only via service role)
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No client access to payment history"
ON public.payment_history FOR ALL
USING (false);
```

**Step 2: Commit**

```bash
git add supabase/migrations/payment_history.sql
git commit -m "feat(admin): add payment_history table migration"
```

---

### Task 11: Create financial API route

**Files:**
- Create: `app/api/admin/financial/route.ts`

**Step 1: Create the financial API**

```typescript
// app/api/admin/financial/route.ts
import { apiHandler } from "@/lib/api/handler";
import { successResponse } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export const GET = apiHandler(async (request) => {
  await requireAdmin();
  const admin = await createAdminClient();

  const months = parseInt(request.nextUrl.searchParams.get("months") || "6");

  // Active subscriptions with plan info for MRR
  const { data: activeSubs } = await admin
    .from("subscriptions")
    .select("id, user_id, status, plan_id, plans(name, slug, price_monthly)")
    .eq("status", "ACTIVE");

  const subs = activeSubs || [];
  const mrr = subs.reduce((sum, s) => {
    const plan = s.plans as unknown as { price_monthly: number } | null;
    return sum + (plan ? Number(plan.price_monthly) : 0);
  }, 0);

  // Payment history (recent)
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const { data: payments } = await admin
    .from("payment_history")
    .select("*")
    .gte("created_at", startDate.toISOString())
    .order("created_at", { ascending: false });

  const paymentRows = payments || [];

  // Monthly revenue aggregation
  const monthlyRevenue: Record<string, { subscription: number; avulso: number; count: number }> = {};
  for (const p of paymentRows) {
    if (p.status !== "paid") continue;
    const month = (p.paid_at || p.created_at).substring(0, 7); // YYYY-MM
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
    .sort((a, b) => b.month.localeCompare(a.month));

  // Current month revenue
  const currentMonth = new Date().toISOString().substring(0, 7);
  const currentMonthData = monthlyRevenue[currentMonth] || { subscription: 0, avulso: 0, count: 0 };
  const revenueThisMonth = currentMonthData.subscription + currentMonthData.avulso;

  // Revenue by plan
  const revenueByPlan: Record<string, number> = {};
  for (const sub of subs) {
    const plan = sub.plans as unknown as { slug: string; price_monthly: number } | null;
    if (plan) {
      const slug = plan.slug || "unknown";
      revenueByPlan[slug] = (revenueByPlan[slug] || 0) + Number(plan.price_monthly);
    }
  }

  // Churn: Canceled subscriptions this month vs total at start of month
  const { data: canceledSubs } = await admin
    .from("subscriptions")
    .select("id")
    .eq("status", "CANCELED")
    .gte("updated_at", `${currentMonth}-01`);

  const canceledCount = canceledSubs?.length || 0;
  const totalAtStart = subs.length + canceledCount;
  const churnRate = totalAtStart > 0 ? Math.round((canceledCount / totalAtStart) * 10000) / 100 : 0;

  // Paying users this month
  const payingUsersThisMonth = new Set(
    paymentRows.filter((p) => p.status === "paid" && (p.paid_at || p.created_at).startsWith(currentMonth)).map((p) => p.user_id)
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
```

**Step 2: Commit**

```bash
git add app/api/admin/financial/route.ts
git commit -m "feat(admin): add financial API route with MRR, churn, revenue"
```

---

### Task 12: Create financial page

**Files:**
- Create: `app/admin/financial/page.tsx`

**Step 1: Create the financial page**

Client component with:
- 6 stat cards: MRR, ARR, Revenue this month, Ticket Médio, Churn Rate, LTV
- Revenue chart (AreaChart, stacked subscription + avulso by month)
- Revenue by plan (DonutChart)
- Recent payments table with pagination

**Step 2: Commit**

```bash
git add app/admin/financial/page.tsx
git commit -m "feat(admin): add financial dashboard page"
```

---

## Phase 5: Credits & IA Page

### Task 13: Create credits API route

**Files:**
- Create: `app/api/admin/credits/route.ts`

**Step 1: Create the credits API**

```typescript
// app/api/admin/credits/route.ts
import { apiHandler } from "@/lib/api/handler";
import { successResponse } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export const GET = apiHandler(async () => {
  await requireAdmin();
  const admin = await createAdminClient();

  const now = new Date();
  const today = now.toISOString().substring(0, 10);
  const _30dAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Parallel queries
  const [balancesRes, todayDebitsRes, last30dTxRes, zeroBalanceRes] = await Promise.all([
    admin.from("credit_balances").select("user_id, balance"),
    admin.from("credit_transactions").select("amount").lt("amount", 0).gte("created_at", `${today}T00:00:00`),
    admin.from("credit_transactions").select("user_id, amount, type, created_at").gte("created_at", _30dAgo),
    admin.from("credit_balances").select("user_id", { count: "exact" }).eq("balance", 0),
  ]);

  const balances = balancesRes.data || [];
  const totalCirculating = balances.reduce((sum, b) => sum + b.balance, 0);
  const consumedToday = (todayDebitsRes.data || []).reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const usersWithZeroCredits = zeroBalanceRes.count || 0;

  // Daily consumption (last 30 days)
  const txs = last30dTxRes.data || [];
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

  // Top 10 consumers (last 30d)
  const consumerMap: Record<string, number> = {};
  for (const tx of txs) {
    if (tx.amount < 0) {
      consumerMap[tx.user_id] = (consumerMap[tx.user_id] || 0) + Math.abs(tx.amount);
    }
  }
  const topConsumerIds = Object.entries(consumerMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([id, total]) => ({ user_id: id, total_consumed: total }));

  // Get names for top consumers
  let topConsumers = topConsumerIds;
  if (topConsumerIds.length > 0) {
    const { data: names } = await admin
      .from("profiles")
      .select("id, name, email")
      .in("id", topConsumerIds.map((c) => c.user_id));

    const nameMap = new Map((names || []).map((n) => [n.id, n]));
    topConsumers = topConsumerIds.map((c) => ({
      ...c,
      name: nameMap.get(c.user_id)?.name || "—",
      email: nameMap.get(c.user_id)?.email || "",
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

  // Users with low credits (< 5)
  const lowCreditUsers = balances
    .filter((b) => b.balance > 0 && b.balance < 5)
    .map((b) => b.user_id);

  let lowCreditUserDetails: Array<{ user_id: string; balance: number; name: string; current_plan: string }> = [];
  if (lowCreditUsers.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, name, current_plan")
      .in("id", lowCreditUsers);

    const balanceMap = new Map(balances.map((b) => [b.user_id, b.balance]));
    lowCreditUserDetails = (profiles || []).map((p) => ({
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
    lowCreditUsers: lowCreditUserDetails,
  });
}, { rateLimit: false });
```

**Step 2: Commit**

```bash
git add app/api/admin/credits/route.ts
git commit -m "feat(admin): add credits analytics API route"
```

---

### Task 14: Create credits page

**Files:**
- Create: `app/admin/credits/page.tsx`

**Step 1: Create the credits page**

Client component with:
- 4 stat cards: Credits in Circulation, Consumed Today, Avg/User/Day, Users with Zero
- Daily consumption AreaChart (30 days, consumed vs added lines)
- Top 10 consumers horizontal BarChart
- Consumption by type PieChart
- Low credit alerts list

**Step 2: Commit**

```bash
git add app/admin/credits/page.tsx
git commit -m "feat(admin): add credits analytics page"
```

---

## Phase 6: Enhanced Feedback Page

### Task 15: Enhance feedback page and API

**Files:**
- Modify: `app/admin/feedback/page.tsx` — Refactor to use admin layout components, add missing sections
- Modify: `app/api/admin/feedback/route.ts` — Add AI quality stats and filter support

**Step 1: Enhance the API with additional stats**

Add to the existing response:
- `iaQualidadeDistribution` — count by ia_qualidade value
- `iaPrecisaoDistribution` — count by ia_precisao value
- `facilidadeUsoDistribution` — count by facilidade_uso value
- Add query param support for filters: `?nps_min=&nps_max=&plan=&area=`

**Step 2: Refactor the feedback page**

Update the page to:
- Remove the standalone header/back button (admin layout provides navigation)
- Use `StatCard` and `ChartCard` components
- Add "AI Quality" section with two BarCharts (ia_qualidade and ia_precisao)
- Add "Insights" section with auto-generated text insights
- Add expandable rows in feedback table
- Keep existing CSV export
- Keep existing data loading pattern

**Step 3: Create feedback export API**

```typescript
// app/api/admin/feedback/export/route.ts
import { apiHandler } from "@/lib/api/handler";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export const GET = apiHandler(async () => {
  await requireAdmin();
  const admin = await createAdminClient();

  const { data: feedbacks } = await admin
    .from("beta_feedback")
    .select("*, profiles:user_id(name, email, practice_areas)")
    .order("created_at", { ascending: false });

  if (!feedbacks || feedbacks.length === 0) {
    return new NextResponse("Nenhum feedback encontrado", { status: 404 });
  }

  const headers = Object.keys(feedbacks[0]);
  const csvRows = [
    headers.join(","),
    ...feedbacks.map((f) =>
      headers.map((h) => {
        const val = (f as Record<string, unknown>)[h];
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
```

**Step 4: Commit**

```bash
git add app/admin/feedback/page.tsx app/api/admin/feedback/route.ts app/api/admin/feedback/export/route.ts
git commit -m "feat(admin): enhance feedback page with AI quality, insights, export API"
```

---

## Phase 7: System Health Page

### Task 16: Create system health API

**Files:**
- Create: `app/api/admin/system/health/route.ts`

**Step 1: Create the health check API**

```typescript
// app/api/admin/system/health/route.ts
import { apiHandler } from "@/lib/api/handler";
import { successResponse } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/auth";
import type { SystemHealthCheck } from "@/types/admin";

export const dynamic = "force-dynamic";

async function checkSupabase(): Promise<SystemHealthCheck> {
  const start = Date.now();
  try {
    const admin = await createAdminClient();
    const { error } = await admin.from("plans").select("id").limit(1);
    return {
      service: "Supabase",
      status: error ? "degraded" : "healthy",
      latency_ms: Date.now() - start,
      message: error?.message || null,
      checked_at: new Date().toISOString(),
    };
  } catch (e) {
    return {
      service: "Supabase",
      status: "down",
      latency_ms: Date.now() - start,
      message: e instanceof Error ? e.message : "Unknown error",
      checked_at: new Date().toISOString(),
    };
  }
}

async function checkPagarme(): Promise<SystemHealthCheck> {
  const start = Date.now();
  try {
    const apiKey = process.env.PAGARME_SECRET_KEY;
    if (!apiKey) {
      return { service: "Pagar.me", status: "degraded", latency_ms: 0, message: "API key not configured", checked_at: new Date().toISOString() };
    }
    const res = await fetch("https://api.pagar.me/core/v5/merchants", {
      headers: { Authorization: `Basic ${Buffer.from(apiKey + ":").toString("base64")}` },
      signal: AbortSignal.timeout(5000),
    });
    return {
      service: "Pagar.me",
      status: res.ok ? "healthy" : "degraded",
      latency_ms: Date.now() - start,
      message: res.ok ? null : `HTTP ${res.status}`,
      checked_at: new Date().toISOString(),
    };
  } catch (e) {
    return {
      service: "Pagar.me",
      status: "down",
      latency_ms: Date.now() - start,
      message: e instanceof Error ? e.message : "Unknown error",
      checked_at: new Date().toISOString(),
    };
  }
}

async function checkOpenAI(): Promise<SystemHealthCheck> {
  const start = Date.now();
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return { service: "OpenAI", status: "degraded", latency_ms: 0, message: "API key not configured", checked_at: new Date().toISOString() };
    }
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(5000),
    });
    return {
      service: "OpenAI",
      status: res.ok ? "healthy" : "degraded",
      latency_ms: Date.now() - start,
      message: res.ok ? null : `HTTP ${res.status}`,
      checked_at: new Date().toISOString(),
    };
  } catch (e) {
    return {
      service: "OpenAI",
      status: "down",
      latency_ms: Date.now() - start,
      message: e instanceof Error ? e.message : "Unknown error",
      checked_at: new Date().toISOString(),
    };
  }
}

export const GET = apiHandler(async () => {
  await requireAdmin();

  const checks = await Promise.all([
    checkSupabase(),
    checkPagarme(),
    checkOpenAI(),
  ]);

  // Vercel is healthy if we're responding
  checks.push({
    service: "Vercel",
    status: "healthy",
    latency_ms: null,
    message: null,
    checked_at: new Date().toISOString(),
  });

  return successResponse({ checks });
}, { rateLimit: false });
```

**Step 2: Commit**

```bash
git add app/api/admin/system/health/route.ts
git commit -m "feat(admin): add system health check API with live service pings"
```

---

### Task 17: Create system health page

**Files:**
- Create: `app/admin/system/page.tsx`

**Step 1: Create the system page**

Client component with:
- 4 service health cards (Supabase, Pagar.me, OpenAI, Vercel) showing status dot (green/yellow/red), latency, and last check time
- Refresh button to re-check all services
- Auto-refresh every 60 seconds

**Step 2: Commit**

```bash
git add app/admin/system/page.tsx
git commit -m "feat(admin): add system health monitoring page"
```

---

## Phase 8: Final Polish

### Task 18: Update Database types for payment_history

**Files:**
- Modify: `types/database.ts` — Add `PaymentHistory` interface and table definition

**Step 1: Add the type**

Add `PaymentHistory` interface and add it to `Database.public.Tables`.

**Step 2: Commit**

```bash
git add types/database.ts
git commit -m "feat(admin): add PaymentHistory type to database types"
```

---

### Task 19: Build verification and lint

**Step 1: Run lint**

Run: `npm run lint`
Expected: No new errors

**Step 2: Run build**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Fix any errors found**

**Step 4: Final commit**

```bash
git add -A
git commit -m "fix(admin): resolve build/lint issues"
```

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | 1-5 | Foundation: auth helper, types, shared components, sidebar, layout |
| 2 | 6-7 | Dashboard overview with stats API and page |
| 3 | 8-9 | Users management with list, detail, add credits |
| 4 | 10-12 | Financial: payment_history table, API, page |
| 5 | 13-14 | Credits analytics: API and page |
| 6 | 15 | Enhanced feedback page with AI quality and insights |
| 7 | 16-17 | System health checks and monitoring page |
| 8 | 18-19 | Polish: types update, build verification |

**Total: 19 tasks across 8 phases**
