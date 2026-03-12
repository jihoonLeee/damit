# APP_OPERATOR_POLISH_PLAN

## PM goal

Move `/app` from a pilot-flavored workspace to an operator-facing workspace that feels stable enough for local and self-host operation.

## Scope

- replace remaining pilot or mixed-language copy in the main workspace
- align the page title, hero, status pills, empty states, and health feedback with the `??` brand
- keep all existing ids, form structure, and interaction flow intact
- avoid feature expansion during this pass

## Non-goals

- no API contract changes
- no auth flow redesign
- no layout rewrite beyond copy and small clarity adjustments

## Operator copy principles

- short, directive language for the person using the tool in the field
- operational state should be readable at a glance
- local and self-host runtime should feel intentional, not temporary
- avoid terms like `pilot workspace` inside the operator path

## Planned edits

1. Update `/public/index.html` hero and default labels to `?? ?? ??????` tone.
2. Update `/public/app.js` meta pill text, health messages, and empty-state guidance to Korean operational copy.
3. Re-run syntax and regression checks, then do a browser visual review pass.
