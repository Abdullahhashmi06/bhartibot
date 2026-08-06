-- ============================================================================
-- InternIQ — Fix: Interview scheduling "not functional" on the recruiter side
-- Created: 2026-08-16
--
-- Symptom reported by recruiters: pressing "Schedule Interview" in an
-- application does nothing (the appointment is never set with the applicant).
--
-- Root cause (verified live against the project):
--   POST /rest/v1/interviews returns
--   HTTP 404 PGRST205: "Could not find the table 'public.interviews'
--   in the schema cache"
--
-- The migration 20260731_interviews_and_shortlist.sql (which created the
-- `interviews`, `starred_candidates` and `talent_pool` tables plus the
-- `shortlisted_candidates` view) was never applied to this database, so the
-- recruiter scheduler insert fails before anything is persisted.
--
-- This migration is IDEMPOTENT and ADDITIVE:
--   • creates the tables only if they do not already exist (table DDL from
--     20260731 / 20260801; the shortlisted_candidates view was corrected to
--     join public.organisations because internships has NO company_name
--     column in this project — company name lives on organisations.name,
--     exposed here aliased as "company_name")
--   • adds a `venue` column (kept for on-site interviews; absent from the
--     original 20260731 DDL)
--   • recreates the recruiter RLS policies only if missing
--   • exposes applicant-visible interviews through a NARROW view
--     (applicant_interviews) instead of a table-level SELECT policy, so
--     internal recruiter columns (technical_rating, overall_decision,
--     feedback_notes, recruiter_id) are never readable by applicants
--   • reloads the PostgREST schema cache so the API sees the table
--     immediately (mirrors 20260815_fix_interviews_schema_cache.sql)
--
-- Safe to run on any environment, whether or not the historical migrations
-- were applied (all statements are IF NOT EXISTS / DROP IF EXISTS / OR
-- REPLACE, so a previously failed partial run is fully recoverable). Does
-- NOT touch any other table, policy, or migration.
-- ============================================================================

-- 1. Interviews table (exact schema from 20260731, plus venue)
CREATE TABLE IF NOT EXISTS public.interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  recruiter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interview_date text,
  interview_time text,
  interview_type text DEFAULT 'online',
  interviewer_name text,
  meeting_link text,
  notes text,
  technical_rating int CHECK (technical_rating >= 1 AND technical_rating <= 5),
  communication_rating int CHECK (communication_rating >= 1 AND communication_rating <= 5),
  culture_fit int CHECK (culture_fit >= 1 AND culture_fit <= 5),
  overall_recommendation text,
  overall_decision text,
  status text DEFAULT 'not_scheduled' CHECK (status IN ('not_scheduled','scheduled','completed','cancelled','offer_sent','rejected')),
  feedback_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Starred candidates table (referenced by lib/queries/star-candidates.ts)
CREATE TABLE IF NOT EXISTS public.starred_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(recruiter_id, application_id)
);

-- 3. Talent pool table (referenced by lib/queries/talent-pool.ts)
CREATE TABLE IF NOT EXISTS public.talent_pool (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(recruiter_id, application_id)
);

-- 4. Shortlisted candidates view (referenced by the shortlisted page)
--    NOTE: internships has NO company_name column in this project. The
--    company/organisation display name lives on public.organisations.name,
--    reached via internships.organization_id. We expose it aliased as
--    "company_name" so existing consumers (frontend cards, types) keep
--    working unchanged.
CREATE OR REPLACE VIEW public.shortlisted_candidates AS
SELECT
  a.id AS application_id,
  a.applicant_name,
  a.email,
  a.phone,
  a.university,
  a.degree,
  a.semester,
  a.cgpa,
  a.linkedin_url,
  a.github_url,
  a.portfolio_url,
  a.cv_path,
  a.status,
  a.created_at AS applied_at,
  a.internship_id,
  i.title AS internship_title,
  coalesce(o.name, '') AS company_name,
  i.location AS internship_location,
  i.work_mode,
  caa.match_score,
  caa.recommendation,
  caa.strengths,
  caa.weaknesses,
  caa.missing_skills,
  caa.reasoning
FROM public.applications a
JOIN public.internships i ON i.id = a.internship_id
JOIN public.organisations o ON o.id = i.organization_id
LEFT JOIN LATERAL (
  SELECT match_score, recommendation, strengths, weaknesses, missing_skills, reasoning
  FROM public.candidate_ai_analysis
  WHERE application_id = a.id
  ORDER BY created_at DESC
  LIMIT 1
) caa ON true
WHERE a.status = 'shortlisted';

-- 5. Venue column (for on-site interviews) — additive for DBs where the
--    table already exists without it.
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS venue text;

-- 6. RLS
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.starred_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_pool ENABLE ROW LEVEL SECURITY;

-- 6a. Recruiters manage their own interviews
DROP POLICY IF EXISTS interviews_recruiter ON public.interviews;
CREATE POLICY interviews_recruiter ON public.interviews
  FOR ALL TO authenticated
  USING (recruiter_id = auth.uid())
  WITH CHECK (recruiter_id = auth.uid());

-- 6b. Applicants can read ONLY their own interviews via a narrow view.
--     A table-level SELECT policy would leak internal columns (technical_rating,
--     overall_decision, feedback_notes, recruiter_id) because RLS is row-level,
--     not column-level. The view below exposes only the safe columns and filters
--     rows by the caller's own email (same lookup as the existing
--     applications_select_own_applicant policy). It runs with the view owner's
--     privileges (like the existing shortlisted_candidates view) and has no
--     user-controlled input, so the WHERE filter cannot be bypassed.
DROP POLICY IF EXISTS interviews_applicant_read ON public.interviews;

CREATE OR REPLACE VIEW public.applicant_interviews AS
SELECT
  i.id,
  i.application_id,
  i.interview_date,
  i.interview_time,
  i.interview_type,
  i.interviewer_name,
  i.meeting_link,
  i.venue,
  i.notes,
  i.status,
  i.created_at,
  i.updated_at,
  a.internship_id,
  it.title AS internship_title,
  coalesce(o.name, '') AS company_name
FROM public.interviews i
JOIN public.applications a ON a.id = i.application_id
JOIN public.internships it ON it.id = a.internship_id
JOIN public.organisations o ON o.id = it.organization_id
WHERE a.email = coalesce(
  (SELECT email FROM public.applicant_profiles WHERE id = auth.uid()),
  (SELECT email FROM auth.users WHERE id = auth.uid())
);

GRANT SELECT ON public.applicant_interviews TO authenticated;

-- 6c. Starred candidates: recruiters manage their own
DROP POLICY IF EXISTS star_candidates_own ON public.starred_candidates;
CREATE POLICY star_candidates_own ON public.starred_candidates
  FOR ALL TO authenticated
  USING (recruiter_id = auth.uid())
  WITH CHECK (recruiter_id = auth.uid());

DROP POLICY IF EXISTS star_candidates_select ON public.starred_candidates;
CREATE POLICY star_candidates_select ON public.starred_candidates
  FOR SELECT TO authenticated
  USING (recruiter_id = auth.uid());

-- 6d. Talent pool: recruiters manage their own
DROP POLICY IF EXISTS talent_pool_own ON public.talent_pool;
CREATE POLICY talent_pool_own ON public.talent_pool
  FOR ALL TO authenticated
  USING (recruiter_id = auth.uid())
  WITH CHECK (recruiter_id = auth.uid());

-- 7. View grants
GRANT SELECT ON public.shortlisted_candidates TO authenticated;
GRANT SELECT ON public.applicant_interviews TO authenticated;

-- 8. Reload the PostgREST schema cache so the API sees the tables immediately
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
