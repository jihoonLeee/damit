# Preview QA Access UX

Date: 2026-03-27
Owner: UX
Status: proposed

## Intent

- Improve internal QA speed without adding any new public-facing complexity.

## UX Principle

- Internal QA should feel like a short operational handoff, not a hidden product feature.

## Expected Flow

1. Operator runs a local CLI command.
2. CLI returns:
   - target environment
   - email
   - next path
   - one-time preview login link
3. Operator opens the link in the browser.
4. If the user already exists:
   - login completes directly
5. If the user does not exist:
   - the existing first-login setup form appears
   - operator completes it once

## UX Requirements

- Output should be short and copyable.
- The command should clearly say this is for `preview` only.
- The link should preserve the existing login UX rather than bypass it with a new screen.

## Copy Guidance

- Prefer `preview QA login link`
- Avoid `debug link` wording in this operator tool
- Make it clear that the result is one-time and environment-scoped
