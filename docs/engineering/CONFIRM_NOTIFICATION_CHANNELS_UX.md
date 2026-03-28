# Confirm Notification Channels UX

## Product Message
- 인증은 이메일
- 고객 알림은 카카오/문자

## `/app/confirm`
- 고객 확인 링크 카드 아래에 `전달 방식 안내`를 넣는다.
- 톤:
  - 지금은 수동 전달
  - 목표는 카카오 알림톡 우선, 문자 fallback
- 링크를 발급한 뒤 운영자가 해야 할 행동을 짧게 안내한다.
  - 링크 복사
  - 고객에게 전달
  - 열람/확인 상태 추적

## `/ops`
- runtime detail에 고객 알림 채널 행을 추가한다.
- 경고가 필요한 경우만 alert로 올린다.
  - 카카오 우선인데 provider 미설정
  - SMS fallback인데 provider 미설정

## Copy Principle
- 미래 계획처럼 추상적으로 쓰지 않는다.
- "지금은 수동", "목표 채널은 카카오/SMS", "설정이 되면 여기서 운영 상태를 다시 본다"처럼 현재와 목표를 함께 보여준다.

## Mobile
- confirm 카드의 전달 가이드는 2~3줄 내로 짧게
- ops detail은 라벨/값 쌍으로 유지
