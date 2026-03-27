# Preview QA Access Spec

Date: 2026-03-27
Owner: Feature
Status: proposed

## Scope

### 1. Use the existing CLI helper

- File: `scripts/preview-qa-session-bootstrap.mjs`
- Inputs:
  - `--env-file`
  - `--base-url`
  - `--email`
  - `--display-name`
  - `--company-name`
  - `--invite-email` optional
  - `--invite-role` optional
  - `--output` optional

### 2. Use the existing preview guard helper

- File: `src/qa/preview-session-bootstrap.js`
- Responsibility:
  - assert preview-only host and Postgres intent
  - convert auth cookies into reusable browser artifacts

### 3. Add tests

- File: `tests/preview-qa-session-bootstrap.test.js`
- Cover:
  - preview-only guardrails
  - cookie merge
  - Playwright cookie conversion

## Behavioral Rules

- Must remain preview-only
- Must require `STORAGE_ENGINE=POSTGRES`
- Must require `AUTH_DEBUG_LINKS=false`
- Must not introduce any public runtime QA route

## Output

- Write a JSON artifact containing:
  - base URL
  - next URLs
  - owner cookie header
  - owner Playwright cookies
  - optional invitee cookie header
  - optional invitee Playwright cookies

## Verification

- Local automated test for helper behavior
- One real preview browser walkthrough after implementation
