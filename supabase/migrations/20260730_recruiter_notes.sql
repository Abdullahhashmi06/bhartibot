-- ============================================================================
-- InternIQ — Phase 4: recruiter_notes
-- Internal recruiter notes per application. Auto-timestamped, multi-note.
-- ============================================================================

create table if not exists public.recruiter_notes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  recruiter_id uuid not null references auth.users (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recruiter_notes_application_id_idx
  on public.recruiter_notes (application_id);

create index if not exists recruiter_notes_recruiter_id_idx
  on public.recruiter_notes (recruiter_id);

alter table public.recruiter_notes enable row level security;

-- Recruiters can manage notes for applications on their org's internships
create policy recruiter_notes_select_own_org
  on public.recruiter_notes
  for select
  to authenticated
  using (
    application_id in (
      select a.id
      from public.applications a
      join public.internships i on i.id = a.internship_id
      where i.organization_id in (
        select organization_id from public.profiles where id = auth.uid()
      )
    )
  );

create policy recruiter_notes_insert_own_org
  on public.recruiter_notes
  for insert
  to authenticated
  with check (
    recruiter_id = auth.uid()
    and application_id in (
      select a.id
      from public.applications a
      join public.internships i on i.id = a.internship_id
      where i.organization_id in (
        select organization_id from public.profiles where id = auth.uid()
      )
    )
  );

create policy recruiter_notes_update_own
  on public.recruiter_notes
  for update
  to authenticated
  using (recruiter_id = auth.uid())
  with check (recruiter_id = auth.uid());

create policy recruiter_notes_delete_own
  on public.recruiter_notes
  for delete
  to authenticated
  using (recruiter_id = auth.uid());
