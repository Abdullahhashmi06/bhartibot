-- ============================================================================
-- InternIQ — Fix: "Could not find the 'timezone' column of 'interviews'
-- in the schema cache" (PGRST204) on Schedule Interview
-- Created: 2026-08-17
--
-- VERIFIED LIVE against the production project (hvacdcjmyylhlaozoxcf) via
-- PostgREST BEFORE writing this file:
--
--   public.interviews EXISTS with: id, application_id, recruiter_id,
--   interview_date, interview_time, interview_type, interviewer_name,
--   meeting_link, venue, notes, technical_rating, communication_rating,
--   culture_fit, overall_recommendation, overall_decision, status,
--   feedback_notes, created_at, updated_at
--
--   MISSING (Postgres 42703 "column ... does not exist"):
--     timezone, decline_reason, reschedule_requested_date,
--     reschedule_requested_time, reschedule_request_note, reschedule_status
--
--   public.notifications  -> MISSING (PGRST205 "Could not find the table")
--   public.applicant_interviews -> EXISTS but is the PRE-workflow version
--     (has venue, no timezone / no workflow columns)
--
-- Root cause: migration 20260816_interview_workflow.sql — which added the
-- timezone + workflow columns, extended the status CHECK, recreated
-- applicant_interviews and created notifications — was NEVER applied to this
-- database. 20260816_fix_interview_scheduling.sql WAS applied (venue exists).
--
-- This migration is IDEMPOTENT and ADDITIVE only:
--   • adds the 6 missing interviews columns (IF NOT EXISTS)
--   • swaps the interviews.status CHECK to the extended set the application
--     writes (accepted / declined / reschedule_requested / missed) — the live
--     constraint is still the old 6-value set, so status updates would be the
--     NEXT failure after timezone. Dropped by NAME LOOKUP (works regardless of
--     the auto-generated constraint name), then re-added.
--   • recreates public.applicant_interviews with the workflow columns so the
--     applicant dashboard shows timezone + response fields
--   • creates public.notifications (the smallest safe in-app notification
--     mechanism, RLS = users read/update only their own rows)
--   • reloads the PostgREST schema cache so the API sees everything
--     immediately
--
-- Safe to run on any environment, whether or not any interview migration was
-- applied. Does NOT drop or rewrite the interviews table, does NOT delete
-- interview data, does NOT weaken any existing RLS policy.
-- ============================================================================

-- 1. Add the missing interviews columns (types match lib/queries/interview.ts
--    and the scheduler: text, nullable except reschedule_status which defaults
--    to 'none' — identical to 20260816_interview_workflow.sql).
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS timezone text;
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS decline_reason text;
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS reschedule_requested_date text;
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS reschedule_requested_time text;
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS reschedule_request_note text;
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS reschedule_status text DEFAULT 'none';

-- 2. Swap the status CHECK constraint to the extended set. The live table was
--    created with the original 6-value CHECK; the application writes
--    'accepted', 'declined', 'reschedule_requested' and 'missed' (see
--    app/dashboard/applications/interviewActions.ts), so the old constraint
--    must be replaced. Drop ANY CHECK touching the status column by name
--    lookup (name-independent), then re-add. Idempotent on a fresh table.
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

-- 3. Recreate the applicant-visible view with the workflow columns (same
--    narrow safe columns as the workflow migration — never recruiter feedback
--    / decisions / ratings / recruiter_id).
--
-- NOTE: we DROP + CREATE instead of CREATE OR REPLACE. PostgreSQL's
-- CREATE OR REPLACE VIEW validates columns POSITIONALLY, so inserting
-- `timezone` at position 5 (where the live view has `interview_type`) and the
-- workflow columns mid-list would raise:
--   ERROR: cannot change name of view column "interview_type" to "timezone"
-- DROP + CREATE avoids that entirely (the GRANT is re-applied below).
DROP VIEW IF EXISTS public.applicant_interviews;

CREATE VIEW public.applicant_interviews AS
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

GRANT SELECT ON public.applicant_interviews TO authenticated;

-- 4. Notifications table (used by the interview workflow server actions —
--    applicantRespondToInterviewAction / recruiterInterviewAction — and the
--    NotificationsPanel). Same schema + RLS as 20260816_interview_workflow.sql:
--    rows are created via the admin client (bypasses RLS); users SELECT and
--    mark-read only their own rows.
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

-- Explicit grants (belt-and-braces on top of Supabase default privileges):
-- the NotificationsPanel reads + marks-read client-side with the
-- authenticated role, and the server actions insert via the admin client.
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;

-- 5. Reload the PostgREST schema cache so the API sees the new columns /
--    tables immediately (this is the cache that produced the PGRST204 error).
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
