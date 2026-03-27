# Preview QA Access Brainstorm

Date: 2026-03-27
Owner: PM
Status: shortlisted

## Problem

- `preview.damit.kr` is already the right DB rehearsal environment.
- But realistic QA still takes too many manual steps because sign-in depends on mailbox access.
- Repeating preview checks should be fast without weakening public auth posture.

## Options

### Option A. Turn debug links back on for preview

- Pros:
  - fastest to use
- Cons:
  - weakens preview posture
  - easy to forget and accidentally normalize
- Decision:
  - reject

### Option B. Add a preview-only HTTP backdoor for QA sessions

- Pros:
  - fast browser entry
- Cons:
  - adds a real runtime attack surface
  - creates operational ambiguity
- Decision:
  - reject

### Option C. Add a local operator CLI that creates a normal login challenge and prints a preview magic link

- Pros:
  - reuses real auth flow
  - no public route changes
  - easy to repeat
  - works for both existing users and first-login setup
- Cons:
  - requires local/operator access to env and DB
- Decision:
  - choose

## Chosen Direction

- Build a CLI-only preview QA access toolkit.
- It should issue a normal auth challenge using the existing repository layer and output a preview login URL.
- The preview app continues to verify through the normal `/api/v1/auth/verify` path.
