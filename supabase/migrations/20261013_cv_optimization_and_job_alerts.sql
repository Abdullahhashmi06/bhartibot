-- ============================================================================
-- InternIQ — CV Optimization & Job Alerts Schema
-- Created: 2026-10-13
--
-- Features:
--   1. cv_analyses: Persists CV optimization drafts, role targets, match scores,
--      evidence findings, suggestions (with accept/reject/edit state), and version history.
--   2. job_alerts: Persists multi-criteria alert preferences (role, skills,
--      company, location, work mode, match threshold, frequency, notification channels).
--   3. job_alert_matches: Persists deduplicated matched internships and delivery logs.
-- ============================================================================

-- ============================================================================
-- 1. CV OPTIMIZATION & VERSIONING (cv_analyses)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cv_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id uuid NOT NULL REFERENCES public.applicant_profiles(id) ON DELETE CASCADE,
  original_cv_path text,
  target_job_id uuid REFERENCES public.internships(id) ON DELETE SET NULL,
  target_role_title text NOT NULL,
  target_role_description text,
  version integer NOT NULL DEFAULT 1,
  match_score integer NOT NULL DEFAULT 0 CHECK (match_score >= 0 AND match_score <= 100),
  summary text NOT NULL DEFAULT '',
  strengths jsonb NOT NULL DEFAULT '[]'::jsonb,
  missing_evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  keyword_analysis jsonb NOT NULL DEFAULT '{"matchedKeywords":[],"missingKeywords":[]}'::jsonb,
  suggestions jsonb NOT NULL DEFAULT '[]'::jsonb,
  optimized_content jsonb NOT NULL DEFAULT '{}'::jsonb,
  model_version text DEFAULT 'gemini-1.5-flash',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cv_analyses_applicant
  ON public.cv_analyses (applicant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cv_analyses_target_job
  ON public.cv_analyses (target_job_id);

ALTER TABLE public.cv_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cv_analyses_own ON public.cv_analyses;
CREATE POLICY cv_analyses_own ON public.cv_analyses
  FOR ALL
  TO authenticated
  USING (applicant_id = auth.uid())
  WITH CHECK (applicant_id = auth.uid());


-- ============================================================================
-- 2. JOB ALERTS (job_alerts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.job_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id uuid NOT NULL REFERENCES public.applicant_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  target_role text,
  skills text[] NOT NULL DEFAULT '{}',
  companies text[] NOT NULL DEFAULT '{}',
  location text,
  work_mode text NOT NULL DEFAULT 'any',
  match_threshold integer NOT NULL DEFAULT 60 CHECK (match_threshold >= 0 AND match_threshold <= 100),
  frequency text NOT NULL DEFAULT 'instant' CHECK (frequency IN ('instant', 'daily', 'weekly')),
  channels text[] NOT NULL DEFAULT '{"in_app"}',
  is_active boolean NOT NULL DEFAULT true,
  last_run_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_alerts_applicant
  ON public.job_alerts (applicant_id, is_active);

ALTER TABLE public.job_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS job_alerts_own ON public.job_alerts;
CREATE POLICY job_alerts_own ON public.job_alerts
  FOR ALL
  TO authenticated
  USING (applicant_id = auth.uid())
  WITH CHECK (applicant_id = auth.uid());


-- ============================================================================
-- 3. JOB ALERT MATCHES & DEDUPLICATION (job_alert_matches)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.job_alert_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id uuid NOT NULL REFERENCES public.job_alerts(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL REFERENCES public.applicant_profiles(id) ON DELETE CASCADE,
  internship_id uuid NOT NULL REFERENCES public.internships(id) ON DELETE CASCADE,
  match_reasons text[] NOT NULL DEFAULT '{}',
  score integer NOT NULL DEFAULT 0,
  notified_channels text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(alert_id, internship_id)
);

CREATE INDEX IF NOT EXISTS idx_job_alert_matches_applicant
  ON public.job_alert_matches (applicant_id, created_at DESC);

ALTER TABLE public.job_alert_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS job_alert_matches_own ON public.job_alert_matches;
CREATE POLICY job_alert_matches_own ON public.job_alert_matches
  FOR ALL
  TO authenticated
  USING (applicant_id = auth.uid())
  WITH CHECK (applicant_id = auth.uid());
