-- ============================================================================
-- InternIQ — Recommendation Engine v2 (Configurable Scoring + Acceptance)
-- Created: 2026-08-04
--
-- Adds:
--   • recommendation_settings — database-driven scoring weights (no hardcoded
--     weights; changing a row instantly affects future recommendations)
--   • Extended applicant_recommendations cache columns:
--       acceptance_probability, overall_score, skill_gaps, strengths,
--       weaknesses, competition_level, avg_applicant_match, reason_generated,
--       algorithm_version, cache_version, weights_snapshot, generated_at,
--       profile_completeness
--   • get_applicant_feed() now returns avg_applicant_match — the average AI
--     match score of existing applicants (competition intelligence)
--
-- SELF-CONTAINED: section 1B creates the applicant_recommendations table
-- (with RLS, indexes, constraints and policies), the internship listing
-- metadata columns, and the applicant read-access RLS policies when they are
-- missing (they are normally provided by the untracked
-- 20260803_ai_applicant_portal.sql). This migration therefore applies cleanly
-- on any environment, whether or not 20260803 was run.
--
-- Idempotent: safe to run multiple times. Preserves existing data.
-- ============================================================================


-- ============================================================================
-- 1) RECOMMENDATION SETTINGS (configurable weights)
--    Single row (id = 1). Weights sum to 100. Bumping `version` invalidates
--    every applicant's cached recommendations (it is part of the signal hash).
-- ============================================================================

create table if not exists public.recommendation_settings (
  id integer primary key check (id = 1),
  required_skills_weight numeric not null default 40 check (required_skills_weight >= 0),
  preferred_skills_weight numeric not null default 15 check (preferred_skills_weight >= 0),
  education_weight numeric not null default 12 check (education_weight >= 0),
  experience_weight numeric not null default 8 check (experience_weight >= 0),
  project_weight numeric not null default 10 check (project_weight >= 0),
  profile_weight numeric not null default 5 check (profile_weight >= 0),
  competition_weight numeric not null default 6 check (competition_weight >= 0),
  recency_weight numeric not null default 4 check (recency_weight >= 0),
  algorithm_version text not null default 'v2',
  cache_version integer not null default 2,
  version integer not null default 1,
  updated_at timestamptz not null default now()
);

comment on table public.recommendation_settings is
  'InternIQ recommendation engine configuration. Weights are normalized to sum to 100 by the engine. Changing any weight and bumping `version` instantly refreshes all cached applicant recommendations.';

-- Seed the default row (weights sum to 100).
insert into public.recommendation_settings (id)
values (1)
on conflict (id) do nothing;

alter table public.recommendation_settings enable row level security;

-- Anyone authenticated may read settings (the engine reads them with the
-- applicant's session client). Writes are intentionally service-role only —
-- no client-side policy grants insert/update/delete.
drop policy if exists recommendation_settings_select on public.recommendation_settings;
create policy recommendation_settings_select
  on public.recommendation_settings
  for select
  to anon, authenticated
  using (true);

-- Auto-bump the version whenever the weights change so cached
-- recommendations are invalidated without any code change.
create or replace function public.bump_recommendation_settings_version()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.version := coalesce(old.version, 0) + 1;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists recommendation_settings_bump_version on public.recommendation_settings;
create trigger recommendation_settings_bump_version
  before update on public.recommendation_settings
  for each row
  execute function public.bump_recommendation_settings_version();


-- ============================================================================
-- 1B) SELF-CONTAINED BASE TABLES
--     The applicant_recommendations table and the internship listing metadata
--     columns are normally created by migration 20260803_ai_applicant_portal
--     (and the applicant portal tables by 20260730). Those files may not be
--     applied in every environment, so this migration guarantees everything it
--     depends on exists before extending it. All statements are idempotent, so
--     running this after 20260730/20260803 is a no-op.
-- ============================================================================

-- applicant_profiles is referenced by the applicant_recommendations FK below.
create table if not exists public.applicant_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  location text,
  linkedin_url text,
  github_url text,
  portfolio_url text,
  university text,
  degree text,
  semester text,
  cgpa text,
  bio text,
  cv_path text,
  role text not null default 'applicant',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.applicant_profiles enable row level security;

drop policy if exists applicant_profiles_own on public.applicant_profiles;
create policy applicant_profiles_own on public.applicant_profiles for all to authenticated using (id = auth.uid()) with check (id = auth.uid());

create table if not exists public.applicant_recommendations (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references public.applicant_profiles(id) on delete cascade,
  internship_id uuid not null references public.internships(id) on delete cascade,
  match_score integer not null default 0 check (match_score >= 0 and match_score <= 100),
  explanation text not null default '',
  matched_skills text[] not null default '{}',
  missing_skills text[] not null default '{}',
  signal_hash text not null default '',
  updated_at timestamptz not null default now(),
  unique (applicant_id, internship_id)
);

create index if not exists applicant_recommendations_applicant_idx
  on public.applicant_recommendations (applicant_id);

alter table public.applicant_recommendations enable row level security;

drop policy if exists applicant_recommendations_own on public.applicant_recommendations;
create policy applicant_recommendations_own
  on public.applicant_recommendations
  for all
  to authenticated
  using (applicant_id = auth.uid())
  with check (applicant_id = auth.uid());

-- Internship listing metadata used by the applicant feed RPC below.
alter table public.internships add column if not exists stipend text;
alter table public.internships add column if not exists deadline timestamptz;
alter table public.internships add column if not exists internship_type text not null default 'full_time';

create index if not exists idx_internships_status_deadline
  on public.internships (status, deadline);

-- ── Applicant read-access RLS (normally from 20260803) ──────────────────
-- The applicant portal needs these policies at runtime; fold them in here so
-- a fresh environment that never ran 20260803 still works end-to-end.

drop policy if exists organisations_select_published on public.organisations;
create policy organisations_select_published
  on public.organisations
  for select
  to anon, authenticated
  using (
    id in (
      select organization_id
      from public.internships
      where status = 'published'
    )
  );

drop policy if exists requirements_select_published on public.requirements;
create policy requirements_select_published
  on public.requirements
  for select
  to anon, authenticated
  using (
    public.is_published_internship(internship_id)
  );

drop policy if exists questions_select_published on public.questions;
create policy questions_select_published
  on public.questions
  for select
  to anon, authenticated
  using (
    public.is_published_internship(internship_id)
  );

drop policy if exists applications_select_own_applicant on public.applications;
create policy applications_select_own_applicant
  on public.applications
  for select
  to authenticated
  using (
    email = (select email from auth.users where id = auth.uid())
  );


-- ============================================================================
-- 2) EXTEND APPLICANT RECOMMENDATIONS CACHE (analytics + acceptance)
-- ============================================================================

alter table public.applicant_recommendations
  add column if not exists acceptance_probability integer not null default 0
  check (acceptance_probability >= 0 and acceptance_probability <= 100);

alter table public.applicant_recommendations
  add column if not exists overall_score integer not null default 0
  check (overall_score >= 0 and overall_score <= 100);

alter table public.applicant_recommendations
  add column if not exists skill_gaps jsonb not null default '[]'::jsonb;

alter table public.applicant_recommendations
  add column if not exists strengths text[] not null default '{}';

alter table public.applicant_recommendations
  add column if not exists weaknesses text[] not null default '{}';

alter table public.applicant_recommendations
  add column if not exists competition_level text not null default '';

alter table public.applicant_recommendations
  add column if not exists avg_applicant_match integer;

alter table public.applicant_recommendations
  add column if not exists reason_generated text not null default 'computed';

alter table public.applicant_recommendations
  add column if not exists algorithm_version text not null default 'v2';

alter table public.applicant_recommendations
  add column if not exists cache_version integer not null default 2;

alter table public.applicant_recommendations
  add column if not exists weights_snapshot jsonb;

alter table public.applicant_recommendations
  add column if not exists generated_at timestamptz not null default now();

alter table public.applicant_recommendations
  add column if not exists profile_completeness integer not null default 0;

create index if not exists applicant_recommendations_generated_at_idx
  on public.applicant_recommendations (applicant_id, generated_at desc);


-- ============================================================================
-- 3) FEED RPC — add average AI match of existing applicants
--    NOTE: 20260803 already created get_applicant_feed() without the
--    avg_applicant_match column. PostgreSQL cannot change a function's return
--    type via CREATE OR REPLACE, so we drop it first (safe: no views depend
--    on it) and recreate, then re-grant execute.
-- ============================================================================

drop function if exists public.get_applicant_feed();

create function public.get_applicant_feed()
returns table (
  id uuid,
  organization_id uuid,
  title text,
  field text,
  description text,
  location text,
  work_mode text,
  duration text,
  stipend text,
  internship_type text,
  deadline timestamptz,
  status text,
  public_slug text,
  company_name text,
  required_skills text[],
  preferred_skills text[],
  applicant_count bigint,
  avg_applicant_match integer,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    i.id,
    i.organization_id,
    i.title,
    i.field,
    i.description,
    i.location,
    i.work_mode,
    i.duration,
    i.stipend,
    i.internship_type,
    i.deadline,
    i.status,
    i.public_slug,
    coalesce(o.name, '') as company_name,
    coalesce(
      array_agg(r.requirement) filter (where r.type = 'required'),
      '{}'::text[]
    ) as required_skills,
    coalesce(
      array_agg(r.requirement) filter (where r.type = 'preferred'),
      '{}'::text[]
    ) as preferred_skills,
    (
      select count(*)::bigint
      from public.applications a
      where a.internship_id = i.id
    ) as applicant_count,
    (
      select round(avg(aa.match_score))::integer
      from public.applications a
      join public.candidate_ai_analysis aa on aa.application_id = a.id
      where a.internship_id = i.id
    ) as avg_applicant_match,
    i.created_at
  from public.internships i
  left join public.organisations o on o.id = i.organization_id
  left join public.requirements r on r.internship_id = i.id
  where i.status = 'published'
    and (i.deadline is null or i.deadline > now())
  group by i.id, o.name
  order by i.created_at desc;
$$;

revoke all on function public.get_applicant_feed() from public;
grant execute on function public.get_applicant_feed() to anon, authenticated;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
