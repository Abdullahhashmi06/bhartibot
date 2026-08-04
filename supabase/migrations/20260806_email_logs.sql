-- ─────────────────────────────────────────────────────────────────────────────
-- Email Logs — production-grade email deduplication + delivery tracking
--
-- Replaces the in-memory dedup in lib/notifications/logger.ts. Every
-- transactional email (shortlisted, rejected, interview invitation, ...) is
-- recorded here so duplicate sends are prevented across restarts, instances,
-- and retries.
--
-- Dedup rule: an email is skipped if a row exists with the same
-- (application_id, email_type) AND status = 'sent'. A partial unique index
-- enforces this at the database level, so even a concurrent double-send cannot
-- create two "sent" rows.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  -- FKs are nullable + SET NULL so the audit trail survives record deletion.
  application_id uuid references public.applications(id) on delete set null,
  applicant_id uuid references public.applicant_profiles(id) on delete set null,
  recruiter_id uuid references auth.users(id) on delete set null default auth.uid(),
  internship_id uuid references public.internships(id) on delete set null,
  -- Machine-readable email kind: 'shortlisted' | 'rejected' | 'interview_invitation' | ...
  email_type text not null,
  recipient_email text not null,
  subject text,
  -- 'sent' | 'failed' | 'skipped' ('skipped' = provider not configured)
  status text not null default 'sent'
    check (status in ('sent', 'failed', 'skipped')),
  provider text not null default 'smtp',
  provider_message_id text,
  sent_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

-- ── Indexes ─────────────────────────────────────────────────────────────────
-- Dedup backstop + lookup: a given (application_id, email_type) may only be
-- logged as "sent" once. Concurrent double-sends raise a unique violation
-- instead of silently creating duplicates, and the same index serves fast
-- dedup lookups (application_id, email_type, status='sent').
create unique index if not exists email_logs_uniq_application_type
  on public.email_logs (application_id, email_type)
  where status = 'sent';

create index if not exists email_logs_recipient_idx
  on public.email_logs (recipient_email);

create index if not exists email_logs_recruiter_idx
  on public.email_logs (recruiter_id);

create index if not exists email_logs_sent_at_idx
  on public.email_logs (sent_at desc);

-- ── Row Level Security ─────────────────────────────────────────────────────
alter table public.email_logs enable row level security;

-- Authenticated users may record email outcomes (recruiter actions, applicant
-- flows). recruiter_id defaults to auth.uid(), so a caller can only log rows
-- that name themselves as the actor.
drop policy if exists email_logs_insert_authenticated on public.email_logs;
create policy email_logs_insert_authenticated
  on public.email_logs
  for insert
  to authenticated
  with check (recruiter_id = auth.uid());

-- Recruiters can read logs they created (recruiter_id defaults to auth.uid()).
drop policy if exists email_logs_select_own on public.email_logs;
create policy email_logs_select_own
  on public.email_logs
  for select
  to authenticated
  using (recruiter_id = auth.uid() or applicant_id = auth.uid());

-- No update/delete policies: logs are append-only by design.
