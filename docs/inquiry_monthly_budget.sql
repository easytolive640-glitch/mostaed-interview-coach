-- Apply before deploying the monthly-budget API. Only the service role may reserve.
-- $5 per UTC calendar month, starting with deployment; excludes other key uses,
-- prior usage, taxes, and hosting. Each attempted call reserves $0.01 permanently.
begin;
create table if not exists public.inquiry_monthly_budget (
  month date primary key,
  reserved_micro_usd bigint not null default 0
    check (reserved_micro_usd between 0 and 5000000)
);
alter table public.inquiry_monthly_budget enable row level security;
revoke all on public.inquiry_monthly_budget from public, anon, authenticated;

create or replace function public.reserve_inquiry_monthly_budget()
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  m date := date_trunc('month', now() at time zone 'UTC')::date;
  changed integer;
begin
  insert into public.inquiry_monthly_budget(month) values (m)
    on conflict (month) do nothing;
  -- The row lock and conditional increment make simultaneous callers safe.
  update public.inquiry_monthly_budget
    set reserved_micro_usd = reserved_micro_usd + 10000
    where month = m and reserved_micro_usd <= 4990000;
  get diagnostics changed = row_count;
  return changed = 1;
end; $$;
revoke all on function public.reserve_inquiry_monthly_budget() from public, anon, authenticated;
grant execute on function public.reserve_inquiry_monthly_budget() to service_role;
commit;
