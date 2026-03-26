## PM 판정

`GO`

모바일 시각 검수 관점에서 `/app` review 모드의 프레이밍 문제가 유의미하게 개선됐다.

## 이번 배치에서 해결한 문제

- `review=detail` 캡처에 상단 운영 요약 블록이 먼저 잡혀 실제 상세 흐름이 잘 보이지 않던 문제
- `review=agreement` 캡처가 핵심 카드보다 빈 영역 또는 어색한 프레임을 잡던 문제
- 기존 작업 건을 선택해도 workflow 요약이 최신 상세 상태를 다시 반영하지 않아, `합의 완료` 건이 초기 단계처럼 보이던 문제

## 반영 내용

### 1. review 모드 전용 레이아웃 정리

- `workspace-meta`
- `workspace-signal-board`
- `workspace-priority-strip`

위 영역을 `review=detail`, `review=agreement`, `review=copy`에서 모두 숨겨, 검수 목적의 핵심 카드만 남기도록 조정했다.

### 2. agreement / copy review 집중화

- `review=agreement`에서는 `합의 기록` 카드에만 집중되도록 불필요한 카드와 점프 UI를 숨겼다.
- `review=copy`에서는 `설명 초안` 카드만 보이도록 정리했다.

### 3. review 스크롤 안정화

`renderReviewState()`를 보강해 review 모드에서 한 번 더 정착 스크롤을 수행하도록 바꿨다. 이로써 agreement/copy 캡처가 더 안정적으로 핵심 섹션을 잡게 됐다.

### 4. workflow 요약 실제 상태 반영 복구

`loadJobCaseDetail()` 이후 `renderWorkflowState()`를 다시 호출하도록 수정했다. 이제 기존 작업 건을 선택했을 때도 현재 상태가 상세 카드와 같은 기준으로 보인다.

## 검증

- `node --check D:\AI_CODEX_DESKTOP\public\app.js`
- `node --check D:\AI_CODEX_DESKTOP\scripts\visual-review.mjs`
- `node D:\AI_CODEX_DESKTOP\tests\api.test.js`
- `node D:\AI_CODEX_DESKTOP\tests\auth-foundation.test.js`
- `node D:\AI_CODEX_DESKTOP\scripts\visual-review.mjs`

## 결과 요약

- `mobile-detail-top.png`: 선택된 작업 건과 종료 상태가 실제 흐름 기준으로 읽힌다.
- `mobile-agreement.png`: 합의 카드 중심 프레임으로 정리됐다.
- review 모드가 이제 “검수용 한 장면”으로 더 일관되게 동작한다.

## 다음 권장 작업

1. `/app` 모바일 agreement 카드의 버튼/입력 필드 밀도를 한 번 더 줄여 실제 조작성을 높이기
2. `/ops`도 모바일 전용 review 프레임을 만들어 운영 대시보드 캡처 기준을 맞추기
