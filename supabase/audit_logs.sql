-- Migration: Criar tabela audit_logs para registro de eventos de segurança
-- Executar manualmente no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_event ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

-- Habilitar RLS sem policies de SELECT para usuários
-- Somente service_role (server-side) pode inserir e ler
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: apenas service_role pode inserir (via createAdminClient)
CREATE POLICY "Service role can insert audit logs"
  ON audit_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy: apenas service_role pode ler (para dashboards admin)
CREATE POLICY "Service role can read audit logs"
  ON audit_logs FOR SELECT
  TO service_role
  USING (true);
