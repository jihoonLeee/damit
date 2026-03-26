# App Workflow Phase 3 Plan

## Goal
- Make the main `/app` workflow feel explicit and finishable.
- Reduce ambiguity around where a selected case is in the sequence.
- Make `AGREED` cases read as completed, not merely paused.

## PM hypothesis
- Operators are still forced to infer the current step from scattered cards.
- A small visible progress guide in the detail area will reduce hesitation more than adding more controls.
- The top workflow banner should reflect the selected case state instead of always reading like a static brochure.

## Scope
- Add a visible per-case workflow progress section in the detail area.
- Make the top workflow banner react to the current stage.
- Clarify the agreement card copy so completed cases read as done and editable only if needed.
- Keep API contracts unchanged.

## Non-goals
- No new backend workflow state.
- No new analytics or charts.
- No new roles or permissions.

## Acceptance
- A user can tell the current stage within a few seconds after selecting a case.
- `AGREED` cases clearly read as complete.
- The next action is visible without reading every section.