-- ============================================================================
-- InternIQ — Remove Anonymous SELECT on public.organisations (2026-08-11)
--
-- WHY THIS FILE EXISTS
--   Two earlier migrations created the SAME policy under the same name:
--       • 20260803_ai_applicant_portal.sql
--       • 20260804_recommendation_engine_v2.sql
--     create policy "organisations_select_published"
--       for select to anon, authenticated
--       using (id in (select organization_id from internships where status = 'published'))
--
--   This grants UNANONYMOUS visitors the ability to read organisation rows
--   (id, name, created_at) for any org that owns a published internship —
--   confirmed live: `GET /rest/v1/organisations?select=name` with the anon
--   key returned 5 org names. No anonymous code path needs this: the public
--   apply page and landing page never query organisations, and the share-link
--   flow uses the service-role admin client.
--
--   This migration drops and re-creates ONLY that policy, restricted to
--   `authenticated` (the applicant portal, which does need org names for
--   published internships, runs as a signed-in user). Recruiter RLS
--   (org_select_own, authenticated) is untouched.
--
--   Idempotent: drop + create under a fixed name; safe on re-runs and on
--   environments that never ran 20260803/20260804.
-- ============================================================================

DROP POLICY IF EXISTS organisations_select_published ON public.organisations;

CREATE POLICY organisations_select_published
  ON public.organisations
  FOR SELECT
  TO authenticated
  USING (
    id in (
      select organization_id
      from public.internships
      where status = 'published'
    )
  );

-- ============================================================================
-- VERIFICATION
--   1) Anonymous read must now return an empty array (RLS blocks the table):
--      curl -s -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
--        "$SUPABASE_URL/rest/v1/organisations?select=name"
--      (Expect: [])
--   2) Signed-in applicant can still read org names for published internships
--      (policy above is TO authenticated).
--   3) Recruiter RLS is unchanged — org_select_own is not touched by this file.
-- ============================================================================
