# PRODUCTION_CONSOLIDATION_REVIEW

## PM lead

This batch is a production-consolidation pass, not a new feature batch.

The goal is to make the current product feel like one operating product:

- one session-based auth model
- one operator workspace model
- one company home model
- one owner-only ops model
- one deploy path without deprecated Tailscale auth-key usage

## Cross-agent verdict

### PM

GO, but only if this batch removes confusion instead of adding more structure.

### Feature

The product should stop using visible `beta` or `pilot` wording on active screens.
Historical documents can remain as records, but current entry surfaces, tests, and operational docs must reflect the unified product shape.

### Builder

The highest-value work is:

1. fix broken or garbled Korean copy on active pages
2. align tests and CI with the renamed workspace path and test file
3. remove deprecated workflow fallback once OAuth secrets are available
4. keep route compatibility only through temporary redirects

### QA

The batch is only complete if:

- active product pages render readable copy
- session-based workspace flows still pass regression
- self-host deploy remains green
- the Tailscale GitHub Action no longer relies on `authkey`

## PM decisions

- keep legacy `/beta-home` and `/beta-app` redirects for compatibility only
- remove `beta` naming from active HTML, JS, CSS, CI, and operator copy
- keep historical pilot documents as archive material for now
- update the main README and active operational docs to reflect the current posture
- treat any garbled Korean in current runtime code as a P0 polish defect

## Definition of done

- `/`, `/login`, `/home`, `/app`, `/ops` all present clean production-facing copy
- `/app` and `/ops` remain session-driven
- CI uses the current workspace regression file
- self-host workflows use OAuth client credentials only
- PM can truthfully say the product is one coherent operational product, even if public internet production is still held
