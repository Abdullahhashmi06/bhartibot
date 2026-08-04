# Google reCAPTCHA v3 — InternIQ

Invisible bot protection across every sensitive action: signup, login, OTP
send/resend, Google OAuth entry, password reset, and the public internship
application form. reCAPTCHA v3 runs in the background — no checkbox, no image
puzzles — and scores every request between 0.0 and 1.0.

## How it works

1. A page (e.g. `/login`) calls `verifyRecaptcha("login")` before the sensitive
   operation (`lib/recaptcha/client.ts`).
2. The client mints a one-time token via `grecaptcha.execute()` (script is
   loaded once, app-wide).
3. The token is POSTed to `/api/recaptcha/verify`
   (`app/api/recaptcha/verify/route.ts`), which is **rate-limited per IP**
   (in-memory, see below).
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

| Action | Where | Guard |
|---|---|---|
| Applicant signup | `app/applicant-auth/page.tsx` | `signup` |
| Applicant login (password) | `app/applicant-auth/page.tsx` | `login` |
| Applicant Google OAuth entry | `app/applicant-auth/page.tsx` | `google_oauth` |
| Applicant OTP request | `app/applicant-auth/page.tsx` | `login` |
| Applicant OTP resend | `app/applicant-auth/page.tsx` (via `handleOtpRequest`) | `login` |
| Applicant password reset | `app/applicant-auth/page.tsx` | `password_reset` |
| Recruiter signup | `app/signup/recruiter/page.tsx` | `signup` |
| Recruiter Google OAuth entry | `app/login/page.tsx` | `google_oauth` |
| Recruiter OTP request | `app/login/page.tsx` | `login` |
| Recruiter OTP resend | `components/auth/OtpVerifyForm.tsx` (shared by login + signup) | `otp_resend` |
| Recruiter password reset | `app/login/page.tsx` | `password_reset` |
| Password update (reset link) | `app/auth/reset-password/page.tsx` | `password_reset` |
| Internship application submission | `components/applications/ApplicationForm.tsx` | `apply` |

The OTP resend gate lives once in the shared `OtpVerifyForm` so recruiter login
and recruiter signup are both covered without duplicated logic.

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

The site key is public by design and safe in the browser; the secret key must
only ever live in server-side env vars — it is never imported from client code
(`lib/recaptcha/client.ts` only reads the `NEXT_PUBLIC_` variable).

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | production | — | Public site key (safe in browser) |
| `RECAPTCHA_SECRET_KEY` | production | — | Secret key (server-only) |
| `RECAPTCHA_SCORE_THRESHOLD` | no | `0.5` | Min accepted score (0.0–1.0) |
| `RECAPTCHA_FAIL_OPEN` | no | `false` | `true` = allow through when Google's API errors |
| `RECAPTCHA_EXPECTED_HOSTNAME` | no | — | Pins verified hostname, e.g. `https://app.interniq.com` |
| `RECAPTCHA_RATE_LIMIT_MAX` | no | `15` | Max `/api/recaptcha/verify` calls per window per IP |
| `RECAPTCHA_RATE_LIMIT_WINDOW_MS` | no | `60000` | Rate-limit window in milliseconds |

### Graceful handling of missing keys

- **No `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`** → `verifyRecaptcha()` returns
  `{ ok: true, skipped: true }` — every form proceeds without blocking. This is
  what keeps local development friction-free when you haven't set keys yet.
- **No `RECAPTCHA_SECRET_KEY`** → server returns `{ ok: true, reason:
  "not_configured" }`. Protection is dormant, not broken.
- Production deployments **must** set both keys — with only one set, the
  client mints a token but the server cannot verify it (or vice-versa), and
  verification fails closed with a friendly error.

## Rate limiting

`/api/recaptcha/verify` is protected by a lightweight **in-memory per-IP rate
limiter** (`lib/recaptcha/rate-limit.ts`):

- Defaults: **15 requests / 60 seconds / IP** (configurable via
  `RECAPTCHA_RATE_LIMIT_MAX` and `RECAPTCHA_RATE_LIMIT_WINDOW_MS`).
- Client IP is read from `x-forwarded-for` (first entry), then `x-real-ip`,
  then `"unknown"` (dev/localhost).
- When exceeded the endpoint returns **HTTP 429** with a friendly message and a
  `Retry-After` header; the Google round-trip is never made.
- No Redis / Upstash / paid services. The map is bounded (10k buckets) with
  opportunistic cleanup so memory cannot grow without limit.
- Note: on serverless platforms (Vercel) each lambda instance keeps its own
  map, so this is best-effort per-instance burst protection — a deliberate,
  documented trade-off that is trivially replaceable with a shared store later.

## Local development

```bash
cp .env.example .env.local
# add the site + secret keys for your recaptcha v3 site (localhost allowed)
npm run dev
```

If the keys are absent, protection is **skipped** so local development is
friction-free. Once keys are present, verification is enforced end-to-end
(including the rate limiter).

## Production deployment (Vercel)

1. Add the env vars above in Vercel → Project → Settings → Environment
   Variables (Production / Preview / Development as appropriate).
2. Deploy. No code changes are required — the same code path activates when the
   keys exist.
3. Verify: sign in at `/login` while watching Network → you should see
   `POST /api/recaptcha/verify` returning `{ "ok": true }` before the Supabase
   auth request fires.

## Testing the integration

### Localhost

1. Set both keys in `.env.local`, restart `npm run dev`.
2. Open `/login` → DevTools → Network. Submit the OTP request.
   - Expect `POST /api/recaptcha/verify` → `{ "ok": true }` **before** the
     `signInWithOtp` call.
3. Open `/applicant-auth`, try password signup → same verification request.
4. **Rate limit:** in a new incognito window, fire 16+ rapid requests at
   `POST /api/recaptcha/verify` (any token) → the 16th returns **429** with a
   friendly message and a `Retry-After` header.
5. **OTP resend:** begin a recruiter OTP flow, click "Resend new passcode" →
   expect `otp_resend` verification before the resend request.
6. **Disabled mode:** clear `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`, restart, and
   confirm signup/login still work (protection skipped).

### Vercel

1. Confirm all 7 vars exist under Production + Preview in Vercel env settings.
2. On the deployed URL, run steps 2–3 above over HTTPS.
3. Confirm the secret key is **not** visible anywhere in the browser: DevTools
   → Sources/Search for `RECAPTCHA_SECRET_KEY` and your secret value → no hits.
4. Confirm the rate limiter returns 429 under a 16-request burst (note: with
   several warm lambda instances the count is per-instance, so a distributed
   burst may appear higher — expected behavior).
5. Verify the internship application form still passes verification
   (`apply` action) before the submission POST.

## Failure behaviour

- **Score below threshold / invalid / reused / expired token** → the form shows
  a generic message ("We couldn't verify your request automatically. Please try
  again.") and the operation is **not** performed. Technical reasons are logged
  server-side only.
- **Rate limited** → HTTP 429 → the form shows a friendly "Too many attempts"
  message; no Google call is made.
- **Google API unreachable** → honours `RECAPTCHA_FAIL_OPEN` (default: fail
  closed so suspicious traffic is never silently accepted).

## Common troubleshooting

- **"We couldn't verify your request automatically" on first try** — ad
  blockers / privacy extensions can block the recaptcha script. Retry, or test
  in an incognito window without extensions.
- **Verification always `ok: true` even with bad tokens** — the secret key is
  not set (server returns `not_configured`). Check `RECAPTCHA_SECRET_KEY`.
- **Verification always fails with a valid key** — check
  `RECAPTCHA_SCORE_THRESHOLD` (raise toward `0.9` to be stricter, lower to be
  more permissive) and confirm the hostname matches
  `RECAPTCHA_EXPECTED_HOSTNAME` if set (localhost must be registered in the
  reCAPTCHA admin console).
- **429 responses during normal use** — your proxy/CDN may collapse many
  clients behind one IP, or a single machine is retrying rapidly. Raise
  `RECAPTCHA_RATE_LIMIT_MAX` and/or the window.
- **`google_unavailable` in server logs** — Google's API was unreachable;
  decide whether to set `RECAPTCHA_FAIL_OPEN=true` (not recommended for
  production).

## Files

- `lib/recaptcha/server.ts` — server-side verification (secret key only here)
- `lib/recaptcha/client.ts` — script loader, token mint, `verifyRecaptcha()`
- `lib/recaptcha/rate-limit.ts` — in-memory per-IP rate limiter
- `app/api/recaptcha/verify/route.ts` — verification endpoint + rate limiting
- `.env.example` — documented env vars
- Auth pages, `OtpVerifyForm.tsx`, `ApplicationForm.tsx` — wired call sites
