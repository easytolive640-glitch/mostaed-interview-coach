-- Run once in the Supabase SQL editor. Only server-side service_role may use these RPCs.
create table if not exists public.paid_subscriptions (
  subscription_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null check (plan in ('starter', 'pro')),
  status text not null,
  test_mode boolean not null default true,
  updated_at timestamptz not null default now()
);
create index if not exists paid_subscriptions_user_idx on public.paid_subscriptions (user_id);
alter table public.paid_subscriptions enable row level security;

create table if not exists public.ai_monthly_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  period date not null,
  attempts integer not null default 0 check (attempts >= 0),
  primary key (user_id, period)
);
alter table public.ai_monthly_usage enable row level security;

revoke all on public.paid_subscriptions, public.ai_monthly_usage from anon, authenticated;

create or replace function public.paid_subscription_for_user(p_user_id uuid)
returns jsonb
language sql security definer set search_path = ''
as $$
  select jsonb_build_object('subscription_id', s.subscription_id, 'plan', s.plan)
  from public.paid_subscriptions s
  where s.user_id = p_user_id and s.status = 'active' and not s.test_mode
  order by case s.plan when 'pro' then 0 else 1 end
  limit 1;
$$;

create or replace function public.ingest_paid_subscription(
  p_subscription_id text, p_user_id uuid, p_plan text,
  p_status text, p_test_mode boolean, p_updated_at timestamptz
)
returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  if p_plan not in ('starter', 'pro') or p_updated_at is null then return false; end if;
  insert into public.paid_subscriptions
    (subscription_id, user_id, plan, status, test_mode, updated_at)
  values (p_subscription_id, p_user_id, p_plan, p_status, p_test_mode, p_updated_at)
  on conflict (subscription_id) do update
    set plan = excluded.plan, status = excluded.status,
        test_mode = excluded.test_mode, updated_at = excluded.updated_at
    where public.paid_subscriptions.updated_at <= excluded.updated_at
      and public.paid_subscriptions.user_id = excluded.user_id;
  return found;
end;
$$;

create or replace function public.reserve_ai_evaluation(p_user_id uuid)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_plan text;
  v_period date := date_trunc('month', now() at time zone 'utc')::date;
  v_limit integer;
  v_count integer;
begin
  select s.plan into v_plan from public.paid_subscriptions s
  where s.user_id = p_user_id and s.status = 'active' and not s.test_mode
  order by case s.plan when 'pro' then 0 else 1 end limit 1;
  if v_plan is null then return jsonb_build_object('allowed', false); end if;
  v_limit := case v_plan when 'pro' then 100 else 20 end;
  insert into public.ai_monthly_usage (user_id, period, attempts)
    values (p_user_id, v_period, 1)
  on conflict (user_id, period) do update
    set attempts = public.ai_monthly_usage.attempts + 1
    where public.ai_monthly_usage.attempts < v_limit
  returning attempts into v_count;
  return jsonb_build_object('allowed', v_count is not null, 'used', v_count, 'limit', v_limit);
end;
$$;

revoke all on function public.paid_subscription_for_user(uuid) from public, anon, authenticated;
revoke all on function public.ingest_paid_subscription(text, uuid, text, text, boolean, timestamptz) from public, anon, authenticated;
revoke all on function public.reserve_ai_evaluation(uuid) from public, anon, authenticated;
grant execute on function public.paid_subscription_for_user(uuid) to service_role;
grant execute on function public.ingest_paid_subscription(text, uuid, text, text, boolean, timestamptz) to service_role;
grant execute on function public.reserve_ai_evaluation(uuid) to service_role;
