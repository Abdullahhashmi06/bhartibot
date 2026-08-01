-- ============================================================================
-- InternIQ
-- Unique Application Constraint (2026-07-31)
--
-- Prevents duplicate applications: one email per internship.
-- The server-side query check already exists; this adds a DB-level guarantee.
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_applications_unique_per_email
  ON public.applications (internship_id, lower(email));
