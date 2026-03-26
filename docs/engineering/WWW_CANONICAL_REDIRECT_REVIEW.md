# WWW Canonical Redirect Review

Date: 2026-03-27
Owner: PM
Status: GO

## Outcome

The product now treats `damit.kr` as the only production root.

Changes made:

- added app-level canonical redirect support for `www.<canonical-host>`
- preserved path and query string on redirect
- added regression coverage for the redirect behavior
- updated the Cloudflare domain runbook to clarify that `www` should stay redirect-only

## PM judgment

This is the right level of strictness.

- users should only ever learn one production address
- preview remains separate and explicit
- login/session/trusted-origin behavior stays simpler

## Remaining operational note

For the redirect to be visible publicly, `www.damit.kr` still needs one of these:

- Cloudflare redirect rule, or
- tunnel hostname mapping to the same app origin

The app code is now ready for either path.
