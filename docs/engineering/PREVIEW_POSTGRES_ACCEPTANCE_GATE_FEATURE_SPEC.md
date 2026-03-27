# PREVIEW_POSTGRES_ACCEPTANCE_GATE_FEATURE_SPEC

## Scope

- add a new script-only preview QA bootstrap command
- add a small helper module for guardrails and cookie formatting
- do not add or modify any public API route

## CLI behavior

### Script

- `scripts/preview-qa-session-bootstrap.mjs`

### Inputs

- `--env-file=<path>` optional
- `--base-url=https://preview.damit.kr` optional override
- `--email=<owner email>` optional
- `--display-name=<owner display name>` optional
- `--company-name=<owner company name>` optional
- `--invite-email=<invitee email>` optional
- `--invite-role=MANAGER|STAFF` optional
- `--invite-display-name=<invitee display name>` optional
- `--output=<artifact path>` optional

## Guardrails

- fail unless effective base URL host starts with `preview.`
- fail if auth debug links are enabled
- fail unless the script is targeting Postgres-backed auth state
- never expose a new public route

## Repository usage

- use repository methods directly:
  - `issueChallenge`
  - `verifyChallenge`
  - `createInvitation`
- use existing auth cookie helpers to build browser-ready cookies

## Output

- write a JSON artifact containing:
  - `baseUrl`
  - `generatedAt`
  - `owner`
    - user summary
    - company summary
    - csrf token
    - cookie header
    - browser cookie list
  - optional `invitee`
  - optional `invitation`
  - `nextUrls`

## QA fit

- browser automation can ingest the cookie list directly
- PM can read the artifact without inspecting implementation details
