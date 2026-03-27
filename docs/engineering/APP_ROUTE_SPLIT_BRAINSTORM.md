# APP_ROUTE_SPLIT_BRAINSTORM

## Problem

- 현재 `/app`은 현장 기록, 작업 건 연결, 변경 견적, 고객 설명 초안, 고객 확인, 합의 기록, 타임라인을 한 화면에 모두 담고 있다.
- 데스크톱에서는 한 번에 많은 정보를 다룰 수 있다는 장점이 있었지만, 실제 사용 관점에서는 "지금 무엇을 먼저 해야 하는지"가 흐려질 수 있다.
- 모바일에서는 한 화면에 여러 단계와 카드가 겹쳐 보여 작업 흐름이 길어지고, 현장 사용 시 집중 포인트가 분산된다.
- 운영 콘솔(`/ops`)에서 작업 화면으로 넘어왔을 때도, 특정 병목을 해결하려는 목적에 비해 `/app` 화면 전체가 너무 넓게 열려 있다.

## Options considered

### 1. `/app` 단일 화면 유지

- pros:
  - 현재 구현을 거의 건드리지 않아도 된다
  - 모든 정보를 한 번에 볼 수 있다
- cons:
  - 모바일에서 과밀하다
  - 단계별 집중이 어렵다
  - `/ops -> /app` handoff의 맥락이 희석된다
- verdict:
  - 유지하지 않음

### 2. 백엔드/도메인 모델까지 전면 재설계하며 완전 분리

- pros:
  - 장기적으로 가장 깔끔할 수 있다
  - 각 단계가 완전히 독립된 표면이 된다
- cons:
  - 현재 제품 안정성을 크게 흔든다
  - 공개 운영 중인 파일럿 단계에서 리스크가 크다
  - Postgres cutover 준비와 병행하기에 부담이 크다
- verdict:
  - 지금 단계에서는 과하다

### 3. 기존 API와 상태 모델은 유지하고, 화면 경로만 단계별로 분리

- pros:
  - 가장 안전하게 UX를 개선할 수 있다
  - `/ops` handoff를 단계별 경로로 더 직접 연결할 수 있다
  - 모바일 집중도가 좋아진다
  - 현재 `/app`를 호환 경로로 남길 수 있다
- cons:
  - 내부적으로는 여전히 shared runtime 성격이 남는다
  - 1차에서는 완전한 코드 분리가 아니라 route split에 가깝다
- verdict:
  - 채택

## Constraints

- 공개 운영 중인 루트 런타임을 불안정하게 만들면 안 된다.
- 기존 API 계약은 1차에서 유지한다.
- 기존 `/app?caseId=...` deep link는 깨지지 않아야 한다.
- `/ops`, `/home`, `/account`의 주요 진입 링크도 함께 조정되어야 한다.
- 모바일 기준으로 "한 화면 한 단계"에 가까운 집중도를 만들어야 한다.

## Route direction

- 1차 canonical route
  - `/app/capture`
  - `/app/quote`
  - `/app/draft`
  - `/app/confirm`
- 1차 compatibility route
  - `/app`
    - 기존 full workspace를 유지하는 호환 경로
- 단계 해석
  - `capture`는 현장 기록 + 작업 건 연결까지 묶는다
  - `quote`는 금액/범위 정리 중심
  - `draft`는 고객 설명 준비 중심
  - `confirm`은 고객 확인 + 합의 기록 중심

## Brainstorm outcome

- 1차는 `route split + stage-focused UI`로 간다.
- `/app`를 바로 제거하지 않고, 새 분리 경로를 주력 동선으로 올린다.
- `/ops` handoff는 이유에 따라 적절한 단계 페이지로 직접 연결한다.
- `/home`의 기본 작업 진입 경로는 `/app/capture`로 바꾼다.
- `/account`의 합의/정산 연관 링크는 `/app/confirm`으로 직접 연결한다.
