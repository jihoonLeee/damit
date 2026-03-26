# Ops/App Risk Priority Phase 2 Plan

Date: 2026-03-26
Owner: PM
Status: planned

## Goal

- `/ops`에서 우선순위를 볼 때 `왜 급한지`뿐 아니라 `얼마나 급한지`, `먼저 어디를 볼지`, `언제 끝난 것으로 볼지`까지 더 빨리 읽히게 만든다.
- `/app`으로 넘어왔을 때 ops handoff가 단순 안내 카드가 아니라 `실행 체크리스트`처럼 보이게 만든다.

## Why now

- 현재도 focus case와 handoff는 동작하지만, 운영자가 화면을 처음 봤을 때 `즉시 / 오늘 안 / 기록 확인` 같은 급도 구분은 더 직접적으로 보여줄 수 있다.
- `/app`에서도 `왜 이 카드부터 봐야 하는지`는 보이지만, 실제로 무엇을 순서대로 보면 되는지는 더 좁혀줄 수 있다.

## Planned changes

1. `/ops`
- focus case 카드에 `긴급도`, `먼저 볼 카드`, `정리 완료 기준`을 붙인다.
- 우선순위 checklist도 같은 분류를 따르도록 정리한다.

2. `/app`
- ops handoff 카드에 `먼저 / 다음 / 완료 기준` 3단 실행 메모를 추가한다.
- 현재 단계 카드와 handoff 설명이 서로 충돌하지 않게 wording을 정리한다.

3. Security review
- 현재 코드 기준 보안 상태를 PM 관점으로 다시 정리한 독립 문서를 남긴다.
- trusted environment 기준과 public production hold 기준을 분리해서 적는다.

## Non-goals

- 권한 모델 변경
- 메일 cutover
- public production 선언
