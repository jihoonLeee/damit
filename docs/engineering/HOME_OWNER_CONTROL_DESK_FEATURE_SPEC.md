# Home Owner Control Desk Feature Spec

## Scope
- `/home` OWNER 전용 control desk 추가
- 클라이언트에서 `account overview`와 `ops snapshot` 조합
- `/home` 역할 카피와 경로 안내는 유지

## Frontend Changes
- `public/home.html`
  - OWNER control desk section markup 추가
- `public/home.js`
  - owner 여부 판단
  - `/api/v1/admin/ops-snapshot` fetch 추가
  - settlement + focus case + runtime signals 렌더링
- `public/styles.css`
  - control desk cards / summary strip / focus action card 스타일 추가

## Data Mapping
- `accountOverview.settlementSummary`
  - `totalConfirmedAmount`
  - `confirmedAmountThisMonth`
  - `latestConfirmedAt`
  - `agreementCountThisMonth`
- `opsSnapshot.focusCases[0]`
  - `jobCaseId`
  - `focusWhyNow`
  - `focusTargetStage`
  - `focusBadge`
  - `focusFirstCheck`
  - `focusDoneWhen`
- `opsSnapshot.signals`
  - `customerConfirmations.staleOpenCount`
  - `auth.failedDeliveryCount24h`
- `opsSnapshot.runtime`
  - `mailProvider`
  - `sentryConfigured`

## Rendering Rules
- OWNER가 아니면 control desk 숨김
- `opsSnapshot` fetch 실패 시
  - 정산 요약만 보여주고
  - 운영 리스크 카드는 fallback copy 사용
- settlement가 비어 있어도 카드 자체는 유지

## QA Notes
- OWNER / MANAGER / STAFF 각각 렌더링 차이 확인
- mobile visual review 추가
- `/home`에서 `/app`, `/ops`, `/account` 링크가 올바른지 확인
