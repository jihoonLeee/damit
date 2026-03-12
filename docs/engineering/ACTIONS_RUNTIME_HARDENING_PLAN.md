# ACTIONS_RUNTIME_HARDENING_PLAN

## PM goal

Reduce deployment-pipeline maintenance risk by removing deprecated GitHub Actions usage and making the Tailscale authentication path future-proof.

## Scope

- move `actions/checkout` to a Node 24 runtime version
- remove the deprecated `webfactory/ssh-agent` action in favor of an inline shell-based SSH agent bootstrap
- upgrade Tailscale action usage to the current major version
- make Tailscale auth prefer OAuth client secrets and fall back to auth key only when OAuth secrets are not present
- update setup documentation so repository secrets match the new workflow shape

## Non-goals

- no change to the self-host deployment target
- no change to the app deployment scripts on Ubuntu
- no change to release trigger policy

## Implementation notes

- use `actions/checkout@v5` because the official release notes say v5 moves to the Node 24 runtime
- use `tailscale/github-action@v4` because the official README recommends OAuth client credentials over auth keys
- keep `TAILSCALE_AUTHKEY` as a temporary fallback so existing deploys do not break during migration
- introduce `TAILSCALE_OAUTH_CLIENT_ID`, `TAILSCALE_OAUTH_SECRET`, and `TAILSCALE_TAGS` as the preferred secret set

## Route split decision track

Review `src/app.js` again after the workflow hardening changes land.
A further route split should only proceed if it removes a clearly bounded slice without increasing auth/context wiring risk.

## Validation

- YAML lint by parsing workflow files locally
- existing app regression tests remain green
- run `Self-Host Deploy` once after the workflow update
- confirm the workflow no longer emits Node 20 warnings from checkout or ssh-agent
