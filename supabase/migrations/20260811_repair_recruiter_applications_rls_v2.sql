-- ============================================================================
-- InternIQ — Repair: Recruiter dashboard shows 0 applications (v2, 2026-08-11)
--
-- WHY V2: the first attempt (20260810) enabled RLS on `candidate_ai_analysis`
-- BEFORE creating the applications policies. On databases where that table is
-- missing (partial migration state — this project has a history of aborted
-- migrations, e.g. the missing `shortlisted_candidates` view), the whole
-- migration aborted on that line and NO applications policies were created.
--
-- This version is bulletproof:
--   • Every `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` and every policy block
--     is guarded by a `to_regclass()` existence check so a missing table can
--     never abort the migration.
--   • The applications policies (the actual fix) are created FIRST and always.
--   • Fully idempotent: drop-if-exists everywhere, safe to run repeatedly and
--     safe to run after 20260810 (which may have partially or fully applied).
--
-- Root cause recap: RLS denies rows by default when no matching policy exists,
-- so the recruiter's application queries silently return 0 while the internship
-- list still renders (published internships are readable by any authenticated
-- user via the internships_public_read policy). The org-scoped SELECT/UPDATE
-- policies on `applications` (and siblings) must exist for the counts to work.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 0) HELPER the INSERT policy depends on (idempotent).
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


-- ============================================================================
-- 1) APPLICATIONS — THE FIX. Created first, always, guarded.
-- ============================================================================
do $$
begin
  if to_regclass('public.applications') is null then
    raise notice 'public.applications missing — skipping applications policies';
  else
    alter table public.applications enable row level security;

    -- Public apply: anyone can submit to a published internship.
    drop policy if exists applications_insert_published on public.applications;
    create policy applications_insert_published
      on public.applications
      for insert
      to anon, authenticated
      with check (public.is_published_internship(internship_id));

    -- RECRUITER READ (the fix): org-scoped.
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

    -- RECRUITER UPDATE: org-scoped.
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

    -- Applicant self-service (kept intact — applicant portal still works).
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
  end if;
end $$;


-- ============================================================================
-- 2) ANSWERS — guarded; only runs if the table exists.
-- ============================================================================
do $$
begin
  if to_regclass('public.answers') is null then
    raise notice 'public.answers missing — skipping answers policies';
  else
    alter table public.answers enable row level security;

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
  end if;
end $$;


-- ============================================================================
-- 3) CANDIDATE AI ANALYSIS — guarded; only runs if the table exists.
-- ============================================================================
do $$
begin
  if to_regclass('public.candidate_ai_analysis') is null then
    raise notice 'public.candidate_ai_analysis missing — skipping analysis policies (ok if AI analysis not yet deployed)';
  else
    alter table public.candidate_ai_analysis enable row level security;

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
  end if;
end $$;


-- ============================================================================
-- VERIFICATION — run in the Supabase SQL Editor after applying:
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
-- ============================================================================
-- END OF 20260811_repair_recruiter_applications_rls_v2.sql
-- ============================================================================
