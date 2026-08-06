-- ============================================================================
-- InternIQ — AI Applicant Portal (Phase: AI-Powered Internship Discovery)
-- Created: 2026-08-03
--
-- Adds:
--   • stipend / deadline / internship_type columns on internships
--   • RLS fixes so authenticated applicants can read organisation names,
--     requirements, questions, and their own applications
--   • applicant_recommendations cache table (match scores + AI explanations)
--   • get_applicant_feed() RPC — one efficient call returning published,
--     open internships joined with org name, skill buckets and applicant counts
-- ============================================================================


-- ============================================================================
-- 0) SELF-CONTAINED APPLICANT PORTAL BASE TABLES
--    These tables are normally created by migration 20260730_applicant_portal.
--    That migration may not be applied in every environment, so this migration
--    guarantees the tables exist before referencing them (the
--    applicant_recommendations FK below points at applicant_profiles). All
--    statements are idempotent — running this after 20260730 is a no-op.
--    NOTE: keep these definitions in sync with 20260730_applicant_portal.sql
--    (20260730 remains the canonical source).
-- ============================================================================

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

create table if not exists public.applicant_skills (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references public.applicant_profiles(id) on delete cascade,
  skill text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.applicant_projects (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references public.applicant_profiles(id) on delete cascade,
  title text not null,
  description text,
  tech_stack text[],
  github_url text,
  live_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.applicant_experience (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references public.applicant_profiles(id) on delete cascade,
  company text not null,
  role text not null,
  start_date text,
  end_date text,
  description text,
  type text default 'internship',
  created_at timestamptz not null default now()
);

create table if not exists public.saved_jobs (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references public.applicant_profiles(id) on delete cascade,
  internship_id uuid not null references public.internships(id) on delete cascade,
  saved_at timestamptz not null default now(),
  unique(applicant_id, internship_id)
);

alter table public.applicant_profiles enable row level security;
alter table public.applicant_skills enable row level security;
alter table public.applicant_projects enable row level security;
alter table public.applicant_experience enable row level security;
alter table public.saved_jobs enable row level security;

drop policy if exists applicant_profiles_own on public.applicant_profiles;
create policy applicant_profiles_own on public.applicant_profiles for all to authenticated using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists applicant_skills_own on public.applicant_skills;
create policy applicant_skills_own on public.applicant_skills for all to authenticated using (applicant_id = auth.uid()) with check (applicant_id = auth.uid());
drop policy if exists applicant_projects_own on public.applicant_projects;
create policy applicant_projects_own on public.applicant_projects for all to authenticated using (applicant_id = auth.uid()) with check (applicant_id = auth.uid());
drop policy if exists applicant_experience_own on public.applicant_experience;
create policy applicant_experience_own on public.applicant_experience for all to authenticated using (applicant_id = auth.uid()) with check (applicant_id = auth.uid());
drop policy if exists saved_jobs_own on public.saved_jobs;
create policy saved_jobs_own on public.saved_jobs for all to authenticated using (applicant_id = auth.uid()) with check (applicant_id = auth.uid());

drop policy if exists internships_public_read on public.internships;
create policy internships_public_read on public.internships for select to anon, authenticated using (status = 'published');


-- ============================================================================
-- 1) INTERNSHIP LISTING METADATA COLUMNS
-- ============================================================================

alter table public.internships add column if not exists stipend text;
alter table public.internships add column if not exists deadline timestamptz;
alter table public.internships add column if not exists internship_type text not null default 'full_time';

comment on column public.internships.stipend is 'Stipend display string, e.g. "PKR 25,000/month". Null = unpaid/not disclosed.';
comment on column public.internships.deadline is 'Application deadline. Expired internships are hidden from the applicant feed.';
comment on column public.internships.internship_type is 'full_time | part_time | contract | other';

create index if not exists idx_internships_status_deadline
  on public.internships (status, deadline);


-- ============================================================================
-- 2) RLS FIXES — APPLICANT READ ACCESS
-- ============================================================================

-- Organisations: anyone (incl. applicants) can read the name of an org that
-- owns at least one published internship.
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

-- Requirements: public read for published internships must also cover
-- authenticated applicants (existing policy only covered the anon role).
drop policy if exists requirements_select_published on public.requirements;

create policy requirements_select_published
  on public.requirements
  for select
  to anon, authenticated
  using (
    public.is_published_internship(internship_id)
  );

-- Questions: same fix — authenticated applicants need to read screening
-- questions on the public apply page.
drop policy if exists questions_select_published on public.questions;

create policy questions_select_published
  on public.questions
  for select
  to anon, authenticated
  using (
    public.is_published_internship(internship_id)
  );

-- Applications: applicants may read their own applications (by email) so the
-- portal can show the "Applied" state and track their submitted applications.
drop policy if exists applications_select_own_applicant on public.applications;

create policy applications_select_own_applicant
  on public.applications
  for select
  to authenticated
  using (
    email = (select email from auth.users where id = auth.uid())
  );


-- ============================================================================
-- 3) APPLICANT RECOMMENDATIONS CACHE
-- ============================================================================

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


-- ============================================================================
-- 4) APPLICANT FEED RPC
--    One security-definer call returning everything the portal needs:
--    internship + org name + required/preferred skills + applicant count.
--    Only published, non-expired internships are returned.
-- ============================================================================

create or replace function public.get_applicant_feed()
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
