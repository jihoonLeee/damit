# DAMIT

`DAMIT` is an operations product for service businesses that need to explain on-site scope changes, generate customer-facing messages, and keep clear agreement records.

This repository currently contains:

- product strategy and PM documentation
- UX and feature specifications
- a working local operational build
- self-host deployment assets for a trusted internal environment on Ubuntu
- an internal ops console at `/ops`
- production-readiness and migration planning documents

## Current PM posture

- local runtime: `GO`
- self-host trusted environment: `GO`
- staging Postgres runtime: `HOLD`
- public production cutover: `HOLD`

## Local quick start

1. `npm start`
2. open `/login` and sign in
3. move through `/home`, `/app`, and `/ops`

## Core commands

- `npm start`
- `npm run seed:demo`
- `npm run reset:data`
- `npm run backup:restore:local`
- `node tests/api.test.js`
- `node tests/auth-foundation.test.js`
- `node tests/workspace-session.test.js`
- `node tests/local-restore-rehearsal.test.js`

## Key documents

- product readiness: [docs/engineering/PRODUCTION_READINESS.md](docs/engineering/PRODUCTION_READINESS.md)
- production consolidation review: [docs/engineering/PRODUCTION_CONSOLIDATION_REVIEW.md](docs/engineering/PRODUCTION_CONSOLIDATION_REVIEW.md)
- local launch checklist: [docs/engineering/LOCAL_LAUNCH_CHECKLIST.md](docs/engineering/LOCAL_LAUNCH_CHECKLIST.md)
- ops console spec: [docs/engineering/OPS_CONSOLE_SPEC.md](docs/engineering/OPS_CONSOLE_SPEC.md)
- self-host track: [docs/self-host/README.md](docs/self-host/README.md)
- GitHub setup: [docs/engineering/GITHUB_REPOSITORY_SETUP.md](docs/engineering/GITHUB_REPOSITORY_SETUP.md)
- local operational plan: [docs/engineering/LOCAL_OPERATIONAL_VERSION_PLAN.md](docs/engineering/LOCAL_OPERATIONAL_VERSION_PLAN.md)
- DDD-lite review: [docs/engineering/DDD_REFACTOR_REVIEW.md](docs/engineering/DDD_REFACTOR_REVIEW.md)
- release deploy policy: [docs/engineering/RELEASE_DEPLOY_POLICY.md](docs/engineering/RELEASE_DEPLOY_POLICY.md)
- release deploy runbook: [docs/engineering/RELEASE_DEPLOY_RUNBOOK.md](docs/engineering/RELEASE_DEPLOY_RUNBOOK.md)
