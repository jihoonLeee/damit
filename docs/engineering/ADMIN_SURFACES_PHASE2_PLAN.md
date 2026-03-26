# ADMIN SURFACES PHASE 2 PLAN

## PM objective

Add the first safe system-admin action without turning `/admin` into a destructive control panel.

## Scope

### 1. Read-only export action

- allow internal system admin to export the currently selected dataset as JSON
- keep the action:
  - read-only
  - scoped to the active dataset and limit
  - explicit in labeling

### 2. Explorer action framing

- explain that export is for:
  - investigation
  - debugging
  - evidence capture
- avoid implying that `/admin` is for direct data manipulation

## Success criteria

- `/admin` exposes a visible first action that is useful and low-risk
- export output uses the same dataset selection already shown in the explorer
- system-admin auth regressions remain green

## Out of scope

- destructive admin actions
- cross-tenant writes
- impersonation
- session revocation from `/admin`
