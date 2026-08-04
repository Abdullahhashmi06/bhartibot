-- ============================================================================
-- InternIQ — Production Security Hardening (2026-08-09)
--
-- Implements the production-blocker fixes from the final security
-- certification. Idempotent: safe to run multiple times.
--
--   C1  Storage: remove ANON read on all resume buckets; SELECT is now
--       owner-scoped or recruiter-org-scoped (via can_read_cv_path()).
--   C2  Storage: INSERT restricted to known folders (public-apply /
--       applicant-resumes/<uid>); DELETE scoped to the object owner.
--   C3  shortlisted_candidates view: grant revoked (view is unused by app
--       code; the page queries applications directly under org-scoped RLS).
--   C4  share_tokens: ANON read-all policy dropped (token access goes
--       through the service-role admin client only).
--   C5  Privilege escalation closed:
--         • applicant_profiles.role is now immutable via trigger
--         • ensure_recruiter_profile() requires auth.uid() = p_user_id AND
--           rejects users who have an applicant profile
--         • remove_spurious_recruiter_profile() requires auth.uid() = p_user_id
-- ============================================================================


-- ============================================================================
-- 0) HELPER: can_read_cv_path()
--    True when the current user is a recruiter whose organisation owns an
--    application whose cv_path matches, i.e. the CV belongs to one of the
--    applications in their org. Used by the storage SELECT policy so
--    recruiters can still create signed URLs without exposing the whole bucket.
-- ============================================================================
create or replace function public.can_read_cv_path(p_path text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.applications a
    join public.internships i on i.id = a.internship_id
    where a.cv_path = p_path
      and i.organization_id in (
        select organization_id from public.profiles where id = auth.uid()
      )
  );
$$;

-- ============================================================================
-- C1 + C2 — STORAGE POLICIES (cv-files, cvs, avatars)
-- ============================================================================

-- --- SELECT: no anon access; owner OR recruiter-org via helper ---
drop policy if exists "cv_files_read_public" on storage.objects;
create policy "cv_files_read_authorized"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'cv-files'
    and (owner = auth.uid() or public.can_read_cv_path(name))
  );

drop policy if exists "cvs_read_public" on storage.objects;
create policy "cvs_read_authorized"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'cvs'
    and (owner = auth.uid() or public.can_read_cv_path(name))
  );

drop policy if exists "avatars_read_public" on storage.objects;
create policy "avatars_read_authorized"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'avatars');

-- --- INSERT: anonymous public-apply uploads only under public-apply/ ---
drop policy if exists "cv_files_insert_all" on storage.objects;
create policy "cv_files_insert_public_apply"
  on storage.objects
  for insert
  to anon, authenticated
  with check (
    bucket_id = 'cv-files'
    and (storage.foldername(name))[1] = 'public-apply'
  );

-- Applicant portal uploads: scoped to the applicant's own folder.
drop policy if exists "cv_files_insert_applicant" on storage.objects;
create policy "cv_files_insert_applicant"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'cv-files'
    and (storage.foldername(name))[1] = 'applicant-resumes'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

drop policy if exists "cvs_insert_all" on storage.objects;
create policy "cvs_insert_public_apply"
  on storage.objects
  for insert
  to anon, authenticated
  with check (
    bucket_id = 'cvs'
    and (storage.foldername(name))[1] = 'public-apply'
  );

drop policy if exists "avatars_insert_auth" on storage.objects;
create policy "avatars_insert_auth"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'avatars');

drop policy if exists "avatars_update_auth" on storage.objects;
create policy "avatars_update_auth"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'avatars')
  with check (bucket_id = 'avatars');

-- --- DELETE: object owner only ---
drop policy if exists "cv_files_delete_auth" on storage.objects;
create policy "cv_files_delete_owner"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'cv-files' and owner = auth.uid());

drop policy if exists "cvs_delete_auth" on storage.objects;
create policy "cvs_delete_owner"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'cvs' and owner = auth.uid());

drop policy if exists "avatars_delete_auth" on storage.objects;
create policy "avatars_delete_owner"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'avatars' and owner = auth.uid());


-- ============================================================================
-- C3 — shortlisted_candidates VIEW
--    The view is not referenced by any app code (the shortlisted page queries
--    public.applications directly under org-scoped RLS). Revoke the grant so
--    no authenticated user can dump cross-org shortlist data through it.
--
--    Fully idempotent: this block is a no-op on databases where the view was
--    never created (e.g. environments that skipped the earlier interviews /
--    shortlist migration). PostgreSQL has no `REVOKE ... IF EXISTS`, so the
--    revoke + comment are guarded by a pg_catalog existence check.
-- ============================================================================
do $$
begin
  if exists (
    select 1
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'shortlisted_candidates'
      and c.relkind = 'v'  -- plain view only (COMMENT ON VIEW fails on matviews)
  ) then
    revoke all on public.shortlisted_candidates from anon, authenticated;

    comment on view public.shortlisted_candidates is
      'LEGACY — unused by the app. Access revoked; use applications + org RLS instead.';
  end if;
end
$$;


-- ============================================================================
-- C4 — share_tokens ANON READ-ALL POLICY
--    Token-based access (app/share/review/[token]) now runs through the
--    service-role admin client, so no anonymous table-level read is needed.
-- ============================================================================
drop policy if exists "Anyone can read share tokens by token" on public.share_tokens;


-- ============================================================================
-- C5 — CLOSE APPLICANT → RECRUITER ESCALATION
-- ============================================================================

-- --- 5a. applicant_profiles.role is immutable (portal never changes it) ---
create or replace function public.protect_applicant_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    raise exception 'applicant role is immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists applicant_profiles_protect_role on public.applicant_profiles;
create trigger applicant_profiles_protect_role
  before update on public.applicant_profiles
  for each row
  execute function public.protect_applicant_role();

-- --- 5b. ensure_recruiter_profile: caller must provision THEMSELVES, and
--         must not be an applicant (prevents applicant self-escalation) ---
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
begin
    if p_user_id is distinct from auth.uid() then
        raise exception 'not allowed';
    end if;

    if exists (
        select 1 from public.applicant_profiles where id = p_user_id
    ) then
        raise exception 'applicant accounts cannot be provisioned as recruiters';
    end if;

    select organization_id into v_org_id
    from public.profiles
    where id = p_user_id;

    if v_org_id is not null then
        return v_org_id;
    end if;

    insert into public.organisations (name)
    values (
        coalesce(nullif(trim(p_organization_name), ''), 'Unnamed Organization')
    )
    returning id into v_org_id;

    insert into public.profiles (id, organization_id, name, email)
    values (p_user_id, v_org_id, coalesce(p_full_name, ''), p_email);

    return v_org_id;
end;
$$;

revoke all on function public.ensure_recruiter_profile(uuid, text, text, text) from public;
grant execute on function public.ensure_recruiter_profile(uuid, text, text, text)
  to authenticated;
grant execute on function public.ensure_recruiter_profile(uuid, text, text, text)
  to service_role;

-- --- 5c. remove_spurious_recruiter_profile: only the user themselves ---
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
    if p_user_id is distinct from auth.uid() then
        raise exception 'not allowed';
    end if;

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
-- END OF 20260809_production_security_hardening.sql
-- ============================================================================
