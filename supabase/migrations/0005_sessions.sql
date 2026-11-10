-- Finished workouts. One row per session; log holds what was actually done.
-- No update policy: history is immutable. Deleting is allowed to the owner.
create table public.sessions (
  id uuid primary key,
  user_id uuid not null references auth.users on delete cascade,
  routine_id uuid references public.routines on delete set null,
  routine_name text not null check (char_length(routine_name) between 1 and 60),
  started_at timestamptz not null,
  finished_at timestamptz not null,
  duration_seconds int not null check (duration_seconds >= 0),
  status text not null check (status in ('completed', 'partial')),
  note text check (char_length(note) <= 500),
  log jsonb not null check (
    jsonb_typeof(log) = 'array' and octet_length(log::text) <= 100000
  ),
  created_at timestamptz not null default now()
);

create index sessions_user_finished_idx
  on public.sessions (user_id, finished_at desc);

alter table public.sessions enable row level security;

create policy "select own sessions" on public.sessions
  for select to authenticated using (user_id = (select auth.uid()));
create policy "insert own sessions" on public.sessions
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "delete own sessions" on public.sessions
  for delete to authenticated using (user_id = (select auth.uid()));
