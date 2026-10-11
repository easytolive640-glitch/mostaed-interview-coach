begin;
create table if not exists public.new_user_alert_settings (
 id boolean primary key default true check (id),
 enabled_at timestamptz not null default now()
);
insert into public.new_user_alert_settings(id) values(true) on conflict do nothing;
create table if not exists public.new_user_login_alerts (
 user_id uuid primary key references auth.users(id) on delete cascade,
 first_login_at timestamptz not null,
 status text not null default 'pending' check(status in ('pending','sending','sent','review')),
 first_attempt_at timestamptz,
 claimed_at timestamptz,
 claim_token uuid,
 attempts integer not null default 0,
 email_id text,
 sent_at timestamptz
);
alter table public.new_user_alert_settings enable row level security;
alter table public.new_user_login_alerts enable row level security;
revoke all on public.new_user_alert_settings,public.new_user_login_alerts from public,anon,authenticated;
grant select,insert,update on public.new_user_login_alerts to service_role;
grant select on public.new_user_alert_settings to service_role;
create or replace function public.claim_new_user_login_alert(p_user uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.new_user_login_alerts; token uuid:=gen_random_uuid();
begin
 insert into public.new_user_login_alerts(user_id,first_login_at)
 select u.id,u.last_sign_in_at from auth.users u,public.new_user_alert_settings s
 where u.id=p_user and s.id and u.created_at>=s.enabled_at
 and u.last_sign_in_at is not null and u.email_confirmed_at is not null
 on conflict do nothing;
 -- Stop uncertain sends after the provider's 24-hour deduplication window.
 update public.new_user_login_alerts set status='review'
 where user_id=p_user and status='sending' and first_attempt_at<now()-interval '23 hours';
 update public.new_user_login_alerts set status='sending',claimed_at=now(),first_attempt_at=coalesce(first_attempt_at,now()),
 claim_token=token,attempts=attempts+1
 where user_id=p_user and (status='pending' or
 (status='sending' and claimed_at<now()-interval '2 minutes' and attempts<5))
 returning * into a;
 if a.user_id is null then return null; end if;
 return jsonb_build_object('user_id',a.user_id,'first_login_at',a.first_login_at,'claim_token',a.claim_token);
end $$;
create or replace function public.finish_new_user_login_alert(p_user uuid,p_claim uuid,p_email text)
returns boolean language plpgsql security definer set search_path='' as $$
begin
 update public.new_user_login_alerts set status='sent',email_id=p_email,sent_at=now()
 where user_id=p_user and claim_token=p_claim and status='sending';
 return found;
end $$;
revoke all on function public.claim_new_user_login_alert(uuid),public.finish_new_user_login_alert(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.claim_new_user_login_alert(uuid),public.finish_new_user_login_alert(uuid,uuid,text) to service_role;
commit;
select 'New-user login alert storage ready' as result;