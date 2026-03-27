# APP_STAGE_POLISH_PRD

## Summary

`/app/quote`, `/app/draft`, `/app/confirm` 화면을 단계 전용 화면답게 더 강하게 다듬는다. 각 단계 상단에 현재 집중 행동, 완료 기준, 다음 단계 이동을 보여주는 focus card를 추가하고, 모바일에서 단계 카드 밀도를 더 줄인다.

## Product outcome

- 작업자가 각 단계 화면에 들어왔을 때 즉시 주 행동을 이해한다.
- 한 단계가 끝나면 다음 단계로 이어지는 경로가 더 짧아진다.
- 모바일에서도 "이제 뭘 눌러야 하지?"라는 망설임이 줄어든다.

## Primary users

- 현장 이후 변경 견적과 설명을 정리하는 사장님
- ops handoff로 특정 단계 카드만 빠르게 확인해야 하는 운영자

## User stories

- quote 화면에서 금액 저장이 필요한지, 이미 끝났는지 바로 알고 싶다.
- draft 화면에서 초안 생성 후 바로 다음 확인 단계로 넘어가고 싶다.
- confirm 화면에서 링크 발급, 합의 기록, 보류 상태 중 무엇을 먼저 해야 하는지 알고 싶다.

## Requirements

### Functional

- 단계별 focus card가 상단에 보인다.
- focus card는 다음 항목을 가진다.
  - 현재 단계 상태 배지
  - 현재 해야 할 행동 제목
  - 짧은 설명
  - 완료 기준
  - 1차 CTA
  - 2차 CTA 또는 다음 단계 이동
- CTA는 현재 단계 상태에 따라 텍스트와 동작이 바뀐다.
- route별 visual review 캡처를 추가한다.

### UX

- 모바일에서 stage 화면은 관련 없는 카드 노출을 더 줄인다.
- CTA 버튼은 한 줄에 몰아넣기보다 모바일에서 세로로 쌓인다.
- "다음 단계" 문구는 기술적 설명보다 운영형 문장으로 짧게 쓴다.

## Risks

- CTA가 많아지면 기존 `ops-return-card`와 역할이 겹칠 수 있다.
- 단계별 문구를 잘못 잡으면 사용자가 현재 상태를 오해할 수 있다.

## Release gate

- `quote`, `draft`, `confirm` 각 화면에서 CTA가 정상 렌더링된다.
- visual review에 stage route 캡처가 추가된다.
- 공개 회귀 테스트가 모두 통과한다.
