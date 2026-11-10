-- Same-owner routine link and time sanity for sessions.
-- Foreign key checks ignore RLS, so before this a user could point a session at
-- another user's routine id (and learn that the id exists). The composite key
-- needs both columns to match one row; on delete only routine_id is cleared.
alter table public.sessions
  drop constraint sessions_routine_id_fkey;

alter table public.sessions
  add constraint sessions_routine_user_fkey
  foreign key (routine_id, user_id)
  references public.routines (id, user_id)
  on delete set null (routine_id);

alter table public.sessions
  add constraint sessions_finished_after_started
  check (finished_at >= started_at);

-- A week, generously: a workout left open and continued later still saves.
alter table public.sessions
  add constraint sessions_duration_max
  check (duration_seconds <= 604800);
