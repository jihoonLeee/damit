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

## Remaining gap

- this batch does not yet prove the live server rehearsal itself
- the next step is to run the rehearsal on `/home/jihoon/damit/app` and capture:
  - local health on `3211`
  - `postgres-preflight`
  - `migration-status`
  - preview public smoke
  - rollback back to SQLite
