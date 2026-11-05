begin;

create table if not exists public.assessment_topup_orders (
  reference uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id text unique,
  capture_id text unique,
  created_at timestamptz not null default now(),
  used_at timestamptz
);
alter table public.assessment_topup_orders enable row level security;
revoke all on public.assessment_topup_orders from public, anon, authenticated;

create or replace function public.assessment_topup_order(
  p_action text, p_user uuid, p_ref uuid, p_order text, p_capture text
) returns boolean language plpgsql security definer set search_path = '' as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user::text, 0));
  case p_action
    when 'reserve' then
      if exists (select 1 from public.assessment_topup_orders where reference=p_ref) then
        return exists (select 1 from public.assessment_topup_orders
          where reference=p_ref and user_id=p_user and capture_id is null and created_at > now()-interval '4 hours');
      end if;
      if (select count(*) from public.assessment_topup_orders
          where user_id=p_user and created_at > now()-interval '1 hour') >= 10 then return false; end if;
      insert into public.assessment_topup_orders(reference,user_id) values (p_ref,p_user);
      return true;
    when 'attach' then
      update public.assessment_topup_orders set order_id=p_order
        where reference=p_ref and user_id=p_user and p_order is not null and (order_id is null or order_id=p_order);
      return found;
    when 'owned' then
      return exists (select 1 from public.assessment_topup_orders where reference=p_ref and user_id=p_user and order_id=p_order);
    when 'credit' then
      update public.assessment_topup_orders set capture_id=p_capture
        where reference=p_ref and user_id=p_user and order_id=p_order
          and p_capture is not null and (capture_id is null or capture_id=p_capture);
      return found;
    else return false;
  end case;
end;
$$;
revoke all on function public.assessment_topup_order(text,uuid,uuid,text,text) from public, anon, authenticated;
grant execute on function public.assessment_topup_order(text,uuid,uuid,text,text) to service_role;

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
  then
    update public.assessment_topup_orders set used_at=now()
      where reference=(select reference from public.assessment_topup_orders
        where user_id=p_user_id and capture_id is not null and used_at is null
        order by created_at, reference limit 1);
    if not found then return false; end if;
  end if;

  insert into public.paid_assessment_attempts(id, user_id, subscription_id, payment_id, expires_at)
    values (p_attempt_id, p_user_id, p_subscription_id, p_payment_id,
      now() + case p_plan when 'starter' then interval '70 minutes' else interval '100 minutes' end);
  return true;
end;
$$;

commit;
