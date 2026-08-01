-- 1. ADD MISSING COLUMNS FOR INTERNSHIP REQUIREMENTS
alter table public.internships
  add column if not exists github_required boolean not null default false;

alter table public.internships
  add column if not exists linkedin_required boolean not null default false;

-- 2. ADD MISSING UPDATE PERMISSION FOR APPLICATIONS
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

-- 3. ADD MISSING DELETE/INSERT PERMISSIONS FOR REQUIREMENTS
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
