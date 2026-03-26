# Logo Trial Application Plan

Date: 2026-03-26
Owner: PM

## Goal

한 장짜리 로고 보드 이미지를 바로 제품에 넣지 않고, trial asset으로 분리한 뒤 핵심 헤더 표면에 시범 적용한다.

## Scope

- `public/` 아래에 분리형 로고 자산 추가
  - symbol
  - wordmark
  - horizontal lockup
- 아래 표면 헤더에 trial lockup 적용
  - landing
  - start
  - login
  - home
  - account
  - admin
  - confirm

## Rules

- 앱 내부 정보 구조는 건드리지 않는다.
- 이번 라운드는 로고와 헤더 정체성만 본다.
- 기존 브랜드 톤과 충돌하지 않게, `DAMIT` 워드마크 중심으로 간다.

## Validation

- static HTML 구조 확인
- auth/api 회귀 확인
- visual review 캡처 갱신
