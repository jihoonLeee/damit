# ROLLBACK_RUNBOOK_POSTGRES

## Purpose

- define the fastest safe rollback path when the preview Postgres rehearsal fails
- keep `damit.kr` root traffic on the known-good SQLite runtime

## Assumptions

- root runtime stays on port `3210`
- preview rehearsal runtime uses port `3211`
- Cloudflare tunnel ingress for `preview.damit.kr` is the only public switch during rehearsal

## Rollback trigger

Rollback immediately when any of the following happen:

- local rehearsal health does not report `storageEngine=POSTGRES`
- `postgres-preflight` fails on the server
- migrations remain pending
- preview login or core workspace flow fails
- preview response time or repeated `5xx` spikes during rehearsal

## Fast rollback

1. point `preview.damit.kr` back to `127.0.0.1:3210` in `/etc/cloudflared/config.yml`
2. restart `cloudflared`
3. stop the preview Postgres stack
4. confirm preview health is back on SQLite

## Commands

### 1. Repoint preview back to SQLite root stack

Update `/etc/cloudflared/config.yml` so:

```yaml
- hostname: preview.damit.kr
  service: http://127.0.0.1:3210
```

Then:

```bash
sudo systemctl restart cloudflared
sudo systemctl status cloudflared --no-pager
```

### 2. Stop the rehearsal stack

```bash
cd /home/jihoon/damit/app
bash deploy/homelab/rollback-to-sqlite.sh
```

### 3. Confirm preview is back on SQLite

```bash
curl --fail --silent --show-error https://preview.damit.kr/api/v1/health
```

Expected:

- `storageEngine` is `SQLITE`

## Recovery notes

- do not delete the rehearsal env file until the incident review is complete
- keep the latest `postgres-preflight` and `migration-status` outputs for review
- root runtime rollback is not part of this runbook because root should remain on SQLite throughout the rehearsal
