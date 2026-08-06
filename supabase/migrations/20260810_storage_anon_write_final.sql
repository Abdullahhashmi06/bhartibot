-- ============================================================================
-- InternIQ — Final Storage Anonymous-Write Hardening (2026-08-10)
--
-- WHY THIS FILE EXISTS
--   20260809_production_security_hardening.sql already restricts anonymous
--   writes to the `public-apply/` folder. However, two earlier migrations
--   still CREATE legacy anon-granting policies by their old names:
--       • 20260801_apply_all_fixes.sql        → cv_files_insert_all, cvs_insert_all
--       • 20260801_consolidated_fixes.sql     → cv_files_insert_all, cvs_insert_all
--   If either file is (re)applied AFTER 20260809 — e.g. via the old
--   run-migration workflow or on an environment that applied migrations in a
--   different order — the legacy `..._insert_all` policies are re-created and,
--   because Postgres RLS permits a row when ANY policy matches, anonymous
--   users regain the ability to upload to the bucket root (verified live:
--   `cv-files/root-test2.pdf` accepted with only the anon key).
--
-- This migration is the idempotent enforcement layer. It is safe to run on
-- any database, with or without the old policies present:
--   • Drops every legacy anon-granting policy BY NAME (no-ops when absent).
--   • Drops + re-creates the hardened policies so their final definitions are
--     guaranteed regardless of prior ordering.
--   • Preserves every existing security property from 20260809: reads are
--     owner- or recruiter-org-scoped, inserts are public-apply-folder-only
--     (anon) or applicant-resumes/<uid>-only (authenticated), deletes are
--     owner-scoped, avatars are authenticated-only.
--
-- AFTER APPLYING: verify with the SELECT queries at the bottom of this file,
-- then re-run the anonymous-upload exploit test — only `public-apply/` paths
-- may succeed.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 0) HELPER: can_read_cv_path()  (idempotent re-create; no security change)
--    Needed by the read policies below on environments that never ran
--    20260809. Recruiters whose organisation owns the application can create
--    signed URLs; nobody else can read the object rows.
-- ============================================================================
create or replace function public.can_read_cv_path(p_path text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.applications a
    join public.internships i on i.id = a.internship_id
    where a.cv_path = p_path
      and i.organization_id in (
        select organization_id from public.profiles where id = auth.uid()
      )
  );
$$;


-- ----------------------------------------------------------------------------
-- 1) DROP every legacy policy that ever granted anonymous / broad access.
--    `IF EXISTS` makes each line a no-op on databases that never had it, and
--    on re-runs. Names are historical — they were introduced by the 20260731
--    and 20260801 migrations and must never come back.
-- ============================================================================
DROP POLICY IF EXISTS "cv_files_read_public"  ON storage.objects;
DROP POLICY IF EXISTS "cvs_read_public"       ON storage.objects;
DROP POLICY IF EXISTS "avatars_read_public"   ON storage.objects;

DROP POLICY IF EXISTS "cv_files_insert_all"   ON storage.objects;
DROP POLICY IF EXISTS "cvs_insert_all"        ON storage.objects;

DROP POLICY IF EXISTS "cv_files_delete_auth"  ON storage.objects;
DROP POLICY IF EXISTS "cvs_delete_auth"       ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete_auth"   ON storage.objects;


-- ----------------------------------------------------------------------------
-- 2) SELECT: owner OR recruiter-org (via can_read_cv_path) — no anon access.
-- ============================================================================
DROP POLICY IF EXISTS "cv_files_read_authorized" ON storage.objects;
CREATE POLICY "cv_files_read_authorized"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'cv-files'
    and (owner = auth.uid() or public.can_read_cv_path(name))
  );

DROP POLICY IF EXISTS "cvs_read_authorized" ON storage.objects;
CREATE POLICY "cvs_read_authorized"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'cvs'
    and (owner = auth.uid() or public.can_read_cv_path(name))
  );

DROP POLICY IF EXISTS "avatars_read_authorized" ON storage.objects;
CREATE POLICY "avatars_read_authorized"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'avatars');


-- ----------------------------------------------------------------------------
-- 3) INSERT: anonymous ONLY under public-apply/; authenticated ONLY under
--    applicant-resumes/<auth.uid()>/; avatars authenticated.
-- ============================================================================
DROP POLICY IF EXISTS "cv_files_insert_public_apply" ON storage.objects;
CREATE POLICY "cv_files_insert_public_apply"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    bucket_id = 'cv-files'
    and (storage.foldername(name))[1] = 'public-apply'
  );

DROP POLICY IF EXISTS "cvs_insert_public_apply" ON storage.objects;
CREATE POLICY "cvs_insert_public_apply"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    bucket_id = 'cvs'
    and (storage.foldername(name))[1] = 'public-apply'
  );

DROP POLICY IF EXISTS "cv_files_insert_applicant" ON storage.objects;
CREATE POLICY "cv_files_insert_applicant"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'cv-files'
    and (storage.foldername(name))[1] = 'applicant-resumes'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

DROP POLICY IF EXISTS "avatars_insert_auth" ON storage.objects;
CREATE POLICY "avatars_insert_auth"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars');


-- ----------------------------------------------------------------------------
-- 4) UPDATE: avatars only (authenticated) — unchanged from hardening.
-- ============================================================================
DROP POLICY IF EXISTS "avatars_update_auth" ON storage.objects;
CREATE POLICY "avatars_update_auth"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars')
  WITH CHECK (bucket_id = 'avatars');


-- ----------------------------------------------------------------------------
-- 5) DELETE: object owner only.
-- ============================================================================
DROP POLICY IF EXISTS "cv_files_delete_owner" ON storage.objects;
CREATE POLICY "cv_files_delete_owner"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'cv-files' and owner = auth.uid());

DROP POLICY IF EXISTS "cvs_delete_owner" ON storage.objects;
CREATE POLICY "cvs_delete_owner"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'cvs' and owner = auth.uid());

DROP POLICY IF EXISTS "avatars_delete_owner" ON storage.objects;
CREATE POLICY "avatars_delete_owner"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' and owner = auth.uid());


-- ============================================================================
-- VERIFICATION
--   Run these after applying. An anonymous write to the bucket root must now
--   fail; only `public-apply/` writes may succeed.
-- ============================================================================
-- 1) No policy on storage.objects may grant INSERT to anon outside public-apply:
--    SELECT policyname, cmd, roles
--    FROM pg_policies
--    WHERE schemaname = 'storage' AND tablename = 'objects' AND cmd = 'INSERT'
--    ORDER BY policyname;
--    (Expect: cv_files_insert_applicant [authenticated],
--             cv_files_insert_public_apply [anon, authenticated],
--             cvs_insert_public_apply [anon, authenticated],
--             avatars_insert_auth [authenticated] — and NOTHING else.)
--
-- 2) No INSERT policy may reference the legacy names:
--    SELECT policyname FROM pg_policies
--    WHERE schemaname='storage' AND tablename='objects'
--      AND policyname LIKE '%insert_all%';
--    (Expect: 0 rows.)
--
-- 3) Functional exploit re-test (from a shell):
--    # must FAIL (4xx):
--    curl -X POST -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
--      -H "Content-Type: application/octet-stream" \
--      "$SUPABASE_URL/storage/v1/object/cv-files/root-test.pdf" -d x
--    # must SUCCEED:
--    curl -X POST -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
--      -H "Content-Type: application/octet-stream" \
--      "$SUPABASE_URL/storage/v1/object/cv-files/public-apply/test.pdf" -d x
-- ============================================================================
