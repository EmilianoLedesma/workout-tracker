-- Size limits. Without them one signed-in user could store arbitrarily long
-- exercise ids or thousands of items in a single routine.
alter table public.routine_exercises
  add constraint routine_exercises_exercise_id_length
  check (char_length(exercise_id) between 1 and 100);

-- Same body as 0002 plus the item-count guard. create or replace keeps grants.
create or replace function public.save_routine(
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

  if jsonb_array_length(coalesce(p_items, '[]'::jsonb)) > 50 then
    raise exception 'too many exercises';
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
