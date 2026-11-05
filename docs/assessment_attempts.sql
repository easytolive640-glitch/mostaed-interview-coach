begin;

create table if not exists public.paid_assessment_attempts (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription_id text not null,
  payment_id text not null,
  expires_at timestamptz not null,
  submitted_at timestamptz
);
create index if not exists paid_assessment_attempts_cycle
  on public.paid_assessment_attempts(user_id, subscription_id, payment_id);
alter table public.paid_assessment_attempts enable row level security;
revoke all on public.paid_assessment_attempts from public, anon, authenticated;

create or replace function public.reserve_assessment_start(
  p_user_id uuid, p_subscription_id text, p_payment_id text, p_plan text, p_attempt_id uuid
) returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_limit integer := case p_plan when 'starter' then 5 when 'pro' then 10 end;
begin
  if v_limit is null or p_attempt_id is null or coalesce(p_payment_id, '') = '' then return false; end if;
  if not exists (
    select 1 from public.paid_subscriptions
    where user_id = p_user_id and subscription_id = p_subscription_id
      and plan = p_plan and status = 'active' and not test_mode
  ) then return false; end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text, 0));
  if exists (select 1 from public.paid_assessment_attempts where id = p_attempt_id) then
    return exists (
      select 1 from public.paid_assessment_attempts
      where id = p_attempt_id and user_id = p_user_id and subscription_id = p_subscription_id
        and payment_id = p_payment_id and submitted_at is null and expires_at > now()
    );
  end if;
  if (select count(*) from public.paid_assessment_attempts
      where user_id = p_user_id and subscription_id = p_subscription_id and payment_id = p_payment_id) >= v_limit
  then return false; end if;

  insert into public.paid_assessment_attempts(id, user_id, subscription_id, payment_id, expires_at)
    values (p_attempt_id, p_user_id, p_subscription_id, p_payment_id,
      now() + case p_plan when 'starter' then interval '70 minutes' else interval '100 minutes' end);
  return true;
end;
$$;

create or replace function public.claim_assessment_submission(
  p_user_id uuid, p_subscription_id text, p_attempt_id uuid
) returns boolean language plpgsql security definer set search_path = '' as $$
begin
  update public.paid_assessment_attempts set submitted_at = now()
    where id = p_attempt_id and user_id = p_user_id and subscription_id = p_subscription_id
      and submitted_at is null and expires_at > now();
  return found;
end;
$$;

revoke all on function public.reserve_assessment_start(uuid, text, text, text, uuid) from public, anon, authenticated;
revoke all on function public.claim_assessment_submission(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.reserve_assessment_start(uuid, text, text, text, uuid) to service_role;
grant execute on function public.claim_assessment_submission(uuid, text, uuid) to service_role;

commit;
