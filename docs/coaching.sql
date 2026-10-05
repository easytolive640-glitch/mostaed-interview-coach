-- Run in Supabase SQL Editor. Private tables: application server only.
create extension if not exists btree_gist;
create table if not exists public.career_coaches (
 id uuid primary key default gen_random_uuid(), user_id uuid not null unique references auth.users(id),
 name text not null, bio text not null, specialty text not null,
 languages text not null, price_cents integer not null check(price_cents between 100 and 100000),
 status text not null default 'pending' check(status in ('pending','approved','paused')),
 zoom_host_id text, created_at timestamptz not null default now()
);
create table if not exists public.coaching_slots (
 id uuid primary key default gen_random_uuid(), coach_id uuid not null references public.career_coaches(id),
 starts_at timestamptz not null, ends_at timestamptz not null check(ends_at=starts_at+interval '30 minutes'), duration_minutes integer not null default 30 check(duration_minutes=30),
 unique(coach_id, starts_at),
 exclude using gist (coach_id with =, tstzrange(starts_at,ends_at,'[)') with &&)
);
create table if not exists public.coaching_bookings (
 id uuid primary key default gen_random_uuid(), slot_id uuid not null references public.coaching_slots(id),
 user_id uuid not null references auth.users(id), price_cents integer not null,
 status text not null default 'pending_payment' check(status in ('pending_payment','paid','meeting_creating','confirmed','meeting_review','cancelled')),
 test_mode boolean not null, order_id text unique, capture_id text unique,
 zoom_meeting_id text, zoom_join_url text, created_at timestamptz not null default now()
);
create unique index if not exists coaching_slot_reserved on public.coaching_bookings(slot_id) where status <> 'cancelled';
-- RLS intentionally has no public policies. Neither profiles nor meeting links are exposed directly.
alter table public.career_coaches enable row level security;
alter table public.coaching_slots enable row level security;
alter table public.coaching_bookings enable row level security;
revoke all on public.career_coaches, public.coaching_slots, public.coaching_bookings from anon, authenticated;
grant all on public.career_coaches, public.coaching_slots, public.coaching_bookings to service_role;
create or replace function public.reserve_coaching_slot(p_slot uuid,p_user uuid,p_test boolean)
returns jsonb language plpgsql security definer set search_path=public as $$
declare s public.coaching_slots; c public.career_coaches; b public.coaching_bookings;
begin
 select * into s from coaching_slots where id=p_slot for update;
 if not found or s.starts_at < now()+interval '2 hours' then raise exception 'Slot unavailable'; end if;
 select * into c from career_coaches where id=s.coach_id;
 if c.status <> 'approved' or c.zoom_host_id is null or c.user_id=p_user then raise exception 'Coach unavailable'; end if;
 select * into b from coaching_bookings where slot_id=p_slot and status<>'cancelled';
 if found then
   if b.user_id=p_user and b.test_mode=p_test then return to_jsonb(b); end if;
   raise exception 'Slot already reserved';
 end if;
 insert into coaching_bookings(slot_id,user_id,price_cents,test_mode) values(p_slot,p_user,c.price_cents,p_test) returning * into b;
 return to_jsonb(b);
end $$;
revoke all on function public.reserve_coaching_slot(uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.reserve_coaching_slot(uuid,uuid,boolean) to service_role;
