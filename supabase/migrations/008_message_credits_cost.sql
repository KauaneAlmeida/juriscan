-- Adicionar coluna credits_cost para rastrear custo de créditos por mensagem
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS credits_cost INTEGER DEFAULT NULL;

COMMENT ON COLUMN public.messages.credits_cost IS 'Custo em créditos desta mensagem (NULL = sem dados, mensagens antigas)';
