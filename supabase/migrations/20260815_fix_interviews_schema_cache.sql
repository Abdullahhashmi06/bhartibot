-- ============================================================================
-- InternIQ — Fix: "Could not find the table 'public.interviews' in the schema cache"
-- Created: 2026-08-15
--
-- When scheduling an interview, the recruiter app showed:
--   Failed to schedule: Could not find the table 'public.interviews' in the schema cache
--
-- Root cause: the interviews table exists in migration 20260731_interviews_and_shortlist.sql,
-- but on some environments it was never applied (or PostgREST's schema cache went stale
-- after the table was created). PostgREST caches the database schema; a table created by a
-- migration that ran outside the Supabase dashboard won't be visible to the API until the
-- cache is reloaded.
--
-- This migration is IDEMPOTENT:
--   • creates the table only if it does not already exist (exact schema from 20260731)
--   • re-applies the recruiter RLS policy only if missing
--   • reloads the PostgREST schema cache so the API sees the table immediately
-- Safe to run on any environment, whether or not 20260731 was applied.
-- ============================================================================

-- 1. Ensure the table exists (exact schema from 20260731_interviews_and_shortlist.sql)
create table if not exists public.interviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  recruiter_id uuid not null references auth.users(id) on delete cascade,
  interview_date text,
  interview_time text,
  interview_type text default 'online',
  interviewer_name text,
  meeting_link text,
  notes text,
  technical_rating int check (technical_rating >= 1 and technical_rating <= 5),
  communication_rating int check (communication_rating >= 1 and communication_rating <= 5),
  culture_fit int check (culture_fit >= 1 and culture_fit <= 5),
  overall_recommendation text,
  overall_decision text,
  status text default 'not_scheduled' check (status in ('not_scheduled','scheduled','completed','cancelled','offer_sent','rejected')),
  feedback_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Ensure RLS + recruiter policy are in place
alter table public.interviews enable row level security;

drop policy if exists interviews_recruiter on public.interviews;
create policy interviews_recruiter on public.interviews
  for all to authenticated
  using (recruiter_id = auth.uid())
  with check (recruiter_id = auth.uid());

-- 3. Reload the PostgREST schema cache so the table is visible to the API
notify pgrst, 'reload schema';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
