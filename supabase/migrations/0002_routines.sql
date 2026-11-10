-- Routines and their exercises. RLS restricts every row to its owner.
-- Writes go through save_routine / seed_starter_routines so they are atomic.

alter table public.user_settings
  add column starters_seeded boolean not null default false;

create table public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  day_label text check (day_label in ('A', 'B', 'C', 'D', 'E', 'F', 'G')),
  is_starter boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.routine_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  position int not null,
  exercise_id text not null,
  sets int not null check (sets between 1 and 10),
  target_type text not null check (target_type in ('reps', 'seconds')),
  target int not null check (target between 1 and 600),
  rest_seconds int not null check (rest_seconds between 0 and 600),
  unique (routine_id, position)
);

create index routines_user_id_idx on public.routines (user_id);
create index routine_exercises_routine_id_idx
  on public.routine_exercises (routine_id);

alter table public.routines enable row level security;
alter table public.routine_exercises enable row level security;

create policy "select own routines" on public.routines
  for select to authenticated using (user_id = (select auth.uid()));
create policy "insert own routines" on public.routines
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "update own routines" on public.routines
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "delete own routines" on public.routines
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "select own routine exercises" on public.routine_exercises
  for select to authenticated using (user_id = (select auth.uid()));
create policy "insert own routine exercises" on public.routine_exercises
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "update own routine exercises" on public.routine_exercises
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "delete own routine exercises" on public.routine_exercises
  for delete to authenticated using (user_id = (select auth.uid()));

-- Create (p_id null) or replace a routine and all its exercises in one transaction.
-- p_items: [{exercise_id, sets, target_type, target, rest_seconds}], position = index.
create function public.save_routine(
  p_id uuid,
  p_name text,
  p_day_label text,
  p_items jsonb
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  if p_id is null then
    insert into routines (user_id, name, day_label)
    values (v_uid, btrim(p_name), p_day_label)
    returning id into v_id;
  else
    update routines
    set name = btrim(p_name), day_label = p_day_label, updated_at = now()
    where id = p_id and user_id = v_uid
    returning id into v_id;
    if v_id is null then
      raise exception 'routine not found';
    end if;
    delete from routine_exercises where routine_id = v_id;
  end if;

  insert into routine_exercises
    (routine_id, user_id, position, exercise_id, sets, target_type, target, rest_seconds)
  select
    v_id,
    v_uid,
    (t.ord - 1)::int,
    t.item ->> 'exercise_id',
    (t.item ->> 'sets')::int,
    t.item ->> 'target_type',
    (t.item ->> 'target')::int,
    (t.item ->> 'rest_seconds')::int
  from jsonb_array_elements(coalesce(p_items, '[]'::jsonb))
    with ordinality as t(item, ord);

  return v_id;
end;
$$;

-- First-run copy of the starter routines. Idempotent: the settings row is locked,
-- and a flag stops the starters coming back after the owner deletes them.
-- p_routines: [{name, day_label, items}]. Returns true when it seeded.
create function public.seed_starter_routines(p_routines jsonb) returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_seeded boolean;
  v_routine jsonb;
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  insert into user_settings (user_id) values (v_uid)
  on conflict (user_id) do nothing;

  select starters_seeded into v_seeded
  from user_settings where user_id = v_uid for update;
  if v_seeded then
    return false;
  end if;

  for v_routine in select * from jsonb_array_elements(p_routines) loop
    v_id := save_routine(
      null,
      v_routine ->> 'name',
      v_routine ->> 'day_label',
      v_routine -> 'items'
    );
    update routines set is_starter = true where id = v_id;
  end loop;

  update user_settings
  set starters_seeded = true, updated_at = now()
  where user_id = v_uid;
  return true;
end;
$$;

revoke execute on function public.save_routine(uuid, text, text, jsonb)
  from public, anon;
revoke execute on function public.seed_starter_routines(jsonb)
  from public, anon;
grant execute on function public.save_routine(uuid, text, text, jsonb)
  to authenticated;
grant execute on function public.seed_starter_routines(jsonb) to authenticated;
