# Active Workout (Milestone 4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The owner can run a workout from a routine on their phone, change today's plan on the fly, close and reopen the app without losing it, and save what was actually done.

**Architecture:** A pure state machine (`workoutState.ts`) holds the whole session: exercises with per-set targets and actuals, a cursor, a phase (`set`, `rest`, `review`), one timer stored as an absolute end time, and pause accounting. Every action carries `now`, so the machine is deterministic and testable without fake clocks. The state is mirrored to `localStorage` on every change (`workoutDraft.ts`). Finishing writes a `finish` record into the draft, then a single idempotent insert saves one row to a new `sessions` table; the draft is cleared only after the server confirms. React glue (`useWorkoutSession`) adds the clock, alerts and save retry. Screens are thin views over the state.

**Tech Stack:** Existing stack (React, TypeScript, Vite, Tailwind, shadcn Button, TanStack Query, Zod, Supabase, Vitest + RTL, Lucide). No new dependencies. Browser APIs used with feature detection: Web Audio, Vibration, Screen Wake Lock.

**Spec:** `docs/superpowers/specs/2026-11-10-active-workout-design.md` (this milestone), `docs/superpowers/specs/2026-11-09-workout-tracker-design.md` (Active Workout, data and draft decisions). PRD: `.claude/prds/workout-tracker.prd.md` (milestone 4). Visual language: bone palette, `page-title` / `section-title`, existing `Button`.

## Global Constraints

- UI language English only, no emojis, no medical claims. Quitting early is shown quietly: the status word `partial` is never shown to the owner; the summary says what was done.
- Changes during a workout apply to today only. The routine is never read after start and never written.
- Targets keep the routine limits: sets 1-10, reps 1-100, seconds 5-600, rest 0-600; at most 50 exercises per session. Adjust steps: reps plus/minus 1, seconds and rest plus/minus 15.
- Timers store absolute end times (`endsAt`) or, when paused, `remainingMs`. No ticking counters in state.
- One active workout at a time. The draft key is `workout-draft-v1`. A draft untouched for more than 24 hours is offered for discard, never resumed silently.
- `sessions` table: RLS on `auth.uid()`, select, insert and delete own rows only, no update (history is immutable). Next migration number: `0005`. Applying it to the live project needs the owner's explicit yes (project data-safety rule); Task 1 stops and asks.
- Save is idempotent: the client generates the session id and inserts with `ignoreDuplicates`.
- Screens are built from mockups the owner has approved in the visual companion (Task 8, Step 1). No screen component is written before that approval.
- TDD for every task. Supabase mocked in tests. TypeScript 7: no `baseUrl`. Alias `@/` maps to `src/`. No new dependencies.
- Streaks, badges, the dashboard "next routine" card and history views belong to milestone 5; this plan adds none of them.

## Review Focus

1. The phone sleeps during a rest or a plank countdown, then the app is reopened: remaining time is correct, the end alert fires once, and no set is logged twice. (Tasks 2, 3, 7)
2. The save fails, the app is closed, then reopened: the draft is still there with an "unsynced" state, retry saves exactly one row, and a second retry after success adds nothing. (Tasks 5, 7, 10)
3. A routine is edited or deleted mid-workout, or an exercise id is missing from the catalog: the workout continues from its snapshot and shows "Exercise no longer available" without crashing. (Tasks 8, 10)
4. A corrupt, truncated or old-version draft sits in `localStorage`: it is ignored, the app starts clean and does not crash. (Task 4)
5. Edge actions: double tap on Done, removing or skipping the current or last exercise, adding an 11th set or a 51st exercise, lowering a target below its minimum, finishing with nothing done. (Task 3)

## File Structure

- `supabase/migrations/0005_sessions.sql`: `sessions` table, checks, RLS.
- `scripts/verify-rls.mjs`: add `sessions` to the checked tables.
- `src/types/workout.ts`: types and Zod schema for the state machine and the saved log.
- `src/features/workouts/timer.ts`: pure timer helpers.
- `src/features/workouts/workoutState.ts`: `createWorkout`, `reduce`, selectors, `toSessionPayload`.
- `src/features/workouts/workoutDraft.ts`: `localStorage` persistence with validation.
- `src/features/workouts/useSaveSession.ts`: the Supabase insert mutation.
- `src/features/workouts/alerts.ts`: beep, vibrate, wake lock.
- `src/features/workouts/useNow.ts`: ticking clock hook.
- `src/features/workouts/useWorkoutSession.ts`: ties state, draft, clock, alerts and save together.
- `src/features/workouts/SetView.tsx`, `RestView.tsx`, `PlanSheet.tsx`, `FinishView.tsx`, `ResumePrompt.tsx`: screens.
- `src/features/workouts/WorkoutPage.tsx`: replaces the placeholder; route `/workout/:routineId` already exists.
- `src/features/routines/RoutinesPage.tsx`: Start button per routine and a Continue banner.

---

### Task 1: Sessions table and RLS check

**Files:**
- Create: `supabase/migrations/0005_sessions.sql`
- Modify: `scripts/verify-rls.mjs` (add `'sessions'` to `TABLES`)

**Interfaces:**
- Produces: table `public.sessions(id uuid primary key, user_id uuid not null references auth.users on delete cascade, routine_id uuid references public.routines on delete set null, routine_name text not null check (char_length between 1 and 60), started_at timestamptz not null, finished_at timestamptz not null, duration_seconds int not null check (>= 0), status text not null check (in 'completed','partial'), note text check (char_length <= 500), log jsonb not null check (jsonb_typeof = 'array' and octet_length(log::text) <= 100000), created_at timestamptz default now())`. Index on `(user_id, finished_at desc)`. Policies: select, insert (with check `user_id = auth.uid()`), delete, all `to authenticated`.

- [ ] **Step 1: Write the migration file** with the table, checks, index and the three policies. Comment at the top explains immutability (no update policy).
- [ ] **Step 2: Add `'sessions'` to `TABLES` in `verify-rls.mjs`.** Run `node --check scripts/verify-rls.mjs`. Expected: no output.
- [ ] **Step 3: STOP and ask the owner** before applying the migration to the live project (data-safety rule). After a yes, apply it with the Supabase MCP `apply_migration`, then verify read-only: the table exists, RLS is enabled, three policies, and `get_advisors` security shows nothing new. Ask the owner to run `node --env-file=.env scripts/verify-rls.mjs`.
- [ ] **Step 4: Commit** `feat(db): sessions table with RLS (migration 0005)`.

---

### Task 2: Workout types and timer helpers

**Files:**
- Create: `src/types/workout.ts`, `src/features/workouts/timer.ts`
- Test: `src/features/workouts/timer.test.ts`

**Interfaces:**
- Produces in `src/types/workout.ts` (types plus a Zod `workoutSchema` that accepts exactly these shapes):
  - `WorkoutSet = { target: number; actual: number | null; restSeconds: number }`
  - `WorkoutExercise = { uid: string; exerciseId: string; targetType: 'reps' | 'seconds'; status: 'active' | 'skipped' | 'removed'; sets: WorkoutSet[] }`
  - `Timer = { endsAt: number } | { remainingMs: number }`
  - `Phase = 'set' | 'rest' | 'review'`
  - `Workout = { version: 1; id: string; routineId: string | null; routineName: string; startedAt: number; updatedAt: number; exercises: WorkoutExercise[]; cursor: { exercise: number; set: number }; phase: Phase; timer: Timer | null; lastDone: { exercise: number; set: number } | null; paused: boolean; pausedAt: number | null; pausedMs: number; finish: { finishedAt: number; status: 'completed' | 'partial'; note: string } | null }`
- Produces in `timer.ts`: `startTimer(now: number, seconds: number): Timer`, `remainingMs(t: Timer, now: number): number` (never below 0), `isFinished(t: Timer, now: number): boolean`, `pauseTimer(t: Timer, now: number): Timer`, `resumeTimer(t: Timer, now: number): Timer`, `addSeconds(t: Timer, now: number, seconds: number): Timer` (result never below 0).

- [ ] **Step 1: Write failing tests** in `timer.test.ts`: `startTimer(1000, 30)` has `remainingMs(.., 1000) === 30000` and `31000` is finished at `isFinished(.., 31000)`; `remainingMs` at `now` far past the end is `0`; `pauseTimer` at 11 s into a 30 s timer gives `remainingMs` 19000 and stays 19000 at any later `now`; `resumeTimer(paused, 50000)` finishes at 69000; `addSeconds(t, now, 15)` adds 15000 to remaining for both running and paused timers; `addSeconds(.., -999)` clamps to 0; pausing an already paused timer and resuming a running one return it unchanged.
- [ ] **Step 2: Run** `npx vitest run src/features/workouts/timer.test.ts`. Expected: FAIL, module not found.
- [ ] **Step 3: Implement** `workout.ts` types (and `workoutSchema`) and `timer.ts` with the signatures above.
- [ ] **Step 4: Run** the same command. Expected: PASS. Run `npm run typecheck`. Expected: clean.
- [ ] **Step 5: Commit** `feat(workouts): workout types and timer helpers`.

---

### Task 3: The workout state machine

**Files:**
- Create: `src/features/workouts/workoutState.ts`
- Test: `src/features/workouts/workoutState.test.ts`

**Interfaces:**
- Consumes: Task 2 types and timer helpers; `Routine`, `RoutineExercise` from `@/types/routine`.
- Produces:
  - `createWorkout(args: { id: string; routine: Routine; now: number; uid: () => string }): Workout` copies the routine (each item becomes a `WorkoutExercise` with `sets` copies of `{ target, actual: null, restSeconds }`), `cursor {0,0}`, phase `'set'`, no timer, not paused. A routine with no items starts in phase `'review'`.
  - `type Action = ({ type: 'startTimer' } | { type: 'adjustTarget'; delta: number } | { type: 'completeSet' } | { type: 'adjustRest'; delta: number } | { type: 'endRest' } | { type: 'addSet' } | { type: 'addExercise'; item: RoutineExercise; uid: string } | { type: 'removeExercise'; uid: string } | { type: 'skipExercise' } | { type: 'pause' } | { type: 'resume' } | { type: 'finish'; note: string }) & { now: number }`
  - `reduce(w: Workout, a: Action): Workout`: pure; always sets `updatedAt = a.now`; ignores impossible actions by returning `w` unchanged.
  - Selectors: `currentSet(w): { exercise: WorkoutExercise; set: WorkoutSet; setNumber: number; setCount: number } | null` (null in `'review'`), `counts(w): { done: number; total: number }` (sets of exercises with status `'active'`), `toSessionPayload(w: Workout): SessionPayload` with `SessionPayload = { id: string; routineId: string | null; routineName: string; startedAt: string; finishedAt: string; durationSeconds: number; status: 'completed' | 'partial'; note: string | null; log: LogExercise[] }` and `LogExercise = { exercise_id: string; target_type: 'reps' | 'seconds'; status: 'active' | 'skipped' | 'removed'; sets: { target: number; actual: number | null; rest_seconds: number }[] }`. `startedAt` and `finishedAt` are ISO strings; `durationSeconds = round((finishedAt - startedAt - pausedMs) / 1000)`, never negative; a blank note becomes `null`; throws if `w.finish` is null.
- Rules (each is a test):
  - `completeSet` only works in phase `'set'`; for a `'seconds'` set only when the timer exists and is finished at `now`. It sets `actual = target`, clears the timer, sets `lastDone`, moves the cursor to the next set of the same exercise, else the first set of the next `'active'` exercise, else phase `'review'`. If a next set exists and the finished set's `restSeconds > 0` the phase becomes `'rest'` with `startTimer(now, restSeconds)`; with 0 rest the phase is `'set'` directly.
  - `startTimer` only in phase `'set'` on a `'seconds'` set with no timer.
  - `adjustTarget`: reps clamp 1-100, seconds clamp 5-600, only in phase `'set'` and only on a set with `actual === null`; if a running timer belongs to that set, the timer changes by `delta` seconds too.
  - `adjustRest` only in phase `'rest'`: changes the timer by `delta` (never below 0) and `restSeconds` of the `lastDone` set by `delta` (never below 0).
  - `endRest` only in phase `'rest'`: phase `'set'`, timer `null`.
  - `addSet` appends a copy of the current exercise's last set (target and rest, `actual: null`), max 10 sets; from `'review'` it moves the cursor to the new set and phase `'set'`.
  - `addExercise` appends at the end, max 50 exercises in total; from `'review'` it moves the cursor to it and phase `'set'`. Unknown `item.sets` outside 1-10 is clamped.
  - `removeExercise` sets status `'removed'`; if it is the current exercise the cursor advances like `completeSet` without logging and the phase becomes `'set'` (or `'review'`), timer `null`.
  - `skipExercise`: current exercise status `'skipped'` (completed sets stay logged), same advance as above.
  - `pause` (not already paused): `paused = true`, `pausedAt = now`, timer converted with `pauseTimer`. While paused every action except `resume` and `finish` is ignored. `resume`: `pausedMs += now - pausedAt`, timer converted with `resumeTimer`.
  - `finish`: sets `finish = { finishedAt: now, status, note }` where status is `'completed'` when every set of every `'active'` exercise has an actual, else `'partial'`; closes open pause accounting; a second `finish` is ignored.

- [ ] **Step 1: Write failing tests** covering every rule above. Include: a two-exercise routine played to `'review'` with correct `actual` values; a timed set that cannot be completed before its timer ends; double `completeSet` (second returns the same object); `adjustTarget(+1)` then `completeSet` logs `target + 1`; a timer adjusted by +15 while running; rest +15 and its effect on `lastDone`; pause at 10 s then resume 60 s later leaves remaining unchanged and `pausedMs` 60000; `toSessionPayload` for a finished early workout has status `'partial'`, ISO strings, correct duration, and `null` for a blank note; removing the only remaining exercise lands in `'review'`; adding an 11th set and a 51st exercise are no-ops.
- [ ] **Step 2: Run** `npx vitest run src/features/workouts/workoutState.test.ts`. Expected: FAIL, module not found.
- [ ] **Step 3: Implement** `createWorkout`, `reduce`, the selectors and `toSessionPayload` to satisfy the tests.
- [ ] **Step 4: Run** the same command. Expected: PASS. Run `npm run typecheck`. Expected: clean.
- [ ] **Step 5: Commit** `feat(workouts): workout state machine`.

---

### Task 4: Local draft persistence

**Files:**
- Create: `src/features/workouts/workoutDraft.ts`
- Test: `src/features/workouts/workoutDraft.test.ts`

**Interfaces:**
- Consumes: `workoutSchema`, `Workout`.
- Produces: `DRAFT_KEY = 'workout-draft-v1'`; `loadDraft(storage?: Storage): Workout | null` (validates with `workoutSchema`; returns `null` for missing, unparsable, wrong-version or invalid data); `saveDraft(w: Workout, storage?: Storage): void` and `clearDraft(storage?: Storage): void` (both swallow storage errors); `isStale(w: Workout, now: number): boolean` (`true` when `now - w.updatedAt` is over 24 hours); `STALE_MS`.

- [ ] **Step 1: Write failing tests**: round trip; `loadDraft` returns `null` for `'{'` (truncated), for `{"version":2,...}`, for a valid shape with a missing field, and for an empty storage; `saveDraft` and `loadDraft` do not throw when `storage.setItem` / `getItem` throw; `clearDraft` removes the key; `isStale` is false at 23h59m and true at 24h01m.
- [ ] **Step 2: Run** `npx vitest run src/features/workouts/workoutDraft.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** with `localStorage` as the default storage.
- [ ] **Step 4: Run** the same command. Expected: PASS.
- [ ] **Step 5: Commit** `feat(workouts): local draft persistence`.

---

### Task 5: Saving a session

**Files:**
- Create: `src/features/workouts/useSaveSession.ts`
- Test: `src/features/workouts/useSaveSession.test.tsx`

**Interfaces:**
- Consumes: `SessionPayload` (Task 3), `useSession`, `getSupabase`.
- Produces: `useSaveSession()` returning a TanStack `useMutation` whose `mutationFn(payload: SessionPayload): Promise<void>` runs `from('sessions').upsert({ id, user_id, routine_id, routine_name, started_at, finished_at, duration_seconds, status, note, log }, { onConflict: 'id', ignoreDuplicates: true })` and throws `new Error(error.message)` on error. `user_id` comes from the signed-in session.

- [ ] **Step 1: Write failing tests** (Supabase mocked like `useRoutines.test.tsx`): the upsert gets snake_case columns, the user id and `{ onConflict: 'id', ignoreDuplicates: true }`; calling twice with the same payload sends the same id both times; a Supabase error rejects; with no signed-in user the mutation rejects without calling Supabase.
- [ ] **Step 2: Run** `npx vitest run src/features/workouts/useSaveSession.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement** the hook.
- [ ] **Step 4: Run** the same command. Expected: PASS.
- [ ] **Step 5: Commit** `feat(workouts): save finished sessions idempotently`.

---

### Task 6: Alerts and clock

**Files:**
- Create: `src/features/workouts/alerts.ts`, `src/features/workouts/useNow.ts`
- Test: `src/features/workouts/alerts.test.ts`, `src/features/workouts/useNow.test.tsx`

**Interfaces:**
- Produces in `alerts.ts`: `prepareAudio(): void` (creates or resumes one shared `AudioContext`, call from a tap), `beep(): void` (short tone, no-op without audio), `vibrate(): void` (`navigator.vibrate([200, 100, 200])` when available), `alertCountdownEnd(): void` (beep and vibrate, never throws), `keepScreenOn(): Promise<() => void>` (requests a screen wake lock; returns a release function; returns a no-op release when unsupported or denied).
- Produces in `useNow.ts`: `useNow(active: boolean, intervalMs = 250): number`, returns `Date.now()` and re-renders on an interval while `active`; also refreshes immediately on `visibilitychange` to visible.

- [ ] **Step 1: Write failing tests**: with `navigator.vibrate` mocked, `vibrate()` calls it with the pattern; without it, no throw; `beep()` with a mocked `AudioContext` starts and stops one oscillator, and with no `AudioContext` does nothing; `alertCountdownEnd` calls both and survives one of them throwing; `keepScreenOn` calls `navigator.wakeLock.request('screen')` and its release calls `release()`, and resolves to a no-op when `wakeLock` is missing or rejects; `useNow` with fake timers advances while active, stops when inactive, and updates on a `visibilitychange` event.
- [ ] **Step 2: Run** `npx vitest run src/features/workouts/alerts.test.ts src/features/workouts/useNow.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement** both files.
- [ ] **Step 4: Run** the same command. Expected: PASS.
- [ ] **Step 5: Commit** `feat(workouts): device alerts and clock hook`.

---

### Task 7: The session hook

**Files:**
- Create: `src/features/workouts/useWorkoutSession.ts`
- Test: `src/features/workouts/useWorkoutSession.test.tsx`

**Interfaces:**
- Consumes: Tasks 2 to 6.
- Produces: `useWorkoutSession(): { workout: Workout | null; now: number; start(routine: Routine): void; act(action: DistributiveOmit<Action, 'now'>): void; discard(): void; save: { status: 'idle' | 'saving' | 'saved' | 'error'; retry(): void }; summary: SessionPayload | null }`.
- Behavior (each is a test, fake timers, Supabase and alerts mocked):
  - Initial state is `loadDraft()`; every state change calls `saveDraft`; `discard` clears it.
  - `start` builds the workout with `crypto.randomUUID()` ids, calls `prepareAudio()` and requests the wake lock; the lock is released on finish, discard and unmount.
  - `act` stamps `now: Date.now()`.
  - The clock ticks only while a workout exists and is not paused.
  - When the running timer reaches zero, `alertCountdownEnd` is called exactly once per countdown. A countdown that already finished while the app was closed alerts once on load.
  - A finished-set timed exercise auto-dispatches `completeSet` when its countdown ends.
  - When `workout.finish` is set, the hook saves `toSessionPayload(workout)`; on success it clears the draft, sets `summary`, `save.status = 'saved'`; on failure the draft stays, `save.status = 'error'`, and `retry()` saves again. On load, a draft that already has `finish` starts saving at once. Saving twice never produces two inserts for one success.

- [ ] **Step 1: Write failing tests** for each behavior above.
- [ ] **Step 2: Run** `npx vitest run src/features/workouts/useWorkoutSession.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement** the hook with `useReducer`-style state over `reduce`, effects for persistence, clock, alerts, wake lock and save.
- [ ] **Step 4: Run** the same command. Expected: PASS. Run `npm run typecheck`. Expected: clean.
- [ ] **Step 5: Commit** `feat(workouts): workout session hook`.

---

### Task 8: Set and rest screens

**Files:**
- Create: `src/features/workouts/SetView.tsx`, `src/features/workouts/RestView.tsx`
- Test: `src/features/workouts/SetView.test.tsx`, `src/features/workouts/RestView.test.tsx`

**Interfaces:**
- Consumes: `Workout`, `currentSet`, `remainingMs`, `ExerciseImage`, `Button`; the exercise lookup arrives as a prop `exercises: Map<string, Exercise>` to keep views pure.
- Produces: `SetView({ workout, now, exercises, act })` and `RestView({ workout, now, exercises, act })`; both render from the state and call `act` only.
- Behavior (each is a test):
  - SetView, reps exercise: exercise name (or "Exercise no longer available" when the id is not in `exercises`), `Set 2 of 3`, the target with `Reps` label, a large `Done` button, `More reps` and `Fewer reps` buttons, the illustration frames; `Done` calls `act({ type: 'completeSet' })`; the stepper buttons call `adjustTarget` with +1 / -1.
  - SetView, timed exercise: shows `Start` until the timer exists, then a `role="timer"` countdown with `aria-label` of the remaining time; `Add 15 seconds` / `Remove 15 seconds` call `adjustTarget` with +15 / -15; no Done button (the set completes at zero).
  - RestView: large countdown in a `role="timer"`, `Add 15 seconds`, `Remove 15 seconds` (call `adjustRest`), `Skip rest` (calls `endRest`), a preview "Next: <name>, set N" and, when the timer is finished, the label "Rest over" and a `Start next set` button (calls `endRest`) with a visible flash class that is disabled under `prefers-reduced-motion`.
  - All buttons are at least 44 px high (`min-h-11`).

- [ ] **Step 1: Mockups first.** Start the visual companion server (the mockup server) and build mockups for the set view (reps and timed), the rest view (running and "Rest over"), the plan sheet and the finish summary, on a phone-width frame in the bone theme, reusing the layout approved earlier in `.superpowers/brainstorm/`. Show them to the owner and wait for explicit approval. Record the approved files and any requested changes in the commit message. Do not write any screen component before this approval.
- [ ] **Step 2: Write failing tests** for the behaviors above.
- [ ] **Step 3: Run** `npx vitest run src/features/workouts/SetView.test.tsx src/features/workouts/RestView.test.tsx`. Expected: FAIL.
- [ ] **Step 4: Implement** both views to match the approved mockups. Visual styling is exempt from TDD; say so in the commit.
- [ ] **Step 5: Run** the same command. Expected: PASS.
- [ ] **Step 6: Commit** `feat(workouts): set and rest screens`.

---

### Task 9: Plan changes and finish screens

**Files:**
- Create: `src/features/workouts/PlanSheet.tsx`, `src/features/workouts/FinishView.tsx`
- Test: `src/features/workouts/PlanSheet.test.tsx`, `src/features/workouts/FinishView.test.tsx`

**Interfaces:**
- Consumes: `Workout`, `act`, `ExercisePicker`, `defaultItem`; equipment and catalog arrive as props to stay pure: `exercises: Exercise[]`, `equipment: readonly Equipment[]`.
- Produces: `PlanSheet({ workout, exercises, equipment, act, onFinishEarly, onClose })` and `FinishView({ workout, saveStatus, summary, onSave(note: string), onRetry })`.
- Behavior (each is a test):
  - PlanSheet lists `Add a set`, `Skip this exercise`, `Remove this exercise` for the current exercise, an exercise list with a `Remove <name>` button per `'active'` exercise, and `Add exercise` revealing the `ExercisePicker`; choosing one calls `act({ type: 'addExercise', item: defaultItem(exercise), uid })`. Each action calls `act` with the matching reducer action. `Pause` / `Resume` is a button in the sheet header calling `pause` / `resume`. `Finish early` calls `onFinishEarly`.
  - FinishView, before saving: counts like "5 of 6 sets done", an optional note field (max 500 characters), a `Save workout` button calling `onSave(note)`. While saving: a status "Saving…". On error: "Not saved yet. Your workout is kept on this phone." with `Try again`. After saving: the summary with exercises and sets done and a `Back to routines` link; never shows the word partial.
- Both screens follow the mockups approved in Task 8, Step 1.

- [ ] **Step 1: Write failing tests** for the behaviors above.
- [ ] **Step 2: Run** `npx vitest run src/features/workouts/PlanSheet.test.tsx src/features/workouts/FinishView.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement** both views.
- [ ] **Step 4: Run** the same command. Expected: PASS.
- [ ] **Step 5: Commit** `feat(workouts): plan changes and finish screens`.

---

### Task 10: The workout page and its entry points

**Files:**
- Create: `src/features/workouts/ResumePrompt.tsx`
- Modify: `src/features/workouts/WorkoutPage.tsx` (replace the placeholder), `src/features/routines/RoutinesPage.tsx` (Start button, Continue banner)
- Test: `src/features/workouts/WorkoutPage.test.tsx`, `src/features/workouts/ResumePrompt.test.tsx`, update `src/features/routines/RoutinesPage.test.tsx`

**Interfaces:**
- Consumes: `useWorkoutSession`, `useRoutine`, `useCatalog`, `useSettings`, `isStale`, `loadDraft`, all views.
- Produces: `WorkoutPage` at `/workout/:routineId`; `ResumePrompt({ draft, stale, onContinue, onDiscard })`.
- Behavior (each is a test, hooks mocked at the module boundary):
  - No draft: loads the routine, then starts; shows "Loading routine…" meanwhile, "Routine not found" with a link back when missing, and the load error message on failure.
  - A draft for the same routine and not stale continues without asking; a draft for another routine, or a stale one, shows `ResumePrompt` with `Continue` and `Discard and start new` (the second clears the draft and starts the requested routine).
  - Phase `'set'` renders `SetView`, `'rest'` renders `RestView`, `'review'` shows "All sets done" and a `Finish` button; a `Plan` button opens `PlanSheet`; `Finish` (and `Finish early` from the sheet) dispatch `finish` and go to `FinishView`.
  - The page never writes to routines and still renders when the routine is later deleted (it reads only the draft once started).
  - RoutinesPage: each routine card has a `Start <name>` button linking to `/workout/<id>`; when a draft exists a banner "Workout in progress" with `Continue` links to its routine, or to the discard flow when the routine is gone.

- [ ] **Step 1: Write failing tests** for the behaviors above.
- [ ] **Step 2: Run** `npx vitest run src/features/workouts src/features/routines`. Expected: FAIL on the new tests only.
- [ ] **Step 3: Implement** the page, prompt and the RoutinesPage changes.
- [ ] **Step 4: Run** the same command. Expected: PASS. Run `npm run lint` and `npm run typecheck`. Expected: clean.
- [ ] **Step 5: Manual phone check** (the owner, with the dev server open on the phone): start a routine, lock the phone during a rest, reopen, close the tab mid-set and reopen, finish early, and confirm a row appears in `sessions`. Record anything that fails as a finding.
- [ ] **Step 6: Update docs**: mark milestone 4 complete in `.claude/prds/workout-tracker.prd.md` with the plan path. Commit `feat(workouts): workout page, start and continue entry points`.
