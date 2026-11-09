# Personal Workout Tracker: Design

Date: 2026-11-09. Status: draft for approval.

## 1. Intent

A personal web app to browse exercises, build routines, log workouts and see progress. It is built for one person: a sedentary beginner starting calisthenics at home, three sessions a week, with only bodyweight, a wall and a chair. The app should also be approachable for other sedentary people, so defaults are gentle and nothing in it assumes fitness experience.

Why it exists: the owner wants to keep their progress long-term, see light gamification (Duolingo-like but not invasive or insistent), and keep coming back because the app keeps getting meaningful updates.

Mobile-first responsive web app, deployed on Vercel, installable as a PWA. UI language: English.

## 2. Goals, non-goals, anti-goals

Goals
- Five v1 modules: Dashboard, Exercise Library, Routines, Active Workout, Progress (plus Settings and Credits).
- Progress is stored online in Supabase and survives device or browser changes.
- A large, well-attributed exercise catalog (see section 5), filtered by available equipment by default.
- Starter routines A/B/C the owner can edit, built only from real catalog exercises.
- Quiet gamification: weekly goal ring, streak counted in weeks, milestone badges.
- A visible post-v1 roadmap (section 10).

Non-goals (v1)
- Native apps, social features, leaderboards, XP/levels/coins.
- Automatic training recommendations or progression algorithms.
- Offline-first sync or conflict resolution.
- Multi-user product features (the app is single-user; auth exists for data protection only).
- Spanish or any second UI language.

Anti-goals (a failure even if it technically works)
- Pushy gamification: push notifications, guilt messages, lost-streak screens.
- Any claim that an exercise or routine is medically safe or suitable for a person. The app records and organizes training; it is not professional advice. State this once, in Settings/Credits and first run.
- Invented exercise data or metadata presented as coming from a source.
- Marking exercises "beginner" without a source saying so.

## 3. Users and context

Initial user: beginner, sedentary lifestyle, trains at home 3 times a week, equipment limited to bodyweight, wall and chair. The weekly goal defaults to 3 and is editable.

## 4. Stack (the owner's call, with my adjustments marked)

React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Lucide, React Router, Recharts, Zod, vite-plugin-pwa with Workbox, Vitest and React Testing Library, ESLint and Prettier. Deploy on Vercel.

My calls (not yet agreed by the owner beyond this document):
- `@supabase/supabase-js` replaces Dexie/IndexedDB from the original spec.
- TanStack Query for server state; no Zustand.
- Playwright is added once the core flow (routine, then session, then save) exists, starting with one E2E test of that flow.

Folder layout (owner's proposal, adapted): `src/app` (router, providers), `src/components` (ui, layout, exercises), `src/features` (dashboard, exercises, routines, workouts, progress), `src/data` (exercise catalog, seed), `src/hooks`, `src/lib` (Supabase client), `src/types`, `src/styles`; `supabase/` at repo root for SQL migrations replaces `src/db`. Add `.superpowers/` to `.gitignore`.

## 5. Exercise catalog

The catalog is static content bundled with the app (JSON plus images), not stored in Supabase. It is read-only, works offline, and is built by a reproducible import script.

Sources (inspected 2026-11-09):
- Primary: `@bryllim/workout-guide` 1.0.0. 302 exercises, 3 frames each. Frames are 512x512 PNG, not SVG. Manifest fields: `id, slug, name, exerciseType, equipment` (single string), `primaryMuscle, secondaryMuscles, isStretch, frames, attribution`. No instructions, description or difficulty. Equipment counts include Bodyweight 111, Wall 3, Chair 1. Code MIT; artwork CC BY-SA 4.0; 76 frames derive from Everkinetic (CC BY-SA 4.0) with per-frame attribution in the manifest.
- Text and metadata: `yuhonas/free-exercise-db`. 876 exercises with `level`, `mechanic`, `force`, `category`, primary and secondary muscles, equipment ("body only" 111), and instructions (871 of 876). Maintainer states the project is Unlicense. Its images have unknown provenance and license: the maintainer says use is "at your own risk". Do not ship these images.
- Later candidates (not v1): `exercemus/exercises` (MIT code, per-exercise data license and author, richer fields) and wger (AGPL code, per-entry CC data). Both need per-exercise attribution handling.

Catalog tiers:
1. Illustrated: Workout Guide exercises with their 3 frames. Instructions, level and extra muscle data merged from free-exercise-db when a name matches.
2. Text-only: free-exercise-db exercises with no Workout Guide match. Show a placeholder instead of art.
3. Project-authored: gap fillers (for example chair sit-to-stand, which neither source has). Clearly labeled as written by this project.

Rules
- Own domain model; do not mirror source shapes. Each exercise: stable ID, name, description (if any), primary muscle, secondary muscles, equipment (normalized, multi-valued), type (reps/duration), level, instructions, illustrations, and per-field provenance (source name, URL, license, author, "project-authored" flag).
- Never mark an exercise beginner unless a source says so. "Suggested" means bodyweight/wall/chair equipment and source level beginner.
- "Calisthenics" is a derived label (equipment-based), marked as derived.
- Name matching across sources is fuzzy; store source refs and flag low-confidence matches for manual review in a review report.
- Keep all images local in the app bundle or public assets, with no external CDN at runtime. Record source, author, license and changes for each illustration. Do not modify originals without documenting it (CC BY-SA 4.0 share-alike applies to the artwork).
- Credits screen lists every source, license and attribution.
- The import script is reproducible, validates output with Zod, and can be re-run to update.

## 6. Data and backend (Supabase)

Supabase is the source of truth for user data. Single user, but authentication is required: the Supabase anon key is public in the browser, so Row Level Security restricts every row to the signed-in user. Auth method: email magic link or password (builder's call; prefer the simplest that works on mobile).

User data: routines and routine exercises (series, reps or seconds, rest, order, day labels A/B/C), sessions with set logs and notes, body weight entries, settings (equipment, weekly goal, theme).

Rules
- A completed session stores a snapshot of the routine and its exercises (JSONB). Editing or deleting a routine never changes history.
- Exercises are referenced by stable catalog ID.
- Streaks and badges are computed from session history, not stored (revisit if it becomes slow).
- The in-progress session lives in `localStorage` and is written to Supabase on finish, with retry on failure, so a dropped connection mid-workout loses nothing.
- Schema changes are SQL migrations in `supabase/`.
- JSON export of all user data is available in Settings. Import validates structure and version with Zod before changing anything.

## 7. Modules

Dashboard (approved layout: "Progress first"): date, weekly ring (sessions this week of goal), streak in weeks, day dots for the week, next routine card with a Start button, latest milestone.

Exercise Library: search by name; filters by muscle and equipment; the equipment filter defaults to the user's equipment from Settings; level and category filters; detail view with the 3 illustrations, instructions, level and provenance. Catalog stays whole; filtering is a view default.

Routines: create, edit, duplicate and delete routines (A, B, C and more); add and remove exercises; reorder; set series, reps or seconds, and rest; organize by days. Starter A/B/C are copied into the user's account on first run and are fully editable.

Starter routines (my draft, to be finalized from the real catalog during planning): A full-body baseline; B lower body and core; C upper body and mobility. About 5-6 exercises each, 2 sets of 8-10 reps or seconds for holds, 60-90 s rest, ordered easy to hard, using easier variants where the catalog has them (for example Wall Push-up before floor push-up). Labeled "suggested", never "safe".

Active Workout (approved layouts): set view with exercise name, 3 illustration frames, set list with rep stepper and a Complete button; rest view with large countdown, -15s/+15s/Skip, next-set preview and last-time reps. Also: pause and resume, skip exercise, per-session notes, finish and save. Accessible timer.

Progress: activity calendar, sessions per week, session history, reps and sets per exercise over time, per-exercise charts, optional body weight log.

Settings: equipment available, weekly goal, theme (light/dark), export/import, rest-week marking, credits and licenses, disclaimer.

## 8. Gamification

- Weekly goal ring on the dashboard and at session end.
- Streak counts consecutive weeks where the weekly goal is met. A planned rest week (illness, travel) does not break it.
- Milestone badges, small set: first session, 10 sessions, 4-week streak, new best on an exercise.
- Quiet by design: no push notifications, no popups on missing a day, no lost-streak screen.

## 9. UX, accessibility, PWA

- Mobile-first, bottom navigation on mobile, large touch targets, minimal forms, loading/empty/error states, light and dark themes, adequate contrast, accessible timer.
- Approved mockups for Dashboard and Active Workout live in `.superpowers/brainstorm/` (local, not committed).
- PWA: manifest, service worker caching the app shell, catalog JSON and illustrations so the library works offline; saving history requires a connection. Show a "new version available" prompt.
- Remind the user that cached data is not a backup; export is available.

## 10. Phases and roadmap

v1 phases (small deliverables, tests after each):
1. Foundation (scaffolding, requested by the owner for the empty folder): Vite + React + TypeScript project; Tailwind, shadcn/ui, Lucide, React Router, TanStack Query, Zod, Recharts, vite-plugin-pwa installed and configured; the folder layout from section 4 with placeholder routes for all modules; responsive shell with bottom navigation and light/dark theme; Supabase client plus `.env.example` and an initial `supabase/` migrations folder; auth and RLS; ESLint, Prettier, Vitest and RTL configured with one smoke test; `.gitignore` (including `.superpowers/`); `git init`; `CLAUDE.md` with conventions; README; Vercel-ready build.
2. Catalog: import pipeline, normalized data, library UI, filters, detail, credits.
3. Routines: CRUD, starter A/B/C, settings for equipment and goal.
4. Active workout: session flow, timer, local draft, save, history.
5. Progress and gamification: dashboard, calendar, charts, streak, badges.
6. PWA and hardening: offline catalog, update prompt, export/import, mobile browser testing, one Playwright flow.

Post-v1 roadmap (shown in the app or README so the project visibly moves): progression suggestions, personalized plans after research, more badges, photo log, richer catalog sources (exercemus/wger), optional offline session queue, optional Spanish UI.

## 11. Constraints and my calls

- No medical claims; one disclaimer.
- Verify dependency versions and read docs rather than guessing APIs.
- Keep CLAUDE.md updated with conventions and decisions.
- My calls: Supabase replaces Dexie; TanStack Query; weekly (not daily) streak; rest weeks allowed; Playwright deferred; catalog bundled rather than in Supabase; derived "calisthenics" label; project-authored gap-fill exercises.

## 11b. Calls made after builder review (mine, not the owner's; change freely)

- Equipment: a normalized vocabulary shared across sources (for example "body only" and "Bodyweight" both become `bodyweight`). An exercise is available when every item it requires is in the user's equipment list. Settings offers the catalog's vocabulary; default is bodyweight, wall, chair.
- Source conflicts: Workout Guide wins for muscles, equipment and exercise type. free-exercise-db supplies instructions, level, mechanic and force only. Low-confidence name matches get no level and are listed in an import review report. The review is advisory, not blocking v1.
- Catalog IDs: derived deterministically from the Workout Guide slug; free-exercise-db-only entries use their own id with a source prefix; project-authored entries use a `project-` prefix. Removed or renamed exercises stay in the catalog as deprecated, never deleted, so history keeps resolving.
- Weeks start Monday in the device's local timezone. Changing the weekly goal applies from the current week forward; each week's goal and any rest-week flag are stored with that week so past streaks do not change retroactively.
- Dashboard "next routine": rotates A, B, C after the last completed session. Skipping a day carries no penalty.
- In-progress session draft: kept in `localStorage` until it syncs, with an "unsynced session" indicator. Single device assumed; no multi-device draft merging.
- First run: no wizard. After sign-in the app seeds starter routines and default settings and shows a dismissible banner containing the disclaimer.
- Approved mockups are copied to `docs/superpowers/specs/mockups/` and committed, so the build does not depend on `.superpowers/`.

## 12. Left to the builder

Auth method details, the exact DB schema, the import script's fuzzy-match approach, final starter exercise selection, component library details, chart styling, the icon set and app name, and test coverage specifics.
