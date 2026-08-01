-- Applicant profiles (separate from recruiter profiles)
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

-- RLS
alter table public.applicant_profiles enable row level security;
alter table public.applicant_skills enable row level security;
alter table public.applicant_projects enable row level security;
alter table public.applicant_experience enable row level security;
alter table public.saved_jobs enable row level security;

-- Applicants can manage their own data
-- (drop-if-exists makes the migration re-runnable / order-independent)
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

-- Applicants can view published internships
drop policy if exists internships_public_read on public.internships;
create policy internships_public_read on public.internships for select to anon, authenticated using (status = 'published');
