-- ============================================================================
-- InternIQ — Deadline Expiry Support (2026-08-14)
--
-- Adds:
--   1. get_expired_applicant_feed() RPC — returns published internships whose
--      deadline has passed but is still within the last 15 days, so applicants
--      can browse them under a separate "Deadline Passed" filter (they remain
--      visible for 15 days after expiry, then disappear from the applicant
--      portal entirely). Recruiters always keep full access.
--   2. A BEFORE INSERT trigger on applications that blocks new applications
--      once the internship deadline has passed (defense-in-depth — the UI also
--      hides the apply form). Existing applications are never touched.
--
-- Idempotent: safe to run on databases with or without prior deadline support.
-- ============================================================================


-- ============================================================================
-- 1) EXPIRED APPLICANT FEED RPC
--    Same shape as get_applicant_feed() but for the 15-day expiry window.
-- ============================================================================

create or replace function public.get_expired_applicant_feed()
returns table (
  id uuid,
  organization_id uuid,
  title text,
  field text,
  description text,
  location text,
  work_mode text,
  duration text,
  stipend text,
  internship_type text,
  deadline timestamptz,
  status text,
  public_slug text,
  company_name text,
  required_skills text[],
  preferred_skills text[],
  applicant_count bigint,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    i.id,
    i.organization_id,
    i.title,
    i.field,
    i.description,
    i.location,
    i.work_mode,
    i.duration,
    i.stipend,
    i.internship_type,
    i.deadline,
    i.status,
    i.public_slug,
    coalesce(o.name, '') as company_name,
    coalesce(
      array_agg(r.requirement) filter (where r.type = 'required'),
      '{}'::text[]
    ) as required_skills,
    coalesce(
      array_agg(r.requirement) filter (where r.type = 'preferred'),
      '{}'::text[]
    ) as preferred_skills,
    (
      select count(*)::bigint
      from public.applications a
      where a.internship_id = i.id
    ) as applicant_count,
    i.created_at
  from public.internships i
  left join public.organisations o on o.id = i.organization_id
  left join public.requirements r on r.internship_id = i.id
  where i.status = 'published'
    and i.deadline is not null
    and i.deadline <= now()
    and i.deadline > now() - interval '15 days'
  group by i.id, o.name
  order by i.deadline desc;
$$;

revoke all on function public.get_expired_applicant_feed() from public;
grant execute on function public.get_expired_applicant_feed() to anon, authenticated;


-- ============================================================================
-- 2) APPLICATION DEADLINE GUARD TRIGGER
--    Blocks new applications once the internship deadline has passed.
--    Null deadlines (no deadline set) are always allowed.
-- ============================================================================

create or replace function public.prevent_application_after_deadline()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deadline timestamptz;
begin
  select i.deadline into v_deadline
  from public.internships i
  where i.id = new.internship_id;

  if v_deadline is not null and v_deadline <= now() then
    raise exception 'Applications for this internship are closed — the application deadline has passed.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_application_after_deadline on public.applications;

create trigger trg_prevent_application_after_deadline
  before insert on public.applications
  for each row execute function public.prevent_application_after_deadline();

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
