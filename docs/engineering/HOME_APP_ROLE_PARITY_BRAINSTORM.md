# HOME_APP_ROLE_PARITY_BRAINSTORM

## Problem

- `preview.damit.kr`가 Postgres 리허설 스택으로 따로 살아 있으면서, 일반 self-host 배포 뒤에는 최신 프론트를 항상 따라오지 못한다.
- `/home`과 `/app`가 둘 다 "들어가서 뭔가 하는 화면"처럼 보여 역할 차이가 첫 시선에 충분히 분리되지 않는다.

## PM hypothesis

- self-host 배포 뒤에 preview Postgres 스택을 조건부로 같이 갱신하면 `production SQLITE / preview POSTGRES` 비교 검수가 더 신뢰 가능해진다.
- `/home`은 운영 출발점, `/app`은 선택된 작업 건의 단계 실행 허브라는 문법을 더 강하게 드러내면 모바일에서도 덜 헷갈린다.

## User value

- 운영자는 `어디서 상태를 보고, 어디서 실제 작업을 실행하는지`를 더 빨리 이해할 수 있다.
- preview Postgres 검수가 production 최신 UI와 분리되지 않아, cutover 판단 근거가 더 단단해진다.

## Constraints

- 공개 root runtime은 계속 `SQLITE`.
- preview Postgres는 `3211` rehearsal stack을 유지.
- Cloudflare ingress 구조는 그대로 두고, 앱/배포 쪽에서 parity를 해결한다.

## Decision

- 이번 배치에서 두 가지를 같이 처리한다.
  - preview Postgres stack refresh 자동화
  - `/home` vs `/app` 역할 분리 강화
