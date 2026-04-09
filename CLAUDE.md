# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Juriscan is a legal tech SaaS platform for Brazilian lawyers. It provides AI-powered legal analysis, document processing, jurimetrics, and case management. The UI and AI responses are in Portuguese (pt-BR).

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint (next/core-web-vitals + next/typescript)
npm run test         # Vitest in watch mode
npm run test:run     # Run tests once
npm run test:coverage # Tests with v8 coverage
```

Run a single test file: `npx vitest run __tests__/unit/path/to/file.test.ts`

## Tech Stack

- **Framework:** Next.js 14 (App Router) with TypeScript strict mode
- **Database/Auth:** Supabase (PostgreSQL + Row-Level Security + Auth)
- **AI:** OpenAI GPT-4o-mini via `openai` SDK, streaming via SSE
- **Payments:** Stripe (subscriptions + credit packs)
- **State:** React Query (server state) + Zustand (client state)
- **Validation:** Zod v4
- **UI:** Tailwind CSS, Lucide icons, Recharts, Sonner toasts
- **Document processing:** unpdf (PDF), mammoth (DOCX), jspdf (PDF generation)
- **Testing:** Vitest + Testing Library + jsdom

## Architecture

The codebase uses Clean Architecture in `src/` layered on top of Next.js App Router conventions:

```
src/domain/          → Entities, repository interfaces, value objects
src/application/     → Use cases, services, DTOs
src/infrastructure/  → Adapters (AI, cache, database, export, legal-data), gateways
```

Outside `src/`, feature-based organization:

```
app/                 → Pages (App Router) and API routes (app/api/)
components/          → React components grouped by feature (Chat/, Auth/, Reports/, etc.)
hooks/               → Custom hooks (useAuth, useChat, useCredits, useReports, etc.)
lib/                 → Shared utilities (API helpers, Supabase clients, credit system, validation)
services/            → Business logic services (credit.service.ts, report.service.ts)
types/               → TypeScript type definitions (database.ts, chat.ts, reports.ts)
supabase/            → Schema SQL, migrations, and feature-specific SQL files
```

## Key Patterns

**Import alias:** `@/` resolves to project root. Always use absolute imports.

**Supabase clients:** Three client creators for different contexts:
- `createServerSupabaseClient()` — Server Components and API routes
- `getSupabaseClient()` — Client Components
- `createAdminClient()` — Admin operations (service role key)

**API routes** use `apiHandler` wrapper from `lib/api/handler` for consistent error handling, auth, and rate limiting. Errors use custom classes: `ValidationError`, `AuthError`, `NotFoundError`, `InsufficientCreditsError`, `RateLimitError`, etc. Responses use `successResponse()`, `errorResponse()`, `paginatedResponse()`.

**Lazy initialization** for OpenAI and Stripe clients to avoid build-time env errors.

**Credit system:** Atomic credit deduction via Supabase RPC with `FOR UPDATE` locking. All AI operations consume credits.

**Chat streaming:** SSE (Server-Sent Events) with `ReadableStream` for real-time AI responses.

**Middleware:** (`middleware.ts`) refreshes Supabase sessions. Auth logic (public vs protected routes) is handled in `lib/supabase/middleware.ts`.

## Deployment

Deployed on **Vercel**. `next.config.mjs` includes:
- `serverExternalPackages: ["unpdf"]` for serverless PDF extraction
- Comprehensive security headers (CSP, HSTS)
- Webpack alias `canvas: false` to exclude Node-only dependency

Environment variables needed: see `.env.example` (Supabase, Stripe, OpenAI keys).
