# ACTIONS_RUNTIME_HARDENING_REVIEW

## PM verdict

GO

## What changed

- upgraded `actions/checkout` to `v5`
- replaced `webfactory/ssh-agent` with an inline shell-based `ssh-agent` bootstrap
- upgraded Tailscale workflow usage to `tailscale/github-action@v4`
- made Tailscale authentication prefer OAuth client secrets and fall back to `TAILSCALE_AUTHKEY` only when OAuth secrets are missing
- documented the new preferred secret set in `GITHUB_ACTIONS_SELF_HOST_SETUP.md`
- reviewed route-module readiness and decided to hold another `src/app.js` split for now

## Validation

- YAML parsed locally with `PyYAML`
- `node tests/api.test.js`
- `node tests/auth-foundation.test.js`
- remote workflow definition was checked before push to confirm the current GitHub copy was still the previous version

## PM note

This batch should remove the Node 20 warnings from checkout and ssh-agent on the next workflow run.
A Tailscale deprecation warning may still remain until `TAILSCALE_OAUTH_CLIENT_ID` and `TAILSCALE_OAUTH_SECRET` are added to the repository secrets.
