# PRODUCTION_CONSOLIDATION_REVIEW

## PM lead

This batch is a production-consolidation pass, not a new feature batch.

The goal is to make the current product feel like one operating product:

- one session-based auth model
- one operator workspace model
- one company home model
- one owner-only ops model
- one deploy path that is stable today and ready for OAuth-only Tailscale later

## Cross-agent verdict

### PM

GO, but only if this batch removes confusion instead of adding more structure.

### Feature

The product should stop using visible `beta` or `pilot` wording on active screens and active routes.
Historical documents can remain as archive records, but current entry surfaces, tests, and operational docs must reflect the unified product shape.

### Builder

The highest-value work is:

1. fix broken or garbled Korean copy on active pages
2. remove legacy beta route aliases from active runtime code
3. align tests and CI with the unified route model
4. repair the self-host deploy workflows so manual dispatch stays healthy
5. keep Tailscale fallback only until OAuth secrets are actually present

### QA

The batch is only complete if:

- active product pages render readable copy
- session-based workspace flows still pass regression
- self-host deploy remains green
- workflow YAML parses cleanly and supports manual dispatch again
- the Tailscale GitHub Action no longer relies on `authkey` once OAuth secrets are present

## PM decisions

- remove legacy `/beta-home` and `/beta-app` route aliases from active runtime code
- remove `beta` naming from active HTML, JS, CSS, tests, and operator copy
- keep historical pilot documents as archive material for now
- update the main README and active operational docs to reflect the current posture
- treat any garbled Korean in current runtime code as a P0 polish defect
- keep Tailscale `authkey` fallback in workflow code until the repository actually contains OAuth secrets

## Current blocker

GitHub repository secret inspection on 2026-03-13 still shows only:

- `TAILSCALE_AUTHKEY`
- self-host SSH/path secrets

The repository does **not** yet contain:

- `TAILSCALE_OAUTH_CLIENT_ID`
- `TAILSCALE_OAUTH_SECRET`

Because of that, the Tailscale deprecation warning cannot be removed safely in this batch without breaking deploys.

## Definition of done

- `/`, `/login`, `/home`, `/app`, `/ops` all present clean production-facing copy
- `/app` and `/ops` remain session-driven
- active runtime code no longer exposes `beta` routes or product wording
- CI uses the current workspace regression file
- self-host workflows are dispatchable and healthy
- PM can truthfully say the product is one coherent operational product, even if public internet production is still held
