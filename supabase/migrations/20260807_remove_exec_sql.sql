-- ============================================================================
-- InternIQ — Remove dev-only exec_sql (2026-08-07)
--
-- `public.exec_sql(text)` executed arbitrary SQL as SECURITY DEFINER and was
-- only ever meant for development migrations. It must never exist in
-- production. This migration drops the function.
--
-- Idempotent: safe to run on environments that never created exec_sql, and on
-- re-runs (a missing function is not an error). Dropping a function removes
-- all of its grants automatically, so no explicit REVOKE is needed.
--
-- The endpoint (/api/run-migration) and runner scripts that used it have been
-- removed from the codebase; apply migrations via the Supabase SQL Editor.
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE proname = 'exec_sql'
      AND pronamespace = 'public'::regnamespace
  ) THEN
    DROP FUNCTION public.exec_sql(text);
  END IF;
END $$;

-- ============================================================================
-- END OF 20260807_remove_exec_sql.sql
-- ============================================================================
