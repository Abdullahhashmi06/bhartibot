-- ============================================================================
-- InternIQ — Fix: Recruiter dashboard shows 0 applications (2026-08-10)
--
-- Symptom: an application row exists in Supabase, internship_id matches, the
-- recruiter owns the internship, all foreign keys are valid — yet
--   /dashboard/applications → Total Applications = 0
--   internship cards                         → Applications = 0
-- and /dashboard/applications/[internshipId] shows no candidates.
--
-- Root cause: RLS silently filters every applications row for the recruiter
-- because the org-scoped SELECT/UPDATE policies were not present in this
-- environment (the migration that creates them — 20260723 / 20260801 — was
-- skipped or aborted during partial manual application, and the policies the
-- app relies on are the ones declared in those files). RLS denies rows by
-- default when no matching policy exists, and the query helpers return 0 with
-- no error — so the dashboard renders fine but empty.
--
-- Fix: idempotently recreate the canonical org-scoped policies exactly as the
-- base migrations declared them. Safe to run repeatedly on any environment
-- (drop-if-exists everywhere) and does NOT weaken security — access remains
-- strictly scoped to the recruiter's organization via profiles.
--
-- Also recreates the applicant self-service policies (kept intact so the
-- applicant portal keeps working) and the helper function the INSERT policy
-- depends on, guarded so the whole file applies on databases where the base
-- migrations were never run.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 0) HELPER the INSERT policy depends on (idempotent)
--    Missing only if 20260723 was never applied in this environment.
-- ----------------------------------------------------------------------------
create or replace function public.is_published_internship(
    internship_uuid uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
select exists (
    select 1
    from public.internships
    where id = internship_uuid
      and status = 'published'
);
$$;


-- ----------------------------------------------------------------------------
-- Ensure RLS is enabled on the affected tables (idempotent).
-- ----------------------------------------------------------------------------
alter table public.applications enable row level security;
alter table public.answers enable row level security;
alter table public.candidate_ai_analysis enable row level security;


-- ============================================================================
-- 1) APPLICATIONS
-- ============================================================================

-- Public apply: anyone can submit to a published internship.
drop policy if exists applications_insert_published on public.applications;
create policy applications_insert_published
  on public.applications
  for insert
  to anon, authenticated
  with check (public.is_published_internship(internship_id));

-- RECRUITER READ (the fix): recruiter can read applications for their org's
-- internships. This is what /dashboard/applications and the internship
-- applicant table execute against.
drop policy if exists applications_select_own_org on public.applications;
create policy applications_select_own_org
  on public.applications
  for select
  to authenticated
  using (
    internship_id in (
      select id
      from public.internships
      where organization_id in (
        select organization_id
        from public.profiles
        where id = auth.uid()
      )
    )
  );

-- RECRUITER UPDATE: recruiters change application status.
drop policy if exists applications_update_own_org on public.applications;
create policy applications_update_own_org
  on public.applications
  for update
  to authenticated
  using (
    internship_id in (
      select id
      from public.internships
      where organization_id in (
        select organization_id
        from public.profiles
        where id = auth.uid()
      )
    )
  )
  with check (
    internship_id in (
      select id
      from public.internships
      where organization_id in (
        select organization_id
        from public.profiles
        where id = auth.uid()
      )
    )
  );

-- Applicant self-service (kept intact — applicant portal still works):
-- applicants read their own applications by email.
-- NOTE: the coalesce form below matches the 20260801 canonical definition.
-- 20260803/20260804 later redefined this policy with the simpler
-- `auth.users.email` form; both are functionally equivalent here because
-- applicant_profiles.email is seeded from the same auth email. Keeping the
-- coalesce form is safe and robust when a profile row exists.
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

-- Applicants may only withdraw (status → 'withdrawn'), nothing else.
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


-- ============================================================================
-- 2) ANSWERS
-- ============================================================================

-- Public apply: answers must belong to an application of a published
-- internship.
drop policy if exists answers_insert_with_application on public.answers;
create policy answers_insert_with_application
  on public.answers
  for insert
  to anon, authenticated
  with check (
    exists (
      select 1
      from public.applications a
      where a.id = application_id
        and public.is_published_internship(a.internship_id)
    )
  );

-- RECRUITER READ: screening answers for applications in their org.
drop policy if exists answers_select_own_org on public.answers;
create policy answers_select_own_org
  on public.answers
  for select
  to authenticated
  using (
    application_id in (
      select a.id
      from public.applications a
      join public.internships i on i.id = a.internship_id
      where i.organization_id in (
        select organization_id
        from public.profiles
        where id = auth.uid()
      )
    )
  );

-- Applicant self-service: applicants read their own answers.
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


-- ============================================================================
-- 3) CANDIDATE AI ANALYSIS — recruiter org-scoped access
--    Needed by the applicant detail page (AI analysis panel) and the
--    comparison page. Same org-scoping chain as applications.
-- ============================================================================
drop policy if exists candidate_ai_analysis_select_own_org on public.candidate_ai_analysis;
create policy candidate_ai_analysis_select_own_org
  on public.candidate_ai_analysis
  for select
  to authenticated
  using (
    application_id in (
      select a.id
      from public.applications a
      join public.internships i on i.id = a.internship_id
      where i.organization_id in (
        select organization_id
        from public.profiles
        where id = auth.uid()
      )
    )
  );

drop policy if exists candidate_ai_analysis_insert_own_org on public.candidate_ai_analysis;
create policy candidate_ai_analysis_insert_own_org
  on public.candidate_ai_analysis
  for insert
  to authenticated
  with check (
    application_id in (
      select a.id
      from public.applications a
      join public.internships i on i.id = a.internship_id
      where i.organization_id in (
        select organization_id
        from public.profiles
        where id = auth.uid()
      )
    )
  );

drop policy if exists candidate_ai_analysis_update_own_org on public.candidate_ai_analysis;
create policy candidate_ai_analysis_update_own_org
  on public.candidate_ai_analysis
  for update
  to authenticated
  using (
    application_id in (
      select a.id
      from public.applications a
      join public.internships i on i.id = a.internship_id
      where i.organization_id in (
        select organization_id
        from public.profiles
        where id = auth.uid()
      )
    )
  )
  with check (
    application_id in (
      select a.id
      from public.applications a
      join public.internships i on i.id = a.internship_id
      where i.organization_id in (
        select organization_id
        from public.profiles
        where id = auth.uid()
      )
    )
  );

-- DELETE — matches the canonical policy set (the AI pipeline may replace an
-- analysis row; the base 20260801 migration defined a delete policy too).
drop policy if exists candidate_ai_analysis_delete_own_org on public.candidate_ai_analysis;
create policy candidate_ai_analysis_delete_own_org
  on public.candidate_ai_analysis
  for delete
  to authenticated
  using (
    application_id in (
      select a.id
      from public.applications a
      join public.internships i on i.id = a.internship_id
      where i.organization_id in (
        select organization_id
        from public.profiles
        where id = auth.uid()
      )
    )
  );


-- ============================================================================
-- VERIFICATION — run in the Supabase SQL Editor:
--
--   select tablename, policyname, cmd, roles
--   from pg_policies
--   where schemaname = 'public'
--     and tablename in ('applications','answers','candidate_ai_analysis')
--   order by tablename, cmd;
--
-- Expected for applications:
--   applications_insert_published      (INSERT, anon+authenticated)
--   applications_select_own_org        (SELECT, authenticated)  ← the fix
--   applications_update_own_org        (UPDATE, authenticated)
--   applications_select_own_applicant  (SELECT, authenticated)
--   applications_update_own_applicant  (UPDATE, authenticated)
--
-- Then confirm the recruiter can read:
--   select count(*) from public.applications a
--   join public.internships i on i.id = a.internship_id
--   where i.organization_id in (
--     select organization_id from public.profiles where id = auth.uid()
--   );
-- ============================================================================
-- END OF 20260810_fix_recruiter_applications_rls.sql
-- ============================================================================
