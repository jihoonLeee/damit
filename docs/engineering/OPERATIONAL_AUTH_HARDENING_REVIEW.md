# OPERATIONAL_AUTH_HARDENING_REVIEW

## PM verdict

GO

## Why this batch is worth doing now

This is the right point to harden auth because:

- the product already has enough operator surface to justify real-user login
- self-host is now consistent enough to inspect auth tables directly
- magic-link login is part of the actual product path, not a temporary prototype path

## What must be true after this batch

- operators can tell whether a login link was actually sent
- production mode does not leak debug links
- refresh flow is harder to replay because the server rotates the full session identity
- idle sessions stop lingering forever
- failed mail delivery is explicit and inspectable instead of silently falling back
- the UI can acknowledge delivery without showing raw email addresses back to the operator

## Guardrails

- keep the UX simple: email in, link delivered, click to continue
- do not overcomplicate with passwords or multi-factor in this batch
- preserve local development ergonomics through explicit debug mode, not accidental leaks
- keep the current product entry flow intact so `/login -> /home -> /app` still feels simple
- do not add admin-only auth repair workflows in this batch

## PM note

This batch strengthens the current product plan.
It does not change the product strategy.
