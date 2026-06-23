# SEO Command Centre — TrueNAS Scale Deployment (Dockge)

Self-hosted SEO toolkit for **Weddings By Mark** running on your own TrueNAS box.

## Target setup

| Setting | Value |
|---|---|
| **Domain** | `seo.weddingsbymark.uk` |
| **Host port** | `30045` |
| **App dataset** | `apps/seo_2026/data` (build cache, yarn/pip cache) |
| **User-data dataset** | `apps_snaps_progs/seo_2026_saved_user` (Mongo + backend storage) |
| **Repo source** | `https://github.com/<you>/SEO_NEW` |

---

## 1. Pre-flight on TrueNAS Scale

1. Create the two datasets (TrueNAS UI → Datasets):
   - `apps/seo_2026/data`
   - `apps_snaps_progs/seo_2026_saved_user`
2. Make sure Dockge is installed and running.
3. Make sure you can reach the internet from Dockge (it needs to clone GitHub).

---

## 2. Drop the stack into Dockge

1. In Dockge → **Add Stack** → name it `seo-command-centre`.
2. Paste `dockge.compose.yml` (rename to `compose.yaml` if Dockge requires).
3. Create a sibling `.env` file (copy `.env.example`) and set:
   ```
   GITHUB_USER=mark-xyz          # ← your GitHub username
   GIT_BRANCH=main
   POOL_PATH=/mnt/tank           # ← your TrueNAS pool mount
   ```
4. Hit **Deploy**.

First build takes 3-5 minutes (clones repo, installs Python + builds React). Watch the logs in Dockge.

---

## 3. Reverse proxy → `seo.weddingsbymark.uk`

Use NGINX Proxy Manager / Traefik / Caddy on TrueNAS:

**NGINX Proxy Manager example:**
- Domain Names: `seo.weddingsbymark.uk`
- Scheme: `http`
- Forward Hostname / IP: `<truenas-ip>`
- Forward Port: `30045`
- Block Common Exploits: ✅
- Websocket Support: ✅
- SSL → Request Let's Encrypt cert → Force SSL → HTTP/2 ✅

That's it — visit `https://seo.weddingsbymark.uk` and you're in.

---

## 4. Update workflow

Whenever you push a change to GitHub:

```bash
# In Dockge UI, stop the stack, then in TrueNAS shell:
cd /path/to/dockge/stacks/seo-command-centre
docker compose -f dockge.compose.yml build --no-cache
docker compose -f dockge.compose.yml up -d
```

Or from Dockge directly, click **Restart** with the **Pull / Rebuild** option.

---

## 5. Backups

Your Mongo data sits at `${POOL_PATH}/apps_snaps_progs/seo_2026_saved_user/mongo/`. Snapshot that dataset on TrueNAS for automatic ZFS-backed backups.

Manual dump:
```bash
docker exec seo-mongo sh -c 'mongodump --archive --gzip' \
  > "/mnt/tank/apps_snaps_progs/seo_2026_saved_user/backups/seo-$(date +%F).archive.gz"
```

---

## 6. Volume map

```
${POOL_PATH}/apps/seo_2026/data/
├── pip-cache/         # Python wheel cache (speeds up rebuilds)
└── yarn-cache/        # Yarn module cache

${POOL_PATH}/apps_snaps_progs/seo_2026_saved_user/
├── mongo/             # MongoDB data files
├── mongo-config/      # MongoDB config DB
├── backend/           # Future: backend exports / uploads
└── backups/           # (suggested) manual mongodump archives
```

---

## 7. Troubleshooting

- **Build fails on clone**: check `GITHUB_USER` in `.env` and that the repo is public (or add a deploy key if private).
- **App loads but `/api/*` fails**: confirm the reverse proxy passes `/api/` to port 30045 (it does by default since nginx inside the frontend container handles that).
- **Mongo permission denied**: ensure dataset `apps_snaps_progs/seo_2026_saved_user` is owned by UID 999 (mongo's user), or set ACL on TrueNAS to allow.
- **Port already in use**: change `30045:80` to another free port and update your reverse proxy.

---

## What this stack is NOT doing
- No external paid APIs.
- No telemetry, no analytics, no tracking.
- No auth (personal tool — protect with the reverse proxy + Cloudflare Access / Authentik if you want).
