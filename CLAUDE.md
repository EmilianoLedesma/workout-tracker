# CLAUDE.md

Personal Workout Tracker: mobile-first React web app for a sedentary beginner doing home calisthenics. Data lives in Supabase.

Read first: `docs/superpowers/specs/2026-11-09-workout-tracker-design.md` (design), `.claude/prds/workout-tracker.prd.md` (PRD), `docs/superpowers/plans/` (implementation plans).

## Commands

- `npm run dev` start Vite
- `npm test` Vitest + React Testing Library (Supabase is always mocked in tests)
- `npm run typecheck`, `npm run lint` (oxlint), `npm run format` (Prettier), `npm run build`
- `npm run catalog:build` regenerate catalog JSON and copy illustrations (runs before dev, build, typecheck)
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
- Catalog rules: unknown equipment (`[]`) is never available or suggested; no level means not beginner; free-exercise-db images are never shipped; frames are copied unchanged; generated catalog files are gitignored.
- Access: Library, exercise detail and Credits are public routes; Dashboard, Routines, Workout, Progress and Settings require sign-in.

## Ways of working

- **Think before coding.** State assumptions. If blocked on a decision only the owner can make, ask one question at a time (multiple choice where possible). Never silently pick between valid interpretations.
- **Classify before building.** Every feature request is a spike, a bounded task or an architectural change. Bounded: short in-chat design and an explicit yes before implementing. Architectural: a written plan in `docs/superpowers/plans/` first. "Too simple to need approval" is how this gets skipped.
- **TDD is the iron law.** No production code without a failing test, watched failing for the right reason. Tests written afterwards do not count. Pure styling and config are the only exceptions; say so when skipping.
- **Plan, then execute task by task.** Plans carry exact interfaces and tests. Run tasks one at a time and sequentially, never implementers in parallel, then a fresh reviewer on the whole branch. Fix Critical and Important findings with a failing test first; list minors as deferred.
- **Isolate real work.** Anything with real shape gets its own branch (or worktree) before implementation and is merged or discarded when done. Direct-on-`main` is for trivial single-file changes.
- **Verify before claiming done.** Locally run focused tests (`npx vitest run <paths>`: the task's tests plus folders that use the code it changed), `npm run lint` and `npm run typecheck`. GitHub Actions (`.github/workflows/ci.yml`: lint, typecheck, full test suite, build) is the full-suite verdict on every push and PR. Do not rerun the whole suite locally just to re-confirm; read the CI result. A red CI check is a real finding, not a fluke to retry. If nothing is pushed, say the full suite is unverified.
- **Data safety is a hard line.** Never write to the live Supabase project (inserts, updates, deletes, applying migrations, any DDL) without asking first, even for idempotent or test data. Reading is free. Rolled-back test transactions still need the ask.
- **Ask before reaching outside the sandbox.** A live database, a browser, GitHub, anything with real-world side effects: ask first, every time, even if already connected earlier in the session.
- **Commit discipline.** Committing and pushing are allowed without asking each time, on a branch or `main` as the work calls for. Before each commit review the diff for secrets, stage only the files for this change (no broad `git add` over the owner's unrelated work), and never add a `Co-Authored-By` trailer. Never force-push or rewrite pushed history without asking.
- **Subagent boundaries.** Subagents never edit `.gitignore` or run `git push`. Only the controller decides those.
