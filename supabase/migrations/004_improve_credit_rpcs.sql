-- =========================================================
-- Migração: Melhorar RPCs de créditos com parâmetros
-- =========================================================

-- Atualizar deduct_credits para aceitar descrição e tipo de transação
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT DEFAULT 'Uso de créditos',
  p_transaction_type transaction_type DEFAULT 'ANALYSIS_DEBIT'
) RETURNS BOOLEAN AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  -- Lock na linha do usuário para evitar race conditions
  SELECT balance INTO v_balance
  FROM public.credit_balances
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Verificar se usuário existe e tem saldo suficiente
  IF v_balance IS NULL OR v_balance < p_amount THEN
    RETURN FALSE;
  END IF;

  -- Deduzir créditos atomicamente
  UPDATE public.credit_balances
  SET balance = balance - p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Registrar transação no histórico (mesma transação = atomicidade)
  INSERT INTO public.credit_transactions (user_id, type, amount, balance, description)
  VALUES (
    p_user_id,
    p_transaction_type,
    -p_amount,
    v_balance - p_amount,
    p_description
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar add_credits (já aceita descrição, sem mudança funcional)
CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT DEFAULT 'Créditos adicionados',
  p_transaction_type transaction_type DEFAULT 'CREDIT_PURCHASE'
) RETURNS INTEGER AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Upsert balance
  INSERT INTO public.credit_balances (user_id, balance, updated_at)
  VALUES (p_user_id, p_amount, NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET balance = credit_balances.balance + p_amount,
      updated_at = NOW()
  RETURNING balance INTO v_new_balance;

  -- Registrar transação
  INSERT INTO public.credit_transactions (user_id, type, amount, balance, description)
  VALUES (
    p_user_id,
    p_transaction_type,
    p_amount,
    v_new_balance,
    p_description
  );

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Índice para consultas de histórico por tipo
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type
  ON public.credit_transactions(type);

-- Índice para consultas de histórico por data
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_created
  ON public.credit_transactions(user_id, created_at DESC);
