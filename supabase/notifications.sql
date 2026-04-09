-- ============================================
-- Tabela de Notificações + Função de Envio
-- Execute este SQL no Supabase Dashboard (SQL Editor)
-- ============================================

-- 1. Criar tabela notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('analysis_completed', 'report_generated', 'deadline_alert', 'low_credits', 'product_update', 'system')),
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 2. Índices
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- 3. RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Usuário pode ver suas próprias notificações
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Usuário pode atualizar suas próprias notificações (marcar como lida)
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role pode inserir notificações (backend)
CREATE POLICY "Service role can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- 4. Função send_notification que verifica preferências
CREATE OR REPLACE FUNCTION public.send_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_data jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id uuid;
  v_should_send boolean := true;
  v_prefs record;
BEGIN
  -- Verificar preferências do usuário
  SELECT * INTO v_prefs
  FROM public.notification_preferences
  WHERE user_id = p_user_id;

  IF FOUND THEN
    CASE p_type
      WHEN 'analysis_completed' THEN v_should_send := v_prefs.analysis_completed;
      WHEN 'report_generated' THEN v_should_send := v_prefs.report_generated;
      WHEN 'deadline_alert' THEN v_should_send := v_prefs.deadline_alerts;
      WHEN 'low_credits' THEN v_should_send := v_prefs.low_credits;
      WHEN 'product_update' THEN v_should_send := v_prefs.product_updates;
      WHEN 'system' THEN v_should_send := true; -- System notifications always sent
      ELSE v_should_send := true;
    END CASE;
  END IF;

  IF NOT v_should_send THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (p_user_id, p_type, p_title, p_message, p_data)
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

-- 5. Habilitar Realtime na tabela notifications
-- IMPORTANTE: Também habilitar no Dashboard do Supabase:
-- Database > Replication > Selecionar tabela "notifications"
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
