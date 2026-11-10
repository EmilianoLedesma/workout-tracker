# Active Workout: Design

Milestone 4. Builds on `2026-11-09-workout-tracker-design.md` (the Active Workout section and the in-progress draft decision stay in force) and on the routines from milestone 3.

## Intent

The owner is a sedentary beginner training at home, phone in hand, often between sets. The workout screen must be quick to use with one thumb, forgiving when the plan changes mid-session, and must never lose a session. Recording what was actually done is the point: milestone 5 (progress, streak, badges) reads it.

## Goals

- Start a workout from a routine and run it set by set.
- Reps exercise: one tap on "Done" logs the set. Timed exercise: a countdown runs and logs the set when it reaches zero.
- A rest countdown starts after each set.
- Change today's plan on the fly: pause and resume; add time, a rep or a set; extend the rest; add or remove exercises; skip an exercise.
- Closing the app or locking the phone never resets the workout. Coming back continues where it was.
- Finish normally, or finish early. Both save what was completed; an early finish is stored as partial.
- Countdown ends are announced by sound, vibration and the screen together.
- The saved session records what was actually done per set.

## Non-goals

- Editing the routine from the workout screen. Routine edits happen in the routine editor only.
- Entering reps or seconds by hand after a set. "Done" logs the numbers on screen.
- Multi-device drafts, background push notifications, social features.
- Progress charts, streaks and badges (milestone 5). This milestone only stores the data they will need.
- Guilt screens. Quitting early is a normal outcome, shown quietly.

## Anti-goals

- A lost or reset workout after a phone lock, app switch, refresh or dropped connection.
- A timer that drifts or freezes because the screen was off.
- A saved session that changes when the routine is later edited or deleted.
- Saving the same session twice after a retry.

## Decisions the owner made

- Changes during a workout apply to today only.
- "Done" logs what is on screen; the app derives actual reps and seconds from that (target plus anything added today).
- Timed exercises run a countdown that completes the set at zero.
- A restarted app continues the workout; it does not reset.
- Finishing early is allowed and saves the completed part.
- Countdown end: sound, vibration and screen, all three.

## Behavior

**Start.** A Start button on each routine card opens `/workout/:routineId`. The routine is copied into a session. If an unfinished workout exists, the app offers to continue it instead of starting a new one (one active workout at a time).

**Set view.** Exercise name, its illustration frames, the set list for the exercise, the target for the current set and a large Done button. Reps exercises have a plus/minus stepper on the target for today. Timed exercises show a countdown with start, plus 15 s and minus 15 s; the set completes at zero.

**Rest view.** Large countdown, minus 15 s, plus 15 s, Skip, preview of the next set. It starts when a set is logged. When it reaches zero the next set is ready; it does not start by itself.

**Plan changes.** From the workout screen: add a set to the current exercise, add an exercise (the same picker used in the routine editor, limited to owned equipment), remove an exercise, skip the current exercise. None of it touches the routine.

**Pause.** Freezes the active countdown and the elapsed workout time. Resume continues from the remaining time.

**Finish.** After the last set the app offers to finish. A Finish early action is always available. Both ask for an optional note, save, and show a short summary.

**Alerts.** When a countdown reaches zero: a short beep, a vibration pattern, and a visible change (the countdown area flashes and the label changes). The beep and the wake lock are enabled from the Start tap so browsers allow them. Where a capability is missing (vibration on iOS Safari, for example) the other two still work.

## Constraints

- Timers store absolute end times, never a ticking counter, so remaining time is correct after the phone sleeps or the tab is suspended. The screen is kept on during a workout with the Screen Wake Lock API where available.
- Honest limit: a web app cannot beep or vibrate while the phone is locked or the tab is in the background. On return the app shows the countdown as finished and alerts then.
- In-progress state lives in `localStorage` (existing decision), written on every change.
- The finished session is saved to Supabase with a client-generated id so a retry cannot create a duplicate. If the save fails the workout stays on the device with an "unsynced" indicator and retries; nothing is lost.
- Data safety: Supabase tables enable RLS on `auth.uid()`. The new migration is applied only after the owner says so.
- No emojis in UI. English copy only. No medical claims.
- TDD per project rules. Supabase mocked in tests; timers tested with fake timers.

## Data (proposal, builder to confirm in the plan)

A `sessions` table: `id uuid` (client-generated), `user_id`, `routine_id` (nullable, set null if the routine is deleted), `routine_name`, `started_at`, `finished_at`, `status` (`completed` or `partial`), `note`, and `log jsonb`. `log` holds the exercises in order with, for each set, the actual reps or seconds and the rest taken, plus skipped and removed exercises. Size limits on note and `log`, enforced in the database as with routines.

## Left to the builder

- State shape and storage format for the local draft; how a draft is versioned and recovered if it cannot be read.
- The reducer or state machine for workout state and the timer helper.
- Screen structure, components and exact layout within the existing bone theme and the approved mockups in `.superpowers/brainstorm/`.
- Beep generation (Web Audio) and the vibration pattern.
- Exact column constraints and the save function (single atomic insert).

## My calls (not yours, please check)

- One active workout at a time.
- Rest does not auto-advance to the next set.
- Early finish is stored as `partial`, shown without any negative wording.
- The local draft is cleared only after the server confirms the save.
- A workout abandoned for more than 24 hours is offered for discard rather than resumed automatically.
