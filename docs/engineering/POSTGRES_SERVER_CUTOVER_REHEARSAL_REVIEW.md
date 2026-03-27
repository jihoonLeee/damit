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
- public preview cutover now proves:
  - `https://preview.damit.kr/api/v1/health` returns `storageEngine=POSTGRES`
  - `https://damit.kr/api/v1/health` remains on `storageEngine=SQLITE`
  - root traffic stayed on SQLite while preview was switched
- an operational issue was discovered during the cutover:
  - a second user-run `cloudflared` process was still attached to the same tunnel
  - preview traffic kept landing on the stale connector until that extra process was stopped

## Remaining gap

- this batch now proves the public preview switch under Cloudflare
- the only remaining optional proof is rollback back to SQLite after preview testing is complete
