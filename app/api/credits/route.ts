import { apiHandler, successResponse } from "@/lib/api";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Force dynamic rendering for authenticated routes
export const dynamic = "force-dynamic";

interface CreditBalance {
  balance: number;
}

interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

interface Subscription {
  id: string;
  user_id: string;
  pagarme_subscription_id: string;
  plan_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

// GET /api/credits - Get user's credit balance and history
export const GET = apiHandler(async (_request, { user }) => {
  const supabase = await createServerSupabaseClient();

  // Get credit balance
  const { data: balanceData } = await supabase
    .from("credit_balances")
    .select("balance")
    .eq("user_id", user!.id)
    .single();

  const balance = balanceData as CreditBalance | null;

  // Get recent transactions
  const { data: transactionsData } = await supabase
    .from("credit_transactions")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const transactions = (transactionsData || []) as CreditTransaction[];

  // Get subscription info
  const { data: subscriptionData } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user!.id)
    .eq("status", "active")
    .single();

  const subscription = subscriptionData as Subscription | null;

  return successResponse({
    balance: balance?.balance || 0,
    transactions,
    subscription,
  });
});
