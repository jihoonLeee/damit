# APP_WORKSPACE_PHASE2_PLAN

## PM goal

Upgrade `/app` from a functional operator workspace into a calmer, more decision-friendly daily operations screen.

## Why this batch matters

The current workspace works, but the operator still has to read too much linearly.
The next improvement should reduce scanning cost.

The screen should answer faster:

- what should I do next
- which case needs attention
- whether the selected case is already explained, confirmed, or still pending
- what happened most recently in a case

## Scope

### Included

- stronger operator status strip near the top of `/app`
- selected-case attention summary
- clearer job card copy hierarchy
- cleaner field-record cards
- more readable timeline items
- small visual emphasis improvements without changing the workflow

### Excluded

- no API contract changes
- no new workflow step
- no auth flow changes
- no drag-and-drop or batch actions
- no analytics layer

## PM design principles

- decision first, detail second
- one screen should still feel calm on mobile
- status copy should be operational, not generic
- timeline entries should read like business events, not raw logs

## Acceptance criteria

- an operator can understand the selected case state without reading every section
- list cards scan cleanly in under a few seconds
- timeline entries look like a sequence of business actions
- mobile layout still works without horizontal confusion
