-- ============================================================================
-- InternIQ
-- Application Status Values Update (2026-07-31)
--
-- Ensures 'under_review' and 'archived' are valid status values.
-- The applications.status column uses text type, so no enum alteration needed.
-- This migration adds a CHECK constraint for valid statuses.
-- ============================================================================

-- Drop existing constraint if any (idempotent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'applications_status_check'
    AND table_name = 'applications'
  ) THEN
    ALTER TABLE public.applications DROP CONSTRAINT applications_status_check;
  END IF;
END $$;

-- Add constraint with all valid statuses
ALTER TABLE public.applications
  ADD CONSTRAINT applications_status_check
  CHECK (status IN ('new', 'under_review', 'shortlisted', 'rejected', 'archived', 'pending'));
