-- Test ledger only. This migration never grants paid AI access.
create table if not exists public.paymob_test_checkouts (
  reference text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id text unique,
  status text not null default 'pending' check (status in ('pending','paid','failed','held')),
  created_at timestamptz not null default now()
);
create table if not exists public.paymob_test_transactions (
  transaction_id text primary key,
  reference text not null references public.paymob_test_checkouts(reference),
  status text not null check (status in ('pending','paid','failed','held'))
);
alter table public.paymob_test_checkouts enable row level security;
alter table public.paymob_test_transactions enable row level security;
revoke all on public.paymob_test_checkouts, public.paymob_test_transactions from anon,authenticated;
create or replace function public.reserve_paymob_test_checkout(p_reference text,p_user_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text,0));
  if (select count(*) from public.paymob_test_checkouts where user_id=p_user_id and created_at > now()-interval '1 hour') >= 10 then return false; end if;
  insert into public.paymob_test_checkouts(reference,user_id) values(p_reference,p_user_id);
  return true;
end; $$;
create or replace function public.attach_paymob_test_order(p_reference text,p_user_id uuid,p_order_id text)
returns boolean language plpgsql security definer set search_path='' as $$
begin
  update public.paymob_test_checkouts set order_id=p_order_id where reference=p_reference and user_id=p_user_id and order_id is null;
  return found;
end; $$;
create or replace function public.record_paymob_test_payment(p_order_id text,p_transaction_id text,p_status text)
returns boolean language plpgsql security definer set search_path='' as $$
declare r text; existing_r text;
begin
  if p_status not in ('pending','paid','failed','held') then return false; end if;
  select reference into r from public.paymob_test_checkouts where order_id=p_order_id for update;
  if r is null then return false; end if;
  insert into public.paymob_test_transactions(transaction_id,reference,status) values(p_transaction_id,r,p_status)
  on conflict(transaction_id) do nothing;
  select reference into existing_r from public.paymob_test_transactions where transaction_id=p_transaction_id;
  if existing_r <> r then return false; end if;
  update public.paymob_test_transactions set status=p_status where transaction_id=p_transaction_id
    and status <> 'held' and (p_status='held' or status='pending' or p_status='paid');
  update public.paymob_test_checkouts set status=case
    when status='held' or p_status='held' then 'held'
    when status='paid' or p_status='paid' then 'paid'
    when p_status='failed' then 'failed' else status end where reference=r;
  return true;
end; $$;
create or replace function public.paymob_test_checkout_status(p_reference text,p_user_id uuid)
returns jsonb language sql security definer set search_path='' as $$
  select jsonb_build_object('status',status) from public.paymob_test_checkouts where reference=p_reference and user_id=p_user_id;
$$;
revoke all on function public.reserve_paymob_test_checkout(text,uuid), public.attach_paymob_test_order(text,uuid,text), public.record_paymob_test_payment(text,text,text), public.paymob_test_checkout_status(text,uuid) from public,anon,authenticated;
grant execute on function public.reserve_paymob_test_checkout(text,uuid), public.attach_paymob_test_order(text,uuid,text), public.record_paymob_test_payment(text,text,text), public.paymob_test_checkout_status(text,uuid) to service_role;
