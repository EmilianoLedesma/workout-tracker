-- A routine exercise must belong to the same user as its routine.
-- Before this, the policies only checked routine_exercises.user_id, and foreign
-- key checks ignore RLS, so one user could attach rows to another user's
-- routine and make every save of that routine fail on unique (routine_id, position).
alter table public.routines
  add constraint routines_id_user_id_key unique (id, user_id);

alter table public.routine_exercises
  drop constraint routine_exercises_routine_id_fkey;

alter table public.routine_exercises
  add constraint routine_exercises_routine_user_fkey
  foreign key (routine_id, user_id)
  references public.routines (id, user_id)
  on delete cascade;
