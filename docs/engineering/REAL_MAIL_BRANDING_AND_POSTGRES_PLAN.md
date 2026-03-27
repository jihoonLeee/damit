# REAL_MAIL_BRANDING_AND_POSTGRES_PLAN

Date: 2026-03-27
Owner: PM
Status: proposed

## Why this batch

- Real login mail delivery now works, so the next maturity gap is message quality.
- The current login and invitation emails are functionally correct but too plain for a live service.
- PM priority after live mail proof is still Postgres readiness, but that work should start with a clear operating sequence, not a rushed cutover.

## Scope

### 1. Real mail branding polish

- Upgrade the login email subject from plain utility wording to a more professional product tone.
- Upgrade the invitation email subject to match the same brand tone.
- Replace the minimal paragraph-only HTML with a structured email layout:
  - branded header
  - clear primary CTA button
  - short operational summary
  - fallback copyable link
  - security note
- Keep the email HTML simple and broadly compatible with common inbox clients.

### 2. Postgres next-step discipline

- Record the exact next execution order for external DB readiness.
- Keep PM judgment explicit:
  - do not cut over immediately
  - prepare preflight, backup, and migration sequence first

## Implementation notes

- Prefer a text-first branded lockup over depending on SVG rendering inside email clients.
- Keep the CTA and fallback link both present.
- Include challenge validity guidance in the login email.
- Invitation email should feel like a real operator workflow, not a developer preview artifact.

## QA target

- Unit coverage confirms the new subjects and branded HTML/text content exist.
- Existing auth and API flows remain green.

## PM judgment

- This batch is `GO`.
- It improves immediate customer-facing quality without widening runtime risk.
