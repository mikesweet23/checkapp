# Checkapp

Checkapp is a self-hosted, multi-assessment platform for Absolute Mind. It is designed to make a scorecard feel like the start of a useful conversation: calm public flows, meaningful category scoring, personalised result bands and a clear next step.

## What is included

- Premium orange / peach / plum brand shell inspired by Absolute Mind.
- Public assessment landing page and one-question-at-a-time flow.
- Seeded Anxiety Check assessment with four score categories and configurable result bands.
- Client-side score calculation and personalised results page with category breakdown, video placeholder and CTA.
- Admin dashboard, assessment list and create-assessment basics screen.
- Prisma/Postgres model covering assessments, sections, questions, options, score categories, result bands, videos, PDF templates, contacts, attempts, answers, scores, email events and CRM linkage.
- Service seams for PDF generation, email delivery and CRM sync in `src/lib/services.ts`.

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

The first vertical slice uses `src/lib/seed-data.ts` as a deterministic demo store so the interface works without a database. The replaceable production persistence layer is described in `prisma/schema.prisma`; set `DATABASE_URL` from `.env.example` before wiring the repository calls.

The intended next increment is to add authenticated admin actions and API routes that map to the Prisma models, then connect the service seams to a PDF renderer, transactional email provider and the chosen CRM.

## Deployment

The app uses the Next.js App Router and is structured for Vercel. Add `DATABASE_URL` and integration secrets as Vercel environment variables when the database and external services are connected.
