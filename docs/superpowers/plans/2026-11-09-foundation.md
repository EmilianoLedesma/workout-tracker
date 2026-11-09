# Foundation (Milestone 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A mobile-first React app skeleton that opens on a phone, lets the owner sign in with Supabase, and navigates a themed shell with placeholder pages for every module.

**Architecture:** Vite SPA with feature folders. Supabase handles auth and data (RLS on every table). TanStack Query is the server-state layer. All pages are placeholders; later milestones fill them in.

**Tech Stack:** React, TypeScript, Vite, Tailwind CSS v4, shadcn/ui, Lucide, React Router, TanStack Query, Zod, `@supabase/supabase-js`, Vitest + React Testing Library, ESLint, Prettier. Deploy: Vercel.

**Spec:** `docs/superpowers/specs/2026-11-09-workout-tracker-design.md` (PRD: `.claude/prds/workout-tracker.prd.md`)

## Global Constraints

- UI language is English only.
- Mobile-first; bottom navigation on mobile; light and dark themes; large touch targets.
- No medical claims anywhere in copy.
- Never use or document the Supabase service-role key in the app. Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (already in `.env.example` / `.env`).
- Every Supabase table has RLS enabled and a policy restricting rows to `auth.uid()`.
- `.superpowers/` and `.env` stay gitignored (already in `.gitignore`).
- Folder layout: `src/app`, `src/components/{ui,layout}`, `src/features/{dashboard,exercises,routines,workouts,progress,settings,auth}`, `src/hooks`, `src/lib`, `src/types`, `src/styles`; SQL in `supabase/migrations/`.
- Verify dependency versions from the registry at install time; do not guess APIs, read each library's current docs.
- Deviation from the spec's Phase 1 list (my call): `vite-plugin-pwa` and Recharts are installed in Milestones 6 and 5 when first used, not now. Zod is installed now because Task 4 uses it.

## Review Focus

1. Missing or malformed env vars: the app shows a clear configuration error screen, not a blank page. (Task 4)
2. Opening a protected deep link while signed out: after login the user lands on that link, not the dashboard. (Task 5)
3. Expired or invalid magic link: the user sees an error and can request a new link. (Task 5)
4. `localStorage` unavailable or blocked: theme still works for the session without throwing. (Task 2)
5. Sign-out clears cached query data so the next user or session sees nothing stale. (Task 5)

---

### Task 1: Project scaffold, tooling and git

**Files:**

- Create: `package.json`, `vite.config.ts`, `tsconfig*.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/styles/index.css`, `eslint.config.js`, `.prettierrc`, `vitest.setup.ts`
- Test: `src/App.test.tsx`

**Interfaces:**

- Produces: `@/` import alias mapped to `src/`; `npm run dev|build|lint|test|typecheck` scripts; `export default function App(): JSX.Element`.

- [ ] **Step 1: Scaffold in a scratch folder, then copy in.** Run `npm create vite@latest <tmp-dir> -- --template react-ts` outside the project, copy its files into the project root without overwriting `.gitignore`, `.env.example`, `.env`, `docs/`, `.claude/`. Merge any extra `.gitignore` lines from the template.
- [ ] **Step 2: Add Tailwind CSS v4** via its Vite plugin per current Tailwind docs; `src/styles/index.css` imports it; `main.tsx` imports the stylesheet.
- [ ] **Step 3: Configure the `@` alias** in `vite.config.ts` and `tsconfig.app.json`.
- [ ] **Step 4: Add Vitest + React Testing Library + jest-dom + jsdom.** `vitest.setup.ts` imports `@testing-library/jest-dom`. Add scripts `test` (`vitest run`) and `typecheck` (`tsc -b --noEmit`).
- [ ] **Step 5: Write the failing test** `src/App.test.tsx`: `it("renders the app name")` renders `<App />` and asserts `screen.getByText("Workout Tracker")` is in the document.
- [ ] **Step 6: Run** `npm test`. Expected: FAIL (text not found).
- [ ] **Step 7: Implement** `App` returning an element containing the text "Workout Tracker" (remove Vite demo content and assets).
- [ ] **Step 8: Run** `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`. Expected: all pass.
- [ ] **Step 9: Configure ESLint + Prettier** (Prettier owns formatting; ESLint config extends the template's React/TS rules) and add `lint`/`format` scripts. Run `npm run lint`: passes.
- [ ] **Step 10: Commit.** `git init` (branch `main`), then `git add -A && git commit -m "chore: scaffold Vite React TS with tooling"`. Confirm `git status` shows `.env` is not tracked.

### Task 2: shadcn/ui and theme

**Files:**

- Create: `components.json`, `src/lib/utils.ts`, `src/components/ui/button.tsx`, `src/app/providers/ThemeProvider.tsx`, `src/hooks/useTheme.ts`
- Modify: `src/styles/index.css` (CSS variables for light/dark)
- Test: `src/app/providers/ThemeProvider.test.tsx`

**Interfaces:**

- Produces: `ThemeProvider({children})`; `useTheme(): { theme: "light" | "dark" | "system"; setTheme(t): void }`. The provider sets class `dark` on `<html>` when the resolved theme is dark.
- Consumes: `@/` alias (Task 1).

- [ ] **Step 1: Initialize shadcn/ui** for Vite + Tailwind v4 per its current docs (alias `@/components`, `@/lib/utils`), then add the `button` component.
- [ ] **Step 2: Write failing tests** in `ThemeProvider.test.tsx`: `it("adds the dark class when theme is dark")`; `it("persists the choice in localStorage")`; `it("does not throw when localStorage access throws")` (mock `Storage.prototype.getItem/setItem` to throw, setTheme("dark") still adds the class).
- [ ] **Step 3: Run** the tests. Expected: FAIL (module missing).
- [ ] **Step 4: Implement** `ThemeProvider` and `useTheme`. Default theme is `"system"`; storage key `theme`; every storage call wrapped in try/catch.
- [ ] **Step 5: Run** tests. Expected: PASS.
- [ ] **Step 6: Commit.** `feat: shadcn/ui and theme provider`.

### Task 3: Router and responsive shell

**Files:**

- Create: `src/app/router/index.tsx`, `src/components/layout/AppShell.tsx`, `src/components/layout/BottomNav.tsx`, `src/features/{dashboard,exercises,routines,progress,settings}/<Name>Page.tsx` (placeholder pages), `src/features/workouts/WorkoutPage.tsx`, `src/features/NotFoundPage.tsx`
- Modify: `src/App.tsx`
- Test: `src/components/layout/BottomNav.test.tsx`, `src/app/router/router.test.tsx`

**Interfaces:**

- Produces: routes `/` (Dashboard), `/library`, `/routines`, `/workout/:routineId`, `/progress`, `/settings`, `*` (NotFound); `createAppRouter(): Router`; `AppShell` renders `<Outlet />` plus `BottomNav` (links: Home, Library, Routines, Progress, Settings, using Lucide icons and `NavLink` active state).
- Consumes: `ThemeProvider` (Task 2).

- [ ] **Step 1: Write failing tests.** `BottomNav.test.tsx`: `it("renders five links with accessible names")` and `it("marks the current route as active (aria-current=page)")`. `router.test.tsx`: `it("renders the Library page at /library")`, `it("renders NotFound for unknown routes")`, using `createMemoryRouter`.
- [ ] **Step 2: Run** tests. Expected: FAIL.
- [ ] **Step 3: Implement** the router, shell and placeholder pages (each placeholder shows a heading with its module name). Bottom nav is fixed to the bottom on small screens, with touch targets of at least 44px; on `md` and up it becomes a left sidebar (same links).
- [ ] **Step 4: Run** tests, lint, typecheck. Expected: pass.
- [ ] **Step 5: Commit.** `feat: router and responsive app shell`.

### Task 4: Env validation, Supabase client, query provider

**Files:**

- Create: `src/lib/env.ts`, `src/lib/supabase.ts`, `src/app/providers/QueryProvider.tsx`, `src/components/layout/ConfigError.tsx`
- Modify: `src/App.tsx`, `src/main.tsx`
- Test: `src/lib/env.test.ts`, `src/components/layout/ConfigError.test.tsx`

**Interfaces:**

- Produces: `parseEnv(raw: Record<string, unknown>): { ok: true; env: { supabaseUrl: string; supabaseAnonKey: string } } | { ok: false; missing: string[] }` (Zod schema: both vars non-empty strings, URL must be a valid URL); `getSupabase(): SupabaseClient`; `QueryProvider({children})`; `ConfigError({missing: string[]})`.

- [ ] **Step 1: Install** `@supabase/supabase-js`, `@tanstack/react-query`, `zod`.
- [ ] **Step 2: Write failing tests.** `env.test.ts`: `it("fails and lists both vars when empty")`, `it("fails for an invalid URL")`, `it("succeeds with a valid URL and key")`. `ConfigError.test.tsx`: `it("names each missing variable and points to .env.example")`.
- [ ] **Step 3: Run** tests. Expected: FAIL.
- [ ] **Step 4: Implement** `parseEnv` with Zod; `getSupabase` creates the client once from `import.meta.env`; `App` renders `ConfigError` instead of the router when `parseEnv` fails.
- [ ] **Step 5: Run** tests. Expected: PASS. Then `npm run dev` with empty `.env`: the page shows the configuration error, not a blank screen.
- [ ] **Step 6: Commit.** `feat: env validation, supabase client, query provider`.

### Task 5: Authentication (magic link)

**Files:**

- Create: `src/features/auth/AuthProvider.tsx`, `src/features/auth/useSession.ts`, `src/features/auth/RequireAuth.tsx`, `src/features/auth/LoginPage.tsx`
- Modify: `src/app/router/index.tsx` (add `/login`; wrap shell routes in `RequireAuth`), `src/features/settings/SettingsPage.tsx` (Sign out button)
- Test: `src/features/auth/RequireAuth.test.tsx`, `src/features/auth/LoginPage.test.tsx`, `src/features/auth/AuthProvider.test.tsx`

**Interfaces:**

- Produces: `AuthProvider` exposing `useSession(): { session: Session | null; loading: boolean; signOut(): Promise<void> }`; `LoginPage` calls `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })`; `RequireAuth` redirects signed-out users to `/login` with the original location in router state.
- Consumes: `getSupabase()`, `QueryProvider` (Task 4). Tests mock `getSupabase` (no network).

- [ ] **Step 1: Write failing tests.** `RequireAuth`: `it("redirects to /login and remembers the path when signed out")`, `it("renders children when a session exists")`, `it("shows a loading state while the session is resolving")`. `LoginPage`: `it("sends a magic link for a valid email and shows a check-your-email message")`, `it("shows the error and allows retry when signInWithOtp fails")`, `it("rejects an empty or invalid email without calling Supabase")`, `it("returns to the remembered path after a session appears")`. `AuthProvider`: `it("signOut clears the React Query cache")`.
- [ ] **Step 2: Run** tests. Expected: FAIL.
- [ ] **Step 3: Implement** the provider (initial `getSession()` plus `onAuthStateChange` subscription with cleanup), guard, login page and sign-out. Expired or invalid link errors arrive in the URL hash/query from Supabase: `LoginPage` displays the error text and offers a fresh request.
- [ ] **Step 4: Run** tests, lint, typecheck. Expected: pass.
- [ ] **Step 5: Manual check** (needs the owner's Supabase project): in Supabase dashboard, Authentication > URL Configuration, add `http://localhost:5173` and the Vercel URL as allowed redirects. Sign in with a real email, click the link, confirm landing in the shell, sign out, confirm redirect to `/login`.
- [ ] **Step 6: Commit.** `feat: magic-link auth with route guard`.

### Task 6: Initial Supabase migration and RLS check

**Files:**

- Create: `supabase/migrations/0001_user_settings.sql`, `supabase/README.md`, `scripts/verify-rls.mjs`

**Interfaces:**

- Produces: table `public.user_settings` with columns `user_id uuid primary key references auth.users on delete cascade`, `weekly_goal int not null default 3 check (weekly_goal between 1 and 7)`, `equipment text[] not null default '{bodyweight,wall,chair}'`, `theme text not null default 'system' check (theme in ('light','dark','system'))`, `updated_at timestamptz not null default now()`; RLS enabled; policies allow select, insert, update and delete only where `user_id = auth.uid()`.

- [ ] **Step 1: Write** the migration SQL as specified above. `supabase/README.md` documents how to apply it (SQL editor or Supabase CLI) and that every future table must enable RLS with an `auth.uid()` policy.
- [ ] **Step 2: Write** `scripts/verify-rls.mjs`: using `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY` from the environment and no session, it tries to select from and insert into `user_settings`; expects zero rows on select and an error on insert; prints PASS or FAIL and exits non-zero on FAIL.
- [ ] **Step 3: Apply** the migration to the owner's project (ask the owner to run it in the SQL editor if no CLI access).
- [ ] **Step 4: Run** `node --env-file=.env scripts/verify-rls.mjs`. Expected: `PASS`.
- [ ] **Step 5: Commit.** `feat: user_settings migration with RLS`.

### Task 7: Docs, Vercel config and final verification

**Files:**

- Create: `CLAUDE.md`, `README.md`, `vercel.json`
- Modify: `docs/superpowers/specs/2026-11-09-workout-tracker-design.md` (record the PWA/Recharts deviation under section 11b)

**Interfaces:**

- Produces: `vercel.json` with a rewrite sending all non-file paths to `/index.html` (SPA routing); `CLAUDE.md` listing conventions: folder layout, scripts, test style (RTL, Supabase mocked), RLS rule, no service-role key, English-only copy, catalog license rules, and pointers to the spec, PRD and this plan.

- [ ] **Step 1: Write** `CLAUDE.md`, `README.md` (what the app is, setup with `.env.example`, scripts, deploy to Vercel with the two env vars, the not-medical-advice note) and `vercel.json`.
- [ ] **Step 2: Run** `npm run lint && npm run typecheck && npm test && npm run build`. Expected: all pass.
- [ ] **Step 3: Run** `npm run preview` and open a deep link such as `/library` directly. Expected: the app loads (redirects to `/login` when signed out) with no 404.
- [ ] **Step 4: Commit.** `docs: CLAUDE.md, README, Vercel config`.
- [ ] **Step 5: Update** the PRD milestone table: Milestone 1 status `complete`, Plan column linking this file.

---

## Self-review

- **Spec coverage:** Foundation list (project, stack, structure, routing, responsive shell, Supabase client and auth/RLS, tooling, docs, git, CLAUDE.md, Vercel-ready) maps to Tasks 1-7. PWA and Recharts are deferred, recorded in Global Constraints.
- **Types:** `getSupabase`, `parseEnv`, `useSession` and `useTheme` are defined once and used consistently.
- **Review Focus:** each of the five items is covered by a named test in its owning task.
