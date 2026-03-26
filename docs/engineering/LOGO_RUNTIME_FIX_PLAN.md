# LOGO_RUNTIME_FIX_PLAN

Date: 2026-03-27
Owner: PM

## Problem

- Public deployment at `damit.kr` looks broken.
- Root cause candidate is the header logo asset `public/logos/damit_default_exact.svg`.
- The current file appears to be the full logo application board, not the cropped runtime lockup.

## Decision

- Keep the current HTML references unchanged.
- Replace `public/logos/damit_default_exact.svg` with a lightweight runtime-safe lockup SVG.
- Compose the runtime lockup from:
  - `public/logos/damit_icon_exact.svg`
  - `public/logos/damit_wordmark_exact.svg`

## Why this path

- Lowest-risk fix for all public surfaces already pointing to the same file.
- Avoids touching many templates during a production incident.
- Keeps favicon and other logo assets unchanged.

## Verification

- Check that `https://damit.kr/` no longer has layout distortion.
- Re-run core regression:
  - `tests/api.test.js`
  - `tests/auth-foundation.test.js`
- Re-run visual review if possible.
- Push and redeploy current production branch.
