# Confirm Notification Channels PRD

## Objective
- 고객 확인 링크 전달 채널을 제품 안에서 명확히 정의하고, 운영자가 현재 전달 방식과 목표 채널 전략을 한눈에 이해할 수 있게 한다.

## Primary Users
- OWNER
- MANAGER

## Success Criteria
- `/app/confirm`에서 현재 고객 전달 방식이 무엇인지 바로 이해할 수 있다.
- `/ops`에서 고객 알림 채널 준비 상태를 확인할 수 있다.
- 운영 문서와 런타임이 모두 `카카오 알림톡 우선, SMS fallback` 전략을 기준으로 정렬된다.

## Non-Goals
- 실제 카카오 알림톡 API 발송 구현
- 실제 SMS 발송 구현
- 고객 전화번호 수집/정규화 UX 추가

## Functional Requirements
- 환경변수로 고객 알림 primary/fallback 전략을 선언한다.
- 런타임은 아래를 계산해 노출한다.
  - primary channel
  - fallback channel
  - kakao configured 여부
  - sms configured 여부
  - operational readiness
- `/app/confirm`는 현재 고객 확인 링크가 어떤 채널 전략을 전제로 전달되는지 안내한다.
- `/ops`는 운영 상세에 고객 알림 채널 준비 상태를 추가한다.

## Initial Defaults
- `CUSTOMER_NOTIFICATION_PRIMARY=KAKAO_ALIMTALK`
- `CUSTOMER_NOTIFICATION_FALLBACK=SMS`
- provider 미설정 시 readiness는 `MANUAL_ONLY`

## Acceptance
- provider 미설정 상태에서 `/ops`는 수동 전달 모드로 읽힌다.
- `/app/confirm`은 "현재는 링크 복사 후 수동 전달"과 "목표 채널은 카카오/SMS"를 동시에 설명한다.
- provider를 나중에 추가해도 구조를 다시 갈아엎지 않아도 된다.
