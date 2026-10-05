begin;
alter table public.career_coaches add column if not exists linkedin_url text;
alter table public.career_coaches add column if not exists cv_path text;
alter table public.career_coaches add column if not exists cv_name text;
alter table public.career_coaches add column if not exists reviewed_by uuid references auth.users(id);
alter table public.career_coaches add column if not exists reviewed_at timestamptz;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('coach-cvs','coach-cvs',false,1048576,array['application/pdf'])
on conflict(id) do update set public=false,file_size_limit=1048576,allowed_mime_types=array['application/pdf'];
-- Explicit deny prevents any broad pre-existing storage policy exposing coach CVs.
drop policy if exists coach_cv_private_select on storage.objects;
create policy coach_cv_private_select on storage.objects as restrictive for select to anon, authenticated using(bucket_id <> 'coach-cvs');
drop policy if exists coach_cv_private_insert on storage.objects;
create policy coach_cv_private_insert on storage.objects as restrictive for insert to anon, authenticated with check(bucket_id <> 'coach-cvs');
drop policy if exists coach_cv_private_update on storage.objects;
create policy coach_cv_private_update on storage.objects as restrictive for update to anon, authenticated using(bucket_id <> 'coach-cvs') with check(bucket_id <> 'coach-cvs');
drop policy if exists coach_cv_private_delete on storage.objects;
create policy coach_cv_private_delete on storage.objects as restrictive for delete to anon, authenticated using(bucket_id <> 'coach-cvs');
commit;
notify pgrst,'reload schema';
select id,public,file_size_limit from storage.buckets where id='coach-cvs';