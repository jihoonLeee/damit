# EXTERNAL_SERVICES_NEXT_STEPS

Date: 2026-03-27
Owner: PM
Status: proposed

## Current blocker summary

- `Sentry` code integration is complete, but `SENTRY_DSN` is not configured yet.
- `Resend` live mail cutover is still blocked by sender-domain verification.
- The currently available Resend API key is `send-only`, so domain management cannot be completed via API.

## PM judgment

- Product/runtime work can continue.
- Real monitoring and real mail cutover now depend on dashboard-side setup, not app code.
- The fastest safe path is:
  1. enable Sentry with a production DSN
  2. register `updates.damit.kr` in Resend
  3. add Resend DNS records in Cloudflare
  4. verify the domain
  5. rerun live mail smoke

## Track A. Sentry enablement

### Goal

Turn on real runtime monitoring for `damit.kr`.

### What to get

- `SENTRY_DSN`
- optional:
  - `SENTRY_ENVIRONMENT=production`
  - `SENTRY_RELEASE=<git sha or version>`

### Where to set it

- production server env
- optionally GitHub Actions or local production-like env if you also want preview verification

### Minimum recommended values

```env
SENTRY_DSN=<project dsn>
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=<git-sha>
```

### After setting

1. redeploy
2. open `/ops`
3. confirm the Sentry warning disappears
4. verify a captured test error only if you intentionally create a safe test path

## Track B. Resend sender-domain cutover

### Canonical sender domain

- `updates.damit.kr`

### Recommended sender

- `MAIL_FROM=login@updates.damit.kr`

### What to do in Resend

1. open the Resend dashboard
2. go to `Domains`
3. add domain:
   - `updates.damit.kr`
4. copy the DNS records Resend gives you

### What to do in Cloudflare

Add the exact DNS records Resend requests for `updates.damit.kr`.

Typical records may include:

- one or more `TXT`
- one or more `CNAME`

Do not guess the values.
Use exactly what Resend shows for that domain.

### After DNS is added

1. wait for propagation
2. click verify in Resend
3. once verified, change runtime mail settings to:

```env
MAIL_PROVIDER=RESEND
MAIL_FROM=login@updates.damit.kr
AUTH_DEBUG_LINKS=false
AUTH_ENFORCE_TRUSTED_ORIGIN=true
```

4. rerun:

```bash
npm run smoke:mail:production-local
```

5. then validate real login delivery on:

- `https://damit.kr/login`

## Exact user-facing next step

### Do this first

1. create a Sentry project DSN or open the existing project and copy the DSN
2. open Resend dashboard and register `updates.damit.kr`

### Then return with one of these

- `SENTRY_DSN added`
- `Resend gave me DNS records`
- or both

At that point the remaining setup can be driven to completion quickly.
