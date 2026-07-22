# Backend Setup

## 1. Create a Supabase project

## 2. Run the SQL migration

In the Supabase SQL Editor, run:

`supabase/migrations/20260722_recruiter_backend.sql`

## 3. Enable Email Auth + OTP

In **Authentication → Providers → Email**:

1. Enable the **Email** provider.
2. **Enable Confirm email** (required for signup OTP verification).
3. Keep email OTP enabled (default).

In **Authentication → Email Templates**:

Update these templates so the email includes the 6-digit code:

### Confirm signup

Include:

```text
Your BhartiBot verification code is: {{ .Token }}
```

### Magic Link

Include:

```text
Your BhartiBot login code is: {{ .Token }}
```

> If the template only has `{{ .ConfirmationURL }}`, users get a link instead of a typed OTP. Keep `{{ .Token }}` in the body for the in-app OTP screens.

### Redirect URLs

In **Authentication → URL Configuration**, add:

- `http://localhost:3000/auth/callback`
- your deployed URL callback when you go to Vercel

## 4. Create `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Copy from `.env.local.example`. Never commit real keys.

## 5. Run the app

```bash
npm install
npm run dev
```

## 6. Test Auth (OTP)

**Signup**

1. Go to `/signup`
2. Create an account
3. Open the email → copy the 6-digit code
4. Enter it on the Verify screen
5. You should land on `/dashboard`

**Login**

1. Go to `/login`
2. Enter the same email → Send login code
3. Enter the OTP from email
4. You should land on `/dashboard`

## 7. Test product flow

- Create internship
- Requirements
- Questions
- Publish + copy public link
- Multi-account RLS
