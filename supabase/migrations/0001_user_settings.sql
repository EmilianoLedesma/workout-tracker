-- Per-user settings. One row per user; RLS restricts every operation to the owner.
create table public.user_settings (
  user_id uuid primary key references auth.users on delete cascade,
  weekly_goal int not null default 3 check (weekly_goal between 1 and 7),
  equipment text[] not null default '{bodyweight,wall,chair}',
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

create policy "select own settings" on public.user_settings
  for select to authenticated using (user_id = (select auth.uid()));

create policy "insert own settings" on public.user_settings
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy "update own settings" on public.user_settings
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "delete own settings" on public.user_settings
  for delete to authenticated using (user_id = (select auth.uid()));
