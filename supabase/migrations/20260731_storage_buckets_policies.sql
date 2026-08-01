-- ============================================================================
-- InternIQ
-- Storage Buckets & RLS Policies (2026-07-31)
--
-- The app uploads CVs (cv-files bucket) and profile pictures (avatars bucket)
-- directly from the browser. Supabase Storage has RLS enabled by default on
-- storage.objects, and without any policies every operation is DENIED —
-- which silently breaks CV / avatar uploads.
--
-- This migration:
--   1. Ensures the buckets exist (idempotent).
--   2. Adds the storage.objects policies the app needs:
--      - READ: anon + authenticated (signed URLs, iframe previews, AI parsing)
--      - WRITE: anon + authenticated for CVs (public apply flow is anonymous)
--      - WRITE/DELETE: authenticated for avatars + CVs (owner portal)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. BUCKETS
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('cv-files', 'cv-files', false, 10485760, array['application/pdf']),
  ('cvs',     'cvs',     false, 10485760, array['application/pdf']),
  ('avatars', 'avatars', false,  5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- 2. READ POLICIES (signed URL creation + direct reads)
-- ----------------------------------------------------------------------------
drop policy if exists "cv_files_read_public" on storage.objects;
create policy "cv_files_read_public"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'cv-files');

drop policy if exists "cvs_read_public" on storage.objects;
create policy "cvs_read_public"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'cvs');

drop policy if exists "avatars_read_public" on storage.objects;
create policy "avatars_read_public"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'avatars');

-- ----------------------------------------------------------------------------
-- 3. WRITE POLICIES
--    Anonymous visitors apply to published internships with a CV, so INSERT
--    must be open to anon + authenticated for the CV buckets.
-- ----------------------------------------------------------------------------
drop policy if exists "cv_files_insert_all" on storage.objects;
create policy "cv_files_insert_all"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'cv-files');

drop policy if exists "cvs_insert_all" on storage.objects;
create policy "cvs_insert_all"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'cvs');

-- Avatars are managed only by the signed-in applicant portal.
drop policy if exists "avatars_insert_auth" on storage.objects;
create policy "avatars_insert_auth"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars');

drop policy if exists "avatars_update_auth" on storage.objects;
create policy "avatars_update_auth"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars')
  with check (bucket_id = 'avatars');

-- ----------------------------------------------------------------------------
-- 4. DELETE POLICIES (applicant portal resume / avatar removal)
-- ----------------------------------------------------------------------------
drop policy if exists "cv_files_delete_auth" on storage.objects;
create policy "cv_files_delete_auth"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'cv-files');

drop policy if exists "cvs_delete_auth" on storage.objects;
create policy "cvs_delete_auth"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'cvs');

drop policy if exists "avatars_delete_auth" on storage.objects;
create policy "avatars_delete_auth"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars');
