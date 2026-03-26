# Cloudflare Hostname Setup And Server Scripts

Date: 2026-03-26
Owner: PM

## PM goal

Make `damit.kr` publicly reachable through Cloudflare without exposing the home server directly, while keeping the current Ubuntu + Docker Compose runtime.

This document answers:

1. where to create the hostname in Cloudflare
2. what exact hostname order to use
3. what to run on the Ubuntu server before and after each step

## 1. Where to create the hostnames in Cloudflare

If the domain is already on Cloudflare and the zone is active:

1. Open the Cloudflare dashboard
2. Open the `damit.kr` account or zone context
3. Go to:
   - `Zero Trust`
   - `Networks`
   - `Tunnels`
4. Open your existing tunnel, or create one if it does not exist yet
5. Inside the tunnel, go to `Public hostnames`
6. Add hostnames there

This is where the public routes are created.

## 2. What to create first

Do **not** start with the root domain.

Create in this order:

1. `preview.damit.kr`
2. `damit.kr`
3. `www.damit.kr` redirect
4. later, `updates.damit.kr` for mail only

## 3. Exact Cloudflare Tunnel hostname settings

### Preview hostname

Create a public hostname with:

- Subdomain: `preview`
- Domain: `damit.kr`
- Path: empty
- Type: `HTTP`
- URL: `127.0.0.1:3210`

Expected public result:

- `https://preview.damit.kr`

### Root hostname

After preview is stable, add another public hostname:

- Subdomain: empty, or root/apex depending on the UI
- Domain: `damit.kr`
- Path: empty
- Type: `HTTP`
- URL: `127.0.0.1:3210`

Expected public result:

- `https://damit.kr`

### `www` redirect

Do not point `www` to the app directly.
Create a redirect rule:

- from: `https://www.damit.kr/*`
- to: `https://damit.kr/${1}`
- status: `301`

## 4. Recommended sequence

### Phase A. Preview

1. Create `preview.damit.kr` in Tunnel -> Public hostnames
2. Update app env to:
   - `APP_BASE_URL=https://preview.damit.kr`
   - `TRUSTED_ORIGINS=https://preview.damit.kr`
3. Redeploy the app
4. Smoke test preview

### Phase B. Root

1. Create root hostname in Tunnel -> Public hostnames
2. Create `www -> root` redirect
3. Update app env to:
   - `APP_BASE_URL=https://damit.kr`
   - `TRUSTED_ORIGINS=https://damit.kr`
4. Redeploy the app
5. Smoke test root

## 5. Server-side scripts included

The following scripts are now available under:

- [deploy/homelab/check-cloudflared.sh](D:\AI_CODEX_DESKTOP\deploy\homelab\check-cloudflared.sh)
- [deploy/homelab/set-host-port.sh](D:\AI_CODEX_DESKTOP\deploy\homelab\set-host-port.sh)
- [deploy/homelab/set-public-origin.sh](D:\AI_CODEX_DESKTOP\deploy\homelab\set-public-origin.sh)
- [deploy/homelab/smoke-public-host.sh](D:\AI_CODEX_DESKTOP\deploy\homelab\smoke-public-host.sh)

## 6. How to use the scripts

Use your real project path on the Ubuntu server.
If your checkout is under `/home/jihoon/damit/app`, replace the example `cd` path with that real path.

### A. Check the Cloudflare Tunnel service on Ubuntu

```bash
cd /home/jihoon/damit/app
bash deploy/homelab/check-cloudflared.sh
```

This checks:

- `cloudflared` binary presence
- version
- service status

### B. Switch the app to preview origin

```bash
cd /home/jihoon/damit/app
bash deploy/homelab/set-host-port.sh 3210
bash deploy/homelab/set-public-origin.sh --host preview.damit.kr --mode preview
bash deploy/homelab/deploy.sh
```

This updates:

- `APP_PORT`
- `APP_BASE_URL`
- `TRUSTED_ORIGINS`
- `AUTH_ENFORCE_TRUSTED_ORIGIN`
- `AUTH_DEBUG_LINKS`

### C. Smoke test the preview hostname

```bash
cd /home/jihoon/damit/app
bash deploy/homelab/smoke-public-host.sh preview.damit.kr
```

### D. Promote to the root domain

```bash
cd /home/jihoon/damit/app
bash deploy/homelab/set-public-origin.sh --host damit.kr --mode root
bash deploy/homelab/deploy.sh
bash deploy/homelab/smoke-public-host.sh damit.kr
```

## 7. What the scripts intentionally do not do

They do **not**:

- create the Cloudflare hostname for you
- manage the tunnel token
- create redirect rules

Why:

- those actions depend on your Cloudflare account state
- they are safer to do explicitly in the dashboard unless you want a full API-token automation path later

## 8. Practical checklist

### Right now

- [ ] In Cloudflare Tunnel, add `preview.damit.kr -> 127.0.0.1:3210`
- [ ] On Ubuntu, run `check-cloudflared.sh`
- [ ] On Ubuntu, run `set-public-origin.sh --host preview.damit.kr --mode preview`
- [ ] Redeploy
- [ ] Run `smoke-public-host.sh preview.damit.kr`

### After preview passes

- [ ] In Cloudflare Tunnel, add `damit.kr -> 127.0.0.1:3210`
- [ ] In Cloudflare Rules, add `www -> root` redirect
- [ ] On Ubuntu, run `set-public-origin.sh --host damit.kr --mode root`
- [ ] Redeploy
- [ ] Run `smoke-public-host.sh damit.kr`

## PM verdict

This is the safest next step:

- no router port-forwarding
- no broad infra migration yet
- no DB move yet
- public hostname first, state migration later
