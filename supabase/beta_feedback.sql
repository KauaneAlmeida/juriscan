-- Beta Feedback table for beta testers
CREATE TABLE IF NOT EXISTS public.beta_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- NPS (0-10)
  nps_score INTEGER NOT NULL CHECK (nps_score >= 0 AND nps_score <= 10),

  -- Ratings (1-5)
  rating_chat_ia INTEGER CHECK (rating_chat_ia >= 1 AND rating_chat_ia <= 5),
  rating_analise_pdf INTEGER CHECK (rating_analise_pdf >= 1 AND rating_analise_pdf <= 5),
  rating_relatorios INTEGER CHECK (rating_relatorios >= 1 AND rating_relatorios <= 5),
  rating_jurimetria INTEGER CHECK (rating_jurimetria >= 1 AND rating_jurimetria <= 5),
  rating_interface INTEGER CHECK (rating_interface >= 1 AND rating_interface <= 5),
  rating_velocidade INTEGER CHECK (rating_velocidade >= 1 AND rating_velocidade <= 5),

  -- Features
  feature_mais_util TEXT,
  feature_menos_util TEXT,
  feature_faltando TEXT,

  -- AI quality
  ia_qualidade TEXT CHECK (ia_qualidade IN ('excelente', 'boa', 'regular', 'ruim', 'pessima')),
  ia_precisao TEXT CHECK (ia_precisao IN ('muito_precisa', 'precisa', 'razoavel', 'imprecisa', 'muito_imprecisa')),
  ia_comparacao TEXT,

  -- Usability
  facilidade_uso TEXT CHECK (facilidade_uso IN ('muito_facil', 'facil', 'neutro', 'dificil', 'muito_dificil')),
  primeiro_uso_intuitivo BOOLEAN,

  -- Pricing
  preco_justo TEXT CHECK (preco_justo IN ('barato', 'justo', 'caro', 'muito_caro')),
  plano_interesse TEXT CHECK (plano_interesse IN ('free', 'starter', 'pro', 'business', 'nenhum')),
  valor_max_mensal INTEGER,

  -- Profile
  area_juridica TEXT,
  tamanho_escritorio TEXT CHECK (tamanho_escritorio IN ('solo', '2_5', '6_15', '16_50', '50_plus')),

  -- Open text
  ponto_forte TEXT,
  ponto_fraco TEXT,
  sugestao_melhoria TEXT,
  depoimento TEXT,
  permite_depoimento BOOLEAN DEFAULT false,

  -- Meta
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.beta_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feedback"
  ON public.beta_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own feedback"
  ON public.beta_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own feedback"
  ON public.beta_feedback FOR UPDATE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_beta_feedback_user ON public.beta_feedback(user_id);
CREATE INDEX idx_beta_feedback_created ON public.beta_feedback(created_at DESC);
CREATE INDEX idx_beta_feedback_nps ON public.beta_feedback(nps_score);
