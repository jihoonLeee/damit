# Ops/App Risk Priority Phase 1 Review

Date: 2026-03-26
Owner: PM
Status: GO

## Result

- 운영 스냅샷에 `focusCases`를 추가해, 최근 활동이 아니라 운영 병목 우선순위 기준으로 작업 건 후보를 계산하도록 바꿨다.
- `/ops`는 가장 위험한 작업 건을 priority와 handoff 양쪽에서 더 직접적으로 보여준다.
- `/app`는 ops focus reason을 받아 `왜 지금 이 작업 건을 보는지`를 더 짧고 분명하게 설명한다.

## Why this is better

- 운영자가 `최근 로그`를 해석하지 않아도, 지금 가장 먼저 볼 작업 건을 바로 이해할 수 있다.
- `/ops -> /app` 이동이 단순 링크 이동이 아니라, 실제 업무 handoff처럼 느껴진다.
- 기존 구조를 유지하면서 판단 로직만 선명해져서 리스크가 낮다.

## Follow-up

- 실제 운영 데이터가 쌓이면 `focusCases` 점수 기준을 다시 미세조정한다.
- 다음 배치에서는 `/ops`의 위험도 설명과 `/app`의 종료/예외 상태 카피를 더 자연스럽게 맞춘다.
