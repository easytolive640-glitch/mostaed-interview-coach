-- Run after paid_access.sql. Prevent refund/reversal holds from being cleared by
-- duplicate activation events or client return verification.
create or replace function public.ingest_paid_subscription(
  p_subscription_id text, p_user_id uuid, p_plan text,
  p_status text, p_test_mode boolean, p_updated_at timestamptz
) returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if p_plan not in ('starter', 'pro') or p_updated_at is null then return false; end if;
  insert into public.paid_subscriptions (subscription_id,user_id,plan,status,test_mode,updated_at)
  values (p_subscription_id,p_user_id,p_plan,p_status,p_test_mode,p_updated_at)
  on conflict (subscription_id) do update
    set plan=excluded.plan,status=excluded.status,test_mode=excluded.test_mode,updated_at=excluded.updated_at
    where public.paid_subscriptions.updated_at <= excluded.updated_at
      and public.paid_subscriptions.user_id=excluded.user_id
      and (public.paid_subscriptions.status <> 'payment_hold' or excluded.status='payment_hold');
  return found;
end;
$$;
revoke all on function public.ingest_paid_subscription(text,uuid,text,text,boolean,timestamptz) from public,anon,authenticated;
grant execute on function public.ingest_paid_subscription(text,uuid,text,text,boolean,timestamptz) to service_role;
