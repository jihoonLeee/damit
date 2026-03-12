# APP_STRUCTURE_PHASE2_PLAN

## PM goal

Improve readability and operational clarity without changing the product flow.

## Scope

- extract low-risk routing concerns out of `src/app.js`
- improve `/app` card and timeline microcopy for real operator usage
- enhance `/ops` with lightweight release/version visibility

## Non-goals

- no API contract redesign
- no full route-module breakup across every endpoint
- no new infrastructure dependency

## Structure decision

Use another incremental `DDD-lite` step:

- move static/public route serving into a dedicated HTTP helper
- move admin health and ops endpoints into a dedicated HTTP helper
- keep business-heavy field agreement flows in `src/app.js` for now

## UX decision

- make job cards read like actionable work summaries
- make timeline items feel like a running operational history
- make ops console show whether the current node is running an identifiable release

## Validation

- syntax checks for the touched server and frontend files
- existing API and auth regression tests
- browser visual review after the copy changes
