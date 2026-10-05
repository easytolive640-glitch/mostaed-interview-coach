begin;
alter table public.career_coaches add column if not exists photo_path text;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('coach-photos','coach-photos',false,307200,array['image/jpeg','image/png']) on conflict(id) do update set public=false,file_size_limit=307200,allowed_mime_types=array['image/jpeg','image/png'];
drop policy if exists coach_photo_private on storage.objects;
create policy coach_photo_private on storage.objects as restrictive for all to anon,authenticated using(bucket_id<>'coach-photos') with check(bucket_id<>'coach-photos');
commit;
notify pgrst,'reload schema';
select id,public,file_size_limit from storage.buckets where id='coach-photos';