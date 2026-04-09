# Admin Dashboard Design — Juriscan

**Date:** 2026-03-03
**Status:** Approved

## Overview

Complete admin dashboard at `/admin` with real-time business metrics, user management, financial analytics, credit monitoring, beta feedback analysis, and system health monitoring. Access restricted to users with `profiles.role = 'ADMIN'`.

## Architecture

### Auth (dual-layer)
1. **Server-side pages:** Each admin Server Component checks role via `createServerSupabaseClient()` → fetch profile → redirect if not ADMIN
2. **API routes:** Shared `requireAdmin()` helper using `apiHandler()` + admin role validation
3. **Middleware:** Existing middleware already redirects unauthenticated users; admin pages handle role check server-side

### Layout
- Separate `app/admin/layout.tsx` with its own sidebar, independent from user `AppShell`
- `AdminSidebar` — Navy dark (`#0B1120`) with gold accents (`#D4A843`)
- Responsive: fixed 256px (desktop) → icons-only 64px (tablet) → drawer (mobile)

### Data access
- All admin queries use `createAdminClient()` (service role key) to bypass RLS
- Database functions with `SECURITY DEFINER` for queries involving `auth.users`
- Shared helper: `lib/admin/auth.ts` → `requireAdmin()`

## Database Changes

### New table: `payment_history`
```sql
CREATE TABLE public.payment_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  pagarme_charge_id TEXT,
  amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_payment_history_user ON public.payment_history(user_id);
CREATE INDEX idx_payment_history_status ON public.payment_history(status);
CREATE INDEX idx_payment_history_paid_at ON public.payment_history(paid_at DESC);
```

### RPC Functions
- `admin_get_dashboard_stats()` — Aggregated metrics (user counts, credits, feedback)
- `admin_get_users_list(search, plan_filter, status_filter, sort_by, page, page_size)` — Paginated user list
- `admin_get_revenue_stats(months)` — Monthly revenue from payment_history
- `admin_nps_breakdown()` — NPS calculation

## API Routes

```
GET  /api/admin/stats              → Dashboard overview metrics
GET  /api/admin/users              → Paginated user list
GET  /api/admin/users/[id]         → Single user details
POST /api/admin/users/[id]/credits → Admin grant credits
GET  /api/admin/financial          → Revenue, MRR, payments
GET  /api/admin/credits            → Credit usage analytics
GET  /api/admin/feedback           → (existing, enhanced)
GET  /api/admin/feedback/export    → CSV export
GET  /api/admin/system/health      → Service health checks
```

## Pages

| Route | Purpose |
|-------|---------|
| `/admin` | Redirect to `/admin/dashboard` |
| `/admin/dashboard` | 6 stat cards + 4 charts + activity feed |
| `/admin/users` | Searchable/filterable user table + detail/credit modals |
| `/admin/financial` | MRR/ARR/churn cards + revenue charts + payment table |
| `/admin/credits` | Usage cards + consumption charts + top users + alerts |
| `/admin/feedback` | Enhanced existing page in new admin layout |
| `/admin/system` | Live service health + error logs + latency metrics |

## Shared Components

- `StatCard` — Metric card with icon, value, subtext, colored left border, trend
- `ChartCard` — White card wrapper with title for Recharts
- `AdminSidebar` — Navigation with sections
- `UserTable` — Sortable/filterable/paginated
- `DataTable` — Generic reusable table component
- `AdminLoadingSkeleton` — Skeleton states for cards/charts/tables

## Design System

- Sidebar: `#0B1120` bg, white/gray text, gold active state
- Cards: white bg, `rounded-xl`, `shadow-sm`, 4px colored left border
- Charts: Recharts with navy tooltips, `#E2E8F0` grid lines
- Tables: `#F1F5F9` header, `#EFF6FF` hover, plan badges
- Responsive: 3-col → 2-col → 1-col grid

## Implementation Phases

**Phase 1:** Layout + Auth + Shared Components + Dashboard
**Phase 2:** Users page + Financial page
**Phase 3:** Credits page + Enhanced Feedback page
**Phase 4:** System health page + Polish

## Decisions

- RPC functions over SQL views (auth.users access requires SECURITY DEFINER)
- New `payment_history` table for accurate financial reporting
- Integrate/enhance existing feedback page rather than rebuild
- Real health checks (live pings) for system page
- Incremental delivery: layout + dashboard + feedback first
