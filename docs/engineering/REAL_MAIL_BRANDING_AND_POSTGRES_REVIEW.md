# REAL_MAIL_BRANDING_AND_POSTGRES_REVIEW

Date: 2026-03-27
Owner: PM
Status: complete

## What changed

### Real mail branding

- Login email subject now reads as a product email, not a debug utility.
- Invitation email subject now follows the same branded tone.
- Both login and invitation emails now use a shared branded HTML shell with:
  - `DAMIT` brand header
  - short guidance copy
  - primary CTA button
  - fallback raw link section
  - security/operational footer
- Text-mode fallbacks were upgraded alongside the HTML versions.

### Postgres next-step discipline

- Production readiness now names the next DB phase more concretely:
  1. prepare Supabase project and credentials
  2. run Postgres preflight
  3. validate restore and migration sequence
  4. only then consider runtime cutover

## PM judgment

- Real mail quality is now closer to a customer-facing live service.
- PM still holds the same DB stance:
  - `Postgres cutover`: HOLD
  - `Postgres readiness sequence`: GO

## Residual risk

- Email rendering quality is improved, but inbox-client differences can still vary.
- A true production DB move still depends on external infrastructure readiness, not just app code.
