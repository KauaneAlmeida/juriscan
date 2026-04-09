-- ===========================================
-- Migração: Adicionar suporte a attachments nas mensagens
-- ===========================================

-- Adicionar coluna de attachments (JSONB)
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';

-- Estrutura do attachment:
-- {
--   "id": "uuid",
--   "type": "file" | "image" | "audio",
--   "name": "documento.pdf",
--   "url": "https://...",
--   "size": 1024000,
--   "mime_type": "application/pdf",
--   "metadata": {
--     "pages": 10,           -- para PDFs
--     "width": 800,          -- para imagens
--     "height": 600,         -- para imagens
--     "duration": 30,        -- para áudio (segundos)
--     "transcription": "..." -- para áudio (texto transcrito)
--     "extracted_text": "..." -- para PDFs (texto extraído)
--   }
-- }

-- Índice para busca em attachments (GIN index para JSONB)
CREATE INDEX IF NOT EXISTS idx_messages_attachments ON public.messages USING GIN (attachments);

-- ===========================================
-- Storage: Bucket para attachments do chat
-- ===========================================
-- NOTA: Execute isto no Supabase Dashboard > Storage ou via API

-- Criar bucket (se não existir)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments',
  'chat-attachments',
  false,
  10485760, -- 10MB
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'audio/webm',
    'audio/mp3',
    'audio/mpeg',
    'audio/ogg',
    'audio/wav'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'audio/webm',
    'audio/mp3',
    'audio/mpeg',
    'audio/ogg',
    'audio/wav'
  ];

-- ===========================================
-- Políticas RLS para Storage
-- ===========================================

-- Permitir usuários fazerem upload em sua própria pasta
CREATE POLICY "Users can upload own chat attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir usuários verem seus próprios arquivos
CREATE POLICY "Users can view own chat attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir usuários deletarem seus próprios arquivos
CREATE POLICY "Users can delete own chat attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'chat-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
