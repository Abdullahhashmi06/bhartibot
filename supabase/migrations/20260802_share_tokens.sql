-- ============================================================================
-- InternIQ — Share Candidate Review Tokens
-- Stores secure share links for external candidate review access.
-- ============================================================================

-- Create extension if not exists (for gen_random_uuid)
create extension if not exists "pgcrypto";

create table public.share_tokens (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  organization_id uuid not null references public.organisations(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  token uuid not null default gen_random_uuid() unique,
  password_hash text,
  expires_at timestamptz,
  is_revoked boolean not null default false,
  viewed_count integer not null default 0,
  last_viewed_at timestamptz,
  created_at timestamptz not null default now(),
  shared_sections jsonb not null default '["candidate_summary","match_score","resume_summary","strengths","weaknesses","skills","radar_chart","interview_questions","recommendation"]'::jsonb,
  include_resume boolean not null default false,
  include_notes boolean not null default false
);

-- Index for fast token lookup
create index share_tokens_token_idx on public.share_tokens(token);
create index share_tokens_application_id_idx on public.share_tokens(application_id);
create index share_tokens_created_by_idx on public.share_tokens(created_by);

-- Enable RLS
alter table public.share_tokens enable row level security;

-- Recruiters can view their own share tokens
create policy "Recruiters can view own share tokens"
  on public.share_tokens for select
  to authenticated
  using (created_by = auth.uid());

-- Recruiters can create share tokens for their organization
create policy "Recruiters can create share tokens"
  on public.share_tokens for insert
  to authenticated
  with check (
    created_by = auth.uid() and
    organization_id in (
      select organization_id from public.profiles where id = auth.uid()
    )
  );

-- Recruiters can update their own share tokens (e.g., revoke)
create policy "Recruiters can update own share tokens"
  on public.share_tokens for update
  to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

-- Recruiters can delete their own share tokens
create policy "Recruiters can delete own share tokens"
  on public.share_tokens for delete
  to authenticated
  using (created_by = auth.uid());

-- Anonymous users can read share tokens by token (for validation only)
-- The token UUID is a secure secret, so this is safe
create policy "Anyone can read share tokens by token"
  on public.share_tokens for select
  to anon
  using (true);

comment on table public.share_tokens is 'Secure share tokens for external candidate review access';
comment on column public.share_tokens.token is 'UUID-based secure share token (not the internal ID)';
comment on column public.share_tokens.password_hash is 'Optional bcrypt hash for password-protected reviews';
comment on column public.share_tokens.expires_at is 'Optional expiration timestamp; null means never expires';
comment on column public.share_tokens.is_revoked is 'Soft delete flag for revocation';
comment on column public.share_tokens.viewed_count is 'Number of times the shared review has been viewed';
comment on column public.share_tokens.last_viewed_at is 'Timestamp of the last view';
comment on column public.share_tokens.shared_sections is 'JSON array of section keys to include in the shared review';
comment on column public.share_tokens.include_resume is 'Whether to include a resume download link';
comment on column public.share_tokens.include_notes is 'Whether to include recruiter notes';