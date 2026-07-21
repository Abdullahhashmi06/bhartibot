# BhartiBot Database Schema

## Overview

BhartiBot uses Supabase PostgreSQL as its primary database.

The initial database schema supports the recruiter-side internship workflow. It stores:

- Organisations
- Recruiter profiles
- Internships
- Internship requirements
- Screening questions

Row Level Security (RLS) is enabled on the application tables.

Detailed RLS policies and organisation-level access control will be implemented separately.

---

# Database Relationships

The current database relationships are:

auth.users
    |
    | id
    v
profiles
    |
    | organization_id
    v
organisations
    |
    | organization_id
    v
internships
    |
    +-------------------+
    |                   |
    v                   v
requirements         questions

---

# 1. organisations

Stores organisations/companies that use BhartiBot to create internship openings.

## Columns

| Column | Type | Constraints / Default | Description |
|---|---|---|---|
| id | uuid | Primary Key, default `gen_random_uuid()` | Unique identifier for the organisation |
| name | text | NOT NULL | Name of the organisation |
| created_at | timestamptz | NOT NULL, default `now()` | Time the organisation was created |

## Relationships

One organisation can have:

- Multiple recruiter profiles
- Multiple internships

---

# 2. profiles

Stores recruiter profile information.

Each profile corresponds to a Supabase authenticated user and belongs to an organisation.

## Columns

| Column | Type | Constraints / Default | Description |
|---|---|---|---|
| id | uuid | Primary Key, Foreign Key | Same UUID as the corresponding Supabase Auth user |
| organization_id | uuid | NOT NULL, Foreign Key | Organisation the recruiter belongs to |
| name | text | NOT NULL | Recruiter's name |
| email | text | NOT NULL | Recruiter's email |
| created_at | timestamptz | NOT NULL, default `now()` | Time the profile was created |

## Foreign Keys

`profiles.id` references:

`auth.users.id`

`profiles.organization_id` references:

`organisations.id`

## Purpose

Using the authenticated user's UUID as the profile ID creates a direct relationship between Supabase Authentication and the BhartiBot recruiter profile.

---

# 3. internships

Stores internship openings created by organisations.

## Columns

| Column | Type | Constraints / Default | Description |
|---|---|---|---|
| id | uuid | Primary Key, default `gen_random_uuid()` | Unique internship identifier |
| organization_id | uuid | NOT NULL, Foreign Key | Organisation that owns the internship |
| title | text | NOT NULL | Internship title |
| field | text | NOT NULL | Academic/professional field |
| description | text | NOT NULL | Internship description |
| location | text | NOT NULL | Internship location |
| work_mode | text | NOT NULL | Work arrangement such as onsite, hybrid, or remote |
| duration | text | NOT NULL | Internship duration |
| status | text | NOT NULL, default `'draft'` | Current internship publication status |
| public_slug | text | UNIQUE, nullable | Unique identifier used in the public application URL |
| created_at | timestamptz | NOT NULL, default `now()` | Time the internship was created |

## Foreign Keys

`internships.organization_id` references:

`organisations.id`

## Internship Status

The initial workflow uses statuses such as:

- `draft`
- `published`

New internships default to:

`draft`

## Public Slug

The `public_slug` will eventually be used to generate a public application URL.

Example:

`/apply/ai-engineering-intern-a82f`

A draft internship may have a NULL `public_slug` until it is published.

The column is UNIQUE so that two internships cannot use the same public application slug.

---

# 4. requirements

Stores recruiter-defined requirements for an internship.

Each internship can contain multiple requirements.

## Columns

| Column | Type | Constraints / Default | Description |
|---|---|---|---|
| id | uuid | Primary Key, default `gen_random_uuid()` | Unique requirement identifier |
| internship_id | uuid | NOT NULL, Foreign Key | Internship associated with the requirement |
| requirement | text | NOT NULL | Requirement description |
| type | text | NOT NULL | Whether the requirement is required or preferred |
| created_at | timestamptz | NOT NULL, default `now()` | Time the requirement was created |

## Foreign Keys

`requirements.internship_id` references:

`internships.id`

## Requirement Types

Expected values:

- `required`
- `preferred`

Example:

| Requirement | Type |
|---|---|
| Python experience | required |
| Currently studying CS/AI/SE | required |
| Pandas experience | preferred |
| Previous ML project | preferred |

Database-level validation for allowed requirement types can be added separately.

---

# 5. questions

Stores recruiter-defined screening questions associated with an internship.

Each internship can contain multiple screening questions.

## Columns

| Column | Type | Constraints / Default | Description |
|---|---|---|---|
| id | uuid | Primary Key, default `gen_random_uuid()` | Unique question identifier |
| internship_id | uuid | NOT NULL, Foreign Key | Internship associated with the question |
| question | text | NOT NULL | Screening question |
| type | text | NOT NULL | Type of answer expected |
| created_at | timestamptz | NOT NULL, default `now()` | Time the question was created |

## Foreign Keys

`questions.internship_id` references:

`internships.id`

## Question Types

Possible MVP question types may include:

- `text`
- `textarea`
- `yes_no`

The exact supported question types can evolve as the application form is implemented.

---

# Row Level Security

Row Level Security (RLS) is enabled on the application tables.

Detailed RLS policies will be implemented during the authentication and authorization phase.

The intended security model is:

- Recruiters must be authenticated.
- Recruiters belong to an organisation.
- Recruiters should only access private recruiter data belonging to their organisation.
- Recruiters should only create or modify internships belonging to their organisation.
- Requirements and questions should only be manageable through internships owned by the recruiter's organisation.

Public applicant access will be handled separately for published internship application pages.

---

# Supabase Authentication

BhartiBot uses Supabase Auth for recruiter authentication.

The relationship between authentication and recruiter profiles is:

auth.users.id
    |
    | same UUID
    v
profiles.id

The `profiles` table contains BhartiBot-specific information about the authenticated recruiter.

---

# Current Schema Status

Initial Day 1 schema completed:

- [x] organisations
- [x] profiles
- [x] internships
- [x] requirements
- [x] questions
- [x] Primary keys configured
- [x] Foreign key relationships configured
- [x] Row Level Security enabled
- [ ] RLS policies
- [ ] Authentication/profile creation integration
- [ ] Application-related tables
- [ ] CV storage
- [ ] AI analysis tables

The remaining items will be implemented in later development stages.