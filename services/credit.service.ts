import type { SupabaseClient } from "@supabase/supabase-js";
import type { TransactionType } from "@/lib/credits/costs";

interface DeductCreditsResult {
  success: boolean;
  newBalance?: number;
  error?: string;
}

/**
 * Deduct credits from user's balance using atomic RPC.
 * The RPC uses FOR UPDATE row locking to prevent race conditions.
 */
export async function deductCredits(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  userId: string,
  amount: number,
  description: string = "Uso de créditos",
  transactionType: TransactionType = "ANALYSIS_DEBIT"
): Promise<DeductCreditsResult> {
  // Kill-switch para testes: quando DISABLE_CREDITS=true, nada é debitado
  // e o retorno simula sucesso para liberar todas as operações pagas.
  if (process.env.DISABLE_CREDITS === "true") {
    return { success: true };
  }

  const { data, error } = await supabase.rpc("deduct_credits", {
    p_user_id: userId,
    p_amount: amount,
    p_description: description,
    p_transaction_type: transactionType,
  });

  if (error) {
    console.error("[Credits] RPC deduct_credits error:", error.message);
    return { success: false, error: "Erro ao deduzir créditos" };
  }

  // RPC returns boolean: true = success, false = insufficient balance
  if (data === false) {
    return { success: false, error: "Créditos insuficientes" };
  }

  return { success: true };
}

/**
 * Add credits to user's balance using atomic RPC.
 * The RPC uses upsert + transaction insert in a single atomic operation.
 */
export async function addCredits(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  userId: string,
  amount: number,
  description: string = "Créditos adicionados",
  transactionType: TransactionType = "CREDIT_PURCHASE"
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  const { data, error } = await supabase.rpc("add_credits", {
    p_user_id: userId,
    p_amount: amount,
    p_description: description,
    p_transaction_type: transactionType,
  });

  if (error) {
    console.error("[Credits] RPC add_credits error:", error.message);
    return { success: false, error: "Erro ao adicionar créditos" };
  }

  // RPC returns the new balance as integer
  return { success: true, newBalance: data as number };
}

/**
 * Reset credits to a fixed amount (used for monthly plan renewal).
 * Sets balance to exactly the plan amount instead of accumulating.
 */
export async function resetCredits(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  userId: string,
  amount: number,
  description: string = "Créditos mensais renovados",
  transactionType: TransactionType = "MONTHLY_ALLOCATION"
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  // Set balance to exact amount (reset, not add)
  const { error: balanceError } = await supabase
    .from("credit_balances")
    .upsert(
      { user_id: userId, balance: amount, updated_at: new Date().toISOString() } as never,
      { onConflict: "user_id" }
    );

  if (balanceError) {
    console.error("[Credits] resetCredits balance error:", balanceError.message);
    return { success: false, error: "Erro ao resetar créditos" };
  }

  // Log the transaction
  await supabase
    .from("credit_transactions")
    .insert({
      user_id: userId,
      amount,
      type: transactionType,
      description,
      created_at: new Date().toISOString(),
    } as never);

  return { success: true, newBalance: amount };
}
