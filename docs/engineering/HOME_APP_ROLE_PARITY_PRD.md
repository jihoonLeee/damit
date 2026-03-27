# HOME_APP_ROLE_PARITY_PRD

## Goal

- `preview.damit.kr`가 최신 프론트와 최신 server code를 안정적으로 따라가게 만든다.
- `/home`과 `/app`의 역할을 텍스트, CTA, 정보 위계에서 분명히 분리한다.

## Non-goals

- root runtime의 Postgres cutover
- 새 업무 단계 추가
- 고객 알림 채널 확장

## Success criteria

1. self-host deploy 뒤 preview Postgres stack refresh 경로가 문서/스크립트로 존재하고, env가 있으면 재현 가능하다.
2. `/home` 첫 화면에서 "운영 출발점"이라는 의미가 바로 읽힌다.
3. `/app` overview에서 "건별 실행 허브"라는 의미가 바로 읽히고, 회사/세션/초대는 `/home`로 돌아가야 한다는 점이 보인다.
4. 기존 auth/api/workspace/customer-confirmation 회귀가 깨지지 않는다.

## Primary audience

- OWNER
- MANAGER
- 내부 운영자
