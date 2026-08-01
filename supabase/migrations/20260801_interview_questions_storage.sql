-- ============================================================================
-- InternIQ — Interview Questions Storage
-- Adds interview_questions column to candidate_ai_analysis table.
-- NOT a new table — extends the existing per-application AI analysis row.
-- ============================================================================

alter table public.candidate_ai_analysis
add column if not exists interview_questions jsonb default null;

comment on column public.candidate_ai_analysis.interview_questions
is 'AI-generated interview questions stored as JSON array. Null until generated.';