-- ============================================================================
-- InternIQ — Step 4: candidate_ai_analysis
-- Stores parsed resume JSON and Gemini scoring output per application.
-- ============================================================================

create table if not exists public.candidate_ai_analysis (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications (id) on delete cascade,
  parsed_resume jsonb not null default '{}'::jsonb,
  match_score integer not null check (match_score >= 0 and match_score <= 100),
  strengths text[] not null default '{}',
  weaknesses text[] not null default '{}',
  missing_skills text[] not null default '{}',
  recommendation text not null,
  reasoning text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists candidate_ai_analysis_application_id_idx
  on public.candidate_ai_analysis (application_id);

create table if not exists public.candidate_ai_analysis_failures (
  application_id uuid primary key references public.applications (id) on delete cascade,
  error_type text not null,
  message text not null,
  retryable boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.candidate_ai_analysis enable row level security;
alter table public.candidate_ai_analysis_failures enable row level security;

-- Recruiters: read/write analysis for applications on their org's internships
create policy candidate_ai_analysis_select_own_org
  on public.candidate_ai_analysis
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

create policy candidate_ai_analysis_insert_own_org
  on public.candidate_ai_analysis
  for insert
  to authenticated
  with check (
    application_id in (
      select a.id
      from public.applications a
      join public.internships i on i.id = a.internship_id
      where i.organization_id in (
        select organization_id from public.profiles where id = auth.uid()
      )
    )
  );

create policy candidate_ai_analysis_update_own_org
  on public.candidate_ai_analysis
  for update
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
  )
  with check (
    application_id in (
      select a.id
      from public.applications a
      join public.internships i on i.id = a.internship_id
      where i.organization_id in (
        select organization_id from public.profiles where id = auth.uid()
      )
    )
  );

create policy candidate_ai_analysis_delete_own_org
  on public.candidate_ai_analysis
  for delete
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

create policy candidate_ai_analysis_failures_select_own_org
  on public.candidate_ai_analysis_failures
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

create policy candidate_ai_analysis_failures_insert_own_org
  on public.candidate_ai_analysis_failures
  for insert
  to authenticated
  with check (
    application_id in (
      select a.id
      from public.applications a
      join public.internships i on i.id = a.internship_id
      where i.organization_id in (
        select organization_id from public.profiles where id = auth.uid()
      )
    )
  );

create policy candidate_ai_analysis_failures_update_own_org
  on public.candidate_ai_analysis_failures
  for update
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
  )
  with check (
    application_id in (
      select a.id
      from public.applications a
      join public.internships i on i.id = a.internship_id
      where i.organization_id in (
        select organization_id from public.profiles where id = auth.uid()
      )
    )
  );

create policy candidate_ai_analysis_failures_delete_own_org
  on public.candidate_ai_analysis_failures
  for delete
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
