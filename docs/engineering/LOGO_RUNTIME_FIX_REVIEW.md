# LOGO_RUNTIME_FIX_REVIEW

Date: 2026-03-27
Owner: PM

## Outcome

- Replaced the broken runtime logo board asset with a production-safe lockup SVG.
- Preserved existing HTML references to `public/logos/damit_default_exact.svg`.
- Kept `damit_icon_exact.svg` as favicon source.

## Expected user-facing effect

- Landing, start, login, home, app-adjacent surfaces, account, admin, and confirm should no longer be pushed or distorted by a giant artboard-sized logo.
- Brand presence remains consistent because the runtime lockup still uses the approved icon and wordmark assets.

## Risk

- Low.
- Change is isolated to a single shared header asset.

## Follow-up

- If the user later exports a true cropped primary lockup SVG, it can replace this wrapper file without changing templates again.
