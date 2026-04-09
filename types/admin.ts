// types/admin.ts

export interface AdminDashboardStats {
  totalUsers: number;
  newUsers7d: number;
  newUsers30d: number;
  activeUsers24h: number;
  activeUsers7d: number;
  totalCreditsRemaining: number;
  avgCreditsRemaining: number;
  creditsConsumed30d: number;
  totalFeedbacks: number;
  avgNps: number;
  npsScore: number;
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
  subscription: AdminSubscriptionInfo | null;
}

export interface AdminSubscriptionInfo {
  id: string;
  status: string;
  plan_id: string;
  payment_method: string;
  current_period_start: string;
  current_period_end: string;
  plans: { name: string; slug: string; price_monthly: number } | null;
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
  user_id: string;
  amount_cents: number;
  status: string;
  payment_method: string | null;
  type: string;
  metadata: Record<string, unknown>;
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

export interface AdminFinancialData {
  mrr: number;
  arr: number;
  revenueThisMonth: number;
  ticketMedio: number;
  churnRate: number;
  ltv: number;
  activeSubscriptions: number;
  revenueByMonth: AdminRevenueStats[];
  revenueByPlan: Record<string, number>;
  recentPayments: AdminPayment[];
}

export interface AdminCreditStats {
  totalCirculating: number;
  consumedToday: number;
  avgPerUserPerDay: number;
  usersWithZeroCredits: number;
  dailyConsumption: Array<{ date: string; consumed: number; added: number }>;
  topConsumers: Array<{ user_id: string; name: string; email: string; total_consumed: number }>;
  consumptionByType: Record<string, number>;
  lowCreditUsers: Array<{ user_id: string; balance: number; name: string; current_plan: string }>;
}

export interface SystemHealthCheck {
  service: string;
  status: "healthy" | "degraded" | "down";
  latency_ms: number | null;
  message: string | null;
  checked_at: string;
}
