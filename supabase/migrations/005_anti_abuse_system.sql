-- ===========================================
-- Migration: Sistema Anti-Abuso de Créditos
-- Previne farming de créditos gratuitos via múltiplas contas
-- ===========================================

-- 1. Alterar trigger para dar 0 créditos no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );

  -- Criar saldo de créditos inicial (0 - créditos são concedidos após verificação de email)
  INSERT INTO public.credit_balances (user_id, balance)
  VALUES (NEW.id, 0);

  -- Criar preferências de notificação padrão
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Adicionar colunas à tabela profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_normalized TEXT,
  ADD COLUMN IF NOT EXISTS welcome_credits_granted BOOLEAN DEFAULT FALSE;

-- 3. Criar tabela signup_attempts
CREATE TABLE IF NOT EXISTS public.signup_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address TEXT NOT NULL,
  email TEXT NOT NULL,
  email_normalized TEXT NOT NULL,
  fingerprint TEXT,
  blocked BOOLEAN DEFAULT FALSE,
  block_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_signup_attempts_ip ON public.signup_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_signup_attempts_email_normalized ON public.signup_attempts(email_normalized);
CREATE INDEX IF NOT EXISTS idx_signup_attempts_created_at ON public.signup_attempts(created_at);
CREATE INDEX IF NOT EXISTS idx_signup_attempts_fingerprint ON public.signup_attempts(fingerprint);

-- RLS: apenas service role pode acessar
ALTER TABLE public.signup_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No client access to signup attempts"
  ON public.signup_attempts FOR ALL
  USING (false);

-- Índice para busca de email normalizado em profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email_normalized ON public.profiles(email_normalized);

-- 4. Criar RPC grant_welcome_credits
CREATE OR REPLACE FUNCTION public.grant_welcome_credits(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_already_granted BOOLEAN;
BEGIN
  -- Verificar se créditos já foram concedidos
  SELECT welcome_credits_granted INTO v_already_granted
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  -- Se não encontrou o perfil ou já foi concedido, retornar false
  IF v_already_granted IS NULL OR v_already_granted = TRUE THEN
    RETURN FALSE;
  END IF;

  -- Conceder 20 créditos usando a função existente
  PERFORM public.add_credits(
    p_user_id,
    20,
    'Créditos de boas-vindas',
    'MONTHLY_ALLOCATION'::transaction_type
  );

  -- Marcar como concedido
  UPDATE public.profiles
  SET welcome_credits_granted = TRUE
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Limpar tentativas antigas (mais de 30 dias) - pode ser executado via cron
-- DELETE FROM public.signup_attempts WHERE created_at < NOW() - INTERVAL '30 days';
