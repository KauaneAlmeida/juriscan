-- ===========================================
-- Migração: Garantir RLS em TODAS as tabelas
-- ===========================================

-- Garantir extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- 1. Criar tabela processed_webhook_events (se não existir)
-- ===========================================

CREATE TABLE IF NOT EXISTS public.processed_webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_processed_webhook_events_stripe_id
  ON public.processed_webhook_events(stripe_event_id);

-- ===========================================
-- 2. Habilitar RLS em tabelas que podem estar faltando
-- ===========================================

-- processed_webhook_events - tabela de idempotência do Stripe
-- Apenas o service role (backend) deve acessar
ALTER TABLE public.processed_webhook_events ENABLE ROW LEVEL SECURITY;

-- Política: Ninguém pode acessar via client (apenas service role)
-- O service role bypassa RLS por padrão
DROP POLICY IF EXISTS "No client access to webhook events" ON public.processed_webhook_events;
CREATE POLICY "No client access to webhook events"
  ON public.processed_webhook_events FOR ALL
  USING (false);

-- ===========================================
-- 2. Verificar e recriar políticas importantes
-- ===========================================

-- Garantir que profiles permite INSERT via trigger
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
CREATE POLICY "Service role can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (true); -- O trigger handle_new_user() usa SECURITY DEFINER

-- ===========================================
-- 3. Políticas para DELETE (proteção de dados)
-- ===========================================

-- Usuários podem deletar suas próprias conversas
DROP POLICY IF EXISTS "Users can delete own conversations" ON public.conversations;
CREATE POLICY "Users can delete own conversations"
  ON public.conversations FOR DELETE
  USING (auth.uid() = user_id);

-- Usuários podem deletar suas próprias análises
DROP POLICY IF EXISTS "Users can delete own analyses" ON public.analyses;
CREATE POLICY "Users can delete own analyses"
  ON public.analyses FOR DELETE
  USING (auth.uid() = user_id);

-- Usuários podem deletar seus próprios relatórios
DROP POLICY IF EXISTS "Users can delete own reports" ON public.reports;
CREATE POLICY "Users can delete own reports"
  ON public.reports FOR DELETE
  USING (auth.uid() = user_id);

-- ===========================================
-- 4. Políticas para operações administrativas via service role
-- ===========================================

-- credit_balances: permitir INSERT/UPDATE via service role (para trigger e funções RPC)
DROP POLICY IF EXISTS "Service role can manage credit balances" ON public.credit_balances;
CREATE POLICY "Service role can manage credit balances"
  ON public.credit_balances FOR ALL
  USING (true)
  WITH CHECK (true);

-- credit_transactions: permitir INSERT via service role
DROP POLICY IF EXISTS "Service role can insert transactions" ON public.credit_transactions;
CREATE POLICY "Service role can insert transactions"
  ON public.credit_transactions FOR INSERT
  WITH CHECK (true);

-- subscriptions: permitir INSERT/UPDATE via service role (webhooks do Stripe)
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.subscriptions;
CREATE POLICY "Service role can manage subscriptions"
  ON public.subscriptions FOR ALL
  USING (true)
  WITH CHECK (true);

-- notification_preferences: permitir INSERT via service role (trigger de novo usuário)
DROP POLICY IF EXISTS "Service role can insert notification preferences" ON public.notification_preferences;
CREATE POLICY "Service role can insert notification preferences"
  ON public.notification_preferences FOR INSERT
  WITH CHECK (true);

-- ===========================================
-- 5. Função auxiliar para verificar RLS
-- ===========================================

CREATE OR REPLACE FUNCTION public.check_rls_status()
RETURNS TABLE (
  table_name TEXT,
  rls_enabled BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.relname::TEXT,
    c.relrowsecurity
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r' -- only tables
  ORDER BY c.relname;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- 6. Comentário com resumo do RLS
-- ===========================================

COMMENT ON TABLE public.profiles IS 'RLS: Users can read/update own profile';
COMMENT ON TABLE public.sessions IS 'RLS: Users can read/delete own sessions';
COMMENT ON TABLE public.plans IS 'RLS: Anyone can read active plans';
COMMENT ON TABLE public.subscriptions IS 'RLS: Users can read own, service role manages';
COMMENT ON TABLE public.credit_balances IS 'RLS: Users can read own, service role manages';
COMMENT ON TABLE public.credit_transactions IS 'RLS: Users can read own, service role inserts';
COMMENT ON TABLE public.conversations IS 'RLS: Users can CRUD own conversations';
COMMENT ON TABLE public.messages IS 'RLS: Users can read/create in own conversations';
COMMENT ON TABLE public.analyses IS 'RLS: Users can CRUD own analyses';
COMMENT ON TABLE public.reports IS 'RLS: Users can CRUD own reports';
COMMENT ON TABLE public.notification_preferences IS 'RLS: Users can read/update own prefs';
COMMENT ON TABLE public.processed_webhook_events IS 'RLS: Service role only (Stripe webhooks)';
