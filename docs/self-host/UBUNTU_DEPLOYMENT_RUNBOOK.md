# UBUNTU_DEPLOYMENT_RUNBOOK

## Goal

Deploy the app to a home Ubuntu server for private pilot use.

This runbook assumes:

- Ubuntu 22.04 or newer
- Docker Engine and Docker Compose plugin installed
- SSH access to the server
- deployment from a checked-out repo directory

## Recommended server layout

- app root: `/srv/damit/app`
- persistent data: `/srv/damit/data`
- backups: `/srv/damit/backups`
- optional reverse access tooling managed separately

## Step 1. Base OS preparation

- update packages
- create an app user if needed
- install Docker and Compose plugin
- enable unattended security updates if desired
- enable firewall before any external access

Recommended minimum firewall posture:

- allow `22/tcp` only if SSH is needed
- restrict SSH to key auth
- do not publish app port directly yet

## Step 2. Copy project to server

Suggested path:

- clone or copy repo into `/srv/damit/app`

Required files already exist in the repo:

- `Dockerfile`
- `deploy/homelab/docker-compose.yml`
- `deploy/homelab/.env.example`

## Step 3. Create self-host env file

1. copy `.env.example` to `.env`
2. set:
   - `APP_BASE_URL`
   - `OWNER_TOKEN`
   - `OWNER_ID`
   - optional mail settings
3. keep:
   - `STORAGE_ENGINE=SQLITE`
   - `OBJECT_STORAGE_PROVIDER=LOCAL_VOLUME`

## Step 4. Prepare persistent directories

Create these directories on the server:

- `/srv/damit/data`
- `/srv/damit/backups`

Make sure the Docker runtime user can write there.

## Step 5. Boot the app

From the repo root:

1. `docker compose -f deploy/homelab/docker-compose.yml --env-file deploy/homelab/.env up -d --build`
2. confirm container is healthy
3. check `GET /api/v1/health`

Expected self-host result:

- runtime is `SQLITE`
- storage engine in health payload is `SQLITE`
- app loads on the bound local port

## Step 6. Seed or reset as needed

For a clean walkthrough:

- `docker compose -f deploy/homelab/docker-compose.yml exec app node scripts/reset-data.mjs`

For a demo dataset:

- `docker compose -f deploy/homelab/docker-compose.yml exec app node scripts/seed-demo-data.mjs`

## Step 7. Local operational checks

Run inside the container or via `docker compose exec`:

- `node tests/api.test.js` only if running test tooling on the server is acceptable
- `node scripts/local-restore-rehearsal.mjs`

Minimum acceptance:

- health green
- P0 flow works
- restore rehearsal green

## Step 8. Exposure decision

Do not expose the app publicly by default.

Preferred order:

1. Tailscale access to the server
2. Cloudflare Tunnel to the local app port
3. direct port-forwarding only if you intentionally accept the higher ops risk

See [EXPOSURE_OPTIONS.md](EXPOSURE_OPTIONS.md).

## Step 9. Backup discipline

- keep SQLite and uploads on persistent disk
- run [../../deploy/homelab/backup.sh](../../deploy/homelab/backup.sh) on a schedule
- periodically copy backups off the server to another machine or external disk

## Step 10. PM release rule

Self-host is `GO` only for private pilot use if:

- health is green
- restore rehearsal is green
- local owner-token workspace works
- beta login route still loads
- no direct public app-port exposure exists without an explicit decision

