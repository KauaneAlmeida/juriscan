-- ===========================================
-- MIGRATION: Adicionar colunas Stripe ao profiles
-- Execute este arquivo no Supabase SQL Editor
-- ===========================================

-- Adicionar coluna stripe_customer_id se não existir
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Adicionar coluna current_plan se não existir
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS current_plan TEXT DEFAULT 'free';

-- Criar índice para stripe_customer_id (útil para lookups)
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id
ON public.profiles(stripe_customer_id)
WHERE stripe_customer_id IS NOT NULL;

-- Verificar se as colunas foram adicionadas
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('stripe_customer_id', 'current_plan');
