# CLAUDE.md

Personal Workout Tracker: mobile-first React web app for a sedentary beginner doing home calisthenics. Data lives in Supabase.

Read first: `docs/superpowers/specs/2026-11-09-workout-tracker-design.md` (design), `.claude/prds/workout-tracker.prd.md` (PRD), `docs/superpowers/plans/` (implementation plans).

## Commands

- `npm run dev` start Vite
- `npm test` Vitest + React Testing Library (Supabase is always mocked in tests)
- `npm run typecheck`, `npm run lint` (oxlint), `npm run format` (Prettier), `npm run build`
- `node --env-file=.env scripts/verify-rls.mjs` check that anonymous clients cannot read or write

## Layout

`src/app` (router, providers) · `src/components/{ui,layout}` · `src/features/<module>` · `src/hooks` · `src/lib` (env, Supabase client) · `src/types` · `src/styles` · `supabase/migrations` (SQL).

## Conventions

- TDD: write the failing test first, watch it fail, then implement.
- UI copy is English only. No medical claims; the app records training, it does not prescribe.
- Env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` only. Never use or commit the secret/service-role key.
- Every Supabase table enables RLS with policies on `auth.uid()`. Schema changes are numbered SQL files in `supabase/migrations`.
- Alias `@/` maps to `src/`. TypeScript 7: no `baseUrl`.
- Exercise catalog (later milestone) is bundled static data. Record source, author and license per item. Illustrations are CC BY-SA 4.0: keep attribution, document any changes, and never ship images with unknown licenses.
- Streaks count weeks (Monday start, device timezone), not days. Gamification stays quiet: no push notifications or guilt screens.
