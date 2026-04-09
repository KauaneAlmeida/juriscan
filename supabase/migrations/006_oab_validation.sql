-- ===========================================
-- Migration 006: Validação obrigatória de OAB
-- Adiciona colunas de verificação, índice único e atualiza trigger
-- ===========================================

-- Colunas de verificação de OAB
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS oab_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS oab_verified_at TIMESTAMPTZ;

-- Índice único parcial: impede OAB duplicada mas permite múltiplos NULLs
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_oab_unique
  ON public.profiles (oab)
  WHERE oab IS NOT NULL AND oab != '';

-- Atualizar trigger para salvar OAB dos metadados do signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, oab)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'oab', '')), '')
  );

  -- Criar saldo de créditos inicial (0 - créditos concedidos após verificação de email)
  INSERT INTO public.credit_balances (user_id, balance)
  VALUES (NEW.id, 0);

  -- Criar preferências de notificação padrão
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
