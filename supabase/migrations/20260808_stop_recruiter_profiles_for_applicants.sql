-- ============================================================================
-- InternIQ — Stop recruiter profiles for applicants (2026-08-08)
--
-- Security audit finding (High): the `on_auth_user_created` trigger
-- (handle_new_user) created a recruiter organisation + `profiles` row for
-- EVERY new auth user — including applicants who sign up via the applicant
-- portal. That gave applicants a dormant recruiter identity (empty org) that
-- must not exist.
--
-- Fixes:
--   1. handle_new_user now skips provisioning when the signup metadata says
--      role = 'applicant' (email/password applicant signup sets this).
--   2. Existing spurious recruiter rows are cleaned up for users who have an
--      applicant_profiles row (and whose org has no internships/profiles).
--   3. New SECURITY DEFINER helper `remove_spurious_recruiter_profile()` so
--      the applicant OAuth callback can clean up the recruiter row that the
--      auth trigger creates before applicant_profiles exists (OAuth metadata
--      carries no role hint).
--
-- Idempotent: safe to run multiple times; drop-if-exists guards everywhere.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. handle_new_user — skip applicant signups
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    new_org_id uuid;
begin
    -- Applicants sign up through the applicant portal with role='applicant'
    -- in user metadata. They must NOT get a recruiter org/profile.
    if coalesce(new.raw_user_meta_data ->> 'role', '') = 'applicant' then
        return new;
    end if;

    insert into public.organisations (name)
    values (
        coalesce(new.raw_user_meta_data ->> 'organization_name', 'Unnamed Organization')
    )
    returning id
    into new_org_id;

    insert into public.profiles (id, organization_id, name, email)
    values (
        new.id,
        new_org_id,
        coalesce(new.raw_user_meta_data ->> 'full_name', ''),
        new.email
    );

    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert
on auth.users
for each row
execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 2. Clean up spurious recruiter rows already created for applicants
-- ----------------------------------------------------------------------------
do $$
declare
    u record;
    v_org_id uuid;
    v_profiles int;
    v_internships int;
begin
    for u in
        select p.id, p.organization_id
        from public.profiles p
        join public.applicant_profiles ap on ap.id = p.id
    loop
        v_org_id := u.organization_id;

        -- Delete the spurious recruiter profile row.
        delete from public.profiles where id = u.id;

        -- Delete the org too, but ONLY if it is otherwise empty.
        if v_org_id is not null then
            select count(*) into v_profiles
            from public.profiles
            where organization_id = v_org_id;

            select count(*) into v_internships
            from public.internships
            where organization_id = v_org_id;

            if v_profiles = 0 and v_internships = 0 then
                delete from public.organisations where id = v_org_id;
            end if;
        end if;
    end loop;
end $$;

-- ----------------------------------------------------------------------------
-- 3. SECURITY DEFINER helper for the applicant OAuth callback
--    Deletes the recruiter profile row (and empty org) that the auth trigger
--    created for a Google/OAuth applicant before applicant_profiles existed.
-- ----------------------------------------------------------------------------
create or replace function public.remove_spurious_recruiter_profile(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_org_id uuid;
    v_profiles int;
    v_internships int;
begin
    -- Only safe when the user actually is an applicant.
    if not exists (
        select 1 from public.applicant_profiles where id = p_user_id
    ) then
        return;
    end if;

    select organization_id into v_org_id
    from public.profiles
    where id = p_user_id;

    delete from public.profiles where id = p_user_id;

    if v_org_id is not null then
        select count(*) into v_profiles
        from public.profiles
        where organization_id = v_org_id;

        select count(*) into v_internships
        from public.internships
        where organization_id = v_org_id;

        if v_profiles = 0 and v_internships = 0 then
            delete from public.organisations where id = v_org_id;
        end if;
    end if;
end;
$$;

revoke all on function public.remove_spurious_recruiter_profile(uuid) from public;
grant execute on function public.remove_spurious_recruiter_profile(uuid) to authenticated;

-- ============================================================================
-- END OF 20260808_stop_recruiter_profiles_for_applicants.sql
-- ============================================================================
