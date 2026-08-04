-- ============================================================================
-- InternIQ — APPLY ALL FIXES (2026-08-01)
--
-- ONE idempotent migration that repairs every database-level issue reported
-- in the stabilization sprint. Safe to run multiple times (every statement is
-- guarded with IF NOT EXISTS / drop-if-exists).
--
-- Fixes included:
--   1. Backfills profiles + organisations for EVERY existing auth user, so the
--      recruiter org-scoping code always resolves and the dashboard never goes
--      empty ("all previous applications removed").
--   2. Adds applicant_profiles.avatar_path  (profile picture upload).
--   3. Recreates the applications status CHECK to include 'withdrawn'.
--   4. Creates storage buckets (cv-files, cvs, avatars) + RLS policies.
--   5. Applicant RLS: read own applications/answers, withdraw-only update.
--   6. Interviews / starred_candidates / talent_pool tables + RLS, and a FIXED
--      shortlisted_candidates view (the old one referenced a non-existent
--      `company_name` column, which aborted the whole interviews migration).
--   7. candidate_ai_analysis + failures tables & policies (idempotent).
--   8. All base RLS policies recreated idempotently (drop if exists).
--
-- HOW TO RUN:
--   Open your Supabase project → SQL Editor → paste this entire file → Run.
--
-- SECURITY NOTE (2026-08-07): the old dev-only `public.exec_sql(text)`
-- SECURITY DEFINER helper (used by the removed /api/run-migration endpoint)
-- has been fully removed from this project. Arbitrary SQL execution must
-- never exist in production — apply migrations only via the Supabase SQL
-- Editor. The removal migration is 20260807_remove_exec_sql.sql.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Backfill profiles + organisations for existing auth users.
--    The on_auth_user_created trigger only fires for NEW signups; existing
--    accounts (or Google-OAuth signups where the trigger was missing) have no
--    profiles row, which previously made every org-scoped query return [].
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  u record;
  new_org_id uuid;
BEGIN
  FOR u IN
    SELECT id, email, raw_user_meta_data
    FROM auth.users
  LOOP
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = u.id) THEN
      INSERT INTO public.organisations (name)
      VALUES (coalesce(u.raw_user_meta_data->>'organization_name', 'Default Organization'))
      RETURNING id INTO new_org_id;

      INSERT INTO public.profiles (id, organization_id, name, email)
      VALUES (
        u.id,
        new_org_id,
        coalesce(u.raw_user_meta_data->>'full_name', ''),
        u.email
      );
    END IF;
  END LOOP;
END $$;

-- Re-apply the trigger for future signups (idempotent).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE new_org_id uuid;
BEGIN
  INSERT INTO public.organisations (name)
  VALUES (coalesce(new.raw_user_meta_data->>'organization_name', 'Unnamed Organization'))
  RETURNING id INTO new_org_id;

  INSERT INTO public.profiles (id, organization_id, name, email)
  VALUES (
    new.id,
    new_org_id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email
  );
  RETURN new;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 2. applicant_profiles.avatar_path
-- ----------------------------------------------------------------------------
ALTER TABLE public.applicant_profiles
  ADD COLUMN IF NOT EXISTS avatar_path text;

-- ----------------------------------------------------------------------------
-- 3. applications status CHECK — include 'withdrawn' (and archived/pending)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'applications_status_check' AND table_name = 'applications'
  ) THEN
    ALTER TABLE public.applications DROP CONSTRAINT applications_status_check;
  END IF;
END $$;

ALTER TABLE public.applications
  ADD CONSTRAINT applications_status_check
  CHECK (status IN ('new', 'under_review', 'shortlisted', 'rejected', 'archived', 'pending', 'withdrawn'));

-- ----------------------------------------------------------------------------
-- 4. Storage buckets + policies (idempotent)
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('cv-files', 'cv-files', false, 10485760, array['application/pdf']),
  ('cvs',      'cvs',      false, 10485760, array['application/pdf']),
  ('avatars',  'avatars',  false,  8388608, array['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "cv_files_read_public" ON storage.objects;
CREATE POLICY "cv_files_read_public" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'cv-files');

DROP POLICY IF EXISTS "cvs_read_public" ON storage.objects;
CREATE POLICY "cvs_read_public" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'cvs');

DROP POLICY IF EXISTS "avatars_read_public" ON storage.objects;
CREATE POLICY "avatars_read_public" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "cv_files_insert_all" ON storage.objects;
CREATE POLICY "cv_files_insert_all" ON storage.objects
  FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'cv-files');

DROP POLICY IF EXISTS "cvs_insert_all" ON storage.objects;
CREATE POLICY "cvs_insert_all" ON storage.objects
  FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'cvs');

DROP POLICY IF EXISTS "avatars_insert_auth" ON storage.objects;
CREATE POLICY "avatars_insert_auth" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_update_auth" ON storage.objects;
CREATE POLICY "avatars_update_auth" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars')
  WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "cv_files_delete_auth" ON storage.objects;
CREATE POLICY "cv_files_delete_auth" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'cv-files');

DROP POLICY IF EXISTS "cvs_delete_auth" ON storage.objects;
CREATE POLICY "cvs_delete_auth" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'cvs');

DROP POLICY IF EXISTS "avatars_delete_auth" ON storage.objects;
CREATE POLICY "avatars_delete_auth" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'avatars');

-- ----------------------------------------------------------------------------
-- 5. Applicant RLS — read own applications/answers, withdraw-only update
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS applications_select_own_applicant ON public.applications;
CREATE POLICY applications_select_own_applicant
  ON public.applications FOR SELECT TO authenticated
  USING (
    email = coalesce(
      (SELECT email FROM public.applicant_profiles WHERE id = auth.uid()),
      (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS answers_select_own_applicant ON public.answers;
CREATE POLICY answers_select_own_applicant
  ON public.answers FOR SELECT TO authenticated
  USING (
    application_id IN (
      SELECT a.id FROM public.applications a
      WHERE a.email = coalesce(
        (SELECT email FROM public.applicant_profiles WHERE id = auth.uid()),
        (SELECT email FROM auth.users WHERE id = auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS applications_update_own_applicant ON public.applications;
CREATE POLICY applications_update_own_applicant
  ON public.applications FOR UPDATE TO authenticated
  USING (
    email = coalesce(
      (SELECT email FROM public.applicant_profiles WHERE id = auth.uid()),
      (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    status = 'withdrawn'
    AND email = coalesce(
      (SELECT email FROM public.applicant_profiles WHERE id = auth.uid()),
      (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- ----------------------------------------------------------------------------
-- 6. candidate_ai_analysis tables FIRST (the shortlisted view depends on it)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.candidate_ai_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL UNIQUE REFERENCES public.applications (id) ON DELETE CASCADE,
  parsed_resume jsonb NOT NULL DEFAULT '{}'::jsonb,
  match_score integer NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  strengths text[] NOT NULL DEFAULT '{}',
  weaknesses text[] NOT NULL DEFAULT '{}',
  missing_skills text[] NOT NULL DEFAULT '{}',
  recommendation text NOT NULL,
  reasoning text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS candidate_ai_analysis_application_id_idx
  ON public.candidate_ai_analysis (application_id);

CREATE TABLE IF NOT EXISTS public.candidate_ai_analysis_failures (
  application_id uuid PRIMARY KEY REFERENCES public.applications (id) ON DELETE CASCADE,
  error_type text NOT NULL,
  message text NOT NULL,
  retryable boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.candidate_ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_ai_analysis_failures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS candidate_ai_analysis_select_own_org ON public.candidate_ai_analysis;
CREATE POLICY candidate_ai_analysis_select_own_org
  ON public.candidate_ai_analysis FOR SELECT TO authenticated
  USING (application_id IN (SELECT a.id FROM public.applications a
    JOIN public.internships i ON i.id = a.internship_id
    WHERE i.organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())));

DROP POLICY IF EXISTS candidate_ai_analysis_insert_own_org ON public.candidate_ai_analysis;
CREATE POLICY candidate_ai_analysis_insert_own_org
  ON public.candidate_ai_analysis FOR INSERT TO authenticated
  WITH CHECK (application_id IN (SELECT a.id FROM public.applications a
    JOIN public.internships i ON i.id = a.internship_id
    WHERE i.organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())));

DROP POLICY IF EXISTS candidate_ai_analysis_update_own_org ON public.candidate_ai_analysis;
CREATE POLICY candidate_ai_analysis_update_own_org
  ON public.candidate_ai_analysis FOR UPDATE TO authenticated
  USING (application_id IN (SELECT a.id FROM public.applications a
    JOIN public.internships i ON i.id = a.internship_id
    WHERE i.organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())))
  WITH CHECK (application_id IN (SELECT a.id FROM public.applications a
    JOIN public.internships i ON i.id = a.internship_id
    WHERE i.organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())));

DROP POLICY IF EXISTS candidate_ai_analysis_delete_own_org ON public.candidate_ai_analysis;
CREATE POLICY candidate_ai_analysis_delete_own_org
  ON public.candidate_ai_analysis FOR DELETE TO authenticated
  USING (application_id IN (SELECT a.id FROM public.applications a
    JOIN public.internships i ON i.id = a.internship_id
    WHERE i.organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())));

DROP POLICY IF EXISTS candidate_ai_analysis_failures_select_own_org ON public.candidate_ai_analysis_failures;
CREATE POLICY candidate_ai_analysis_failures_select_own_org
  ON public.candidate_ai_analysis_failures FOR SELECT TO authenticated
  USING (application_id IN (SELECT a.id FROM public.applications a
    JOIN public.internships i ON i.id = a.internship_id
    WHERE i.organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())));

DROP POLICY IF EXISTS candidate_ai_analysis_failures_insert_own_org ON public.candidate_ai_analysis_failures;
CREATE POLICY candidate_ai_analysis_failures_insert_own_org
  ON public.candidate_ai_analysis_failures FOR INSERT TO authenticated
  WITH CHECK (application_id IN (SELECT a.id FROM public.applications a
    JOIN public.internships i ON i.id = a.internship_id
    WHERE i.organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())));

DROP POLICY IF EXISTS candidate_ai_analysis_failures_update_own_org ON public.candidate_ai_analysis_failures;
CREATE POLICY candidate_ai_analysis_failures_update_own_org
  ON public.candidate_ai_analysis_failures FOR UPDATE TO authenticated
  USING (application_id IN (SELECT a.id FROM public.applications a
    JOIN public.internships i ON i.id = a.internship_id
    WHERE i.organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())))
  WITH CHECK (application_id IN (SELECT a.id FROM public.applications a
    JOIN public.internships i ON i.id = a.internship_id
    WHERE i.organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())));

DROP POLICY IF EXISTS candidate_ai_analysis_failures_delete_own_org ON public.candidate_ai_analysis_failures;
CREATE POLICY candidate_ai_analysis_failures_delete_own_org
  ON public.candidate_ai_analysis_failures FOR DELETE TO authenticated
  USING (application_id IN (SELECT a.id FROM public.applications a
    JOIN public.internships i ON i.id = a.internship_id
    WHERE i.organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())));

-- ----------------------------------------------------------------------------
-- 7. Interviews / starred_candidates / talent_pool + FIXED shortlisted view
--    NOTE: the old view referenced `i.company_name` (does not exist), which
--    aborted this whole migration on earlier projects. Now fixed.
-- ----------------------------------------------------------------------------
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

CREATE TABLE IF NOT EXISTS public.starred_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(recruiter_id, application_id)
);

CREATE TABLE IF NOT EXISTS public.talent_pool (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(recruiter_id, application_id)
);

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

ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.starred_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_pool ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS interviews_recruiter ON public.interviews;
CREATE POLICY interviews_recruiter ON public.interviews
  FOR ALL TO authenticated
  USING (recruiter_id = auth.uid())
  WITH CHECK (recruiter_id = auth.uid());

DROP POLICY IF EXISTS star_candidates_own ON public.starred_candidates;
CREATE POLICY star_candidates_own ON public.starred_candidates
  FOR ALL TO authenticated
  USING (recruiter_id = auth.uid())
  WITH CHECK (recruiter_id = auth.uid());

DROP POLICY IF EXISTS star_candidates_select ON public.starred_candidates;
CREATE POLICY star_candidates_select ON public.starred_candidates
  FOR SELECT TO authenticated
  USING (recruiter_id = auth.uid());

DROP POLICY IF EXISTS talent_pool_own ON public.talent_pool;
CREATE POLICY talent_pool_own ON public.talent_pool
  FOR ALL TO authenticated
  USING (recruiter_id = auth.uid())
  WITH CHECK (recruiter_id = auth.uid());

GRANT SELECT ON public.shortlisted_candidates TO authenticated;

-- ----------------------------------------------------------------------------
-- 8. Base RLS policies — recreated idempotently (drop if exists)
-- ----------------------------------------------------------------------------
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS org_select_own ON public.organisations;
CREATE POLICY org_select_own ON public.organisations
  FOR SELECT TO authenticated
  USING (id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS internships_select_own_org ON public.internships;
CREATE POLICY internships_select_own_org ON public.internships
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS internships_insert_own_org ON public.internships;
CREATE POLICY internships_insert_own_org ON public.internships
  FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS internships_update_own_org ON public.internships;
CREATE POLICY internships_update_own_org ON public.internships
  FOR UPDATE TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS internships_select_published ON public.internships;
CREATE POLICY internships_select_published ON public.internships
  FOR SELECT TO anon
  USING (status = 'published');

DROP POLICY IF EXISTS internships_public_read ON public.internships;
CREATE POLICY internships_public_read ON public.internships
  FOR SELECT TO anon, authenticated USING (status = 'published');

DROP POLICY IF EXISTS requirements_select_own_org ON public.requirements;
CREATE POLICY requirements_select_own_org ON public.requirements
  FOR SELECT TO authenticated
  USING (public.can_access_internship(internship_id));

DROP POLICY IF EXISTS requirements_insert_own_org ON public.requirements;
CREATE POLICY requirements_insert_own_org ON public.requirements
  FOR INSERT TO authenticated
  WITH CHECK (public.can_access_internship(internship_id));

DROP POLICY IF EXISTS requirements_delete_own_org ON public.requirements;
CREATE POLICY requirements_delete_own_org ON public.requirements
  FOR DELETE TO authenticated
  USING (public.can_access_internship(internship_id));

DROP POLICY IF EXISTS requirements_select_published ON public.requirements;
CREATE POLICY requirements_select_published ON public.requirements
  FOR SELECT TO anon
  USING (public.is_published_internship(internship_id));

DROP POLICY IF EXISTS questions_select_own_org ON public.questions;
CREATE POLICY questions_select_own_org ON public.questions
  FOR SELECT TO authenticated
  USING (internship_id IN (SELECT id FROM public.internships
    WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())));

DROP POLICY IF EXISTS questions_insert_own_org ON public.questions;
CREATE POLICY questions_insert_own_org ON public.questions
  FOR INSERT TO authenticated
  WITH CHECK (internship_id IN (SELECT id FROM public.internships
    WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())));

DROP POLICY IF EXISTS questions_delete_own_org ON public.questions;
CREATE POLICY questions_delete_own_org ON public.questions
  FOR DELETE TO authenticated
  USING (internship_id IN (SELECT id FROM public.internships
    WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())));

DROP POLICY IF EXISTS questions_select_published ON public.questions;
CREATE POLICY questions_select_published ON public.questions
  FOR SELECT TO anon
  USING (public.is_published_internship(internship_id));

DROP POLICY IF EXISTS applications_insert_published ON public.applications;
CREATE POLICY applications_insert_published ON public.applications
  FOR INSERT TO anon, authenticated
  WITH CHECK (public.is_published_internship(internship_id));

DROP POLICY IF EXISTS applications_select_own_org ON public.applications;
CREATE POLICY applications_select_own_org ON public.applications
  FOR SELECT TO authenticated
  USING (internship_id IN (SELECT id FROM public.internships
    WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())));

DROP POLICY IF EXISTS applications_update_own_org ON public.applications;
CREATE POLICY applications_update_own_org ON public.applications
  FOR UPDATE TO authenticated
  USING (internship_id IN (SELECT id FROM public.internships
    WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())))
  WITH CHECK (internship_id IN (SELECT id FROM public.internships
    WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())));

DROP POLICY IF EXISTS answers_insert_with_application ON public.answers;
CREATE POLICY answers_insert_with_application ON public.answers
  FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.applications a
    WHERE a.id = application_id AND public.is_published_internship(a.internship_id)));

DROP POLICY IF EXISTS answers_select_own_org ON public.answers;
CREATE POLICY answers_select_own_org ON public.answers
  FOR SELECT TO authenticated
  USING (application_id IN (SELECT a.id FROM public.applications a
    JOIN public.internships i ON i.id = a.internship_id
    WHERE i.organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())));

-- Applicant portal tables (idempotent)
ALTER TABLE public.applicant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicant_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicant_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicant_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS applicant_profiles_own ON public.applicant_profiles;
CREATE POLICY applicant_profiles_own ON public.applicant_profiles
  FOR ALL TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS applicant_skills_own ON public.applicant_skills;
CREATE POLICY applicant_skills_own ON public.applicant_skills
  FOR ALL TO authenticated USING (applicant_id = auth.uid()) WITH CHECK (applicant_id = auth.uid());

DROP POLICY IF EXISTS applicant_projects_own ON public.applicant_projects;
CREATE POLICY applicant_projects_own ON public.applicant_projects
  FOR ALL TO authenticated USING (applicant_id = auth.uid()) WITH CHECK (applicant_id = auth.uid());

DROP POLICY IF EXISTS applicant_experience_own ON public.applicant_experience;
CREATE POLICY applicant_experience_own ON public.applicant_experience
  FOR ALL TO authenticated USING (applicant_id = auth.uid()) WITH CHECK (applicant_id = auth.uid());

DROP POLICY IF EXISTS saved_jobs_own ON public.saved_jobs;
CREATE POLICY saved_jobs_own ON public.saved_jobs
  FOR ALL TO authenticated USING (applicant_id = auth.uid()) WITH CHECK (applicant_id = auth.uid());

-- ============================================================================
-- END OF APPLY ALL FIXES
-- ============================================================================
