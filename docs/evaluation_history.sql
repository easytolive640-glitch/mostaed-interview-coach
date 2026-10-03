-- Run once in the Mostaed Supabase SQL Editor.
create table if not exists public.evaluation_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  category text not null check (category in ('hr','customerService','itCloud')),
  language text not null check (language in ('english','arabic')),
  evaluation jsonb not null check (jsonb_typeof(evaluation) = 'object')
);
create index if not exists evaluation_history_owner_date on public.evaluation_history(user_id, created_at desc);
alter table public.evaluation_history enable row level security;
revoke all on public.evaluation_history from anon, authenticated;
grant select on public.evaluation_history to authenticated;
grant select, insert on public.evaluation_history to service_role;
drop policy if exists "Read own evaluation history" on public.evaluation_history;
create policy "Read own evaluation history" on public.evaluation_history
  for select to authenticated using ((select auth.uid()) = user_id);
-- Only the backend writes verified results. Raw CV text and audio are not stored.
