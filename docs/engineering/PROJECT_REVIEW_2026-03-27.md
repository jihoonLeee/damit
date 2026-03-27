# PROJECT_REVIEW_2026-03-27

## PM summary

- strongest area now is `brand + route clarity + live operations posture`
- `damit.kr` and `preview.damit.kr` are live, real mail works, and the public pilot reads as one coherent product
- do not spend the next batch on broad feature expansion

## Cross-functional review

### PM

- the product now feels like a service, not a prototype
- the biggest remaining risk is overclaiming Postgres production maturity before authenticated preview use is proven

### QA / security

- preview Postgres switch is technically proven
- the last practical blocker is authenticated QA on preview without weakening live auth posture
- `AUTH_DEBUG_LINKS=true` is not acceptable as the answer
- a public QA bypass route is also not acceptable

### UX

- current user-facing surfaces are coherent enough for a realistic acceptance pass
- the next UX bottleneck is not layout polish, but whether a tester can move through the real logged-in flow without special-case manual steps

## Decision

- next approved milestone is `Preview Postgres acceptance gate`
- success means:
  - authenticated preview QA can be run without enabling debug links
  - the full owner/operator path can be exercised on preview Postgres
  - preview can be rolled back to SQLite without affecting root traffic

## Immediate next step

- add a `preview-only`, `script-only`, `non-public` QA session bootstrap path
- use it to run the preview acceptance pass before discussing root Postgres cutover
