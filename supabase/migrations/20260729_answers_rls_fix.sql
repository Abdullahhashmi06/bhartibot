-- ============================================================================
-- BhartiBot
-- Applications Answers RLS Fix
-- Created: 2026-07-29
-- ============================================================================

-- Create a helper function that bypasses RLS on applications to check validity
create or replace function public.is_valid_application_for_answer(
    app_uuid uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
select exists (
    select 1
    from public.applications a
    where a.id = app_uuid
      and public.is_published_internship(a.internship_id)
);
$$;

-- Replace the broken answers insert policy
drop policy if exists answers_insert_with_application on public.answers;

create policy answers_insert_with_application
on public.answers
for insert
to anon, authenticated
with check (
    public.is_valid_application_for_answer(application_id)
);
