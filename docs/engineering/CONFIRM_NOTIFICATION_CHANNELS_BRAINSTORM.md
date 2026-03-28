# Confirm Notification Channels Brainstorm

## Goal
- `confirm` 단계의 고객 전달 채널을 이메일이 아니라 `카카오 알림톡 우선, SMS fallback` 구조로 설계한다.

## Why Now
- 로그인/운영 인증은 이메일로 충분하지만, 고객 확인 링크 전달은 한국 현장 업무 특성상 카카오/문자가 훨씬 자연스럽다.
- 현재 제품은 링크 발급 후 복사/수동 전달 구조라, 운영상 "어떤 채널을 기준으로 갈 것인가"가 코드와 화면에 아직 드러나지 않는다.

## Current State
- 고객 확인 링크는 발급만 하고 수동 복사한다.
- 로그인/초대 메일은 Resend로 이미 운영 가능하다.
- 합의 기록의 `confirmationChannel`은 존재하지만, 링크 전달 전략은 별도 런타임 신호가 없다.

## Product Direction
- 인증 채널
  - 이메일 유지
- 고객 알림 채널
  - 1순위: 카카오 알림톡
  - 2순위: SMS fallback
- 초기 구현
  - 실제 provider 연동 전까지는 `manual copy` 유지
  - 대신 runtime과 UI는 이미 카카오/SMS 중심 구조로 바꿔둔다

## What We Can Build Now
- 환경변수 기반 `customer notification readiness`
- `/ops`에서 채널 준비 상태 표시
- `/app/confirm`에서 고객 전달 가이드 표시
- 문서화된 provider 확장 포인트

## Decision
- 이번 배치는 `실제 카카오 연동`이 아니라 `카카오/SMS-ready 구조`를 제품 안에 먼저 심는다.
