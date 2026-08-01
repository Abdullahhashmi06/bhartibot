-- ============================================================================
-- InternIQ — Consolidated Stabilization Fixes (2026-08-01)
--
-- Fixes several data-isolation / upload bugs in one idempotent migration:
--   1. applicant_profiles.avatar_path  (profile picture upload was failing
--      because this column simply did not exist)
--   2. applications status check includes 'withdrawn' (applicant withdraw flow
--      was blocked by the CHECK constraint added on 2026-07-31)
--   3. RLS: applicants may read their OWN applications + answers by email
--      (previously only recruiters in the org could read them, so the
--      applicant portal showed "no applications")
--   4. Storage buckets + policies for cv-files / cvs / avatars (idempotent
--      re-run in case the earlier migration was never applied)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. applicant_profiles.avatar_path
-- ----------------------------------------------------------------------------
alter table public.applicant_profiles
  add column if not exists avatar_path text;

comment on column public.applicant_profiles.avatar_path
  is 'Storage path in the avatars bucket for the applicant profile picture.';

-- ----------------------------------------------------------------------------
-- 2. applications status CHECK constraint (idempotent) — include 'withdrawn'
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'applications_status_check'
    AND table_name = 'applications'
  ) THEN
    ALTER TABLE public.applications DROP CONSTRAINT applications_status_check;
  END IF;
END $$;

ALTER TABLE public.applications
  ADD CONSTRAINT applications_status_check
  CHECK (status IN ('new', 'under_review', 'shortlisted', 'rejected', 'archived', 'pending', 'withdrawn'));

-- ----------------------------------------------------------------------------
-- 3. RLS — applicants read their own applications + answers
-- ----------------------------------------------------------------------------
drop policy if exists applications_select_own_applicant on public.applications;
create policy applications_select_own_applicant
  on public.applications
  for select
  to authenticated
  using (
    email = coalesce(
      (select email from public.applicant_profiles where id = auth.uid()),
      (select email from auth.users where id = auth.uid())
    )
  );

drop policy if exists answers_select_own_applicant on public.answers;
create policy answers_select_own_applicant
  on public.answers
  for select
  to authenticated
  using (
    application_id in (
      select a.id
      from public.applications a
      where a.email = coalesce(
        (select email from public.applicant_profiles where id = auth.uid()),
        (select email from auth.users where id = auth.uid())
      )
    )
  );

-- Applicants may withdraw their own application (status → 'withdrawn' only,
-- so candidates cannot game their own pipeline status or edit other fields).
drop policy if exists applications_update_own_applicant on public.applications;
create policy applications_update_own_applicant
  on public.applications
  for update
  to authenticated
  using (
    email = coalesce(
      (select email from public.applicant_profiles where id = auth.uid()),
      (select email from auth.users where id = auth.uid())
    )
  )
  with check (
    status = 'withdrawn'
    and email = coalesce(
      (select email from public.applicant_profiles where id = auth.uid()),
      (select email from auth.users where id = auth.uid())
    )
  );

-- ----------------------------------------------------------------------------
-- 4. Storage buckets + policies (idempotent)
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('cv-files', 'cv-files', false, 10485760, array['application/pdf']),
  ('cvs',      'cvs',      false, 10485760, array['application/pdf']),
  ('avatars',  'avatars',  false,  8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- READ (signed URLs + iframe previews + AI parsing)
drop policy if exists "cv_files_read_public" on storage.objects;
create policy "cv_files_read_public" on storage.objects
  for select to anon, authenticated using (bucket_id = 'cv-files');

drop policy if exists "cvs_read_public" on storage.objects;
create policy "cvs_read_public" on storage.objects
  for select to anon, authenticated using (bucket_id = 'cvs');

drop policy if exists "avatars_read_public" on storage.objects;
create policy "avatars_read_public" on storage.objects
  for select to anon, authenticated using (bucket_id = 'avatars');

-- WRITE
drop policy if exists "cv_files_insert_all" on storage.objects;
create policy "cv_files_insert_all" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'cv-files');

drop policy if exists "cvs_insert_all" on storage.objects;
create policy "cvs_insert_all" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'cvs');

drop policy if exists "avatars_insert_auth" on storage.objects;
create policy "avatars_insert_auth" on storage.objects
  for insert to authenticated with check (bucket_id = 'avatars');

drop policy if exists "avatars_update_auth" on storage.objects;
create policy "avatars_update_auth" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars')
  with check (bucket_id = 'avatars');

-- DELETE (applicant portal resume / avatar removal)
drop policy if exists "cv_files_delete_auth" on storage.objects;
create policy "cv_files_delete_auth" on storage.objects
  for delete to authenticated using (bucket_id = 'cv-files');

drop policy if exists "cvs_delete_auth" on storage.objects;
create policy "cvs_delete_auth" on storage.objects
  for delete to authenticated using (bucket_id = 'cvs');

drop policy if exists "avatars_delete_auth" on storage.objects;
create policy "avatars_delete_auth" on storage.objects
  for delete to authenticated using (bucket_id = 'avatars');
