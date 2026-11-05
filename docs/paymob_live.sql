begin;
alter table public.paid_subscriptions add column if not exists access_expires_at timestamptz;
alter table public.coaching_bookings add column if not exists charged_cents integer, add column if not exists currency text;
create table if not exists public.paymob_live_orders (
 id uuid primary key, user_id uuid not null references auth.users(id),
 kind text not null check(kind in ('starter','pro','topup','coaching')),
 amount integer not null check(amount>=100), booking_id uuid references public.coaching_bookings(id),
 order_id text unique, transaction_id text unique,
 created_at timestamptz not null default now(), paid_at timestamptz, reversed_at timestamptz,
 check ((kind='coaching')=(booking_id is not null))
);
alter table public.paymob_live_orders enable row level security;
revoke all on public.paymob_live_orders from public,anon,authenticated;
grant select on public.paymob_live_orders to service_role;

create or replace function public.reserve_paymob_order(p_id uuid,p_user uuid,p_kind text,p_amount integer,p_booking uuid)
returns boolean language plpgsql security definer set search_path='' as $$
begin
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user::text,0));
 if (select count(*) from public.paymob_live_orders where user_id=p_user and created_at>now()-interval '1 hour')>=10 then return false; end if;
 if p_kind in ('starter','pro') and exists(select 1 from public.paymob_live_orders
   where user_id=p_user and kind in ('starter','pro') and paid_at is null and reversed_at is null
     and created_at>now()-interval '20 minutes') then return false; end if;
 if p_booking is not null then
   if not exists(select 1 from public.coaching_bookings where id=p_booking and user_id=p_user and status='pending_payment' and not test_mode and order_id is null) then return false; end if;
   if exists(select 1 from public.paymob_live_orders where booking_id=p_booking and (paid_at is not null or created_at>now()-interval '20 minutes')) then return false; end if;
 end if;
 insert into public.paymob_live_orders(id,user_id,kind,amount,booking_id) values(p_id,p_user,p_kind,p_amount,p_booking);
 return true;
end $$;
create or replace function public.attach_paymob_order(p_id uuid,p_order text)
returns boolean language plpgsql security definer set search_path='' as $$
begin
 update public.paymob_live_orders set order_id=p_order where id=p_id and order_id is null and p_order~'^[0-9]+$';
 return found;
end $$;

create or replace function public.apply_paymob_payment(p_order text,p_tx text,p_amount integer,p_reversed boolean)
returns boolean language plpgsql security definer set search_path='' as $$
declare o public.paymob_live_orders; v_id text;
begin
 select * into o from public.paymob_live_orders where order_id=p_order and amount=p_amount for update;
 if not found then return false; end if;
 v_id:='paymob:'||o.id::text;
 if p_reversed then
   update public.paymob_live_orders set reversed_at=coalesce(reversed_at,now()) where id=o.id;
   update public.paid_subscriptions set status='cancelled',updated_at=now() where subscription_id=v_id;
   update public.assessment_topup_orders set capture_id=null where reference=o.id and used_at is null;
   update public.coaching_bookings set status='cancelled',zoom_join_url=null where id=o.booking_id and capture_id='paymob:'||o.transaction_id;
   return true;
 end if;
 if o.reversed_at is not null then return true; end if;
 if o.paid_at is not null then return o.transaction_id=p_tx; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(o.user_id::text,0));
 if o.kind in ('starter','pro') then
   update public.paid_subscriptions set status='superseded',updated_at=now()
     where user_id=o.user_id and subscription_id like 'paymob:%' and status='active';
   insert into public.paid_subscriptions(subscription_id,user_id,plan,status,test_mode,access_expires_at)
     values(v_id,o.user_id,o.kind,'active',false,now()+interval '30 days');
 elsif o.kind='topup' then
   insert into public.assessment_topup_orders(reference,user_id,order_id,capture_id)
     values(o.id,o.user_id,'paymob:'||p_order,'paymob:'||p_tx);
 else
   update public.coaching_bookings set status='paid',charged_cents=o.amount,currency='EGP',order_id='paymob:'||p_order,capture_id='paymob:'||p_tx
     where id=o.booking_id and user_id=o.user_id and status='pending_payment' and order_id is null
       and exists(select 1 from public.coaching_slots where id=public.coaching_bookings.slot_id and starts_at>now());
   if not found then return false; end if;
 end if;
 update public.paymob_live_orders set paid_at=now(),transaction_id=p_tx where id=o.id;
 return true;
end $$;

create or replace function public.paymob_paid_access(p_id text,p_user uuid)
returns jsonb language sql security definer set search_path='' as $$
 select jsonb_build_object('plan',s.plan,'amount',o.amount,'transaction_id',o.transaction_id,'expires_at',s.access_expires_at)
 from public.paid_subscriptions s join public.paymob_live_orders o on s.subscription_id='paymob:'||o.id::text
 where s.subscription_id=p_id and s.user_id=p_user and o.user_id=p_user and s.status='active'
   and not s.test_mode and s.access_expires_at>now() and o.paid_at is not null and o.reversed_at is null;
$$;
create or replace function public.paid_subscription_for_user(p_user_id uuid)
returns jsonb language sql security definer set search_path='' as $$
 select jsonb_build_object('subscription_id',s.subscription_id,'plan',s.plan)
 from public.paid_subscriptions s where s.user_id=p_user_id and s.status='active' and not s.test_mode
   and (s.access_expires_at is null or s.access_expires_at>now())
 order by (s.subscription_id like 'paymob:%') desc,(s.plan='pro') desc,s.updated_at desc
 limit 1;
$$;

revoke all on function public.reserve_paymob_order(uuid,uuid,text,integer,uuid),public.attach_paymob_order(uuid,text),
 public.apply_paymob_payment(text,text,integer,boolean),public.paymob_paid_access(text,uuid) from public,anon,authenticated;
grant execute on function public.reserve_paymob_order(uuid,uuid,text,integer,uuid),public.attach_paymob_order(uuid,text),
 public.apply_paymob_payment(text,text,integer,boolean),public.paymob_paid_access(text,uuid) to service_role;
create or replace function public.release_expired_paymob_bookings()
returns void language sql security definer set search_path='' as $$
 update public.coaching_bookings b set status='cancelled'
 where b.status='pending_payment' and b.order_id is null and not b.test_mode
 and b.created_at<now()-interval '30 minutes'
 and not exists(select 1 from public.paymob_live_orders o where o.booking_id=b.id
   and (o.paid_at is not null or o.created_at>now()-interval '30 minutes'));
$$;
revoke all on function public.release_expired_paymob_bookings() from public,anon,authenticated;
grant execute on function public.release_expired_paymob_bookings() to service_role;

create or replace function public.paymob_topup_paid(p_ref uuid,p_user uuid,p_order text)
returns boolean language sql security definer set search_path='' as $$
 select exists(select 1 from public.paymob_live_orders where id=p_ref and user_id=p_user and kind='topup'
 and order_id=p_order and paid_at is not null and reversed_at is null);
$$;
revoke all on function public.paymob_topup_paid(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.paymob_topup_paid(uuid,uuid,text) to service_role;
commit;
