# Ops/App Risk Priority Phase 1

Date: 2026-03-26
Owner: PM

## Goal

`/ops`가 단순 최근 활동 추천이 아니라, 지금 가장 먼저 봐야 하는 작업 건 하나를 더 정확하게 뽑아주도록 만든다.
`/app`는 `/ops`에서 넘어온 이유를 더 짧고 직접적으로 설명해서, 작업자가 왜 이 카드를 먼저 봐야 하는지 바로 이해하게 만든다.

## Problem

- 현재 `/ops` handoff는 최근 고객 확인/최근 타임라인/세션 신호 중심이라, 실제 병목 작업 건 판단이 다소 넓다.
- 현재 `/app` handoff 카드는 이유를 잘 설명하지만, 왜 우선순위로 올라왔는지 한 단계 더 또렷하게 보일 여지가 있다.
- 운영자 입장에서는 `최근`보다 `지금 가장 위험한 작업 건`이 먼저 읽혀야 한다.

## Scope

1. 운영 스냅샷에 `focusCases`를 추가한다.
2. `focusCases`는 아래 우선순위로 계산한다.
   - 고객 확인 `VIEWED`
   - 고객 확인 `ISSUED/VIEWED` 장기 정체
   - `ON_HOLD`
   - 변경 금액 미정리
   - 설명 초안 미생성
   - 고객 확인 링크 미발급
   - 합의 기록 검토
3. `/ops` priority와 handoff는 `focusCases[0]`를 가장 먼저 반영한다.
4. `/app`는 query param으로 넘어온 ops focus reason을 읽고 handoff 카드를 더 직접적으로 표현한다.

## Non-goals

- 새로운 관리자 권한 추가
- 새로운 작업 흐름 단계 추가
- 메일 로그인 cutover 진행

## Validation

- `api.test.js`에서 `/api/v1/admin/ops-snapshot`에 `focusCases`가 포함되는지 확인
- `auth-foundation.test.js`, `api.test.js` 회귀 확인
- `visual-review.mjs`로 `/ops`, `/app` authenticated 캡처 회귀 확인
