# SEO Command Centre — Deploy on TrueNAS (Dockge)

A self-hosted, no-paid-APIs SEO toolkit for **Weddings By Mark** (perfectweddingsbymark.uk).

## What's in this stack

| Container | Image / Build | Port | Purpose |
|---|---|---|---|
| `seo-mongo` | `mongo:7` | internal | Stores audits + checklist progress |
| `seo-backend` | Built from `deploy/Dockerfile.backend` | 8001 (internal) | FastAPI app — all `/api/*` routes |
| `seo-frontend` | Built from `deploy/Dockerfile.frontend` (nginx) | **8088 → 80** | React UI + nginx reverse-proxies `/api/*` to backend |

## Quick start on TrueNAS (Dockge)

1. **Save to GitHub** from the Emergent chat input (top right) so you have the full repo.
2. SSH into TrueNAS and `git clone` the repo to your Dockge compose folder (e.g. `/mnt/pool/dockge/seo-command-centre`).
3. In Dockge, create a new stack pointing at `deploy/docker-compose.yml`.
4. (Optional) change `"8088:80"` to whatever host port you want.
5. (Optional) if you want it on a subdomain like `seo.perfectweddingsbymark.uk`, point your reverse-proxy (Traefik / NGINX Proxy Manager / Caddy) at the `seo-frontend` container.
6. Hit **Deploy**. First build takes 2-3 minutes.

## Subdomain example (NGINX Proxy Manager)

- Domain: `seo.perfectweddingsbymark.uk`
- Forward Hostname / IP: `seo-frontend` (or your TrueNAS IP)
- Forward Port: `8088`
- Enable SSL via Let's Encrypt.

Done — the backend is automatically proxied behind the same hostname under `/api/*`.

## Local-only mode

If you don't want a subdomain, just visit `http://<truenas-ip>:8088` on your LAN.

## Updating

```bash
cd /mnt/pool/dockge/seo-command-centre
git pull
docker compose -f deploy/docker-compose.yml build
docker compose -f deploy/docker-compose.yml up -d
```

## Backups

The Mongo volume is named `seo_mongo`. To back it up:

```bash
docker exec seo-mongo sh -c 'mongodump --archive' > seo-backup-$(date +%F).archive
```

## Environment variables you can tweak

- `MONGO_URL` — defaults to `mongodb://mongo:27017` (in-cluster).
- `DB_NAME` — defaults to `seo_command_centre`.
- `CORS_ORIGINS` — set to your subdomain in production, e.g. `https://seo.perfectweddingsbymark.uk`.
- `REACT_APP_BACKEND_URL` (build-arg) — leave empty if backend is proxied under the same hostname.

## What's inside

- **Site Auditor** — Fetches any URL, parses HTML, scores 20+ on-page / technical / content factors.
- **Schema Generator** — JSON-LD for LocalBusiness + Photographer in one click.
- **Location Page Builder** — 74 pre-loaded towns across Lancashire, Manchester, Wirral, North Wales & Staffordshire.
- **Meta Optimiser** — Title + description suggestions with length guards.
- **Keyword Density Checker** — Avoid stuffing, avoid under-using.
- **SEO Checklist** — 50 prioritised, weighted, ethical tasks. Tracked over time with streaks.
- **Competitor Snapshot** — Side-by-side stat compare with winner highlights.

Nothing leaves your server. No paid APIs. No tracking.
