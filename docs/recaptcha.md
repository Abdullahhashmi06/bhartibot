# Google reCAPTCHA v3 — InternIQ

Invisible bot protection across all authentication flows and the public
internship application form. reCAPTCHA v3 runs in the background — no checkbox,
no image puzzles — and scores every request between 0.0 and 1.0.

## How it works

1. A page (e.g. `/login`) calls `verifyRecaptcha("login")` before the sensitive
   operation (`lib/recaptcha/client.ts`).
2. The client mints a one-time token via `grecaptcha.execute()` (script is
   loaded once, app-wide).
3. The token is POSTed to `/api/recaptcha/verify`
   (`app/api/recaptcha/verify/route.ts`).
4. The server exchanges the token with Google's `siteverify` endpoint using the
   secret key (`lib/recaptcha/server.ts`) and enforces:
   - **Score threshold** (default `0.5`, configurable)
   - **Action binding** (token minted for `login` cannot be used for `signup`)
   - **Token age** (rejects expired tokens — Google tokens live ~2 minutes)
   - **Reuse protection** (Google rejects any already-redeemed token with
     `timeout-or-duplicate`)
   - **Optional hostname pinning** (`RECAPTCHA_EXPECTED_HOSTNAME`)
5. Only if the server says `ok` does the Supabase call (signup, login, OTP,
   apply, ...) proceed.

## Protected actions

| Action | Where |
|---|---|
| Applicant signup / login | `app/applicant-auth/page.tsx` |
| Applicant Google OAuth entry | `app/applicant-auth/page.tsx` |
| Applicant OTP request / verify | `app/applicant-auth/page.tsx` |
| Applicant password reset | `app/applicant-auth/page.tsx` |
| Recruiter signup | `app/signup/recruiter/page.tsx` |
| Recruiter Google OAuth entry | `app/signup/recruiter/page.tsx`, `app/login/page.tsx` |
| Recruiter OTP request / verify / resend | `app/login/page.tsx`, `app/signup/recruiter/page.tsx` |
| Recruiter password reset | `app/login/page.tsx` |
| Password update (reset link) | `app/auth/reset-password/page.tsx` |
| Internship application submission | `components/applications/ApplicationForm.tsx` |

## Google Cloud credentials

1. Go to <https://www.google.com/recaptcha/admin> and sign in with the Google
   account that owns the project's Google Cloud project.
2. **Register a new site** with:
   - Label: `InternIQ`
   - Type: **reCAPTCHA v3** (not v2)
   - Domains: `localhost` (dev) and your production domain(s), e.g.
     `app.interniq.com`
3. You get two values:
   - **Site key** → `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
   - **Secret key** → `RECAPTCHA_SECRET_KEY` (server-side only, never expose)

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | production | Public site key (safe in browser) |
| `RECAPTCHA_SECRET_KEY` | production | Secret key (server-only) |
| `RECAPTCHA_SCORE_THRESHOLD` | no | Min accepted score, default `0.5` |
| `RECAPTCHA_FAIL_OPEN` | no | `true` = allow through when Google's API errors; default `false` |
| `RECAPTCHA_EXPECTED_HOSTNAME` | no | Pins verified hostname, e.g. `https://app.interniq.com` |

## Local development

```bash
cp .env.example .env.local
# add the site + secret keys for your recaptcha v3 site (localhost allowed)
npm run dev
```

If the keys are absent, protection is **skipped** (`skipped: true`) so local
development is friction-free. Once keys are present, verification is enforced.

## Production deployment (Vercel)

1. Add the env vars above in Vercel → Project → Settings → Environment
   Variables (Production / Preview / Development as appropriate).
2. Deploy. No code changes are required — the same code path activates when the
   keys exist.
3. Verify: sign in at `/login` while watching Network → you should see
   `POST /api/recaptcha/verify` returning `{ "ok": true }` before the Supabase
   auth request fires.

## Failure behaviour

- **Score below threshold / invalid / reused / expired token** → the form shows
  a generic message ("We couldn't verify your request automatically. Please try
  again.") and the operation is **not** performed. Technical reasons are logged
  server-side only.
- **Google API unreachable** → honours `RECAPTCHA_FAIL_OPEN` (default: fail
  closed so suspicious traffic is never silently accepted).

## Files

- `lib/recaptcha/server.ts` — server-side verification (secret key only here)
- `lib/recaptcha/client.ts` — script loader, token mint, `verifyRecaptcha()`
- `app/api/recaptcha/verify/route.ts` — verification endpoint
- `.env.example` — documented env vars
- Auth pages + `ApplicationForm.tsx` — wired call sites
