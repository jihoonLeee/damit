# OPS_DASHBOARD_PHASE2_PLAN

## PM goal

Upgrade `/ops` from a simple status screen into a signal-rich operator dashboard.

## Why now

The product is no longer positioned as a pilot-only tool.
The operator surface needs to feel trustworthy, deliberate, and useful during daily operation.

The current dashboard is correct but too passive:

- it answers "what exists"
- it does not clearly answer "what needs attention"

## Phase 2 scope

### Included

- stronger visual hierarchy for the top metrics
- operational alert strip
- backup freshness emphasis
- release visibility emphasis
- recent operator activity section
- more polished Korean operator copy
- mobile-safe layout improvements for `/ops`

### Excluded

- destructive actions beyond backup creation
- tenant/user management
- full audit explorer
- log search
- charts that imply historical retention we do not yet store

## Required backend support

Extend `ops-snapshot` so the UI can render richer operator signals without extra endpoint fan-out.

### Proposed snapshot additions

- `generatedAt`
- `activity.recentAuditLogs`
- `backupSummary.latestBackupAt`
- `backupSummary.latestBackupName`
- `backupSummary.totalRecentBackups`

## UX direction

### Top layer

- one hero banner with current operational verdict
- one alert strip for anything needing attention

### Summary cards

- service health
- latest backup
- release version
- storage mode

### Detail sections

- operational snapshot details
- recent operator activity
- recent backups

## PM acceptance criteria

- an owner can understand system state in under 10 seconds
- an owner can tell whether backup freshness is acceptable
- an owner can see which release is running without opening another tool
- the dashboard remains usable on mobile width
- copy reads like an operator product, not an internal prototype
