# DAMIT

`DAMIT` is a field-operations product for service businesses that need to explain scope changes, generate customer-facing draft messages, and keep clear agreement records.

This repository currently contains:

- product strategy and PM documentation
- UX and feature specifications
- a working local MVP
- self-host deployment assets for a private pilot on Ubuntu
- production-readiness and migration planning documents

## Current PM posture

- local runtime: `GO`
- self-host private pilot: `GO`
- staging Postgres runtime: `HOLD`
- public production cutover: `HOLD`

## Local quick start

1. `npm start`
2. open `/app`
3. use `/login` for the beta auth path if needed

## Core commands

- `npm start`
- `npm run seed:demo`
- `npm run reset:data`
- `npm run backup:restore:local`
- `node tests/api.test.js`
- `node tests/auth-foundation.test.js`
- `node tests/beta-workspace.test.js`

## Key documents

- product readiness: [docs/engineering/PRODUCTION_READINESS.md](docs/engineering/PRODUCTION_READINESS.md)
- local launch checklist: [docs/engineering/LOCAL_LAUNCH_CHECKLIST.md](docs/engineering/LOCAL_LAUNCH_CHECKLIST.md)
- self-host track: [docs/self-host/README.md](docs/self-host/README.md)
- GitHub setup: [docs/engineering/GITHUB_REPOSITORY_SETUP.md](docs/engineering/GITHUB_REPOSITORY_SETUP.md)
- local production-like plan: [docs/engineering/LOCAL_OPERATIONAL_VERSION_PLAN.md](docs/engineering/LOCAL_OPERATIONAL_VERSION_PLAN.md)