# Preview QA Access PRD

Date: 2026-03-27
Owner: PM
Status: proposed

## Product Goal

- Let operators enter `preview.damit.kr` quickly for realistic QA without changing public auth rules.

## User

- Internal PM
- Internal QA
- Internal builder/operator

## Problem Statement

- Preview Postgres proof is already live, but each real walkthrough still depends on mailbox access.
- This makes regression loops slower than necessary and discourages frequent preview checks.

## Success Criteria

- An operator can generate a one-time preview login URL in under 10 seconds.
- The login URL uses the existing auth challenge/verify flow.
- No public runtime route or global debug mode is added.
- The tool works with existing users and can also support first-login setup flows.

## Non-Goals

- Do not change the customer-facing login UX.
- Do not change root runtime auth posture.
- Do not replace real mail delivery.
- Do not introduce a permanent preview-only web UI for session injection.

## Functional Requirements

1. The operator can run a CLI command with:
   - env file
   - email
   - next path
   - optional invitation token
2. The command issues a normal login challenge through the repository layer.
3. The command prints a full preview login URL.
4. The generated URL targets `preview.damit.kr` by default.

## Guardrails

- Default base URL must be preview-only.
- The command must not silently generate root-domain links.
- The command must not expose refresh tokens or raw session cookies.

## Release Gate

- Local test coverage exists for the URL generation path.
- A real preview walkthrough succeeds using the generated link.
