-- Optional public AI inquiry quota. No chat text or raw IP address is stored.
create table if not exists public.inquiry_daily_quota (
 day date not null, client_hash text not null, used integer not null default 0,
 primary key(day,client_hash), check(used>=0)
);
alter table public.inquiry_daily_quota enable row level security;
revoke all on public.inquiry_daily_quota from anon,authenticated;
create or replace function public.reserve_inquiry_message(p_client_hash text)
returns boolean language plpgsql security definer set search_path='' as $$
declare d date := (now() at time zone 'UTC')::date; n integer;
begin
 if p_client_hash is null or p_client_hash !~ '^[a-f0-9]{64}$' then return false; end if;
 perform pg_advisory_xact_lock(74812309);
 delete from public.inquiry_daily_quota where day<d-7;
 select coalesce(sum(used),0) into n from public.inquiry_daily_quota where day=d;
 if n>=100 then return false; end if;
 insert into public.inquiry_daily_quota(day,client_hash,used) values(d,p_client_hash,0) on conflict do nothing;
 select used into n from public.inquiry_daily_quota where day=d and client_hash=p_client_hash;
 if n>=10 then return false; end if;
 update public.inquiry_daily_quota set used=used+1 where day=d and client_hash=p_client_hash;
 return true;
end; $$;
revoke all on function public.reserve_inquiry_message(text) from public,anon,authenticated;
grant execute on function public.reserve_inquiry_message(text) to service_role;
