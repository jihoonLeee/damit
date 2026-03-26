# Self-Host Port Change To 3210

Date: 2026-03-26
Owner: PM

## PM reason

Another app on the same home server is already using host port `3100`.

To avoid collisions and keep the `damit` self-host runtime easy to reason about, the recommended host port is now:

- `3210`

Internal container port stays:

- `3000`

## Updated default

Use:

- host port: `3210`
- local public target for Cloudflare Tunnel: `http://127.0.0.1:3210`

## PM verdict

- self-host default port `3210`: `GO`
- this is a host-binding change only
- no application-level runtime change is required beyond env and public-origin docs
