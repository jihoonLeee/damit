# Customer Notification Automation Brainstorm

Date: 2026-03-28
Stage: Brainstorm

## Problem

- 고객 확인 링크는 발급되지만 지금도 운영자가 링크를 복사해서 수동으로 전달해야 한다.
- 모바일 흐름은 단계 분리로 좋아졌지만, 마지막 확인 단계가 자동 전달 없이 멈추면 실제 운영 속도가 떨어진다.
- 현재 데이터 모델에는 고객 휴대폰 번호와 전달 상태 근거가 부족하다.

## Product Direction

- 인증은 이메일 유지
- 고객 확인 링크 전달은 카카오 알림톡 우선, 문자 fallback
- 1차 provider는 하나로 시작해서 구현 복잡도를 줄인다
- provider는 `SOLAPI`를 기준으로 설계한다

## What Must Exist First

- 작업 건에 고객 휴대폰 번호
- 고객 확인 링크의 최신 전달 상태
- provider 설정 유무에 따라 자동 전달과 수동 전달을 명확히 구분하는 런타임 판단
- 전달 실패가 링크 발급 자체를 막지 않도록 하는 안전한 fallback

## First Slice

- `job_cases.customer_phone_number`
- `customer_confirmation_links`에 최신 전달 메타 추가
- Solapi adapter 추가
- 링크 발급 시:
  - phone + provider config가 있으면 자동 전달 시도
  - 아니면 manual fallback
- `/app/confirm`, `/ops`, `/account`, `/home`에서 현재 전달 상태를 읽을 수 있게 정리

## Risks

- 카카오 알림톡은 템플릿 변수 계약이 외부 템플릿과 정확히 맞아야 한다
- SMS fallback까지 실제 발송하면 비용이 든다
- 전화번호 validation을 너무 엄격하게 잡으면 현장 입력이 막힐 수 있다

## PM Call

- 먼저 `연락처 + 전달 상태 + provider adapter + 수동 fallback`까지 구현
- 그 다음 live provider credential과 템플릿이 들어오면 실운영 smoke
