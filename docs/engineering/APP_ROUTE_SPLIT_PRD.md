# APP_ROUTE_SPLIT_PRD

## Goal

- 작업 워크플로를 단계별 페이지로 분리해, 현장/모바일 상황에서도 지금 해야 할 일을 더 빠르게 이해하고 이어서 처리할 수 있게 만든다.

## Why this matters

- 현재 `/app`의 모든 기능은 유용하지만, 한 화면에 너무 많은 단계가 열려 있어 실제 사용에서는 집중이 분산된다.
- 현장형 제품은 "한 번에 한 단계"가 더 중요하다.
- 모바일에서 특히 `기록 -> 견적 -> 설명 -> 확인/합의` 흐름이 분리되어야 사용자가 길을 잃지 않는다.
- `/ops`에서 특정 병목을 보고 작업 화면으로 넘어왔을 때, 전체 워크스페이스보다 해당 단계 화면이 바로 열리는 편이 훨씬 직관적이다.

## Users

- OWNER
- MANAGER
- STAFF

## User stories

- as an owner, I want to open the exact workflow stage I need instead of scanning a full workspace
- as a manager, I want to move from quote work to draft work without carrying unrelated panels on screen
- as a staff member, I want capture work to feel like a dedicated intake screen, especially on mobile
- as an operator, I want `/ops` to hand off a case directly into the correct stage page

## Non-goals

- 백엔드 도메인 모델 재설계
- API contract 대규모 변경
- `/app` full workspace의 즉시 제거
- 1차에서 모든 카드/컴포넌트의 완전한 코드 분리

## Success criteria

- `/app/capture`, `/app/quote`, `/app/draft`, `/app/confirm` 경로가 동작한다.
- `/home`의 주 작업 진입 링크가 새 단계 경로를 가리킨다.
- `/ops` handoff가 작업 이유에 맞는 단계 경로를 연다.
- `/account`의 최근 합의/정산 링크가 `/app/confirm?caseId=...`로 이어진다.
- 모바일에서 각 단계 화면이 full workspace보다 덜 과밀하게 읽힌다.
- 기존 `/app` compatibility 경로는 계속 동작한다.

## Release strategy

### Phase 1

- 새 단계 경로 추가
- 단계별로 불필요한 섹션 숨김
- 기존 shared runtime 재사용
- 주요 진입 링크와 handoff 링크 갱신

### Phase 2

- 단계별 문구와 CTA 추가 정교화
- 필요 시 HTML/JS 모듈도 단계 기준으로 추가 분리
- `/app` 호환 경로 축소 여부 판단
