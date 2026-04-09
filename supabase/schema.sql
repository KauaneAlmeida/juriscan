-- ===========================================
-- JURISCAN - Schema do Banco de Dados
-- Execute este arquivo no Supabase SQL Editor
-- ===========================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- ENUMS
-- ===========================================

CREATE TYPE user_role AS ENUM ('USER', 'ADMIN', 'SUPPORT');
CREATE TYPE user_status AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'DELETED');
CREATE TYPE device_type AS ENUM ('DESKTOP', 'MOBILE', 'TABLET');
CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'PAUSED', 'TRIALING');
CREATE TYPE transaction_type AS ENUM ('CREDIT_PURCHASE', 'MONTHLY_ALLOCATION', 'ANALYSIS_DEBIT', 'REPORT_DEBIT', 'REFUND', 'ADJUSTMENT');
CREATE TYPE analysis_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
CREATE TYPE confidence_level AS ENUM ('VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH');
CREATE TYPE conversation_status AS ENUM ('ACTIVE', 'ARCHIVED', 'DELETED');
CREATE TYPE message_role AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');
CREATE TYPE report_type AS ENUM ('PREDICTIVE_ANALYSIS', 'JURIMETRICS', 'EXECUTIVE_SUMMARY', 'RELATOR_PROFILE', 'CUSTOM');
CREATE TYPE report_status AS ENUM ('DRAFT', 'GENERATING', 'COMPLETED', 'FAILED');

-- ===========================================
-- TABELA: profiles (extensão do auth.users)
-- ===========================================

CREATE TABLE public.profiles (
id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
email TEXT NOT NULL,
name TEXT NOT NULL,
oab TEXT,
oab_verified BOOLEAN DEFAULT FALSE,
oab_verified_at TIMESTAMPTZ,
phone TEXT,
avatar_url TEXT,
law_firm TEXT,
practice_areas TEXT[] DEFAULT '{}',
role user_role DEFAULT 'USER',
status user_status DEFAULT 'ACTIVE',
terms_accepted_at TIMESTAMPTZ,
privacy_accepted_at TIMESTAMPTZ,
marketing_consent BOOLEAN DEFAULT FALSE,
analytics_consent BOOLEAN DEFAULT TRUE,
pagarme_customer_id TEXT,
current_plan TEXT DEFAULT 'free',
email_normalized TEXT,
welcome_credits_granted BOOLEAN DEFAULT FALSE,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW(),
deleted_at TIMESTAMPTZ,
last_login_at TIMESTAMPTZ
);

-- ===========================================
-- TABELA: sessions (sessões ativas)
-- ===========================================

CREATE TABLE public.sessions (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
device_info TEXT,
device_type device_type DEFAULT 'DESKTOP',
ip_address TEXT,
location TEXT,
last_active_at TIMESTAMPTZ DEFAULT NOW(),
expires_at TIMESTAMPTZ NOT NULL,
created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- TABELA: plans (planos de assinatura)
-- ===========================================

CREATE TABLE public.plans (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
name TEXT NOT NULL,
slug TEXT UNIQUE NOT NULL,
description TEXT,
price_monthly DECIMAL(10, 2) NOT NULL,
monthly_credits INTEGER NOT NULL,
features JSONB DEFAULT '[]',
pagarme_plan_id TEXT,
is_active BOOLEAN DEFAULT TRUE,
created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir planos padrão
INSERT INTO public.plans (name, slug, price_monthly, monthly_credits, features) VALUES
('Free', 'free', 0.00, 20, '["20 creditos (unico)", "Chat juridico com IA"]'),
('Starter', 'starter', 69.00, 100, '["100 creditos/mes", "Chat juridico com IA", "Analise de documentos PDF", "Historico de conversas", "Suporte por email"]'),
('Pro', 'pro', 129.00, 300, '["300 creditos/mes", "Tudo do Starter", "Jurimetria avancada", "Analise preditiva", "Suporte prioritario"]'),
('Business', 'business', 299.00, 800, '["800 creditos/mes", "Tudo do Pro", "Analises em lote", "Relatorios ilimitados", "Suporte dedicado"]');

-- ===========================================
-- TABELA: subscriptions (assinaturas)
-- ===========================================

CREATE TABLE public.subscriptions (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
plan_id UUID NOT NULL REFERENCES public.plans(id),
status subscription_status DEFAULT 'ACTIVE',
pagarme_customer_id TEXT,
pagarme_subscription_id TEXT,
payment_method TEXT DEFAULT 'credit_card',
current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
cancel_at_period_end BOOLEAN DEFAULT FALSE,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- TABELA: credit_balances (saldo de créditos)
-- ===========================================

CREATE TABLE public.credit_balances (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
balance INTEGER DEFAULT 0,
updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- TABELA: credit_transactions (transações de créditos)
-- ===========================================

CREATE TABLE public.credit_transactions (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
type transaction_type NOT NULL,
amount INTEGER NOT NULL,
balance INTEGER NOT NULL,
description TEXT NOT NULL,
reference_id UUID,
reference_type TEXT,
created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- TABELA: conversations (conversas do chat)
-- ===========================================

CREATE TABLE public.conversations (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
title TEXT,
status conversation_status DEFAULT 'ACTIVE',
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- TABELA: messages (mensagens do chat)
-- ===========================================

CREATE TABLE public.messages (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
role message_role NOT NULL,
content TEXT NOT NULL,
metadata JSONB,
created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- TABELA: analyses (análises jurídicas)
-- ===========================================

CREATE TABLE public.analyses (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
process_number TEXT,
case_type TEXT,
tribunal TEXT,
court TEXT,
judge TEXT,
relator TEXT,
prediction DECIMAL(5, 2),
confidence confidence_level,
status analysis_status DEFAULT 'PENDING',
summary TEXT,
key_points JSONB,
recommendations JSONB,
risks JSONB,
credits_used INTEGER DEFAULT 0,
processing_time INTEGER,
ai_model TEXT,
error_message TEXT,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW(),
completed_at TIMESTAMPTZ
);

-- ===========================================
-- TABELA: reports (relatórios gerados)
-- ===========================================

CREATE TABLE public.reports (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
analysis_id UUID REFERENCES public.analyses(id) ON DELETE SET NULL,
title TEXT NOT NULL,
type report_type NOT NULL,
version TEXT DEFAULT '1.0',
content JSONB DEFAULT '{}',
file_url TEXT,
file_size INTEGER,
page_count INTEGER,
credits_used INTEGER DEFAULT 0,
status report_status DEFAULT 'DRAFT',
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW(),
generated_at TIMESTAMPTZ
);

-- ===========================================
-- TABELA: notification_preferences (preferências de notificação)
-- ===========================================

CREATE TABLE public.notification_preferences (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
analysis_completed BOOLEAN DEFAULT TRUE,
report_generated BOOLEAN DEFAULT TRUE,
deadline_alerts BOOLEAN DEFAULT TRUE,
low_credits BOOLEAN DEFAULT TRUE,
product_updates BOOLEAN DEFAULT FALSE,
marketing_emails BOOLEAN DEFAULT FALSE,
push_enabled BOOLEAN DEFAULT FALSE,
updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- ÍNDICES
-- ===========================================

CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON public.sessions(expires_at);
CREATE INDEX idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON public.credit_transactions(created_at);
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX idx_analyses_status ON public.analyses(status);
CREATE INDEX idx_analyses_process_number ON public.analyses(process_number);
CREATE INDEX idx_reports_user_id ON public.reports(user_id);
CREATE INDEX idx_reports_analysis_id ON public.reports(analysis_id);
CREATE INDEX idx_profiles_email_normalized ON public.profiles(email_normalized);
CREATE UNIQUE INDEX idx_profiles_oab_unique ON public.profiles(oab) WHERE oab IS NOT NULL AND oab != '';

-- ===========================================
-- TRIGGERS: Atualizar updated_at automaticamente
-- ===========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = NOW();
RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analyses_updated_at
BEFORE UPDATE ON public.analyses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
BEFORE UPDATE ON public.reports
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- TRIGGER: Criar profile automaticamente após signup
-- ===========================================

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

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===========================================
-- ROW LEVEL SECURITY (RLS)
-- ===========================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policies para profiles
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Policies para sessions
CREATE POLICY "Users can view own sessions"
ON public.sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
ON public.sessions FOR DELETE
USING (auth.uid() = user_id);

-- Policies para subscriptions
CREATE POLICY "Users can view own subscription"
ON public.subscriptions FOR SELECT
USING (auth.uid() = user_id);

-- Policies para credit_balances
CREATE POLICY "Users can view own credit balance"
ON public.credit_balances FOR SELECT
USING (auth.uid() = user_id);

-- Policies para credit_transactions
CREATE POLICY "Users can view own transactions"
ON public.credit_transactions FOR SELECT
USING (auth.uid() = user_id);

-- Policies para conversations
CREATE POLICY "Users can view own conversations"
ON public.conversations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create conversations"
ON public.conversations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
ON public.conversations FOR UPDATE
USING (auth.uid() = user_id);

-- Policies para messages
CREATE POLICY "Users can view messages from own conversations"
ON public.messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = messages.conversation_id
    AND conversations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create messages in own conversations"
ON public.messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = conversation_id
    AND conversations.user_id = auth.uid()
  )
);

-- Policies para analyses
CREATE POLICY "Users can view own analyses"
ON public.analyses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create analyses"
ON public.analyses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analyses"
ON public.analyses FOR UPDATE
USING (auth.uid() = user_id);

-- Policies para reports
CREATE POLICY "Users can view own reports"
ON public.reports FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create reports"
ON public.reports FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reports"
ON public.reports FOR UPDATE
USING (auth.uid() = user_id);

-- Policies para notification_preferences
CREATE POLICY "Users can view own notification preferences"
ON public.notification_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
ON public.notification_preferences FOR UPDATE
USING (auth.uid() = user_id);

-- Plans são públicos (somente leitura)
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active plans"
ON public.plans FOR SELECT
USING (is_active = TRUE);

-- ===========================================
-- TABELA: processed_webhook_events (idempotency para webhooks)
-- ===========================================

CREATE TABLE public.processed_webhook_events (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
event_id TEXT UNIQUE NOT NULL,
event_type TEXT NOT NULL,
processed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_processed_webhook_events_event_id ON public.processed_webhook_events(event_id);

-- RLS para processed_webhook_events (apenas service role)
ALTER TABLE public.processed_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No client access to webhook events"
ON public.processed_webhook_events FOR ALL
USING (false);

-- Limpar eventos antigos (mais de 7 dias) - pode ser executado via cron
-- DELETE FROM public.processed_webhook_events WHERE processed_at < NOW() - INTERVAL '7 days';

-- ===========================================
-- FUNÇÃO RPC: deduct_credits (dedução atômica de créditos)
-- ===========================================

CREATE OR REPLACE FUNCTION public.deduct_credits(
p_user_id UUID,
p_amount INTEGER,
p_description TEXT DEFAULT 'Uso de créditos',
p_transaction_type transaction_type DEFAULT 'ANALYSIS_DEBIT'
) RETURNS BOOLEAN AS $$
DECLARE
v_balance INTEGER;
BEGIN
-- Lock the row and get current balance
SELECT balance INTO v_balance
FROM public.credit_balances
WHERE user_id = p_user_id
FOR UPDATE;

-- Check if user has enough credits
IF v_balance IS NULL OR v_balance < p_amount THEN
  RETURN FALSE;
END IF;

-- Deduct credits atomically
UPDATE public.credit_balances
SET balance = balance - p_amount,
    updated_at = NOW()
WHERE user_id = p_user_id;

-- Record the transaction
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

-- ===========================================
-- FUNÇÃO RPC: add_credits (adição atômica de créditos)
-- ===========================================

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

-- Record the transaction
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

-- ===========================================
-- TABELA: signup_attempts (tentativas de cadastro para anti-abuso)
-- ===========================================

CREATE TABLE public.signup_attempts (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
ip_address TEXT NOT NULL,
email TEXT NOT NULL,
email_normalized TEXT NOT NULL,
fingerprint TEXT,
blocked BOOLEAN DEFAULT FALSE,
block_reason TEXT,
created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_signup_attempts_ip ON public.signup_attempts(ip_address);
CREATE INDEX idx_signup_attempts_email_normalized ON public.signup_attempts(email_normalized);
CREATE INDEX idx_signup_attempts_created_at ON public.signup_attempts(created_at);
CREATE INDEX idx_signup_attempts_fingerprint ON public.signup_attempts(fingerprint);

ALTER TABLE public.signup_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No client access to signup attempts"
ON public.signup_attempts FOR ALL
USING (false);

-- ===========================================
-- FUNÇÃO RPC: grant_welcome_credits (concessão idempotente de créditos de boas-vindas)
-- ===========================================

CREATE OR REPLACE FUNCTION public.grant_welcome_credits(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
v_already_granted BOOLEAN;
BEGIN
SELECT welcome_credits_granted INTO v_already_granted
FROM public.profiles
WHERE id = p_user_id
FOR UPDATE;

IF v_already_granted IS NULL OR v_already_granted = TRUE THEN
  RETURN FALSE;
END IF;

PERFORM public.add_credits(
  p_user_id,
  20,
  'Créditos de boas-vindas',
  'MONTHLY_ALLOCATION'::transaction_type
);

UPDATE public.profiles
SET welcome_credits_granted = TRUE
WHERE id = p_user_id;

RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- FIM DO SCHEMA
-- ===========================================
