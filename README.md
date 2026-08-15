# InternIQ

**AI Powered Internship Recruitment and Talent Management Platform**

InternIQ is a full-stack platform for managing the internship recruitment lifecycle — from publishing opportunities and collecting applications to AI-assisted candidate evaluation, interviews, notifications, and final decisions.

Live Demo: https://www.interniq.pk

Built by: Abdullah Hashmi & Umer Farooque

---

## Table of Contents

- [Overview](#overview)
- [Key Highlights](#key-highlights)
- [Why This Project Exists](#why-this-project-exists)
- [How The Platform Works](#how-the-platform-works)
- [Feature Breakdown](#feature-breakdown)
  - [Recruiter Side](#recruiter-side)
  - [Applicant Side](#applicant-side)
  - [Artificial Intelligence](#artificial-intelligence)
  - [Interview Management](#interview-management)
  - [Email and Notifications](#email-and-notifications)
  - [Security](#security)
  - [Progressive Web App](#progressive-web-app)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Database Design](#database-design)
- [Authentication](#authentication)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Getting Started Locally](#getting-started-locally)
- [Database Setup](#database-setup)
- [Deployment](#deployment)
- [Testing and Quality Checks](#testing-and-quality-checks)
- [Data Privacy](#data-privacy)
- [Known Limitations](#known-limitations)
- [Future Roadmap](#future-roadmap)
- [Team](#team)
- [License](#license)
- [Contact](#contact)

---

## Overview

Internship recruitment is often handled across spreadsheets, email, messaging apps, and manually reviewed CVs. This makes it difficult for recruiters to compare candidates, coordinate interviews, and keep track of applications. Applicants also have to repeatedly enter their information and often have limited visibility into their application status.

InternIQ brings these parts of the recruitment process into a single platform, covering the workflow from internship creation and applications to AI-assisted candidate evaluation, interviews, notifications, and final decisions.

The platform combines:

- AI-powered resume parsing and candidate evaluation
- Structured internship creation with requirements and screening questions
- Recruiter dashboard with applicant and recruitment pipeline management
- Dedicated applicant portal with CV reuse and application tracking
- Interview scheduling and lifecycle management
- Transactional email with calendar invitations
- Role-based authentication for recruiters and applicants
- Responsive, installable Progressive Web App (PWA)

## Why This Project Exists

Internship recruitment has a few recurring problems that InternIQ was designed around.

On the recruiter side, hundreds of CVs can arrive for a single posting with no structured way to compare them. Manually reading every CV is slow, and by the time a recruiter reaches the two hundredth resume they are simply not giving it the same attention as the first one. Interview coordination usually happens through scattered emails with no record of who accepted or declined. Most teams end up running their whole pipeline out of a spreadsheet.

On the applicant side, the biggest complaint is silence. A student submits an application and often never hears anything back, with no idea whether their CV was even opened. They also end up retyping the same information, education, experience, skills, for every single application they submit.

InternIQ addresses both sides at once instead of only solving half the problem.

## How The Platform Works

The core workflow looks like this from start to finish.

```text
Recruiter Signup or Login
        |
        v
Create Internship (requirements + screening questions - Ai assisted)
        |
        v
Publish Opportunity
        |
        v
Applicant Discovers Internship (Ai displays job with highest skill match)
        |
        v
Application Submitted With CV
        |
        v
AI Analysis (resume parsing + candidate scoring)
        |
        v
Recruiter Review (score + evidence + reasoning)
        |
   +----+----+
   |         |
Shortlist   Reject
   |
   v
Schedule Interview
   |
   v
Email + Calendar Invite Sent
   |
   v
Interview Lifecycle (accept, decline, reschedule, cancel, complete)
   |
   v
Final Decision
```

Every step in that diagram happens automatically inside InternIQ. Nothing needs to be copied between different tools, and every status change triggers an email and an in app notification for the person who needs to see it.

---

## Feature Breakdown

### Recruiter Side

Recruiters can sign in using Google OAuth, email OTP, or password-based authentication, with reCAPTCHA protection on authentication flows. The recruiter dashboard provides an overview of recruitment activity, including internship and application counts, shortlisted and rejected candidates, scheduled interviews, and average AI evaluation scores.

Recruiters can:

- Create and publish internships with structured requirements, preferred skills, and custom screening questions
- Browse, search, filter, and sort applicants
- View candidate profiles with parsed resume information, AI evaluation results, and application history
- Star candidates and save them to a reusable talent pool
- Compare multiple candidates side by side
- Add private recruiter notes that are not visible to applicants
- Generate shareable, token-based candidate review links for hiring managers
- Move candidates through the recruitment pipeline, including application review, shortlisting, interviews, offers, and rejection

### Applicant Side

Applicants have a dedicated authenticated portal for managing their profile, discovering internships, submitting applications, and tracking their progress.

When an applicant uploads a resume, InternIQ parses it and extracts information such as their name, contact details, education, experience, projects, skills, and certifications. The extracted information can then be used to populate their profile and reduce repeated data entry.

When an applicant submits an application, InternIQ stores a snapshot of their profile at the time of submission. This preserves the information associated with that application even if the applicant updates their profile later.

Applicants can also:

- Browse and search published internships
- View internship details, requirements, and screening questions
- Track submitted applications and their current statuses
- Accept, decline, or request a reschedule for interview invitations through the applicant portal
- Receive in-app notifications for application and interview updates

### Artificial Intelligence

The AI system is the core differentiator of the platform. Instead of a single mystery number, it produces a full, explainable breakdown of why a candidate does or does not fit a role.

When a candidate applies, the pipeline runs automatically. Their CV is downloaded from storage, text is extracted from the PDF, and the resume is parsed into a structured profile covering education, experience, projects, skills, and certifications. That structured profile is then scored against the specific internship's required and preferred skills.

The output includes eight separate dimensions rather than one flat score:

```text
Match Score
Technical Score
Education Score
Experience Score
Communication Score
Culture Fit Score
Resume Quality Score
Confidence Score
```

Alongside the scores, the AI returns a written list of strengths, weaknesses, and missing skills, plus a recommendation of Hire, Interview, Maybe, or Reject, and a plain language explanation of how it reached that conclusion. This means a recruiter always has something to reason about, not just a percentage to trust blindly.

InternIQ is not tied to a single AI vendor. It runs a multiple provider setup with automatic fallback, so if one provider is down or rate limited, the system quietly moves to the next one.

```text
InternIQ AI Abstraction
        |
   Primary Provider
        |
     Groq
        |
   (on failure)
        |
   OpenRouter
        |
   (on failure)
        |
   Google Gemini
```

There is also a separate recommendation engine on the applicant side that ranks internships for each student using a configurable weighted formula covering required skills, preferred skills, education, experience, projects, and how competitive a given role currently is.

### Interview Management

Recruiters can schedule interviews with a date, time, timezone, interview type, interviewer name, and either a meeting link or physical venue.

Applicants can respond to interview invitations directly from the applicant portal. The interview workflow supports acceptance, decline, reschedule requests, cancellation, completion, and missed interviews.

A typical interview workflow is:


```text
Schedule Interview
        |
        v
    Scheduled
     /   |   \
    /    |    \
Accept Decline Reschedule Request
  |       |          |
  v       v      Recruiter Review
Accepted Declined    /      \
                  Approve   Reject
                     |        |
                     +----+---+
                          |
                     Rescheduled
                          |
                          v
                       Scheduled
```

Scheduled
    |
    +--> Cancelled
    +--> Missed
    +--> Completed
---

## Technology Stack

**Frontend**

Next.js, React, and TypeScript form the core of the application, styled with a custom Tailwind CSS design system.

**Backend**

Next.js Server Actions and API Routes handle all server side logic, so there is no separate backend service to maintain. Supabase provides authentication, the database, and file storage.

**Database**

PostgreSQL, hosted through Supabase, with Row Level Security enforced at the database level.

**Artificial Intelligence**

Google Gemini as the primary provider, with OpenRouter and Groq configured as automatic fallbacks.

**Email**

Nodemailer connected to a custom domain SMTP account, with HTML templates and automatic `.ics` calendar attachments.

**Hosting**

Vercel, running on a global serverless edge network with automatic HTTPS, behind the custom domain `interniq.pk`.

**Progressive Web App**

Serwist, a modern wrapper around Workbox, handles the service worker and offline behavior.

**Bot Protection**

Google reCAPTCHA v3, verified entirely on the server.

---

## System Architecture

```text
                 InternIQ Client
          Next.js / React / TypeScript
                       |
                       v
                Application Layer
   Server Actions, API Routes, Middleware, Services
             |                        |
             v                        v
        Supabase                 AI Providers
   PostgreSQL, Auth, RLS      Gemini, OpenRouter, Groq
             |
             v
           Communication Layer
   SMTP, HTML Email, .ics Files, Notifications
```

The application is split into six layers that stay clearly separated from each other. The frontend layer renders the interface using Server and Client Components. The application layer holds all business logic through Server Actions and API Routes. The database layer stores everything in a normalised PostgreSQL schema with Row Level Security. The AI layer wraps multiple providers behind a single abstraction with automatic fallback. The email layer manages transactional communication. The security layer wraps all of it with authentication, route protection, and strict HTTP headers.

## Database Design

InternIQ uses a normalised relational schema with dedicated tables for organisations, recruiter profiles, applicant profiles, internships, requirements, screening questions, applications, AI analysis results, interviews, notifications, and email logs. Foreign keys, constraints, and indexes keep the data consistent, and Row Level Security policies restrict every sensitive table so users can only ever access their own data or data that belongs to their organisation.

A simplified view of how the core entities relate to each other:

```text
Organization
    |
    -- Internship
          |
          -- Requirements
          -- Screening Questions
          |
          -- Applications
                |
                -- Applicant Profile
                -- AI Analysis
                -- Recruiter Notes
                |
                -- Interviews
                      |
                      -- Notifications and Emails
```

## Authentication

InternIQ supports Google OAuth, email based OTP, and password authentication with a proper reset flow. Recruiters and applicants are kept completely separate, both in how they log in and in what they are allowed to access once logged in. Middleware checks the logged in user's role on every request and redirects them if they try to reach an area that does not belong to their role, so an applicant can never open the recruiter dashboard and a recruiter can never open the applicant portal.

---

## Project Structure

```text
InternIQ/
  app/
    api/
    applicant/
    dashboard/
    internships/
    login/
    signup/
    auth/
  components/
    applications/
    auth/
    dashboard/
  lib/
    ai/
    email/
    notifications/
    queries/
    supabase/
    recaptcha/
  public/
    icons/
    sw.js
  supabase/
    migrations/
  .env.local.example
  next.config.mjs
  package.json
  tsconfig.json
  README.md
```

## Environment Variables

Create a `.env.local` file in the project root before running the app. None of these values should ever be committed to source control.

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI Providers
GEMINI_API_KEY=
OPENROUTER_API_KEY=
OPENROUTER_MODEL=
GROQ_API_KEY=
GROQ_MODEL=
AI_PROVIDER=
AI_FALLBACK_ORDER=

# Application
NEXT_PUBLIC_APP_URL=

# reCAPTCHA
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=
RECAPTCHA_SECRET_KEY=

# SMTP
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

Real API keys, database service role keys, SMTP passwords, and the reCAPTCHA secret key should only ever exist in your local `.env.local` file or in your hosting provider's environment settings. They should never appear in the repository itself.

## Getting Started Locally

Clone this repository to your machine and move into the project folder.

```bash
git clone https://github.com/interniq/interniq.git
cd interniq
```

Install the dependencies.

```bash
npm install
```

Copy the example environment file and fill in your own values.

```bash
cp .env.local.example .env.local
```

Start the development server.

```bash
npm run dev
```

The app will be running at `http://localhost:3000`.

## Database Setup

Database migrations live under `supabase/migrations`. Apply them to your own Supabase project through the SQL Editor or your preferred migration tool.

Using the SQL Editor:

1. Open your Supabase project dashboard.
2. Go to the SQL Editor.
3. Open a new query.
4. Paste in a migration file's contents and run it.
5. Repeat for each migration in order.

## Deployment

InternIQ is deployed on Vercel behind a custom domain.

```text
GitHub Repository
       |
       v
    Vercel
       |
       v
 Production Build
       |
       v
 www.interniq.pk
```

Environment variables for production are configured directly inside the hosting provider's dashboard rather than committed to the repository.

Before deploying, it is worth checking through this list:

- The `.env.local` file is not committed
- No API keys are hardcoded anywhere in the source code
- The Supabase service role key is only used server side
- The reCAPTCHA secret is only used server side
- The SMTP password is only used server side
- OAuth redirect URLs are configured for the production domain
- The production domain is registered with reCAPTCHA
- HTTPS is enabled and enforced
- Security headers are enabled
- Row Level Security policies are active on every sensitive table
- All required migrations have been applied

## Testing and Quality Checks

Before every deployment, the project runs through basic static checks.

```bash
npx tsc --noEmit
npm run lint
npm run build
```

On top of that, the production build has been manually tested for authentication flows across both roles, the full interview lifecycle, live email delivery including calendar attachments, security header presence, and database policy behavior with real data.

## Data Privacy

InternIQ processes personal information including names, email addresses, CVs, education history, and AI generated candidate assessments. Because of that, the production site includes a Privacy Policy, Terms of Service, and an AI Disclaimer as dedicated pages rather than an afterthought. The AI Disclaimer specifically makes clear that AI generated scores are meant to support a recruiter's decision, not replace it, and that a human is always the one making the final call on any candidate.

## Known Limitations

Every project has trade offs, and it is worth being upfront about the current ones.

- AI output quality depends on whichever provider ends up handling a given request
- AI recommendations are meant to be reviewed by a human recruiter, not acted on automatically
- Email delivery depends on the configured SMTP provider staying available
- OAuth and reCAPTCHA both depend on their respective external services being reachable
- Some features may need additional configuration before they can be enabled in a new environment

## What We Want To Build Next

There is a long list of things we would like to add over time.

**Artificial Intelligence**

Better semantic matching, candidate embeddings, recruiter feedback loops that improve future scoring, automatically generated interview questions, and automated interview summaries.

**Recruitment tools**

Bulk candidate actions, bulk email communication, interview scorecards, structured interviewer feedback, hiring team collaboration, and formal offer management.

**Applicant experience**

A more personalised internship feed, application reminders, calendar synchronisation, and skill gap recommendations tied directly to specific roles.

**Analytics**

Proper time to hire metrics, internship performance metrics, candidate source tracking, and accuracy tracking for the AI's own recommendations over time.

## Team

InternIQ was built and is maintained by a two person team, Umer Farooque and Abdullah Hashmi. Both contributed across the full stack of the platform, covering product design, backend architecture, AI integration, security, and production deployment.

## Contributing

Contributions are welcome. To propose a change, create a new branch for your feature.

```bash
git checkout -b feature/your-feature-name
```

Make your changes, then run the same checks used before deployment.

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Commit and push your branch, then open a pull request describing what changed and why.

```bash
git commit -m "Add your feature"
git push origin feature/your-feature-name
```

## License

This project is proprietary software. All rights are reserved by the developers, Umer Farooque and Abdullah Hashmi. The source code may not be copied, distributed, or used in other projects without explicit written permission.

## Contact

**Email:** interniq26@gmail.com
**Website:** [https://www.interniq.pk](https://www.interniq.pk)
**Production sender address:** info@interniq.pk

---

InternIQ brings recruitment management, applicant experience, artificial intelligence, communication automation, interview scheduling, and production grade security together into one platform, built around the full internship recruitment lifecycle from the first posting to the final decision.
