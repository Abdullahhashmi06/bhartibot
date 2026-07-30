-- ============================================================
-- Migration: 20260731_interviews_and_shortlist
-- Creates missing tables for interview scheduling, star candidates,
-- and talent pool. Also creates a shortlisted_candidates view.
-- ============================================================

-- 1. Interviews table
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

-- 2. Starred candidates table (referenced by lib/queries/star-candidates.ts as "starred_candidates")
CREATE TABLE IF NOT EXISTS public.starred_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(recruiter_id, application_id)
);

-- 3. Talent pool table
CREATE TABLE IF NOT EXISTS public.talent_pool (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(recruiter_id, application_id)
);

-- 4. Shortlisted candidates view (all shortlisted applications with internship details)
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
  i.company_name,
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
LEFT JOIN LATERAL (
  SELECT match_score, recommendation, strengths, weaknesses, missing_skills, reasoning
  FROM public.candidate_ai_analysis
  WHERE application_id = a.id
  ORDER BY created_at DESC
  LIMIT 1
) caa ON true
WHERE a.status = 'shortlisted';

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.starred_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_pool ENABLE ROW LEVEL SECURITY;

-- Interviews: recruiters can manage their own
DROP POLICY IF EXISTS interviews_recruiter ON public.interviews;
CREATE POLICY interviews_recruiter ON public.interviews
  FOR ALL TO authenticated
  USING (recruiter_id = auth.uid())
  WITH CHECK (recruiter_id = auth.uid());

-- Starred candidates: recruiters can manage their own
DROP POLICY IF EXISTS star_candidates_own ON public.starred_candidates;
CREATE POLICY star_candidates_own ON public.starred_candidates
  FOR ALL TO authenticated
  USING (recruiter_id = auth.uid())
  WITH CHECK (recruiter_id = auth.uid());

-- Talent pool: recruiters can manage their own
DROP POLICY IF EXISTS talent_pool_own ON public.talent_pool;
CREATE POLICY talent_pool_own ON public.talent_pool
  FOR ALL TO authenticated
  USING (recruiter_id = auth.uid())
  WITH CHECK (recruiter_id = auth.uid());

-- Allow recruiters to SELECT star_candidates for their own organization
-- (needed for the isStarred check in the application detail page)
DROP POLICY IF EXISTS star_candidates_select ON public.starred_candidates;
CREATE POLICY star_candidates_select ON public.starred_candidates
  FOR SELECT TO authenticated
  USING (recruiter_id = auth.uid());

-- Grant usage on view
GRANT SELECT ON public.shortlisted_candidates TO authenticated;
