# Preview Runtime Parity Brainstorm

Date: 2026-03-28
Status: GO

## Problem

- preview customer notification smoke reached `preview.damit.kr`
- confirmation link issuance succeeded
- response did not include `delivery`
- persisted `deliveryStatus` was also `null`

## Likely causes

1. preview Postgres stack is running an older image or code snapshot
2. root runtime is newer than preview runtime
3. preview local `3211` runtime is current, but public preview is still routed to a stale process
4. preview env/bootstrap path is dropping code or runtime state during refresh

## Decision

- do not guess from browser behavior
- compare root and preview runtime directly
- inspect real container filesystem and live API behavior
- only after parity is proven should provider smoke continue

