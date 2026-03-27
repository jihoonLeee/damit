# Home Owner Control Desk Review

## Verdict
- GO

## What Changed
- `/home`에 OWNER 전용 `사장님 운영 데스크`를 추가했다.
- 새 API 없이 기존 `account overview + ops snapshot`을 조합했다.
- OWNER는 `/home`에서 아래를 바로 볼 수 있게 됐다.
  - 이번 달 합의 금액
  - 누적 합의 금액
  - 최근 합의 시각
  - 오늘 점검 신호
  - 가장 먼저 볼 작업 건 1개

## Why This Is Better
- `/account`의 정산 요약과 `/ops`의 병목 신호를 `/home` 시작점에서 한 번에 보여준다.
- `/home`은 여전히 출발점이고, 깊은 운영 점검은 `/ops`, 건별 실행은 `/app`으로 넘긴다.
- 모바일에서도 한 화면에 병목 후보를 여러 개 우겨넣지 않고 대표 액션만 보여줘 밀도가 안정적이다.

## Implementation Notes
- `public/home.html`
  - owner control desk section 추가
- `public/home.js`
  - OWNER일 때만 `/api/v1/admin/ops-snapshot` fetch
  - settlement summary와 focus case를 묶어 렌더링
- `public/styles.css`
  - owner summary cards / focus card 스타일 추가

## QA
- `node --check public/home.js`
- `node tests/api.test.js`
- `node tests/auth-foundation.test.js`
- `node scripts/visual-review.mjs`
- visual review:
  - `output/visual-review/desktop-home-authenticated.png`
  - `output/visual-review/mobile-home-authenticated.png`

## Follow-up
- 정산 화면 2차 확장 후보
  - 기간 필터
  - CSV export
- 이후 `/home`에서 owner control desk와 `/account` 정산 상세의 역할을 더 명확히 나눌 수 있다.
