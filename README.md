# BhartiBot

AI-assisted internship application & screening platform. Recruiters define
requirements, applicants submit CVs through a public link, and AI maps
evidence against those requirements. Recruiters make the final call.

**Day 2 status:** Signup, login, logout, and route protection are wired to
Supabase Auth. Internship creation is still a placeholder (Day 3).

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Supabase Auth via `@supabase/ssr` (Postgres/Storage schema owned by Developer B)

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
| `/internships/[slug]`             | Internship detail (built out later)                          |

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
  internships/[slug]/page.tsx
components/
  layout/Navbar.tsx                top nav, active-link + auth-aware
  layout/Shell.tsx                  shared page wrapper (nav + footer)
  auth/LogoutButton.tsx              client-side sign-out
  ui/Button.tsx                       button + link-button variants
  ui/Tag.tsx                           status/requirement pill
  ui/FormNotice.tsx                     inline error/info banner for forms
lib/
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
- [ ] Day 3 — Create Internship form connected to the database
