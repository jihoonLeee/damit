# VISUAL_REVIEW_AUTOMATION_RECOVERY_PLAN

## Purpose

- Restore automated browser-based visual review for `/`, `/app`, and `/ops`.
- Make authenticated UI review repeatable again after the previous Edge spawn and timeout failures.

## Current problem

- local regression tests are green, but authenticated screenshot proof is weak
- current script depends on direct Edge spawning and is fragile in this environment
- previous evidence showed two failure shapes:
  - `spawn EPERM`
  - long-running headless process that timed out

## PM decision

- GO
- This is worth fixing now because UX/UI quality is a priority and `/ops` plus `/app` have changed recently.
- Scope should stay small: stabilize the script first, do not redesign the whole review pipeline.

## Success criteria

- the script prints clear progress for each capture step
- headless browser invocations fail fast instead of hanging silently
- authenticated capture steps reuse a predictable browser profile path
- at least the script can be re-run with the approved elevated command and produce actionable output

## Planned changes

- make Edge binary resolution more defensive
- add explicit spawn timeout handling
- add clearer progress logging for each capture target
- add safer browser flags for headless execution
- document the result after rerun
