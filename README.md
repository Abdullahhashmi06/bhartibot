# InternIQ

AI-assisted internship application & screening platform. Recruiters define
requirements, applicants submit CVs through a public link, and AI maps
evidence against those requirements. Recruiters make the final call.

**Day 6 status (Developer A):** Public `/apply/[slug]` page with student
application form. Applicants submit personal details, education, links,
screening answers, and optional CV selection. Applications persist in
Supabase with status `new`. CV file storage lands Day 7.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Supabase Auth + Postgres via `@supabase/ssr`

## Getting started

**Requirements:** Node.js 18.18+ (or 20+) and npm.

```bash
git clone <repo-url>
cd <your-clone-directory>
cp .env.example .env.local   # then fill in your Supabase + provider values
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
| `/login`                          | Recruiter login via email OTP                                |
| `/signup`                         | Recruiter signup + email OTP verification                    |
| `/auth/callback`                  | Exchanges auth codes / magic-link sessions                   |
| `/dashboard`                      | **Protected.** Empty-state dashboard + logout                |
| `/dashboard/create-internship`    | **Protected.** Placeholder — real form lands Day 3            |
| `/internships/[slug]`             | **Protected.** Internship detail + screening questions (Day 4) |
| `/apply/[slug]`                   | **Public.** Published internship + student application form (Day 6) |
| `/apply/[slug]/success`           | **Public.** Confirmation after application submit (Day 6) |

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
  login/page.tsx                   email OTP sign-in (signInWithOtp + verifyOtp)
  signup/page.tsx                  signUp + email OTP verification
  auth/callback/route.ts            email link / code exchange fallback
  dashboard/page.tsx                protected, reads session server-side
  dashboard/create-internship/page.tsx   placeholder — real form Day 3
  internships/[slug]/page.tsx       detail + screening questions (Day 4)
  apply/[slug]/page.tsx             public apply form (Day 6)
  apply/[slug]/success/page.tsx     post-submit confirmation (Day 6)
components/
  layout/Navbar.tsx                top nav, active-link + auth-aware
  layout/Shell.tsx                  shared page wrapper (nav + footer)
  auth/LogoutButton.tsx              client-side sign-out
  auth/OtpVerifyForm.tsx              shared 6-digit OTP entry + resend
  internships/RequirementList.tsx     required/preferred inputs (create form)
  internships/ScreeningQuestions.tsx  add / view / delete questions (Day 4)
  internships/PublishPanel.tsx          publish + copy public link (Day 5)
  applications/ApplicationForm.tsx    student application form (Day 6)
  ui/Button.tsx                       button + link-button variants
  ui/Tag.tsx                           status/requirement pill
  ui/FormNotice.tsx                     inline error/info banner for forms
lib/
  queries/internships.ts             create / list / detail internship helpers
  queries/questions.ts               get / create / delete screening questions
  queries/applications.ts            submit student applications + answers
  supabase/client.ts                Supabase client for Client Components
  supabase/server.ts                 Supabase client for Server Components
middleware.ts                        session refresh + route protection
```

## Environment variables

Copy `.env.example` to `.env.local` (already git-ignored) and fill in every
variable for your environment. At minimum you need the public Supabase pair
(Project Settings → API):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Both are public and safe in the browser. The `SUPABASE_SERVICE_ROLE_KEY`
and any AI API key must **only** ever be used in server-side code (route
handlers / server actions), never in a client component, never committed.

`.env.example` documents the full variable set (Supabase, reCAPTCHA, AI
providers, SMTP email, PWA metadata) with sensible defaults.

Add for AI resume analysis (server-only):

```
GEMINI_API_KEY=
```

Apply `supabase/migrations/20260728_candidate_ai_analysis.sql` before using
AI analysis on the applicant detail page.

## Testing AI analysis and error handling

Prerequisites: `GEMINI_API_KEY` in `.env.local`, AI migration applied, at least
one application with a PDF CV uploaded.

1. Open `/dashboard/applications/<internshipId>/<applicationId>`.
2. Confirm personal info, CV link, and screening answers load without clicking
   **Analyze CV** — the page must never auto-call Gemini.
3. Click **Analyze CV** and wait for the match score panel.
4. Refresh the page — the cached analysis should appear with no new Gemini
   request (check server logs).
5. Click **Re-analyze CV** — only this explicit action should trigger a new
   Gemini run and replace the stored analysis.
6. Temporarily set `GEMINI_API_KEY` to an invalid value, click **Analyze CV**
   (or **Try again** after a failure). Confirm:
   - The applicant page still loads (CV opens, answers visible).
   - An **AI Analysis** card shows a user-friendly reason (no stack trace).
   - Server console logs `[InternIQ AI] …` with the technical detail.
7. Restore the valid key. With a cached failure, click **Try again** — analysis
   should succeed and the failure cache clears.
8. To simulate quota exceeded, use an exhausted key or mock a 429 in
   `lib/ai/gemini.ts` temporarily. Confirm the message reads
   *Daily AI quota exceeded*, **Try again** is shown, and repeat page loads do
   not hammer Gemini (failure is cached until you click **Try again**).
9. Upload or test with a PDF over 5 MB — expect *This resume is too large to
   analyze* without crashing the page.

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

## Testing the Day 6 flow locally (Developer A)

1. Log in, open a draft internship, and click **Publish Internship**.
2. Copy the public `/apply/<slug>` link.
3. Open the link in a private/incognito window (no recruiter session).
4. Confirm the internship title, description, and requirements are visible.
5. Fill in name, email, education fields, and optional links.
6. Answer any screening questions (Text and Yes/No).
7. Optionally select a PDF CV (storage upload lands Day 7).
8. Click **Submit Application** — you should land on `/apply/<slug>/success`.
9. In Supabase → Table Editor, confirm a row in `applications` with
   `status = new` and matching rows in `answers`.
10. Confirm draft internships return 404 on `/apply/<slug>` (not published).

Developer B must apply `supabase/migrations/20260723_applications.sql`
before submissions work (applications + answers tables, public RLS, and
missing UPDATE/DELETE policies).

## Testing the Day 5 flow locally (Developer A)

1. Open a draft internship from `/dashboard`.
2. Confirm the Publish section shows status **draft**.
3. Click **Publish Internship**.
4. Confirm status becomes **published** and a public link appears
   (`/apply/<slug>`).
5. Click **Copy link** and paste somewhere to verify.
6. Optionally click **Move back to draft** and confirm the link panel hides.
7. Dashboard list should reflect the updated status tag.

If publish fails with an RLS error, Developer B needs an UPDATE policy on
`internships` for the recruiter's organisation (similar to the select/insert
policies already used for create).

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

## Testing auth (email OTP)

1. Set real Supabase values in `.env.local`.
2. In Supabase, enable Confirm email and put `{{ .Token }}` in the
   Confirm signup + Magic Link email templates (see `docs/backend-setup.md`).
3. `npm run dev`, go to `/signup`, create a recruiter account.
4. Enter the 6-digit code from email → you should land on `/dashboard`.
5. Log out, go to `/login`, enter the same email, send code, verify OTP.
6. Confirm `/dashboard` loads. Visit `/dashboard` while logged out and
   confirm redirect to `/login?next=/dashboard`.

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
- [x] Day 5 (Dev A) — Publish button, draft/published state, copy public `/apply/[slug]` link
- [x] Day 6 (Dev A) — Public apply page, student application form, screening answers saved
- [ ] Day 7 — CV upload to storage, recruiter applications list

## Note on naming

`docs/database-schema.md` refers to the organizations table as
"organisations" (British spelling) in prose, but the actual foreign key
column everywhere is `organization_id` (American spelling), matching the
original project context doc and this codebase. The application code never
queries the organizations table by name directly, so this is a documentation
wording detail only — but worth agreeing on one spelling with Developer B
before it causes a real mismatch later (e.g. in a future direct query).
