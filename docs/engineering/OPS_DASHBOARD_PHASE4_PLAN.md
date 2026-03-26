# OPS_DASHBOARD_PHASE4_PLAN

## PM verdict

GO

## Why this batch exists

The product now has a real email-first login path and stricter session handling.

That means the operations dashboard must answer two new operator questions:

- was the login link actually delivered
- are active sessions still healthy

If `/ops` cannot answer those questions, it is still only an infrastructure board, not an operational console.

## What this batch will change

- repair and replace the current `/ops` microcopy where it is visibly broken
- add auth delivery and session health into the ops snapshot contract
- extend the read-only data explorer with auth-oriented datasets
- add a dedicated auth signal card in `/ops`
- add a recent login delivery feed for owner review

## Required outcomes

- operators can see recent login-link delivery quality
- operators can see active session volume and idle-risk hints
- failed mail delivery produces a visible warning
- data explorer can inspect `login_challenges` and `sessions` without exposing token hashes
- `/ops` copy stays in clear Korean and matches the current DAMIT brand tone

## Guardrails

- stay read-only for auth inspection
- never expose raw token hashes or refresh secrets
- keep the dashboard lightweight and operator-first
- preserve SQLite/Postgres parity in the ops snapshot contract

## PM note

This is not an analytics dashboard.

It is a tighter operator console for a single-node production-like stage.
