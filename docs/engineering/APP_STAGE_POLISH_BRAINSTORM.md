# APP_STAGE_POLISH_BRAINSTORM

## Problem

- `/app/capture`, `/app/quote`, `/app/draft`, `/app/confirm` 경로 분리는 되었지만, 각 단계 화면이 아직 완전히 "한 단계만 처리하는 화면"처럼 느껴지지는 않는다.
- 특히 모바일에서는 현재 단계의 핵심 CTA가 카드 안쪽에 묻혀 있고, 다음 단계로 이어지는 기준도 화면 상단에서 바로 읽히지 않는다.
- 시각 검수도 아직 `/app` 중심이라 stage route 자체의 품질 증거가 부족하다.

## User signal

- 사용자가 각 작업별로 화면을 나누는 흐름이 더 직관적이라고 피드백했다.
- 모바일까지 고려하면 "한 화면에서 한 가지 주된 행동"이 더 강하게 보여야 한다.

## Goal

- `quote`, `draft`, `confirm` 각 화면의 상단에서 지금 해야 할 행동과 완료 기준을 바로 보여준다.
- 모바일에서는 불필요한 맥락 전환 없이, 현재 단계의 카드와 CTA에 집중하게 만든다.
- visual review가 stage route별 캡처를 남기도록 확장한다.

## Non-goals

- 백엔드 데이터 모델 변경
- `/app` 전체 호환 경로 제거
- 새로운 운영 권한/역할 추가

## Direction

1. 각 단계 화면에 전용 `stage focus / CTA card`를 둔다.
2. CTA는 "지금 해야 할 행동"과 "다음 단계로 넘어갈 조건"을 같이 보여준다.
3. 모바일에서는 stage 화면에서 불필요한 카드 밀도를 더 줄인다.
4. `visual-review.mjs`에 stage route 전용 캡처를 추가한다.

## Success criteria

- `quote`, `draft`, `confirm` 화면에서 상단만 보고도 "무엇을 해야 하는지" 판단할 수 있다.
- 모바일 캡처에서 단계 CTA와 핵심 카드가 fold 안쪽에 더 잘 들어온다.
- stage route별 시각 증거가 산출물로 남는다.
