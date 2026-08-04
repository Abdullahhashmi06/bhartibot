# Email System — InternIQ

InternIQ's complete email system: a centralized SMTP transport
(Nodemailer over SMTP, provider-agnostic — documented against MailerSend),
a reusable branded HTML template system, and typed senders for every
transactional email.

## Architecture

```
Feature code (server actions / route handlers / scheduler)
        │  import from "@/lib/email"
        ▼
lib/email/index.ts        ← barrel: senders, templates, smtp, types
  ├── lib/email/smtp.ts        ← Nodemailer transport + validation
  ├── lib/email/templates.ts   ← HTML components (baseLayout, button, otpBox…)
  └── lib/email/emails/        ← message templates + senders
        ├── otp.ts             ← OTP email
        ├── reset-password.ts  ← password reset email
        ├── status.ts          ← shortlisted + rejected emails
        └── interview.ts       ← interview invitation (+ .ics) + reminder
        ▼
SMTP provider (e.g. MailerSend)
```

- `sendEmail()` **never throws** — returns a `SendEmailResult` object; callers
  degrade gracefully.
- A **fresh transporter is created per send** — serverless-safe on Vercel.
- When SMTP is **not configured**, emails are logged and `{ success: false,
  skipped: true }` is returned — development stays friction-free.
- All senders are **fire-and-forget friendly**: they return a result and never
  roll back DB changes or block the caller's flow.

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `SMTP_HOST` | yes | — | e.g. `smtp.mailersend.net` |
| `SMTP_PORT` | no | `587` | `587` (STARTTLS) or `465` (implicit SSL) |
| `SMTP_USER` | yes | — | SMTP username / API token |
| `SMTP_PASS` | yes | — | SMTP password / API secret |
| `SMTP_FROM` | no | `InternIQ <user>` | Sender address |
| `EMAIL_TEST_SECRET` | production only | — | Enables `/api/email/test` + `/api/email/lab` in production |

Credentials are read **exclusively** from `process.env`; the service is
`server-only` so nothing reaches the client bundle. **No DB changes required** —
emails need no new tables.

## MailerSend setup

1. Create an account at <https://mailersend.com> and verify your sending
   domain (SPF, DKIM, DMARC).
2. Domains → your domain → **SMTP & Webhooks** → **Add SMTP credential**.
3. Copy **SMTP Host** (`smtp.mailersend.net`), **Port**, **Username**,
   **Password**. `SMTP_FROM` must use your verified domain.

## Email templates & senders

All templates share the brand system in `lib/email/templates.ts`
(BaseLayout, Header, Footer, Button, OTPBox, StatusBadge, CompanyCard,
CallToAction, Divider, security note) — green/teal palette, mobile-first
tables, Stripe/Linear-style modern SaaS design.

| Email | Sender | Template | Trigger |
|---|---|---|---|
| OTP | `sendOtpEmail()` | `buildOtpEmailHtml()` | app-generated codes (see note) |
| Password reset | `sendResetPasswordEmail()` | `buildResetPasswordEmailHtml()` | reset requests (see note) |
| Shortlisted | `sendShortlistedEmail()` | `buildShortlistedEmailHtml()` | status → `shortlisted` |
| Rejected | `sendRejectedEmail()` | `buildRejectedEmailHtml()` | status → `rejected` |
| Interview invitation | `sendInterviewInvitationEmail()` | `buildInterviewInvitationEmailHtml()` | interview scheduled (+ `.ics` attachment) |
| Interview reminder | `sendInterviewReminderEmail()` | `buildInterviewReminderEmailHtml()` | reusable — no scheduler wired |

### Wiring

- **Status emails** fire from `updateStatusServerAction`
  (`app/dashboard/applications/statusActions.ts`) only when the status
  *actually changes* (`prevStatus !== newStatus`), fire-and-forget via
  `sendShortlistedEmailAction` / `sendRejectionEmailAction`
  (`app/dashboard/applications/actions.ts`).
- **Interview invitation** fires from `InterviewScheduler` → server action →
  `sendInterviewEmail()` (delegates to the SMTP invitation sender with the
  `.ics` calendar attachment). If the email fails, the interview is still
  saved — never rolls back.
- The old Resend HTTP path in `lib/notifications/email.ts` now **delegates to
  the SMTP system** (same exported API, no duplicate templates).

### Deduplication & delivery log (database-backed)

Every transactional email goes through `sendEmailWithLog()`
(`lib/email/log.ts`), which records an `email_logs` row and prevents
duplicate sends:

1. **Check** — if a `status = 'sent'` row already exists for the same
   `application_id` + `email_type`, the email is skipped
   (`{ success: true, skipped: true }`).
2. **Send** — reuses the existing SMTP `sendEmail()` service.
3. **Log** — a row is inserted with `sent` / `failed` / `skipped` status,
   `provider_message_id`, recipient, subject, and metadata (including the
   error reason on failure). A failed send never rolls back the application
   status update — it only records the failure.

A partial **unique index** on `(application_id, email_type) WHERE status =
'sent'` is the hard backstop: even a concurrent double-send can only create
one `sent` row. Note: the dedup check runs before the send, so a rare
cross-instance race could still deliver two emails (the DB blocks the second
*log*, not the second *email*) — the status-change gate (`prevStatus !==
newStatus`) is the primary guard. Also note that interview **reschedules** are
blocked by the same dedup (same application + `interview_invitation` type); if
reschedules should send a fresh invite, use a distinct `email_type` (e.g.
`interview_reschedule`).

RLS: authenticated users can insert rows naming themselves as the actor
(`recruiter_id = auth.uid()`, which is the column default) and select their own
rows. Logs are append-only (no update/delete policies).

### A note on OTP / password-reset delivery

InternIQ's auth OTPs and password-reset links are sent **by Supabase Auth
itself** (signUp / signInWithOtp / resetPasswordForEmail) — the app never sees
the generated code. To brand those emails with the InternIQ template:

1. Supabase Dashboard → **Authentication → SMTP Settings** → enable custom SMTP
   and paste your `SMTP_HOST/PORT/USER/PASS`.
2. Supabase Dashboard → **Authentication → Email Templates** → paste the HTML
   from `buildOtpEmailHtml()` / `buildResetPasswordEmailHtml()` into the
   relevant templates (Supabase exposes the code as `{{ .Token }}`).

The `sendOtpEmail()` / `sendResetPasswordEmail()` helpers exist for any
app-generated codes and for testing/preview.

## Developer email lab

Preview every template by sending it to any address:

- **CLI** — `node --env-file=.env.local scripts/test-smtp.mjs you@example.com`
  (generic SMTP test).
- **Web** — `/email-lab` page (dev): pick a template + recipient → sends via
  `POST /api/email/lab`.
- **API** — `POST /api/email/lab` with
  `{ "to": "you@example.com", "template": "otp|reset|shortlisted|rejected|interview|reminder" }`.

`/api/email/lab` and `/api/email/test` are **disabled in production unless
`EMAIL_TEST_SECRET` is set** (403 otherwise) — they can never become open
email relays.

## Testing

### Localhost

1. Add `SMTP_*` vars to `.env.local`, restart `npm run dev`.
2. `curl -X POST http://localhost:3000/api/email/lab -H "Content-Type: application/json" -d '{"to":"you@example.com","template":"otp"}'`
3. Repeat for `reset`, `shortlisted`, `rejected`, `interview`, `reminder`.
4. Check the inbox: branding, OTP box, buttons, footer, `.ics` attachment on
   the interview email.
5. Status flow: shortlist a candidate → shortlisted email; reject → rejected
   email. Re-setting the same status does NOT resend.

### Vercel

1. Add all `SMTP_*` vars (+ `EMAIL_TEST_SECRET` if you want the lab live).
2. Deploy; run the same lab calls against the production URL with the
   `x-test-secret` header.
3. Confirm no `SMTP_*` secrets appear in the client bundle (server-only).
4. Confirm status-change emails fire exactly once per actual status change.

## Files

- `lib/email/smtp.ts` — transport, env config, attachments, `sendEmail()`
- `lib/email/log.ts` — DB-backed dedup + delivery logging (`sendEmailWithLog`)
- `lib/email/templates.ts` — HTML component system
- `lib/email/emails/*` — OTP, reset, status, interview templates + senders
- `lib/email/test-html.ts` — generic SMTP test email
- `lib/email/index.ts` — barrel
- `lib/notifications/email.ts` — delegated legacy API (interviews/rejections)
- `lib/notifications/logger.ts` — failure logging only (dedup moved to DB)
- `supabase/migrations/20260806_email_logs.sql` — email_logs table + RLS + unique dedup index
- `app/dashboard/applications/statusActions.ts` — status-change email triggers
- `app/dashboard/applications/actions.ts` — shortlist/reject/interview actions
- `components/applications/InterviewScheduler.tsx` — interview email trigger
- `app/api/email/test/route.ts`, `app/api/email/lab/route.ts` — test endpoints
- `app/email-lab/page.tsx` — dev preview page
- `scripts/test-smtp.mjs` — CLI SMTP test
