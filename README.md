# Checkapp

Checkapp is a self-hosted, multi-assessment platform for Absolute Mind. It is designed to make a scorecard feel like the start of a useful conversation: calm public flows, meaningful category scoring, a report that is genuinely specific to each person, and a clear next step.

## What is included

- Absolute Mind brand shell: the logo's orange and charcoal, category colours taken from the origami mark, Montserrat throughout (including the PDF) and a favicon cut from the logo.
- A public home page listing live check-ins, an assessment landing page and a one-question-at-a-time flow.
- Personalised results for every participant:
  - their overall score and result band;
  - a **main focus area** and **strongest area**, with a write-up for each category at their score level;
  - up to three **reflections on their own answers**, written per answer option in the builder;
  - their **written answers** ("In your words");
  - **progress since their last check-in** when they retake one;
  - an optional video per band, and Paula's personal sign-off.
- A **private results link** (`/results/<token>`) saved in the database, so results survive a refresh and can be reopened from the email.
- A branded, multi-page PDF report attached to a personalised email (Resend).
- Crisis signposting (999, NHS 111, Samaritans, Shout) on every result, email and PDF, emphasised for bands marked "priority".
- Admin workspace for Paula and Mike: assessment builder with score-band gap checks, a dashboard, reports with each person's answers, priority flags and PDF download, contacts with one-click data erasure, and an email notification when someone completes a check-in.
- Consent: explicit consent to process health-related answers (required), plus separate optional consent for follow-up. The CRM webhook only receives people who opted in.
- Protection: honeypot field, per-IP and per-email submission limits, login throttling, and timing-safe credential checks.
- Automatic data retention: results older than `DATA_RETENTION_MONTHS` are deleted by a daily Vercel Cron job.

## Run locally

```bash
pnpm install
pnpm dev
```

Then open `http://localhost:3000`. Without `DATABASE_URL` the app runs in demo mode: results are shown from the browser session and nothing is saved.

Useful routes:

- `/` — public home page
- `/assessments/anxiety-check` — assessment landing page
- `/assessments/anxiety-check/run` — question flow
- `/results/<token>` — a participant's private results page
- `/admin` — workspace dashboard (`/admin/reports`, `/admin/contacts`, `/admin/assessments`)

Checks:

```bash
pnpm typecheck
pnpm test
pnpm build
```

## Database

The public and admin flows use Prisma when `DATABASE_URL` is configured, with the seed data kept as a fallback. After pulling schema changes, apply them with:

```bash
pnpm db:push
```

This release adds `AssessmentAttempt.publicToken`, `Contact.followUpConsent`, `Contact.consentedAt` and `ScoreCategory.content`. All are optional or defaulted, so existing data is kept. Attempts made before this release have no private link, and their answers are shown in the admin area from the stored scores.

## Deployment

The app uses the Next.js App Router and is structured for Vercel. See `.env.example` for every variable. At a minimum set `DATABASE_URL`, `PUBLIC_BASE_URL`, the `ADMIN_*` values, `RESEND_API_KEY`, `REPORT_FROM_EMAIL`, `PRIVACY_CONTACT_EMAIL` and `CRON_SECRET`. `vercel.json` schedules the retention clean-up.

The PDF fonts in `assets/fonts` are Montserrat, licensed under the SIL Open Font License (`assets/fonts/OFL.txt`).
