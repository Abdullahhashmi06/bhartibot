-- ============================================================================
-- InternIQ — DIAGNOSTIC: Recruiter dashboard shows 0 applications
--
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- STEP 1: The email 'recruiter@example.com' appears SIX times below (R1, R2,
--         R3, R6 and in the FIX comments). Replace ALL occurrences with the
--         affected recruiter's login email — use the editor's find-and-replace
--         (Ctrl+H) to change every occurrence at once. Each query line is also
--         marked with a trailing comment:  -- EDIT THIS EMAIL
--
-- STEP 2: Run the whole script. It prints labelled sections R1–R6.
--
-- Interpreting the results:
--   R1 profile row        → if 0 rows: the recruiter has NO profiles row.
--                           Recruiter org-scoping cannot work. See FIX A.
--   R2 internships by org → if empty, the recruiter's org owns no internships
--                           the way the app expects. See FIX B.
--   R3 org mismatch       → if 'MISMATCH', the internship you see on the
--                           dashboard belongs to a DIFFERENT organization than
--                           the recruiter's profile. That is why applications
--                           are invisible (applications RLS is strictly
--                           org-scoped; internship listing is not).
--   R4 application rows   → if 0 rows, the application may reference a
--                           different internship than the one the recruiter
--                           sees, or the internship id differs.
--   R5 policies           → lists every RLS policy on applications. If
--                           applications_select_own_org is absent, run
--                           migrations 20260810 + 20260811.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- R1) Does the recruiter have a profiles row? Which org?
-- ----------------------------------------------------------------------------
select
  u.id                    as user_id,
  u.email,
  p.id                    as profile_id,
  p.organization_id       as profile_org,
  o.name                  as profile_org_name,
  case when p.id is null then 'NO PROFILE ROW -> FIX A' else 'OK' end as status
from auth.users u
left join public.profiles p on p.id = u.id
left join public.organisations o on o.id = p.organization_id
where u.email = 'recruiter@example.com';  -- EDIT THIS EMAIL

-- ----------------------------------------------------------------------------
-- R2) Which internships exist for the recruiter's org?
-- ----------------------------------------------------------------------------
select
  i.id              as internship_id,
  i.title,
  i.status,
  i.organization_id as internship_org
from public.internships i
where i.organization_id in (
  select p.organization_id
  from public.profiles p
  join auth.users u on u.id = p.id
  where u.email = 'recruiter@example.com'  -- EDIT THIS EMAIL
)
order by i.created_at desc;

-- ----------------------------------------------------------------------------
-- R3) Org-chain integrity: profile org vs internship org
--     NOTE: if R1 returned NO profile row, this section returns 0 rows —
--     read R1's signal instead.
-- ----------------------------------------------------------------------------
select
  i.id              as internship_id,
  i.title,
  i.organization_id as internship_org,
  p.organization_id as recruiter_profile_org,
  case
    when i.organization_id is distinct from p.organization_id then 'MISMATCH -> FIX B'
    else 'OK'
  end as org_check
from public.internships i
join public.profiles p
  on p.id = (select id from auth.users where email = 'recruiter@example.com')  -- EDIT THIS EMAIL
order by i.created_at desc;

-- ----------------------------------------------------------------------------
-- R4) Do applications exist, and for which internships?
-- ----------------------------------------------------------------------------
select
  a.id              as application_id,
  a.internship_id,
  a.applicant_name,
  a.status,
  a.created_at,
  i.title           as internship_title,
  i.organization_id as internship_org
from public.applications a
left join public.internships i on i.id = a.internship_id
order by a.created_at desc;

-- ----------------------------------------------------------------------------
-- R5) Current RLS policies on applications / answers / candidate_ai_analysis
-- ----------------------------------------------------------------------------
select tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public'
  and tablename in ('applications','answers','candidate_ai_analysis')
order by tablename, cmd;

-- ----------------------------------------------------------------------------
-- R6) The exact query the dashboard runs, executed with org scoping.
--     (The SQL editor runs as superuser, bypassing RLS — if this returns rows
--      but the app shows 0, RLS is the blocker and FIX C applies.)
-- ----------------------------------------------------------------------------
select count(*) as applications_in_recruiter_org
from public.applications a
join public.internships i on i.id = a.internship_id
where i.organization_id in (
  select p.organization_id
  from public.profiles p
  join auth.users u on u.id = p.id
  where u.email = 'recruiter@example.com'  -- EDIT THIS EMAIL
);

-- ----------------------------------------------------------------------------
-- R7) DEFINITIVE RLS TEST — proves whether RLS (not data) is the blocker.
--     Runs the real applications query AS the recruiter role, so RLS applies.
--     Replace the user id below with the value from R1's user_id column.
--     If R7 returns 0 but R6 returns > 0, RLS is filtering → FIX C.
--     If R7 errors with 'permission denied', grants/policies are broken.
-- ----------------------------------------------------------------------------
-- set local role authenticated;
-- set local request.jwt.claim.sub = '<USER_ID_FROM_R1>';  -- EDIT THIS
-- select count(*) as applications_visible_as_recruiter
-- from public.applications a
-- join public.internships i on i.id = a.internship_id
-- where i.organization_id in (
--   select organization_id
--   from public.profiles
--   where id = auth.uid()
-- );
-- reset role;

-- ============================================================================
-- FIXES
-- ============================================================================
-- FIX A (no profile row): create the recruiter profile bound to their org.
--   insert into public.profiles (id, organization_id, name, email)
--   select u.id, (org id from R2), coalesce(u.raw_user_meta_data->>'full_name',''), u.email
--   from auth.users u where u.email = 'recruiter@example.com';
--   (or simply have the recruiter log out and back in through Google OAuth,
--    which runs ensure_recruiter_profile idempotently.)
--
-- FIX B (org mismatch): the internship belongs to a different organization than
--   the recruiter's profile. Decide which org is correct and either update the
--   internship's organization_id to the recruiter's profile org, or update the
--   profile to the internship's org — never both blindly. Re-run R3 after.
--
-- FIX C (policies missing): apply supabase/migrations/20260810_... and
--   20260811_... (idempotent) and re-run R5. applications_select_own_org must
--   be listed for SELECT.
-- ============================================================================
-- END OF DIAGNOSTIC
-- ============================================================================
