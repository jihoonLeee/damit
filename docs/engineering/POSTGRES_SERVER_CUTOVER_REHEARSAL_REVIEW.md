# POSTGRES_SERVER_CUTOVER_REHEARSAL_REVIEW

## Verdict

- GO for preview-only rehearsal tooling

## What changed

- made homelab compose runtime reusable with alternate env files and container names
- added a dedicated preview Postgres env example
- added preview-only rehearsal, smoke, and rollback scripts
- aligned homelab defaults with the current public posture where debug links should stay off
- removed hardcoded `/srv/damit/app` assumptions from helper scripts

## Operational shape

- root runtime remains on port `3210`
- preview Postgres rehearsal runtime uses port `3211`
- preview-only public switch still requires a manual `/etc/cloudflared/config.yml` update on the server

## Evidence

- `bash deploy/homelab/deploy.sh --env-file ... --project-name ...` is now supported by script design
- `bash deploy/homelab/smoke.sh --env-file ... --expect-storage-engine ...` is now supported by script design
- the compose file can now load alternate env files and container names
- server-side preview rehearsal now proves:
  - `127.0.0.1:3211/api/v1/health` returns `storageEngine=POSTGRES`
  - `postgres-preflight` is green on the server
  - `migration-status` is green on the server after checksum repair
  - the preview Postgres container reaches healthy state
- the only remaining manual step is public preview repoint via `/etc/cloudflared/config.yml`

## Remaining gap

- this batch still does not prove the public preview switch or rollback under Cloudflare
- the next step is to:
  - point `preview.damit.kr` to `127.0.0.1:3211`
  - smoke `https://preview.damit.kr`
  - then point preview back to `127.0.0.1:3210`
  - confirm rollback back to SQLite
