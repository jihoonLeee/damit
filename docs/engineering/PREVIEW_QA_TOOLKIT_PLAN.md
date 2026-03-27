# Preview QA Toolkit Plan

Date: 2026-03-27
Owner: PM
Status: proposed

## Why this batch

- Preview Postgres runtime is already proven at the environment level.
- The next bottleneck is repeatable authenticated QA on preview.
- A bootstrap tool already exists, but it is not yet fully documented or covered by tests.

## Scope

### 1. Formalize the PM/UX/QA decision

- Lock the next milestone as `preview QA speed`, not new product scope.

### 2. Promote the existing preview QA bootstrap

- Treat `scripts/preview-qa-session-bootstrap.mjs` as the official internal preview entry tool.
- Keep it preview-only and internal-only.

### 3. Add automated coverage

- Add a focused test for preview guardrails and browser cookie artifact conversion.

### 4. Run a real preview walkthrough

- Generate a bootstrap artifact
- Enter preview as an authenticated owner
- Check major authenticated surfaces on the live preview stack

## PM judgment

- `preview QA toolkit`: GO
- `root Postgres cutover`: HOLD
