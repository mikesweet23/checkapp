# Checkapp

Checkapp is a self-hosted, multi-assessment platform for Absolute Mind. It is designed to make a scorecard feel like the start of a useful conversation: calm public flows, meaningful category scoring, personalised result bands and a clear next step.

## What is included

- Premium orange / peach / plum brand shell inspired by Absolute Mind.
- Public assessment landing page and one-question-at-a-time flow.
- Seeded Anxiety Check assessment with four score categories and configurable result bands.
- Client-side score calculation and personalised results page with category breakdown, video placeholder and CTA.
- Paula/Mike-only admin workspace with assessment builder, result-band PDF copy, contacts and delivery reports.
- Prisma/Postgres model covering assessments, sections, questions, options, score categories, result bands, videos, PDF templates, contacts, attempts, answers, scores, email events and CRM linkage.
- Branded two-page PDF reports generated with `pdf-lib` and attached to Resend emails.
- Contact/result persistence through Prisma, plus an optional `CRM_WEBHOOK_URL` sync hook for the Absolute Mind CRM.

## Run locally

```bash
pnpm install
pnpm dev
```

Then open `http://localhost:3000`.

Useful routes:

- `/` — public product landing page
- `/assessments/anxiety-check` — public assessment landing page
- `/assessments/anxiety-check/run` — question flow
- `/assessments/anxiety-check/results` — result page after completing the flow
- `/admin` — workspace dashboard
- `/admin/assessments` — assessment library
- `/admin/assessments/new` — assessment basics editor

## Data architecture

The public and admin flows use the Prisma repository when `DATABASE_URL` is configured, with the original seed data retained as a local fallback. Set `ADMIN_ADDITIONAL_EMAILS` to `mike@mikesweet.co.uk` (alongside the existing `ADMIN_EMAIL`) so Mike can sign in with the configured admin password.

Completed attempts are saved as contacts, scores, answers and email events through Prisma. When `CRM_WEBHOOK_URL` is configured, the same completion is posted to the CRM and the returned external ID is stored in `CrmLinkage`.

## Deployment

The app uses the Next.js App Router and is structured for Vercel. Add `DATABASE_URL`, `RESEND_API_KEY`, `REPORT_FROM_EMAIL` and the optional `CRM_WEBHOOK_URL` / `CRM_WEBHOOK_SECRET` as Vercel environment variables. The report email includes the generated PDF attachment; the external CRM hook is intentionally provider-neutral so it can connect to the existing Absolute Mind CRM without coupling the assessment platform to a vendor SDK.
