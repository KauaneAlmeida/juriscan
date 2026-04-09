# Beta Feedback System — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a complete beta feedback collection system with a 5-step wizard form, Supabase storage, and an admin analytics dashboard.

**Architecture:** Multi-step wizard form at `/feedback` using controlled React state with localStorage draft persistence. API route for CRUD. Admin dashboard at `/admin/feedback` with Recharts visualizations and CSV export. All protected by Supabase Auth + RLS.

**Tech Stack:** Next.js App Router, React Query, Zod v4, Supabase (RLS), Recharts, Tailwind CSS, Lucide icons, Sonner toasts.

---

## Task 1: Database — SQL migration file

**Files:**
- Create: `supabase/beta_feedback.sql`

**Step 1: Write the SQL migration**

```sql
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
```

**Step 2: Run the SQL in Supabase Dashboard**

Go to Supabase Dashboard → SQL Editor → paste and run the migration.

**Step 3: Commit**

```bash
git add supabase/beta_feedback.sql
git commit -m "feat: add beta_feedback table migration"
```

---

## Task 2: Types & Validation — Zod schema + TypeScript types

**Files:**
- Create: `types/feedback.ts`
- Create: `lib/validation/feedback.ts`

**Step 1: Create TypeScript types**

Create `types/feedback.ts`:

```typescript
export interface BetaFeedback {
  id: string;
  user_id: string;
  nps_score: number;
  rating_chat_ia: number | null;
  rating_analise_pdf: number | null;
  rating_relatorios: number | null;
  rating_jurimetria: number | null;
  rating_interface: number | null;
  rating_velocidade: number | null;
  feature_mais_util: string | null;
  feature_menos_util: string | null;
  feature_faltando: string | null;
  ia_qualidade: string | null;
  ia_precisao: string | null;
  ia_comparacao: string | null;
  facilidade_uso: string | null;
  primeiro_uso_intuitivo: boolean | null;
  preco_justo: string | null;
  plano_interesse: string | null;
  valor_max_mensal: number | null;
  area_juridica: string | null;
  tamanho_escritorio: string | null;
  ponto_forte: string | null;
  ponto_fraco: string | null;
  sugestao_melhoria: string | null;
  depoimento: string | null;
  permite_depoimento: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeedbackFormData {
  // Step 1
  nps_score: number | null;
  rating_interface: number | null;
  facilidade_uso: string | null;
  primeiro_uso_intuitivo: boolean | null;
  // Step 2
  rating_chat_ia: number | null;
  rating_analise_pdf: number | null;
  rating_relatorios: number | null;
  rating_jurimetria: number | null;
  rating_velocidade: number | null;
  feature_mais_util: string;
  feature_menos_util: string;
  feature_faltando: string;
  // Step 3
  ia_qualidade: string | null;
  ia_precisao: string | null;
  ia_comparacao: string;
  // Step 4
  preco_justo: string | null;
  plano_interesse: string | null;
  valor_max_mensal: number | null;
  area_juridica: string | null;
  tamanho_escritorio: string | null;
  // Step 5
  ponto_forte: string;
  ponto_fraco: string;
  sugestao_melhoria: string;
  depoimento: string;
  permite_depoimento: boolean;
}

export interface FeedbackStats {
  totalResponses: number;
  npsScore: number;
  npsBreakdown: { promoters: number; passives: number; detractors: number };
  avgRatings: {
    chat_ia: number | null;
    analise_pdf: number | null;
    relatorios: number | null;
    jurimetria: number | null;
    interface: number | null;
    velocidade: number | null;
  };
  pricingDistribution: Record<string, number>;
  planDistribution: Record<string, number>;
  avgValorMensal: number | null;
  authorizedTestimonials: Array<{
    depoimento: string;
    user_name: string;
    area_juridica: string | null;
    created_at: string;
  }>;
}
```

**Step 2: Create Zod validation schema**

Create `lib/validation/feedback.ts`:

```typescript
import { z } from "zod";

export const betaFeedbackSchema = z.object({
  nps_score: z.number().int().min(0).max(10),
  rating_chat_ia: z.number().int().min(1).max(5).nullable().optional(),
  rating_analise_pdf: z.number().int().min(1).max(5).nullable().optional(),
  rating_relatorios: z.number().int().min(1).max(5).nullable().optional(),
  rating_jurimetria: z.number().int().min(1).max(5).nullable().optional(),
  rating_interface: z.number().int().min(1).max(5).nullable().optional(),
  rating_velocidade: z.number().int().min(1).max(5).nullable().optional(),
  feature_mais_util: z.string().max(1000).optional().default(""),
  feature_menos_util: z.string().max(1000).optional().default(""),
  feature_faltando: z.string().max(1000).optional().default(""),
  ia_qualidade: z.enum(["excelente", "boa", "regular", "ruim", "pessima"]).nullable().optional(),
  ia_precisao: z.enum(["muito_precisa", "precisa", "razoavel", "imprecisa", "muito_imprecisa"]).nullable().optional(),
  ia_comparacao: z.string().max(2000).optional().default(""),
  facilidade_uso: z.enum(["muito_facil", "facil", "neutro", "dificil", "muito_dificil"]).nullable().optional(),
  primeiro_uso_intuitivo: z.boolean().nullable().optional(),
  preco_justo: z.enum(["barato", "justo", "caro", "muito_caro"]).nullable().optional(),
  plano_interesse: z.enum(["free", "starter", "pro", "business", "nenhum"]).nullable().optional(),
  valor_max_mensal: z.number().int().min(0).max(10000).nullable().optional(),
  area_juridica: z.string().max(100).nullable().optional(),
  tamanho_escritorio: z.enum(["solo", "2_5", "6_15", "16_50", "50_plus"]).nullable().optional(),
  ponto_forte: z.string().max(2000).optional().default(""),
  ponto_fraco: z.string().max(2000).optional().default(""),
  sugestao_melhoria: z.string().max(2000).optional().default(""),
  depoimento: z.string().max(3000).optional().default(""),
  permite_depoimento: z.boolean().optional().default(false),
});

export type BetaFeedbackInput = z.infer<typeof betaFeedbackSchema>;
```

**Step 3: Commit**

```bash
git add types/feedback.ts lib/validation/feedback.ts
git commit -m "feat: add beta feedback types and Zod schema"
```

---

## Task 3: API Route — `/api/feedback`

**Files:**
- Create: `app/api/feedback/route.ts`

**Step 1: Create the API route**

Create `app/api/feedback/route.ts`:

```typescript
import { apiHandler, parseBody } from "@/lib/api/handler";
import { successResponse } from "@/lib/api/response";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { betaFeedbackSchema } from "@/lib/validation/feedback";

export const dynamic = "force-dynamic";

// GET — fetch current user's feedback (if exists)
export const GET = apiHandler(async (_request, { user }) => {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("beta_feedback")
    .select("*")
    .eq("user_id", user!.id)
    .maybeSingle();

  if (error) throw error;

  return successResponse({ feedback: data });
});

// POST — submit feedback (insert or update)
export const POST = apiHandler(async (request, { user }) => {
  const body = await parseBody(request, betaFeedbackSchema);
  const supabase = await createServerSupabaseClient();

  // Check if user already submitted
  const { data: existing } = await supabase
    .from("beta_feedback")
    .select("id")
    .eq("user_id", user!.id)
    .maybeSingle();

  if (existing) {
    // Update existing feedback
    const { data, error } = await supabase
      .from("beta_feedback")
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .eq("user_id", user!.id)
      .select()
      .single();

    if (error) throw error;
    return successResponse({ feedback: data });
  }

  // Insert new feedback
  const { data, error } = await supabase
    .from("beta_feedback")
    .insert({ ...body, user_id: user!.id })
    .select()
    .single();

  if (error) throw error;
  return successResponse({ feedback: data }, 201);
});
```

**Step 2: Commit**

```bash
git add app/api/feedback/route.ts
git commit -m "feat: add feedback API route (GET + POST)"
```

---

## Task 4: API Route — `/api/admin/feedback` (admin dashboard data)

**Files:**
- Create: `app/api/admin/feedback/route.ts`

**Step 1: Create admin API route**

Create `app/api/admin/feedback/route.ts`:

```typescript
import { apiHandler } from "@/lib/api/handler";
import { successResponse } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET — admin-only: fetch all feedbacks + stats
export const GET = apiHandler(async (_request, { user }) => {
  // Verify admin role
  const supabase = await createServerSupabaseClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  if (profile?.role !== "ADMIN") {
    return new Response(JSON.stringify({ error: { code: "FORBIDDEN", message: "Acesso negado" } }), { status: 403 });
  }

  // Use admin client to bypass RLS
  const admin = await createAdminClient();

  // Fetch all feedbacks with user info
  const { data: feedbacks, error } = await admin
    .from("beta_feedback")
    .select("*, profiles:user_id(name, practice_areas)")
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Calculate stats
  const total = feedbacks?.length || 0;
  const npsScores = feedbacks?.map((f: Record<string, unknown>) => f.nps_score as number) || [];
  const promoters = npsScores.filter((s: number) => s >= 9).length;
  const passives = npsScores.filter((s: number) => s >= 7 && s <= 8).length;
  const detractors = npsScores.filter((s: number) => s <= 6).length;
  const npsScore = total > 0 ? Math.round(((promoters - detractors) / total) * 100) : 0;

  // Average ratings
  const avgRating = (field: string) => {
    const values = feedbacks?.map((f: Record<string, unknown>) => f[field] as number | null).filter((v): v is number => v !== null) || [];
    return values.length > 0 ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10 : null;
  };

  // Distribution counters
  const countField = (field: string) => {
    const counts: Record<string, number> = {};
    feedbacks?.forEach((f: Record<string, unknown>) => {
      const val = f[field] as string | null;
      if (val) counts[val] = (counts[val] || 0) + 1;
    });
    return counts;
  };

  // Average valor mensal
  const valorValues = feedbacks?.map((f: Record<string, unknown>) => f.valor_max_mensal as number | null).filter((v): v is number => v !== null) || [];
  const avgValorMensal = valorValues.length > 0 ? Math.round(valorValues.reduce((a, b) => a + b, 0) / valorValues.length) : null;

  // Authorized testimonials
  const testimonials = feedbacks
    ?.filter((f: Record<string, unknown>) => f.permite_depoimento && f.depoimento)
    .map((f: Record<string, unknown>) => ({
      depoimento: f.depoimento as string,
      user_name: (f.profiles as Record<string, unknown>)?.name as string || "Anônimo",
      area_juridica: f.area_juridica as string | null,
      created_at: f.created_at as string,
    })) || [];

  return successResponse({
    feedbacks,
    stats: {
      totalResponses: total,
      npsScore,
      npsBreakdown: { promoters, passives, detractors },
      avgRatings: {
        chat_ia: avgRating("rating_chat_ia"),
        analise_pdf: avgRating("rating_analise_pdf"),
        relatorios: avgRating("rating_relatorios"),
        jurimetria: avgRating("rating_jurimetria"),
        interface: avgRating("rating_interface"),
        velocidade: avgRating("rating_velocidade"),
      },
      pricingDistribution: countField("preco_justo"),
      planDistribution: countField("plano_interesse"),
      avgValorMensal,
      authorizedTestimonials: testimonials,
    },
  });
});
```

**Step 2: Commit**

```bash
git add app/api/admin/feedback/route.ts
git commit -m "feat: add admin feedback API with stats aggregation"
```

---

## Task 5: Hook — `useFeedback`

**Files:**
- Create: `hooks/useFeedback.ts`

**Step 1: Create the custom hook**

Create `hooks/useFeedback.ts`:

```typescript
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { BetaFeedback, FeedbackFormData } from "@/types/feedback";

const INITIAL_FORM_DATA: FeedbackFormData = {
  nps_score: null,
  rating_interface: null,
  facilidade_uso: null,
  primeiro_uso_intuitivo: null,
  rating_chat_ia: null,
  rating_analise_pdf: null,
  rating_relatorios: null,
  rating_jurimetria: null,
  rating_velocidade: null,
  feature_mais_util: "",
  feature_menos_util: "",
  feature_faltando: "",
  ia_qualidade: null,
  ia_precisao: null,
  ia_comparacao: "",
  preco_justo: null,
  plano_interesse: null,
  valor_max_mensal: null,
  area_juridica: null,
  tamanho_escritorio: null,
  ponto_forte: "",
  ponto_fraco: "",
  sugestao_melhoria: "",
  depoimento: "",
  permite_depoimento: false,
};

export { INITIAL_FORM_DATA };

export function useFeedback() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<BetaFeedback | null>({
    queryKey: ["beta-feedback"],
    queryFn: async () => {
      const res = await fetch("/api/feedback");
      if (!res.ok) throw new Error("Erro ao buscar feedback");
      const result = await res.json();
      return result.data.feedback;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (formData: FeedbackFormData) => {
      const payload = {
        ...formData,
        nps_score: formData.nps_score!,
        // Convert empty strings to null for optional text fields
        feature_mais_util: formData.feature_mais_util || undefined,
        feature_menos_util: formData.feature_menos_util || undefined,
        feature_faltando: formData.feature_faltando || undefined,
        ia_comparacao: formData.ia_comparacao || undefined,
        ponto_forte: formData.ponto_forte || undefined,
        ponto_fraco: formData.ponto_fraco || undefined,
        sugestao_melhoria: formData.sugestao_melhoria || undefined,
        depoimento: formData.depoimento || undefined,
      };

      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || "Erro ao enviar feedback");
      }

      const result = await res.json();
      return result.data.feedback;
    },
    onSuccess: (feedback) => {
      queryClient.setQueryData(["beta-feedback"], feedback);
    },
  });

  return {
    existingFeedback: data ?? null,
    isLoading,
    error,
    submitFeedback: submitMutation.mutateAsync,
    isSubmitting: submitMutation.isPending,
    submitError: submitMutation.error,
  };
}
```

**Step 2: Commit**

```bash
git add hooks/useFeedback.ts
git commit -m "feat: add useFeedback hook with React Query"
```

---

## Task 6: Reusable UI Components — StarRating + NpsSelector

**Files:**
- Create: `components/Feedback/StarRating.tsx`
- Create: `components/Feedback/NpsSelector.tsx`

**Step 1: Create StarRating component**

Create `components/Feedback/StarRating.tsx`:

```tsx
"use client";

import { Star } from "lucide-react";

interface StarRatingProps {
  value: number | null;
  onChange: (value: number) => void;
  label: string;
}

export default function StarRating({ value, onChange, label }: StarRatingProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-gray-700 flex-1">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-1 transition-transform hover:scale-110 active:scale-95"
          >
            <Star
              className={`w-6 h-6 transition-colors ${
                value && star <= value
                  ? "fill-amber-400 text-amber-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Create NpsSelector component**

Create `components/Feedback/NpsSelector.tsx`:

```tsx
"use client";

interface NpsSelectorProps {
  value: number | null;
  onChange: (value: number) => void;
}

export default function NpsSelector({ value, onChange }: NpsSelectorProps) {
  const getColor = (n: number) => {
    if (n <= 6) return value === n ? "bg-red-500 text-white ring-2 ring-red-300" : "bg-red-50 text-red-700 hover:bg-red-100";
    if (n <= 8) return value === n ? "bg-amber-500 text-white ring-2 ring-amber-300" : "bg-amber-50 text-amber-700 hover:bg-amber-100";
    return value === n ? "bg-emerald-500 text-white ring-2 ring-emerald-300" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100";
  };

  return (
    <div>
      <p className="text-sm font-medium text-gray-800 mb-3">
        Em uma escala de 0 a 10, qual a probabilidade de recomendar o Juriscan para um colega?
      </p>
      <div className="flex gap-1.5 sm:gap-2 flex-wrap justify-center">
        {Array.from({ length: 11 }, (_, i) => i).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-lg text-sm font-semibold transition-all ${getColor(n)}`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-400 px-1">
        <span>Nada provável</span>
        <span>Muito provável</span>
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add components/Feedback/StarRating.tsx components/Feedback/NpsSelector.tsx
git commit -m "feat: add StarRating and NpsSelector components"
```

---

## Task 7: Wizard Steps — Step components (1-5)

**Files:**
- Create: `components/Feedback/steps/Step1Nps.tsx`
- Create: `components/Feedback/steps/Step2Features.tsx`
- Create: `components/Feedback/steps/Step3Ai.tsx`
- Create: `components/Feedback/steps/Step4Pricing.tsx`
- Create: `components/Feedback/steps/Step5Open.tsx`

**Step 1: Create Step1Nps (NPS + Usability)**

Create `components/Feedback/steps/Step1Nps.tsx`:

```tsx
"use client";

import NpsSelector from "@/components/Feedback/NpsSelector";
import StarRating from "@/components/Feedback/StarRating";
import type { FeedbackFormData } from "@/types/feedback";

interface Props {
  data: FeedbackFormData;
  onChange: (updates: Partial<FeedbackFormData>) => void;
}

const FACILIDADE_OPTIONS = [
  { value: "muito_facil", label: "Muito fácil" },
  { value: "facil", label: "Fácil" },
  { value: "neutro", label: "Neutro" },
  { value: "dificil", label: "Difícil" },
  { value: "muito_dificil", label: "Muito difícil" },
];

export default function Step1Nps({ data, onChange }: Props) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-1">Satisfação Geral</h2>
        <p className="text-sm text-gray-500 mb-6">Como está sendo sua experiência com o Juriscan?</p>
      </div>

      <NpsSelector
        value={data.nps_score}
        onChange={(v) => onChange({ nps_score: v })}
      />

      <div>
        <StarRating
          label="Avaliação geral da interface"
          value={data.rating_interface}
          onChange={(v) => onChange({ rating_interface: v })}
        />
      </div>

      <div>
        <p className="text-sm font-medium text-gray-800 mb-3">
          O Juriscan foi fácil de usar na primeira vez?
        </p>
        <div className="flex flex-wrap gap-2">
          {FACILIDADE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ facilidade_uso: opt.value })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                data.facilidade_uso === opt.value
                  ? "bg-primary text-white ring-2 ring-primary/30"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-800 mb-3">
          Conseguiu usar sem precisar de ajuda?
        </p>
        <div className="flex gap-3">
          {[true, false].map((val) => (
            <button
              key={String(val)}
              type="button"
              onClick={() => onChange({ primeiro_uso_intuitivo: val })}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                data.primeiro_uso_intuitivo === val
                  ? "bg-primary text-white ring-2 ring-primary/30"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {val ? "Sim" : "Não"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Create Step2Features (Feature Ratings)**

Create `components/Feedback/steps/Step2Features.tsx`:

```tsx
"use client";

import StarRating from "@/components/Feedback/StarRating";
import type { FeedbackFormData } from "@/types/feedback";

interface Props {
  data: FeedbackFormData;
  onChange: (updates: Partial<FeedbackFormData>) => void;
}

const RATINGS = [
  { key: "rating_chat_ia" as const, label: "Chat com IA Jurídica" },
  { key: "rating_analise_pdf" as const, label: "Análise de Documentos PDF" },
  { key: "rating_relatorios" as const, label: "Geração de Relatórios" },
  { key: "rating_jurimetria" as const, label: "Jurimetria" },
  { key: "rating_velocidade" as const, label: "Velocidade de Resposta" },
];

export default function Step2Features({ data, onChange }: Props) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-1">Avaliação por Funcionalidade</h2>
        <p className="text-sm text-gray-500 mb-6">Avalie cada funcionalidade que testou (pode deixar em branco as que não usou)</p>
      </div>

      <div className="space-y-4">
        {RATINGS.map((r) => (
          <StarRating
            key={r.key}
            label={r.label}
            value={data[r.key]}
            onChange={(v) => onChange({ [r.key]: v })}
          />
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Qual funcionalidade você mais gostou?
        </label>
        <input
          type="text"
          value={data.feature_mais_util}
          onChange={(e) => onChange({ feature_mais_util: e.target.value })}
          placeholder="Ex: Chat com IA, Análise de PDF..."
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Qual funcionalidade menos gostou ou não funcionou bem?
        </label>
        <input
          type="text"
          value={data.feature_menos_util}
          onChange={(e) => onChange({ feature_menos_util: e.target.value })}
          placeholder="Ex: Jurimetria, Relatórios..."
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          O que está faltando no Juriscan?
        </label>
        <input
          type="text"
          value={data.feature_faltando}
          onChange={(e) => onChange({ feature_faltando: e.target.value })}
          placeholder="Funcionalidade que gostaria de ver..."
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
        />
      </div>
    </div>
  );
}
```

**Step 3: Create Step3Ai (AI Quality)**

Create `components/Feedback/steps/Step3Ai.tsx`:

```tsx
"use client";

import type { FeedbackFormData } from "@/types/feedback";

interface Props {
  data: FeedbackFormData;
  onChange: (updates: Partial<FeedbackFormData>) => void;
}

const QUALIDADE_OPTIONS = [
  { value: "excelente", label: "Excelente" },
  { value: "boa", label: "Boa" },
  { value: "regular", label: "Regular" },
  { value: "ruim", label: "Ruim" },
  { value: "pessima", label: "Péssima" },
];

const PRECISAO_OPTIONS = [
  { value: "muito_precisa", label: "Muito precisas" },
  { value: "precisa", label: "Precisas" },
  { value: "razoavel", label: "Razoáveis" },
  { value: "imprecisa", label: "Imprecisas" },
  { value: "muito_imprecisa", label: "Muito imprecisas" },
];

export default function Step3Ai({ data, onChange }: Props) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-1">Qualidade da IA</h2>
        <p className="text-sm text-gray-500 mb-6">Como você avalia as respostas e análises geradas pela IA?</p>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-800 mb-3">
          Como você avalia a qualidade das respostas da IA?
        </p>
        <div className="flex flex-wrap gap-2">
          {QUALIDADE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ ia_qualidade: opt.value })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                data.ia_qualidade === opt.value
                  ? "bg-primary text-white ring-2 ring-primary/30"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-800 mb-3">
          As análises jurídicas foram precisas e confiáveis?
        </p>
        <div className="flex flex-wrap gap-2">
          {PRECISAO_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ ia_precisao: opt.value })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                data.ia_precisao === opt.value
                  ? "bg-primary text-white ring-2 ring-primary/30"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Você usa outras ferramentas de IA no trabalho? Como o Juriscan se compara?
        </label>
        <textarea
          value={data.ia_comparacao}
          onChange={(e) => onChange({ ia_comparacao: e.target.value })}
          placeholder="Ex: Uso ChatGPT, mas o Juriscan é mais preciso para análise jurídica..."
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-none"
        />
      </div>
    </div>
  );
}
```

**Step 4: Create Step4Pricing (Pricing + Profile)**

Create `components/Feedback/steps/Step4Pricing.tsx`:

```tsx
"use client";

import type { FeedbackFormData } from "@/types/feedback";

interface Props {
  data: FeedbackFormData;
  onChange: (updates: Partial<FeedbackFormData>) => void;
}

const PRECO_OPTIONS = [
  { value: "barato", label: "Barato" },
  { value: "justo", label: "Justo" },
  { value: "caro", label: "Caro" },
  { value: "muito_caro", label: "Muito caro" },
];

const PLANO_OPTIONS = [
  { value: "free", label: "Free (grátis)" },
  { value: "starter", label: "Starter — R$ 69/mês" },
  { value: "pro", label: "Pro — R$ 129/mês", popular: true },
  { value: "business", label: "Business — R$ 299/mês" },
  { value: "nenhum", label: "Nenhum (não assinaria)" },
];

const AREAS = [
  "Trabalhista", "Civil", "Criminal", "Tributário", "Empresarial",
  "Previdenciário", "Família", "Ambiental", "Digital", "Administrativo",
];

const TAMANHO_OPTIONS = [
  { value: "solo", label: "Advocacia solo" },
  { value: "2_5", label: "2-5 pessoas" },
  { value: "6_15", label: "6-15 pessoas" },
  { value: "16_50", label: "16-50 pessoas" },
  { value: "50_plus", label: "50+ pessoas" },
];

export default function Step4Pricing({ data, onChange }: Props) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-1">Pricing e Perfil</h2>
        <p className="text-sm text-gray-500 mb-6">Nos ajude a entender o valor percebido e seu perfil profissional</p>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-800 mb-3">Considerando os planos, o preço é:</p>
        <div className="flex flex-wrap gap-2">
          {PRECO_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ preco_justo: opt.value })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                data.preco_justo === opt.value
                  ? "bg-primary text-white ring-2 ring-primary/30"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-800 mb-3">Qual plano escolheria?</p>
        <div className="space-y-2">
          {PLANO_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ plano_interesse: opt.value })}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${
                data.plano_interesse === opt.value
                  ? "bg-primary text-white ring-2 ring-primary/30"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {opt.label}
              {opt.popular && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  data.plano_interesse === opt.value ? "bg-white/20" : "bg-amber-100 text-amber-700"
                }`}>
                  Mais popular
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Valor máximo mensal que pagaria (R$)
        </label>
        <input
          type="number"
          min={0}
          max={10000}
          value={data.valor_max_mensal ?? ""}
          onChange={(e) => onChange({ valor_max_mensal: e.target.value ? Number(e.target.value) : null })}
          placeholder="Ex: 150"
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Área de atuação principal
        </label>
        <select
          value={data.area_juridica ?? ""}
          onChange={(e) => onChange({ area_juridica: e.target.value || null })}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none bg-white"
        >
          <option value="">Selecione...</option>
          {AREAS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
          <option value="Outro">Outro</option>
        </select>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-800 mb-3">Tamanho do escritório</p>
        <div className="flex flex-wrap gap-2">
          {TAMANHO_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ tamanho_escritorio: opt.value })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                data.tamanho_escritorio === opt.value
                  ? "bg-primary text-white ring-2 ring-primary/30"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Step 5: Create Step5Open (Open Feedback + Testimonial)**

Create `components/Feedback/steps/Step5Open.tsx`:

```tsx
"use client";

import type { FeedbackFormData } from "@/types/feedback";

interface Props {
  data: FeedbackFormData;
  onChange: (updates: Partial<FeedbackFormData>) => void;
}

export default function Step5Open({ data, onChange }: Props) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-1">Feedback Aberto</h2>
        <p className="text-sm text-gray-500 mb-6">Suas palavras nos ajudam a construir um produto melhor</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Qual o maior ponto forte do Juriscan?
        </label>
        <textarea
          value={data.ponto_forte}
          onChange={(e) => onChange({ ponto_forte: e.target.value })}
          placeholder="O que mais te impressionou..."
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Qual o maior ponto fraco ou o que mais precisa melhorar?
        </label>
        <textarea
          value={data.ponto_fraco}
          onChange={(e) => onChange({ ponto_fraco: e.target.value })}
          placeholder="O que te frustrou ou pode melhorar..."
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Alguma sugestão específica de melhoria?
        </label>
        <textarea
          value={data.sugestao_melhoria}
          onChange={(e) => onChange({ sugestao_melhoria: e.target.value })}
          placeholder="Ideias, funcionalidades, melhorias..."
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-none"
        />
      </div>

      <div className="border-t border-gray-200 pt-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Gostaria de deixar um depoimento sobre sua experiência?
        </label>
        <p className="text-xs text-gray-400 mb-2">Podemos usar no site com sua autorização</p>
        <textarea
          value={data.depoimento}
          onChange={(e) => onChange({ depoimento: e.target.value })}
          placeholder="Conte como o Juriscan tem ajudado no seu dia a dia..."
          rows={4}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-none"
        />
        <label className="flex items-center gap-2 mt-3 cursor-pointer">
          <input
            type="checkbox"
            checked={data.permite_depoimento}
            onChange={(e) => onChange({ permite_depoimento: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30"
          />
          <span className="text-sm text-gray-600">
            Autorizo o uso do meu depoimento no site do Juriscan
          </span>
        </label>
      </div>
    </div>
  );
}
```

**Step 6: Commit**

```bash
git add components/Feedback/steps/
git commit -m "feat: add all 5 feedback wizard step components"
```

---

## Task 8: Feedback Page — `/feedback` with wizard + localStorage draft

**Files:**
- Create: `app/feedback/page.tsx`

**Step 1: Create the feedback page**

Create `app/feedback/page.tsx`:

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import AppShell from "@/components/AppShell";
import Step1Nps from "@/components/Feedback/steps/Step1Nps";
import Step2Features from "@/components/Feedback/steps/Step2Features";
import Step3Ai from "@/components/Feedback/steps/Step3Ai";
import Step4Pricing from "@/components/Feedback/steps/Step4Pricing";
import Step5Open from "@/components/Feedback/steps/Step5Open";
import { useFeedback, INITIAL_FORM_DATA } from "@/hooks/useFeedback";
import type { FeedbackFormData } from "@/types/feedback";

const STEPS = ["Satisfação", "Funcionalidades", "Qualidade da IA", "Pricing", "Feedback"];
const DRAFT_KEY = "juriscan_feedback_draft";

export default function FeedbackPage() {
  const router = useRouter();
  const { existingFeedback, isLoading, submitFeedback, isSubmitting } = useFeedback();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<FeedbackFormData>(INITIAL_FORM_DATA);

  // Load draft from localStorage or existing feedback
  useEffect(() => {
    if (existingFeedback) {
      setFormData({
        nps_score: existingFeedback.nps_score,
        rating_interface: existingFeedback.rating_interface,
        facilidade_uso: existingFeedback.facilidade_uso,
        primeiro_uso_intuitivo: existingFeedback.primeiro_uso_intuitivo,
        rating_chat_ia: existingFeedback.rating_chat_ia,
        rating_analise_pdf: existingFeedback.rating_analise_pdf,
        rating_relatorios: existingFeedback.rating_relatorios,
        rating_jurimetria: existingFeedback.rating_jurimetria,
        rating_velocidade: existingFeedback.rating_velocidade,
        feature_mais_util: existingFeedback.feature_mais_util || "",
        feature_menos_util: existingFeedback.feature_menos_util || "",
        feature_faltando: existingFeedback.feature_faltando || "",
        ia_qualidade: existingFeedback.ia_qualidade,
        ia_precisao: existingFeedback.ia_precisao,
        ia_comparacao: existingFeedback.ia_comparacao || "",
        preco_justo: existingFeedback.preco_justo,
        plano_interesse: existingFeedback.plano_interesse,
        valor_max_mensal: existingFeedback.valor_max_mensal,
        area_juridica: existingFeedback.area_juridica,
        tamanho_escritorio: existingFeedback.tamanho_escritorio,
        ponto_forte: existingFeedback.ponto_forte || "",
        ponto_fraco: existingFeedback.ponto_fraco || "",
        sugestao_melhoria: existingFeedback.sugestao_melhoria || "",
        depoimento: existingFeedback.depoimento || "",
        permite_depoimento: existingFeedback.permite_depoimento,
      });
      return;
    }

    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        setFormData(JSON.parse(draft));
      } catch {
        // ignore corrupted draft
      }
    }
  }, [existingFeedback]);

  // Save draft to localStorage
  useEffect(() => {
    if (!existingFeedback && !submitted) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
    }
  }, [formData, existingFeedback, submitted]);

  const handleChange = useCallback((updates: Partial<FeedbackFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const canAdvance = step === 0 ? formData.nps_score !== null : true;

  const handleSubmit = async () => {
    if (formData.nps_score === null) {
      toast.error("O NPS é obrigatório");
      setStep(0);
      return;
    }

    try {
      await submitFeedback(formData);
      localStorage.removeItem(DRAFT_KEY);
      setSubmitted(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar feedback");
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppShell>
    );
  }

  if (submitted) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh] p-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Obrigado pelo seu feedback!</h2>
            <p className="text-gray-500 mb-6">
              Sua opinião é fundamental para melhorarmos o Juriscan. Cada resposta nos ajuda a construir uma ferramenta melhor para advogados.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors"
            >
              Voltar ao Dashboard
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto p-4 sm:p-6 pb-32 sm:pb-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-800">
            {existingFeedback ? "Editar Feedback" : "Feedback Beta"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {existingFeedback ? "Atualize suas respostas" : "Leva apenas 3 minutos"}
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">
              Etapa {step + 1} de {STEPS.length}
            </span>
            <span className="text-xs text-gray-400">{STEPS[step]}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
          {step === 0 && <Step1Nps data={formData} onChange={handleChange} />}
          {step === 1 && <Step2Features data={formData} onChange={handleChange} />}
          {step === 2 && <Step3Ai data={formData} onChange={handleChange} />}
          {step === 3 && <Step4Pricing data={formData} onChange={handleChange} />}
          {step === 4 && <Step5Open data={formData} onChange={handleChange} />}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-6">
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 disabled:opacity-0 disabled:pointer-events-none transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canAdvance}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Próximo
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {isSubmitting ? "Enviando..." : "Enviar Feedback"}
            </button>
          )}
        </div>
      </div>
    </AppShell>
  );
}
```

**Step 2: Commit**

```bash
git add app/feedback/page.tsx
git commit -m "feat: add feedback wizard page with 5 steps and localStorage draft"
```

---

## Task 9: Navigation — Add feedback link to Sidebar + Dashboard banner

**Files:**
- Modify: `components/Sidebar.tsx` — add "Feedback Beta" nav item
- Modify: `components/Mobile/BottomNav.tsx` — no change needed (5 items is already full)
- Modify: `app/dashboard/page.tsx` — add feedback banner

**Step 1: Add nav item to Sidebar**

In `components/Sidebar.tsx`, add to `navItems` array after "Configurações":

```typescript
import { MessageSquareHeart } from "lucide-react"; // add to imports

// Add to navItems array:
{ id: "feedback", icon: MessageSquareHeart, label: "Feedback Beta", href: "/feedback", tourId: "menu-feedback" },
```

**Step 2: Add banner to Dashboard**

In `app/dashboard/page.tsx`, add a banner above the stats cards, after the header `</div>`:

```tsx
import { MessageSquareHeart } from "lucide-react"; // add to imports

{/* Beta Feedback Banner — add after header div, before stats grid */}
<div className="bg-gradient-to-r from-primary to-blue-800 rounded-xl p-4 sm:p-5 mb-6 text-white">
  <div className="flex items-center justify-between gap-4">
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
        <MessageSquareHeart className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <h3 className="font-semibold text-sm sm:text-base">Sua opinião é importante!</h3>
        <p className="text-blue-200 text-xs sm:text-sm mt-0.5 truncate">
          Responda a pesquisa em 3 minutos e ajude a moldar o Juriscan.
        </p>
      </div>
    </div>
    <Link
      href="/feedback"
      className="bg-amber-500 hover:bg-amber-400 text-blue-900 font-semibold px-4 sm:px-6 py-2 rounded-lg text-sm whitespace-nowrap transition-colors"
    >
      Dar Feedback
    </Link>
  </div>
</div>
```

**Step 3: Commit**

```bash
git add components/Sidebar.tsx app/dashboard/page.tsx
git commit -m "feat: add feedback link to sidebar and banner to dashboard"
```

---

## Task 10: Admin Feedback Dashboard — `/admin/feedback`

**Files:**
- Create: `app/admin/feedback/page.tsx`

**Step 1: Create admin dashboard page**

Create `app/admin/feedback/page.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  TrendingUp, Users, Star, DollarSign,
  Download, ArrowLeft, Quote,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { FeedbackStats, BetaFeedback } from "@/types/feedback";

const COLORS = ["#1C398E", "#3B82F6", "#F59E0B", "#EF4444", "#10B981"];

export default function AdminFeedbackPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [feedbacks, setFeedbacks] = useState<BetaFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/feedback");
        if (res.status === 403) {
          router.push("/dashboard");
          return;
        }
        if (!res.ok) throw new Error("Erro ao carregar dados");
        const result = await res.json();
        setStats(result.data.stats);
        setFeedbacks(result.data.feedbacks);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  const exportCsv = () => {
    if (!feedbacks.length) return;
    const headers = Object.keys(feedbacks[0]);
    const csvRows = [
      headers.join(","),
      ...feedbacks.map((f) =>
        headers.map((h) => {
          const val = (f as Record<string, unknown>)[h];
          const str = val === null ? "" : String(val);
          return `"${str.replace(/"/g, '""')}"`;
        }).join(",")
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `feedback_beta_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">{error || "Erro ao carregar"}</p>
      </div>
    );
  }

  const ratingData = [
    { name: "Chat IA", value: stats.avgRatings.chat_ia },
    { name: "Análise PDF", value: stats.avgRatings.analise_pdf },
    { name: "Relatórios", value: stats.avgRatings.relatorios },
    { name: "Jurimetria", value: stats.avgRatings.jurimetria },
    { name: "Interface", value: stats.avgRatings.interface },
    { name: "Velocidade", value: stats.avgRatings.velocidade },
  ].filter((d) => d.value !== null);

  const pricingData = Object.entries(stats.pricingDistribution).map(([name, value]) => ({
    name: { barato: "Barato", justo: "Justo", caro: "Caro", muito_caro: "Muito caro" }[name] || name,
    value,
  }));

  const planData = Object.entries(stats.planDistribution).map(([name, value]) => ({
    name: { free: "Free", starter: "Starter", pro: "Pro", business: "Business", nenhum: "Nenhum" }[name] || name,
    value,
  }));

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/dashboard")} className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Feedback Beta Testers</h1>
          </div>
          <button
            onClick={exportCsv}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <span className="text-sm text-gray-500">NPS Score</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.npsScore}</p>
          </div>
          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-500">Respostas</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalResponses}</p>
          </div>
          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-amber-500" />
              <span className="text-sm text-gray-500">Promotores</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats.totalResponses > 0
                ? Math.round((stats.npsBreakdown.promoters / stats.totalResponses) * 100)
                : 0}%
            </p>
          </div>
          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-500">Valor Médio</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats.avgValorMensal ? `R$ ${stats.avgValorMensal}` : "—"}
            </p>
          </div>
        </div>

        {/* NPS Breakdown */}
        <div className="bg-white rounded-xl border p-5 mb-8">
          <h3 className="font-semibold text-gray-800 mb-4">Distribuição NPS</h3>
          <div className="space-y-3">
            {[
              { label: "Promotores (9-10)", value: stats.npsBreakdown.promoters, color: "bg-emerald-500" },
              { label: "Neutros (7-8)", value: stats.npsBreakdown.passives, color: "bg-amber-500" },
              { label: "Detratores (0-6)", value: stats.npsBreakdown.detractors, color: "bg-red-500" },
            ].map((item) => {
              const pct = stats.totalResponses > 0 ? Math.round((item.value / stats.totalResponses) * 100) : 0;
              return (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-36">{item.label}</span>
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 w-12 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Ratings Bar Chart */}
          {ratingData.length > 0 && (
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold text-gray-800 mb-4">Média por Funcionalidade</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={ratingData} layout="vertical">
                  <XAxis type="number" domain={[0, 5]} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#1C398E" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Pricing Pie Chart */}
          {pricingData.length > 0 && (
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold text-gray-800 mb-4">Percepção de Preço</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pricingData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pricingData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Plan Distribution */}
        {planData.length > 0 && (
          <div className="bg-white rounded-xl border p-5 mb-8">
            <h3 className="font-semibold text-gray-800 mb-4">Plano de Interesse</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={planData}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Testimonials */}
        {stats.authorizedTestimonials.length > 0 && (
          <div className="bg-white rounded-xl border p-5 mb-8">
            <h3 className="font-semibold text-gray-800 mb-4">Depoimentos Autorizados</h3>
            <div className="space-y-4">
              {stats.authorizedTestimonials.map((t, i) => (
                <div key={i} className="border-l-4 border-primary pl-4 py-2">
                  <Quote className="w-5 h-5 text-gray-300 mb-1" />
                  <p className="text-gray-700 text-sm italic">&ldquo;{t.depoimento}&rdquo;</p>
                  <p className="text-xs text-gray-500 mt-2">
                    — {t.user_name}{t.area_juridica ? `, ${t.area_juridica}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Feedbacks Table */}
        <div className="bg-white rounded-xl border p-5 overflow-x-auto">
          <h3 className="font-semibold text-gray-800 mb-4">Todos os Feedbacks ({feedbacks.length})</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-3 pr-4">Usuário</th>
                <th className="pb-3 pr-4">NPS</th>
                <th className="pb-3 pr-4">IA</th>
                <th className="pb-3 pr-4">Preço</th>
                <th className="pb-3 pr-4">Plano</th>
                <th className="pb-3">Data</th>
              </tr>
            </thead>
            <tbody>
              {feedbacks.map((f) => (
                <tr key={f.id} className="border-b last:border-0">
                  <td className="py-3 pr-4 text-gray-700">
                    {(f as Record<string, unknown> & { profiles?: { name?: string } }).profiles?.name || "—"}
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold text-white ${
                      f.nps_score >= 9 ? "bg-emerald-500" : f.nps_score >= 7 ? "bg-amber-500" : "bg-red-500"
                    }`}>
                      {f.nps_score}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-gray-600 capitalize">
                    {f.ia_qualidade?.replace("_", " ") || "—"}
                  </td>
                  <td className="py-3 pr-4 text-gray-600 capitalize">
                    {f.preco_justo?.replace("_", " ") || "—"}
                  </td>
                  <td className="py-3 pr-4 text-gray-600 capitalize">
                    {f.plano_interesse || "—"}
                  </td>
                  <td className="py-3 text-gray-400 text-xs">
                    {new Date(f.created_at).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/admin/feedback/page.tsx
git commit -m "feat: add admin feedback dashboard with charts, stats and CSV export"
```

---

## Task Summary

| Task | What | Files |
|------|------|-------|
| 1 | SQL migration | `supabase/beta_feedback.sql` |
| 2 | Types + Zod schema | `types/feedback.ts`, `lib/validation/feedback.ts` |
| 3 | API route (user) | `app/api/feedback/route.ts` |
| 4 | API route (admin) | `app/api/admin/feedback/route.ts` |
| 5 | useFeedback hook | `hooks/useFeedback.ts` |
| 6 | StarRating + NpsSelector | `components/Feedback/StarRating.tsx`, `components/Feedback/NpsSelector.tsx` |
| 7 | 5 wizard steps | `components/Feedback/steps/Step{1-5}*.tsx` |
| 8 | Feedback page | `app/feedback/page.tsx` |
| 9 | Sidebar + Dashboard banner | Modify `Sidebar.tsx`, `dashboard/page.tsx` |
| 10 | Admin dashboard | `app/admin/feedback/page.tsx` |

**Total new files:** 13
**Modified files:** 2
**Dependencies needed:** None (Recharts already installed)
