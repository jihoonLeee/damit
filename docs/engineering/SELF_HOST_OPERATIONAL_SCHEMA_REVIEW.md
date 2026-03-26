# SELF_HOST_OPERATIONAL_SCHEMA_REVIEW.md

## PM verdict

GO

## What changed

The SQLite runtime now initializes the auth schema and customer confirmation schema during app boot.

That means a fresh self-host instance is provisioned as one operational product from the start, instead of looking partially initialized until certain feature routes are used.

## Why this matters

This improves:

- deployment confidence
- SQLite inspection clarity
- operational consistency between modules

## Validation

- health bootstrap still passes
- SQLite schema existence is asserted in API tests

## Remaining truth

This does not mean self-host is full public production.
It means the single-node operational runtime is now more internally consistent.
