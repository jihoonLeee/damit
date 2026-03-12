# APP_ROUTE_MODULE_READINESS_REVIEW

## PM verdict

HOLD

## Current state

`src/app.js` is still large, but the recent extraction of static serving and system/admin endpoints already removed the lowest-risk cross-cutting concerns.

## Why not split again immediately

- auth and business-context guards still cross many write routes
- the current file shape is large but navigable after the last extraction
- another split right now would likely move complexity sideways instead of reducing it
- the deployment-pipeline hardening work has a better short-term payoff than another route rewrite

## Good next split candidates later

- auth session/challenge routes
- field record routes
- job case read/write routes
- customer confirmation routes

## Trigger for the next split

Proceed only when one of these becomes true:

- `src/app.js` grows materially again after new features land
- one bounded route group needs isolated testing or ownership
- PM/Builder/QA all agree the auth/context wiring is stable enough to centralize in reusable route helpers
