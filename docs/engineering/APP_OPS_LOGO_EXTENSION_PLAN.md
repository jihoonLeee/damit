# App Ops Logo Extension Plan

Date: 2026-03-26
Owner: PM

## Goal

`/app`와 `/ops`의 내부 운영 표면에도 최종 로고 자산을 직접 노출해, 바깥 진입면과 안쪽 작업 화면의 브랜드 연속성을 강화한다.

## Scope

- `public/index.html`
- `public/ops.html`
- `public/styles.css`

## Rules

- 정보 구조와 액션 구조는 바꾸지 않는다.
- 로고는 헤더 상단 보조 계층으로만 넣는다.
- 내부 운영 화면은 여전히 빠른 스캔이 최우선이므로 과장된 브랜딩은 피한다.

## Validation

- auth/api 회귀 테스트
- 필요 시 visual review 재시도
