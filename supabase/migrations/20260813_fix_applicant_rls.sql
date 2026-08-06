-- ============================================================================
-- InternIQ — Fix Applicant Applications Visibility (2026-08-13)
--
-- PROBLEM SUMMARY:
--   The applicant portal dashboard "My Applications" page fetches applications
--   by the applicant's email. The `applications_select_own_applicant` RLS policy
--   was attempting to use `(select email from auth.users where id = auth.uid())`.
--   This fails silently because standard authenticated users do not have access
--   to the `auth.users` schema, causing 0 rows to be returned.
--
-- FIXES IN THIS MIGRATION:
--   F1. Recreate `applications_select_own_applicant` policy using the correct
--       `auth.jwt() ->> 'email'` function, which safely extracts the email
--       from the JWT token without needing elevated schema privileges.
--
-- HOW TO APPLY:
--   Supabase Dashboard → SQL Editor → paste → Run
-- ============================================================================

DROP POLICY IF EXISTS applications_select_own_applicant ON public.applications;

CREATE POLICY applications_select_own_applicant
ON public.applications
FOR SELECT
TO authenticated
USING (
    email = (auth.jwt() ->> 'email')::text
);
