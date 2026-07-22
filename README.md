# BhartiBot

AI-assisted internship application & screening platform. Recruiters define
requirements, applicants submit CVs through a public link, and AI maps
evidence against those requirements. Recruiters make the final call.

**Day 4 status (Developer A):** Internship detail page shows description,
requirements, and a screening-questions panel (Text / Yes-No) with
add / view / delete. Publishing + public link land Day 5.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Supabase Auth + Postgres via `@supabase/ssr`

## Getting started

**Requirements:** Node.js 18.18+ (or 20+) and npm.

```bash
git clone <repo-url>
cd bhartibot
cp .env.local.example .env.local   # fill in the two values from Developer B
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without a real
`.env.local`, the app still runs but signup/login calls will fail — see
[Environment variables](#environment-variables) below.

## Routes

| Route                          | Purpose                                                  |
|----------------------------------|------------------------------------------------------------|
| `/`                               | Landing page                                                |
| `/login`                          | Recruiter login — wired to Supabase Auth                    |
| `/signup`                         | Recruiter signup — wired to Supabase Auth                    |
| `/auth/callback`                  | Exchanges the email-confirmation code for a session          |
| `/dashboard`                      | **Protected.** Empty-state dashboard + logout                |
| `/dashboard/create-internship`    | **Protected.** Placeholder — real form lands Day 3            |
| `/internships/[slug]`             | **Protected.** Internship detail + screening questions (Day 4) |

`/dashboard` and everything under it require a session. Visiting them
while logged out redirects to `/login?next=<page>`; visiting `/login` or
`/signup` while already logged in redirects to `/dashboard`. This is
enforced in `middleware.ts` on every request, not just in the UI.

## Project structure

```
app/
  layout.tsx                     root layout (fonts, metadata)
  globals.css                     Tailwind base + design tokens
  page.tsx                        landing page
  login/page.tsx                   Supabase signInWithPassword
  signup/page.tsx                  Supabase signUp (+ org/name metadata)
  auth/callback/route.ts            email-confirmation code exchange
  dashboard/page.tsx                protected, reads session server-side
  dashboard/create-internship/page.tsx   placeholder — real form Day 3
  internships/[slug]/page.tsx       detail + screening questions (Day 4)
components/
  layout/Navbar.tsx                top nav, active-link + auth-aware
  layout/Shell.tsx                  shared page wrapper (nav + footer)
  auth/LogoutButton.tsx              client-side sign-out
  internships/RequirementList.tsx     required/preferred inputs (create form)
  internships/ScreeningQuestions.tsx  add / view / delete questions (Day 4)
  ui/Button.tsx                       button + link-button variants
  ui/Tag.tsx                           status/requirement pill
  ui/FormNotice.tsx                     inline error/info banner for forms
lib/
  queries/internships.ts             create / list / detail internship helpers
  queries/questions.ts               get / create / delete screening questions
  supabase/client.ts                Supabase client for Client Components
  supabase/server.ts                 Supabase client for Server Components
middleware.ts                        session refresh + route protection
```

## Environment variables

Copy `.env.local.example` to `.env.local` (already git-ignored) and fill in
the two values Developer B gives you from the Supabase dashboard
(Project Settings → API):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Both are public and safe in the browser. The `SUPABASE_SERVICE_ROLE_KEY`
and any AI API key must **only** ever be used in server-side code (route
handlers / server actions), never in a client component, never committed.

## Handoff note for Developer B (auth → database)

Signup calls `supabase.auth.signUp()` with this metadata on the user:

```json
{ "full_name": "Abdullah Khan", "organization_name": "ABC Technologies" }
```

For the `organizations` + `profiles` rows to exist, your Day 2 needs a
Postgres trigger on `auth.users` insert that reads
`raw_user_meta_data->>'organization_name'` and `->>'full_name'`, creates
(or looks up) the organization, and inserts the matching profile row with
that `organization_id`. Flag it if you need the metadata shaped differently
— easy to adjust before you build the trigger.

## Required SQL — questions table policies (Day 4)

The internship detail page inserts/deletes rows in `questions`. If your
Supabase project only has earlier policies, those calls will fail with a
Row Level Security error. Developer B should ensure policies like these
exist (run once in the Supabase SQL Editor if missing):

```sql
create policy "questions_select_own_org" on questions for select using (
  internship_id in (
    select id from internships where organization_id in (
      select organization_id from profiles where id = auth.uid()
    )
  )
);

create policy "questions_insert_own_org" on questions for insert with check (
  internship_id in (
    select id from internships where organization_id in (
      select organization_id from profiles where id = auth.uid()
    )
  )
);

create policy "questions_delete_own_org" on questions for delete using (
  internship_id in (
    select id from internships where organization_id in (
      select organization_id from profiles where id = auth.uid()
    )
  )
);
```

## Testing the Day 4 flow locally (Developer A)

1. Log in and open an internship from `/dashboard`.
2. Confirm the detail page shows description + required/preferred tags.
3. Add a Text question and a Yes/No question.
4. Confirm both appear in the list with the correct type tags.
5. Delete one question and confirm it disappears.
6. Refresh the page — remaining questions should still be there.
7. In Supabase → Table Editor, confirm `questions` rows match.

## Required SQL — requirements table policies (Day 3)

The app now inserts rows into `requirements` when an internship is created.
If your Supabase project only has the Day 2 policies, requirement inserts
will fail with a Row Level Security error. Run this once in the Supabase
SQL Editor:

```sql
create policy "requirements_select_own_org" on requirements for select using (
  internship_id in (
    select id from internships where organization_id in (
      select organization_id from profiles where id = auth.uid()
    )
  )
);

create policy "requirements_insert_own_org" on requirements for insert with check (
  internship_id in (
    select id from internships where organization_id in (
      select organization_id from profiles where id = auth.uid()
    )
  )
);
```

## Testing the Day 3 flow locally

1. Log in with a recruiter account (Day 2 must already work).
2. Go to `/dashboard/create-internship`.
3. Fill in title, location, duration; add a couple of required and
   preferred requirements; submit.
4. You should land back on `/dashboard` and see the internship listed.
5. Click it — the detail page should show the description and both
   requirement columns.
6. In Supabase → Table Editor, confirm rows exist in `internships` and
   `requirements` with the correct `organization_id` / `internship_id`.
7. Log in as a second recruiter (different organization) and confirm you
   only ever see your own organization's internships — never the other's.

## Testing the Day 2 flow locally

1. Set real Supabase values in `.env.local`.
2. `npm run dev`, go to `/signup`, create a recruiter account.
3. If email confirmation is on in your Supabase project, confirm via the
   emailed link (redirects through `/auth/callback`), then `/login`.
4. If email confirmation is off, signup logs you in immediately.
5. Confirm `/dashboard` loads with your name/org and "No internships yet."
6. Log out, confirm you're bounced to `/login`.
7. Try visiting `/dashboard` directly while logged out — confirm the
   redirect to `/login?next=/dashboard`.

## Branching

- `main` — stable, integrated code only
- Feature branches, e.g. `feature/auth-ui`, `feature/internship-form`
- Open a PR before merging into `main`
- Pull latest before starting new work
- Communicate before editing shared files (`app/layout.tsx`,
  `components/layout/*`, `tailwind.config.ts`)

## Status

- [x] Day 1 — application skeleton, placeholder routes, shared layout
- [x] Day 2 — Supabase Auth wired to `/login`/`/signup`/logout, `/dashboard` protected via middleware
- [x] Day 3 — Create Internship form saves to Supabase, dashboard lists real internships
- [x] Day 4 (Dev A) — Internship detail + screening questions UI (add / view / delete, Text & Yes-No)
- [ ] Days 5–7 — publish, public application link, student apply, CV upload

## Note on naming

`docs/database-schema.md` refers to the organizations table as
"organisations" (British spelling) in prose, but the actual foreign key
column everywhere is `organization_id` (American spelling), matching the
original project context doc and this codebase. The application code never
queries the organizations table by name directly, so this is a documentation
wording detail only — but worth agreeing on one spelling with Developer B
before it causes a real mismatch later (e.g. in a future direct query).
