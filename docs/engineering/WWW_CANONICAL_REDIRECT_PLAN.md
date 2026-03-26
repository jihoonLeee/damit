# WWW Canonical Redirect Plan

Date: 2026-03-27
Owner: PM

## Goal

Make `https://damit.kr` the single canonical product origin.

That means:

- `https://damit.kr` is the public root
- `https://preview.damit.kr` remains a safe preview surface
- `https://www.damit.kr` must never become a second live origin

## Why this matters

- session and trusted-origin logic should only have one public root
- product links, copied URLs, and preview links stay consistent
- brand trust is better when users only see one production hostname

## Decision

Use two layers:

1. Product-level canonical redirect
   - if the app receives a request for `www.<canonical-host>`
   - it redirects to the root canonical host

2. Edge-level hostname mapping
   - Cloudflare can still route `www.damit.kr`
   - but the app will always normalize it to `damit.kr`

## Current canonical rule

- canonical production root: `https://damit.kr`
- canonical preview root: `https://preview.damit.kr`

## Acceptance

- requests with `Host: www.damit.kr` redirect to `https://damit.kr`
- path and query string are preserved
- `preview.damit.kr` is not redirected
- API and page requests both follow the same canonical rule when the request hits the app
