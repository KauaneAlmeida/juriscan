-- ===========================================
-- Migration 009: Migrate Stripe to Pagar.me
-- Defensive: handles cases where columns may or may not exist
-- ===========================================

-- Subscriptions: rename or add pagarme columns
DO $$
BEGIN
  -- Try to rename stripe_customer_id -> pagarme_customer_id
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='subscriptions' AND column_name='stripe_customer_id') THEN
    ALTER TABLE public.subscriptions RENAME COLUMN stripe_customer_id TO pagarme_customer_id;
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='subscriptions' AND column_name='pagarme_customer_id') THEN
    ALTER TABLE public.subscriptions ADD COLUMN pagarme_customer_id TEXT;
  END IF;

  -- Try to rename stripe_subscription_id -> pagarme_subscription_id
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='subscriptions' AND column_name='stripe_subscription_id') THEN
    ALTER TABLE public.subscriptions RENAME COLUMN stripe_subscription_id TO pagarme_subscription_id;
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='subscriptions' AND column_name='pagarme_subscription_id') THEN
    ALTER TABLE public.subscriptions ADD COLUMN pagarme_subscription_id TEXT;
  END IF;
END $$;

ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'credit_card';

-- Profiles: rename or add pagarme_customer_id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='stripe_customer_id') THEN
    ALTER TABLE public.profiles RENAME COLUMN stripe_customer_id TO pagarme_customer_id;
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='pagarme_customer_id') THEN
    ALTER TABLE public.profiles ADD COLUMN pagarme_customer_id TEXT;
  END IF;
END $$;

-- Plans: add Pagar.me plan ID column
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS pagarme_plan_id TEXT;

-- Processed webhook events: rename or add event_id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='processed_webhook_events' AND column_name='stripe_event_id') THEN
    ALTER TABLE public.processed_webhook_events RENAME COLUMN stripe_event_id TO event_id;
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='processed_webhook_events' AND column_name='event_id') THEN
    ALTER TABLE public.processed_webhook_events ADD COLUMN event_id TEXT UNIQUE;
  END IF;
END $$;

DROP INDEX IF EXISTS idx_processed_webhook_events_stripe_id;
CREATE INDEX IF NOT EXISTS idx_processed_webhook_events_event_id ON public.processed_webhook_events(event_id);

-- Deactivate old plans, insert new ones
UPDATE public.plans SET is_active = false;
INSERT INTO public.plans (name, slug, price_monthly, monthly_credits, features, is_active) VALUES
  ('Free', 'free', 0.00, 20, '["20 creditos (unico)", "Chat juridico com IA"]', true),
  ('Starter', 'starter', 69.00, 100, '["100 creditos/mes", "Chat juridico com IA", "Analise de documentos PDF", "Historico de conversas", "Suporte por email"]', true),
  ('Pro', 'pro', 129.00, 300, '["300 creditos/mes", "Tudo do Starter", "Jurimetria avancada", "Analise preditiva", "Suporte prioritario"]', true),
  ('Business', 'business', 299.00, 800, '["800 creditos/mes", "Tudo do Pro", "Analises em lote", "Relatorios ilimitados", "Suporte dedicado"]', true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, price_monthly = EXCLUDED.price_monthly,
  monthly_credits = EXCLUDED.monthly_credits, features = EXCLUDED.features, is_active = true;
