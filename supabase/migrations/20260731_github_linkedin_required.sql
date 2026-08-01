-- ============================================================================
-- InternIQ
-- GitHub & LinkedIn Required Fields on Internships (2026-07-31)
--
-- Adds:
--   • github_required  boolean, default false
--   • linkedin_required boolean, default false
-- ============================================================================

alter table public.internships
  add column if not exists github_required boolean not null default false;

alter table public.internships
  add column if not exists linkedin_required boolean not null default false;

comment on column public.internships.github_required
  is 'When true, applicants must provide a GitHub URL or enter N/A.';

comment on column public.internships.linkedin_required
  is 'When true, applicants must provide a LinkedIn URL or enter N/A.';
