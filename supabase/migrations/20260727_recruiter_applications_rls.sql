-- ============================================================================
-- BhartiBot
-- Applications Recruiter Update RLS (Sprint 2)
-- Created: 2026-07-27
--
-- Adds:
--   • applications UPDATE policy so recruiters can change status
--   • answers UPDATE policy (defensive)
-- ============================================================================

-- --------------------------------------------------------------------------
-- Applications: recruiter can update status of applications for their org
-- --------------------------------------------------------------------------

drop policy if exists applications_update_own_org on public.applications;

create policy applications_update_own_org

on public.applications

for update

to authenticated

using (

    internship_id in (

        select id

        from public.internships

        where organization_id in (

            select organization_id

            from public.profiles

            where id = auth.uid()

        )

    )

)

with check (

    internship_id in (

        select id

        from public.internships

        where organization_id in (

            select organization_id

            from public.profiles

            where id = auth.uid()

        )

    )

);


-- --------------------------------------------------------------------------
-- Requirements: recruiter DELETE (needed for edit internship flow)
-- --------------------------------------------------------------------------

drop policy if exists requirements_delete_own_org on public.requirements;

create policy requirements_delete_own_org

on public.requirements

for delete

to authenticated

using (

    internship_id in (

        select id

        from public.internships

        where organization_id in (

            select organization_id

            from public.profiles

            where id = auth.uid()

        )

    )

);


-- --------------------------------------------------------------------------
-- Requirements: recruiter INSERT (needed for edit internship flow)
-- --------------------------------------------------------------------------

drop policy if exists requirements_insert_own_org on public.requirements;

create policy requirements_insert_own_org

on public.requirements

for insert

to authenticated

with check (

    internship_id in (

        select id

        from public.internships

        where organization_id in (

            select organization_id

            from public.profiles

            where id = auth.uid()

        )

    )

);
