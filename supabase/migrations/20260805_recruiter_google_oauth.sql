-- ============================================================================
-- 20260805_recruiter_google_oauth.sql
--
-- Recruiter Google OAuth support.
--
-- The `handle_new_user` trigger provisions an organisation + recruiter profile
-- on *email* signup. Google OAuth signups also fire that trigger, but the
-- callback path needs an explicit, idempotent way to guarantee the recruiter
-- profile exists (a profile row may be missing if the user signed up before the
-- trigger existed, or if the trigger was not applied). Direct INSERTs from the
-- callback would fail because RLS on `organisations`/`profiles` only permits
-- SELECT. This migration adds a security-definer RPC (bypassing RLS, same
-- technique as `handle_new_user`) that provisions both rows exactly once.
-- ============================================================================

create or replace function public.ensure_recruiter_profile(
    p_user_id uuid,
    p_email text,
    p_full_name text default '',
    p_organization_name text default 'Unnamed Organization'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_org_id uuid;
    v_existing uuid;
begin
    -- Already provisioned? Return the existing org id (idempotent).
    select organization_id into v_org_id
    from public.profiles
    where id = p_user_id;

    if v_org_id is not null then
        return v_org_id;
    end if;

    -- Create organisation.
    insert into public.organisations (name)
    values (
        coalesce(nullif(trim(p_organization_name), ''), 'Unnamed Organization')
    )
    returning id into v_org_id;

    -- Create recruiter profile.
    insert into public.profiles (id, organization_id, name, email)
    values (
        p_user_id,
        v_org_id,
        coalesce(p_full_name, ''),
        p_email
    );

    return v_org_id;
end;
$$;

-- Allow the authenticated user (via the OAuth callback / server client) to
-- execute the RPC. Security definer makes the underlying inserts bypass RLS.
grant execute on function public.ensure_recruiter_profile(uuid, text, text, text)
to authenticated;

grant execute on function public.ensure_recruiter_profile(uuid, text, text, text)
to service_role;

-- Keep the auth-user trigger in sync so email signups continue to work and any
-- environment that applied migrations out of order still provisions profiles.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert
on auth.users
for each row
execute function public.handle_new_user();
