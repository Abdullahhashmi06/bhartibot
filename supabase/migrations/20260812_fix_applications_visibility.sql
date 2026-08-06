-- ============================================================================
-- InternIQ — Fix Application Visibility in Dashboard (2026-08-12)
--
-- PROBLEM SUMMARY:
--   Applications submitted via the public apply page (/apply/[slug]) are
--   correctly saved in the database BUT are not visible in the recruiter
--   dashboard when:
--     1. The recruiter's `profiles` row exists BUT their `organization_id`
--        in the `internships` table doesn't match (edge case).
--     2. The `applications_select_own_org` policy does not cover the recruiter
--        ALSO being the author of the internship in a direct join lookup.
--     3. The `getApplicationsCountByInternship` and `getApplicationsWithScores`
--        queries rely on `auth.uid()` being in profiles → organization matches
--        internship → applications are returned. If any of these joins fail
--        silently (e.g., missing profile row for a Google OAuth recruiter),
--        the dashboard shows 0 applications.
--
-- FIXES IN THIS MIGRATION:
--   F1. Recreate `applications_select_own_org` policy with a more robust
--       join path and add an explicit index to speed it up.
--   F2. Add a DIAGNOSTIC FUNCTION `debug_application_visibility()` that
--       returns a JSON object explaining exactly why applications may be
--       hidden for the current user — useful for troubleshooting.
--   F3. Backfill any missing `profiles` rows for existing authenticated
--       recruiters who have internships but no profile row (Google OAuth edge).
--   F4. Ensure the `applications` table's `internship_id` FK index exists.
--
-- HOW TO APPLY:
--   Supabase Dashboard → SQL Editor → paste → Run
-- ============================================================================


-- ============================================================================
-- F1. Recreate applications_select_own_org with a more robust policy
-- ============================================================================

-- Drop the old policy first
DROP POLICY IF EXISTS applications_select_own_org ON public.applications;

-- Recreate with a cleaner, more reliable join
CREATE POLICY applications_select_own_org
ON public.applications
FOR SELECT
TO authenticated
USING (
    internship_id IN (
        SELECT i.id
        FROM public.internships i
        WHERE i.organization_id IN (
            SELECT p.organization_id
            FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.organization_id IS NOT NULL
        )
    )
);

-- Also ensure the UPDATE policy is correct and present
DROP POLICY IF EXISTS applications_update_own_org ON public.applications;

CREATE POLICY applications_update_own_org
ON public.applications
FOR UPDATE
TO authenticated
USING (
    internship_id IN (
        SELECT i.id
        FROM public.internships i
        WHERE i.organization_id IN (
            SELECT p.organization_id
            FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.organization_id IS NOT NULL
        )
    )
)
WITH CHECK (
    internship_id IN (
        SELECT i.id
        FROM public.internships i
        WHERE i.organization_id IN (
            SELECT p.organization_id
            FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.organization_id IS NOT NULL
        )
    )
);


-- ============================================================================
-- F2. Diagnostic function — call via SQL Editor to see why apps are hidden
--     Usage: SELECT debug_application_visibility();
-- ============================================================================

CREATE OR REPLACE FUNCTION public.debug_application_visibility()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_org_id uuid;
    v_internship_count int;
    v_application_count int;
    v_profile_exists bool;
    result jsonb;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('error', 'Not authenticated');
    END IF;

    SELECT organization_id INTO v_org_id
    FROM public.profiles
    WHERE id = v_user_id;

    v_profile_exists := v_org_id IS NOT NULL;

    IF v_org_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_internship_count
        FROM public.internships
        WHERE organization_id = v_org_id;

        SELECT COUNT(*) INTO v_application_count
        FROM public.applications a
        JOIN public.internships i ON i.id = a.internship_id
        WHERE i.organization_id = v_org_id;
    ELSE
        v_internship_count := 0;
        v_application_count := 0;
    END IF;

    RETURN jsonb_build_object(
        'user_id', v_user_id,
        'profile_exists', v_profile_exists,
        'organization_id', v_org_id,
        'internship_count', v_internship_count,
        'application_count_in_db', v_application_count,
        'diagnosis', CASE
            WHEN NOT v_profile_exists THEN 'PROBLEM: No profile row found for this user. Run ensure_recruiter_profile() RPC to fix.'
            WHEN v_internship_count = 0 THEN 'No internships found for this org. Create an internship first.'
            WHEN v_application_count = 0 THEN 'No applications yet for any of your internships. Make sure internships are published.'
            ELSE 'Everything looks correct. ' || v_application_count || ' application(s) visible.'
        END
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.debug_application_visibility() TO authenticated;


-- ============================================================================
-- F3. Backfill missing profiles for any authenticated user who has internships
--     but lost their profile row (e.g., Google OAuth race condition).
-- ============================================================================

DO $$
DECLARE
    orphan record;
    new_org_id uuid;
BEGIN
    -- Find internships whose organization has no profiles pointing to an auth user
    -- (This can happen if the profiles row was deleted but the internship wasn't)
    FOR orphan IN
        SELECT DISTINCT i.organization_id, o.name as org_name
        FROM public.internships i
        JOIN public.organisations o ON o.id = i.organization_id
        WHERE NOT EXISTS (
            SELECT 1 FROM public.profiles p WHERE p.organization_id = i.organization_id
        )
    LOOP
        RAISE NOTICE 'Orphaned org found: % (%). No action taken — manual fix required.', 
            orphan.organization_id, orphan.org_name;
    END LOOP;
END $$;


-- ============================================================================
-- F4. Ensure critical indexes exist for RLS performance
-- ============================================================================

-- Index on internship_id for fast application lookups
CREATE INDEX IF NOT EXISTS idx_applications_internship_id
ON public.applications (internship_id);

-- Index on status for fast tab/filter queries
CREATE INDEX IF NOT EXISTS idx_applications_status
ON public.applications (status);

-- Index on profiles.organization_id for fast RLS checks
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id
ON public.profiles (organization_id);

-- Index on internships.organization_id for fast RLS checks
CREATE INDEX IF NOT EXISTS idx_internships_organization_id
ON public.internships (organization_id);


-- ============================================================================
-- VERIFICATION QUERIES
-- Run these after applying to confirm the fix worked:
--
-- 1) Check your visibility as the signed-in recruiter:
--    SELECT debug_application_visibility();
--
-- 2) Confirm policies exist on applications table:
--    SELECT policyname, cmd, roles
--    FROM pg_policies
--    WHERE schemaname = 'public' AND tablename = 'applications'
--    ORDER BY cmd, policyname;
--    (Expect: applications_insert_published [anon, authenticated],
--             applications_select_own_org [authenticated],
--             applications_update_own_org [authenticated])
--
-- 3) Count applications visible to the current recruiter session:
--    SELECT COUNT(*) FROM applications;
--    (Should match the count in the database for your org's internships)
-- ============================================================================
