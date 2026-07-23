-- ============================================================================
-- BhartiBot
-- Applications Migration (Day 6)
-- Created: 2026-07-23
--
-- Adds:
--   • applications table
--   • answers table
--   • Public read policies for published internships
--   • Missing recruiter policies (internships UPDATE, questions DELETE)
-- ============================================================================


-- ============================================================================
-- APPLICATIONS
-- ============================================================================

create table if not exists public.applications (

    id uuid primary key default gen_random_uuid(),

    internship_id uuid not null,

    applicant_name text not null,

    email text not null,

    phone text,

    university text,

    degree text,

    semester text,

    cgpa text,

    linkedin_url text,

    github_url text,

    portfolio_url text,

    cv_path text,

    status text not null default 'new',

    created_at timestamptz not null default now()

);



-- ============================================================================
-- ANSWERS
-- ============================================================================

create table if not exists public.answers (

    id uuid primary key default gen_random_uuid(),

    application_id uuid not null,

    question_id uuid not null,

    answer text not null,

    created_at timestamptz not null default now(),

    unique (application_id, question_id)

);



-- ============================================================================
-- FOREIGN KEYS
-- ============================================================================

alter table public.applications
add constraint applications_internship_id_fkey
foreign key (internship_id)
references public.internships(id)
on delete cascade;



alter table public.answers
add constraint answers_application_id_fkey
foreign key (application_id)
references public.applications(id)
on delete cascade;



alter table public.answers
add constraint answers_question_id_fkey
foreign key (question_id)
references public.questions(id)
on delete cascade;



-- ============================================================================
-- HELPER: published internship check
-- ============================================================================

create or replace function public.is_published_internship(

    internship_uuid uuid

)

returns boolean

language sql

stable

security definer

set search_path = public

as $$

select exists (

    select 1

    from public.internships

    where id = internship_uuid

      and status = 'published'

);

$$;



-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table public.applications enable row level security;

alter table public.answers enable row level security;



-- --------------------------------------------------------------------------
-- Internships: public read for published listings (apply page)
-- --------------------------------------------------------------------------

drop policy if exists internships_select_published on public.internships;

create policy internships_select_published

on public.internships

for select

to anon

using (status = 'published');



-- --------------------------------------------------------------------------
-- Requirements: public read for published internships
-- --------------------------------------------------------------------------

drop policy if exists requirements_select_published on public.requirements;

create policy requirements_select_published

on public.requirements

for select

to anon

using (

    public.is_published_internship(internship_id)

);



-- --------------------------------------------------------------------------
-- Questions: public read for published internships
-- --------------------------------------------------------------------------

drop policy if exists questions_select_published on public.questions;

create policy questions_select_published

on public.questions

for select

to anon

using (

    public.is_published_internship(internship_id)

);



-- --------------------------------------------------------------------------
-- Internships: recruiter UPDATE (publish / unpublish)
-- --------------------------------------------------------------------------

drop policy if exists internships_update_own_org on public.internships;

create policy internships_update_own_org

on public.internships

for update

to authenticated

using (

    organization_id in (

        select organization_id

        from public.profiles

        where id = auth.uid()

    )

)

with check (

    organization_id in (

        select organization_id

        from public.profiles

        where id = auth.uid()

    )

);



-- --------------------------------------------------------------------------
-- Questions: recruiter DELETE
-- --------------------------------------------------------------------------

drop policy if exists questions_delete_own_org on public.questions;

create policy questions_delete_own_org

on public.questions

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
-- Applications: anyone can apply to published internships
-- --------------------------------------------------------------------------

drop policy if exists applications_insert_published on public.applications;

create policy applications_insert_published

on public.applications

for insert

to anon, authenticated

with check (

    public.is_published_internship(internship_id)

);



drop policy if exists applications_select_own_org on public.applications;

create policy applications_select_own_org

on public.applications

for select

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
-- Answers: insert with a valid application; recruiters read via org
-- --------------------------------------------------------------------------

drop policy if exists answers_insert_with_application on public.answers;

create policy answers_insert_with_application

on public.answers

for insert

to anon, authenticated

with check (

    exists (

        select 1

        from public.applications a

        where a.id = application_id

          and public.is_published_internship(a.internship_id)

    )

);



drop policy if exists answers_select_own_org on public.answers;

create policy answers_select_own_org

on public.answers

for select

to authenticated

using (

    application_id in (

        select a.id

        from public.applications a

        join public.internships i on i.id = a.internship_id

        where i.organization_id in (

            select organization_id

            from public.profiles

            where id = auth.uid()

        )

    )

);



-- ============================================================================
-- INDEXES
-- ============================================================================

create index if not exists idx_applications_internship
on public.applications (internship_id);



create index if not exists idx_applications_status
on public.applications (status);



create index if not exists idx_answers_application
on public.answers (application_id);



-- ============================================================================
-- COMMENTS
-- ============================================================================

comment on table public.applications
is 'Student internship applications submitted via public apply links.';



comment on table public.answers
is 'Applicant answers to screening questions.';



comment on column public.applications.status
is 'Recruiter workflow status: new, under_review, shortlisted, rejected.';



comment on column public.applications.cv_path
is 'Storage path in cv-files bucket. Populated when CV upload is wired (Day 7).';
