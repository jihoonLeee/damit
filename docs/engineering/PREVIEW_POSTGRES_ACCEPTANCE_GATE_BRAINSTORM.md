# PREVIEW_POSTGRES_ACCEPTANCE_GATE_BRAINSTORM

## Problem

- preview Postgres runtime is publicly proven
- root remains correctly on SQLite
- the missing proof is real authenticated use on preview plus clean rollback after that use

## Options considered

### 1. Re-enable debug links on preview

- pros:
  - fastest path to QA
- cons:
  - weakens the exact auth posture we are trying to prove
- verdict:
  - reject

### 2. Add a public QA bypass API route

- pros:
  - convenient for automation
- cons:
  - creates a new public risk surface
  - easy to misuse or forget to remove
- verdict:
  - reject

### 3. Use only manual mailbox-driven login

- pros:
  - closest to real user behavior
- cons:
  - slow
  - hard to automate
  - harder to repeat during rollback rehearsal
- verdict:
  - acceptable fallback, not the main gate

### 4. Add a preview-only script that creates QA sessions directly

- pros:
  - no new public route
  - keeps preview auth posture intact
  - repeatable for PM, QA, and browser automation
- cons:
  - needs careful guardrails
- verdict:
  - choose this option

## Constraints

- no weakening of root runtime
- no plaintext token storage
- no public QA endpoint
- output should be usable by browser QA and API QA

## Brainstorm outcome

- create a script-only preview QA bootstrap flow
- script should:
  - require `preview.*` base URL
  - require Postgres-backed runtime intent
  - create an owner QA session
  - optionally create an invitee QA session for join-flow checks
  - output cookie artifacts for browser automation
