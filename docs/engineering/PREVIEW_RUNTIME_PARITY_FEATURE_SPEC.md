# Preview Runtime Parity Feature Spec

Date: 2026-03-28
Status: GO

## Scope

- inspect remote root runtime container
- inspect remote preview Postgres runtime container
- compare:
  - `/app/src/app.js` delivery response path
  - package/runtime state if needed
  - live response payloads
- fix deploy/refresh path if preview is stale
- rerun preview customer notification smoke

## Non-goals

- redesign customer notification flow
- root Postgres cutover

