# Preview Runtime Parity PRD

Date: 2026-03-28
Status: GO

## Goal

Determine whether preview Postgres runtime is truly on the latest code and, if not, restore parity safely.

## User

- PM
- builder
- operator

## Success criteria

- root runtime and preview runtime can be compared by:
  - deployed code markers
  - live API response shape
- root cause is identified
- preview runtime returns customer confirmation `delivery` metadata
- preview smoke can proceed again

