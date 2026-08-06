-- ============================================================================
-- InternIQ — Phase 2: Interview workflow completion (applicant response,
-- reschedule requests, notifications)
-- Created: 2026-08-16
--
-- ADDITIVE and IDEMPOTENT. Safe to run whether or not
-- 20260816_fix_interview_scheduling.sql was applied first:
--   • recreates public.interviews only if missing (now with the full status
--     set and workflow columns inline, so this migration is self-contained)
--   • swaps the interviews.status CHECK constraint to include the new states
--     (accepted, declined, reschedule_requested, missed) — the old constraint
--     is dropped by NAME LOOKUP (any CHECK touching the status column), so it
--     works regardless of the auto-generated constraint name
--   • adds workflow columns if missing
--   • recreates public.applicant_interviews (same narrow safe columns as
--     before, plus the applicant-visible workflow fields)
--   • creates public.notifications (the smallest safe in-app notification
--     mechanism — no websockets) with RLS: users read/update only their own
-- Does NOT touch any other table, policy, or migration.
-- ============================================================================

-- 1. Interviews table — self-contained (full schema, new statuses + columns)
CREATE TABLE IF NOT EXISTS public.interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  recruiter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interview_date text,
  interview_time text,
  timezone text,
  interview_type text DEFAULT 'online',
  interviewer_name text,
  meeting_link text,
  venue text,
  notes text,
  technical_rating int CHECK (technical_rating >= 1 AND technical_rating <= 5),
  communication_rating int CHECK (communication_rating >= 1 AND communication_rating <= 5),
  culture_fit int CHECK (culture_fit >= 1 AND culture_fit <= 5),
  overall_recommendation text,
  overall_decision text,
  status text DEFAULT 'not_scheduled' CHECK (status IN ('not_scheduled','scheduled','accepted','declined','reschedule_requested','completed','cancelled','missed','offer_sent','rejected')),
  feedback_notes text,
  -- Applicant workflow columns (Phase 2)
  decline_reason text,
  reschedule_requested_date text,
  reschedule_requested_time text,
  reschedule_request_note text,
  reschedule_status text DEFAULT 'none',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 1b. Swap the status CHECK constraint to the extended set. Drop ANY check
--     constraint that touches the `status` column (name-independent), then
--     re-add the new one. Idempotent: on a fresh table the inline CHECK is
--     dropped and re-created identically; on an old table the restrictive
--     CHECK is replaced.
DO $$
DECLARE r record;
BEGIN
  IF to_regclass('public.interviews') IS NOT NULL THEN
    FOR r IN
      SELECT c.conname
      FROM pg_constraint c
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
      WHERE c.conrelid = 'public.interviews'::regclass
        AND c.contype = 'c'
        AND a.attname = 'status'
    LOOP
      EXECUTE format('ALTER TABLE public.interviews DROP CONSTRAINT %I', r.conname);
    END LOOP;
  END IF;
END $$;

ALTER TABLE public.interviews ADD CONSTRAINT interviews_status_check
  CHECK (status IN ('not_scheduled','scheduled','accepted','declined','reschedule_requested','completed','cancelled','missed','offer_sent','rejected'));

-- 1c. Workflow columns (additive for DBs where the table already exists)
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS timezone text;
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS decline_reason text;
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS reschedule_requested_date text;
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS reschedule_requested_time text;
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS reschedule_request_note text;
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS reschedule_status text DEFAULT 'none';

-- 2. Applicant-visible interview view — same narrow safe columns as before,
--    plus the workflow fields the applicant owns (their decline reason and
--    their reschedule request). NEVER exposes recruiter feedback/decision
--    columns (technical_rating, overall_decision, feedback_notes, recruiter_id).
CREATE OR REPLACE VIEW public.applicant_interviews AS
SELECT
  i.id,
  i.application_id,
  i.interview_date,
  i.interview_time,
  i.timezone,
  i.interview_type,
  i.interviewer_name,
  i.meeting_link,
  i.venue,
  i.notes,
  i.status,
  i.decline_reason,
  i.reschedule_requested_date,
  i.reschedule_requested_time,
  i.reschedule_request_note,
  i.reschedule_status,
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

-- 3. In-app notifications (smallest safe mechanism — no websockets).
--    Rows are created by server actions (admin client, bypasses RLS);
--    users can SELECT and mark-read only their own rows.
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON public.notifications (user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_select_own ON public.notifications;
CREATE POLICY notifications_select_own ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS notifications_update_own ON public.notifications;
CREATE POLICY notifications_update_own ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 4. Keep the recruiter interview policy + view grants intact
DROP POLICY IF EXISTS interviews_recruiter ON public.interviews;
CREATE POLICY interviews_recruiter ON public.interviews
  FOR ALL TO authenticated
  USING (recruiter_id = auth.uid())
  WITH CHECK (recruiter_id = auth.uid());

GRANT SELECT ON public.applicant_interviews TO authenticated;

-- 5. Reload the PostgREST schema cache so new tables/columns are visible
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
