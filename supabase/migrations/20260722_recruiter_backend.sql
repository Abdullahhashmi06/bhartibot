-- ============================================================================
-- BhartiBot
-- Recruiter Backend Migration
-- Created: 2026-07-22
--
-- Description:
-- Initial recruiter backend schema including:
--   • Organisations
--   • Recruiter Profiles
--   • Internships
--   • Requirements
--   • Interview Questions
--
-- Author:
-- Team BhartiBot
-- ============================================================================



-- ============================================================================
-- EXTENSIONS
-- ============================================================================

create extension if not exists pgcrypto;



-- ============================================================================
-- ORGANISATIONS
-- ============================================================================

create table if not exists public.organisations (

    id uuid primary key default gen_random_uuid(),

    name text not null,

    created_at timestamptz not null default now()

);



-- ============================================================================
-- PROFILES
-- ============================================================================

create table if not exists public.profiles (

    id uuid primary key,

    organization_id uuid not null,

    name text not null default '',

    email text not null default '',

    created_at timestamptz not null default now()

);



-- ============================================================================
-- INTERNSHIPS
-- ============================================================================

create table if not exists public.internships (

    id uuid primary key default gen_random_uuid(),

    organization_id uuid not null,

    title text not null,

    field text not null,

    description text not null,

    location text not null,

    work_mode text not null,

    duration text not null,

    status text not null default 'draft',

    public_slug text unique,

    created_at timestamptz not null default now()

);



-- ============================================================================
-- REQUIREMENTS
-- ============================================================================

create table if not exists public.requirements (

    id uuid primary key default gen_random_uuid(),

    internship_id uuid not null,

    requirement text not null,

    type text not null,

    created_at timestamptz not null default now()

);



-- ============================================================================
-- QUESTIONS
-- ============================================================================

create table if not exists public.questions (

    id uuid primary key default gen_random_uuid(),

    internship_id uuid not null,

    question text not null,

    type text not null,

    created_at timestamptz not null default now()

);



-- ============================================================================
-- FOREIGN KEYS
-- ============================================================================

alter table public.profiles
add constraint profiles_organization_id_fkey
foreign key (organization_id)
references public.organisations(id)
on delete cascade;



alter table public.internships
add constraint internships_organization_id_fkey
foreign key (organization_id)
references public.organisations(id)
on delete cascade;



alter table public.requirements
add constraint requirements_internship_id_fkey
foreign key (internship_id)
references public.internships(id)
on delete cascade;



alter table public.questions
add constraint questions_internship_id_fkey
foreign key (internship_id)
references public.internships(id)
on delete cascade;



-- ============================================================================
-- END OF PART 1
-- ============================================================================

-- ============================================================================
-- PART 2
-- TRIGGERS & HELPER FUNCTIONS
-- ============================================================================



-- ============================================================================
-- HANDLE NEW USER
--
-- Automatically creates:
--   • Organisation
--   • Recruiter Profile
--
-- whenever a new auth.users account is created.
-- ============================================================================

create or replace function public.handle_new_user()

returns trigger

language plpgsql

security definer

set search_path = public

as $$

declare
    new_org_id uuid;

begin

    --------------------------------------------------------------------------
    -- Create organisation
    --------------------------------------------------------------------------

    insert into public.organisations (name)

    values (

        coalesce(

            new.raw_user_meta_data ->> 'organization_name',

            'Unnamed Organization'

        )

    )

    returning id

    into new_org_id;



    --------------------------------------------------------------------------
    -- Create recruiter profile
    --------------------------------------------------------------------------

    insert into public.profiles (

        id,

        organization_id,

        name,

        email

    )

    values (

        new.id,

        new_org_id,

        coalesce(

            new.raw_user_meta_data ->> 'full_name',

            ''

        ),

        new.email

    );



    return new;

end;

$$;



-- ============================================================================
-- AUTH TRIGGER
-- ============================================================================

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created

after insert

on auth.users

for each row

execute function public.handle_new_user();



-- ============================================================================
-- HELPER FUNCTION
--
-- Used by RLS policies on requirements.
-- Checks whether the logged-in recruiter owns
-- the internship they're trying to access.
-- ============================================================================

create or replace function public.can_access_internship(

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

    from public.internships i

    join public.profiles p

        on p.organization_id = i.organization_id

    where

        i.id = internship_uuid

        and p.id = auth.uid()

);

$$;



-- ============================================================================
-- END OF PART 2
-- ============================================================================

-- ============================================================================
-- PART 3
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================



-- ============================================================================
-- ENABLE RLS
-- ============================================================================

alter table public.organisations enable row level security;

alter table public.profiles enable row level security;

alter table public.internships enable row level security;

alter table public.requirements enable row level security;

alter table public.questions enable row level security;



-- ============================================================================
-- ORGANISATIONS
-- ============================================================================

drop policy if exists org_select_own on public.organisations;

create policy org_select_own

on public.organisations

for select

to authenticated

using (

    id in (

        select organization_id

        from public.profiles

        where id = auth.uid()

    )

);



-- ============================================================================
-- PROFILES
-- ============================================================================

drop policy if exists profiles_select_own on public.profiles;

create policy profiles_select_own

on public.profiles

for select

to authenticated

using (

    auth.uid() = id

);



-- ============================================================================
-- INTERNSHIPS
-- ============================================================================

drop policy if exists internships_select_own_org on public.internships;

create policy internships_select_own_org

on public.internships

for select

to authenticated

using (

    organization_id in (

        select organization_id

        from public.profiles

        where id = auth.uid()

    )

);



drop policy if exists internships_insert_own_org on public.internships;

create policy internships_insert_own_org

on public.internships

for insert

to authenticated

with check (

    organization_id in (

        select organization_id

        from public.profiles

        where id = auth.uid()

    )

);



-- ============================================================================
-- REQUIREMENTS
-- ============================================================================

drop policy if exists requirements_select_own_org on public.requirements;

create policy requirements_select_own_org

on public.requirements

for select

to authenticated

using (

    public.can_access_internship(internship_id)

);



drop policy if exists requirements_insert_own_org on public.requirements;

create policy requirements_insert_own_org

on public.requirements

for insert

to authenticated

with check (

    public.can_access_internship(internship_id)

);



-- ============================================================================
-- QUESTIONS
-- ============================================================================

drop policy if exists questions_select_own_org on public.questions;

create policy questions_select_own_org

on public.questions

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



drop policy if exists questions_insert_own_org on public.questions;

create policy questions_insert_own_org

on public.questions

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



-- ============================================================================
-- END OF PART 3
-- ============================================================================

-- ============================================================================
-- PART 4
-- INDEXES, COMMENTS & VERIFICATION
-- ============================================================================



-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

create index if not exists idx_profiles_organization
on public.profiles (organization_id);



create index if not exists idx_internships_organization
on public.internships (organization_id);



create index if not exists idx_internships_slug
on public.internships (public_slug);



create index if not exists idx_requirements_internship
on public.requirements (internship_id);



create index if not exists idx_questions_internship
on public.questions (internship_id);



-- ============================================================================
-- COLUMN COMMENTS
-- ============================================================================

comment on table public.organisations
is 'Recruiter organizations using BhartiBot.';



comment on table public.profiles
is 'Recruiter profiles linked to Supabase Auth users.';



comment on table public.internships
is 'Internships created by recruiters.';



comment on table public.requirements
is 'Required and preferred skills for internships.';



comment on table public.questions
is 'Interview or screening questions for internships.';



-- ============================================================================
-- POST-MIGRATION VERIFICATION
--
-- Run these manually after applying the migration.
-- ============================================================================

-- Verify tables
-- select * from organisations;
-- select * from profiles;
-- select * from internships;
-- select * from requirements;
-- select * from questions;

-- Verify trigger
-- select tgname
-- from pg_trigger
-- where tgname='on_auth_user_created';

-- Verify helper function
-- select proname
-- from pg_proc
-- where proname='can_access_internship';

-- Verify RLS policies
-- select tablename, policyname
-- from pg_policies
-- order by tablename;



-- ============================================================================
-- END OF MIGRATION
-- ============================================================================