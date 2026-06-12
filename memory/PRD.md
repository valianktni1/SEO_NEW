# SEO Command Centre — Product Requirements

## Original problem statement
Mark (Weddings By Mark, perfectweddingsbymark.uk) asked how Claude Code could rank his site in 24 hours ethically. After clarification, he wanted a self-hosted, no-paid-APIs SEO toolkit, similar to apps we've built before (couples galleries). To run on his TrueNAS via Dockge with a Docker compose yaml. Target service regions: Lancashire, Manchester, Wirral, North Wales, Staffordshire.

## User persona
- Single user: Mark (wedding photographer, UK).
- Self-hosted, no auth required.
- Deploys to his own TrueNAS server via Dockge / Docker Compose.

## Core requirements (static)
- Free, no external paid APIs.
- Ethical SEO only — no black-hat tactics.
- React + FastAPI + MongoDB stack (familiar to Mark).
- All audits performed server-side (httpx + BeautifulSoup) — no API keys needed.
- Pre-loaded with Mark's target regions and 74 town names.
- Pre-loaded with 50 prioritised, weighted, ethical SEO tasks.

## What's been implemented (2026-01)
- ✅ **Site Auditor** — POST /api/audit, 18 scored checks across Technical / On-page / Content categories.
- ✅ **Schema Generator** — JSON-LD output for ProfessionalService + LocalBusiness with optional address, areasServed, aggregateRating.
- ✅ **Location Page Builder** — Generates SEO-ready Markdown + meta + per-page schema for any of 74 towns across 5 regions.
- ✅ **Meta Optimiser** — Title + description suggestions for 7 page types with length guards.
- ✅ **Keyword Density Checker** — Single/bigram/trigram analysis + target-keyword density with good/low/high status.
- ✅ **SEO Checklist** — 50 weighted ethical tasks across 5 categories; toggleable, persists in Mongo.
- ✅ **Competitor Snapshot** — Side-by-side compare with emerald/rose winner highlights.
- ✅ **Dashboard** — Latest score, daily streak, weighted completion %, audit history, category progress.
- ✅ **Dark luxury dashboard UI** — Outfit / Manrope / JetBrains Mono fonts, gold (#C5A059) accent.
- ✅ **TrueNAS / Dockge deployment** — `/deploy/` with Dockerfile.backend, Dockerfile.frontend (nginx), docker-compose.yml, nginx.conf, README.md.
- ✅ **End-to-end tested** — 16/16 backend cases + full frontend e2e via testing agent (100% pass).

## Architecture
- Frontend: React 19 + Tailwind + Radix UI / shadcn at /app/frontend.
- Backend: FastAPI + Motor (Mongo) at /app/backend with all routes prefixed /api.
- Data: MongoDB collections `audits`, `tasks_completed`.

## Prioritised backlog (P0 / P1 / P2)
- P1: Per-audit historical chart on Dashboard (Recharts already installed).
- P1: Export audit as PDF / shareable HTML report.
- P1: Bulk location-page export (download all 74 as a zip of .md files).
- P2: Calendar view of streak and weekly content cadence.
- P2: Bridebook / Hitched / Guides For Brides directory submission tracker.
- P2: Periodic scheduled audits (cron inside backend) with diff alerts.
- P2: Pinterest pin description generator + image filename optimiser.
- P2: Lighthouse-style score timeline (already scaffolded via dashboard endpoint).

## Next tasks
1. (User) Save to GitHub → clone on TrueNAS → run `deploy/docker-compose.yml` in Dockge.
2. (User) Implement schema + meta changes on the live site, then re-audit.
3. (User) Start ticking off the 50-task checklist — Local SEO + Schema tasks first for fastest local-pack wins.
