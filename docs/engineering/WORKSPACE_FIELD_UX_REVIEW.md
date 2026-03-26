# Workspace Field UX Review

Date: 2026-03-13
Review leads: PM fallback, QA fallback, move-in-cleaning field-user fallback

## Scope
- `/app` operator workspace
- `/confirm/:token` customer confirmation page
- 실제 현장 사용자 관점에서 "다음 행동이 즉시 보이는가"와 "증거/기록 영역이 주 작업을 방해하지 않는가"를 중심으로 점검

## Findings

### P1. Timeline grows as primary content instead of a bounded evidence rail
- Current detail panel treats timeline as the last full-height card.
- As records accumulate, the entire page keeps growing and the operator loses the feeling of a contained workflow.
- This is especially problematic after agreement is already completed, because the operator is forced to scroll through old evidence to confirm that the case is effectively done.

Recommendation:
- Make timeline a bounded activity rail with internal scroll on desktop.
- Add timeline count + guidance copy in the card header.
- Keep recent items visible first, but stop the card from taking over the whole page.

### P1. Agreed cases still inherit an "ongoing workflow" tone
- `AGREED` already means the product's core process is complete.
- However, the progress rail and some supporting copy still make the operator feel like another operational step remains.
- This creates hesitation at the exact moment that should feel settled.

Recommendation:
- When a selected case is `AGREED`, show a completed state headline instead of step 5 guidance.
- Explicitly say the case is complete inside the product and that the remaining value is re-checking records when needed.
- Reduce urgency language in the priority strip for agreed cases.

### P2. Customer confirmation page needs tighter spacing logic consistency
- The confirmation page is much better than before, but spacing consistency still depends on generic card styles.
- The page should read as one calm review surface instead of stacked generic cards.

Recommendation:
- Standardize card cluster rhythm and card header spacing for the confirmation page.
- Keep acknowledgement state banner visually distinct from informational cards.

## PM Decision
- GO for immediate UX correction.
- Fix timeline containment and agreed-state workflow framing in the same batch.
- Treat confirmation page spacing as a polish item in the same pass because it is user-facing and low risk.
