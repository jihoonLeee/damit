# DAMIT Logo Asset Mapping

Date: 2026-03-26
Owner: PM

## Canonical assets

- `public/logos/damit_default_exact.svg`
  - 기본 가로형 lockup
  - landing, start, login, home, account, admin, confirm 헤더용
- `public/logos/damit_icon_exact.svg`
  - 심볼 only
  - favicon, 작은 배지, 소형 로고용
- `public/logos/damit_app_icon_exact.svg`
  - 앱 아이콘형
  - touch icon, 앱 숏컷, PWA 계열 확장용
- `public/logos/damit_vertical_exact.svg`
  - 세로형 lockup
  - 좁은 폭 카드, 향후 onboarding/marketing narrow layout 용
- `public/logos/damit_wordmark_exact.svg`
  - wordmark only
  - 문서 헤더, 넓은 배너, 제휴/브랜드 표기용

## Current product usage

- visible header logo
  - `landing.html`
  - `start.html`
  - `login.html`
  - `home.html`
  - `account.html`
  - `admin.html`
  - `confirm.html`
  - all use `damit_default_exact.svg`

- favicon / browser icon
  - all public HTML surfaces use `damit_icon_exact.svg`

- app icon reserve
  - `damit_app_icon_exact.svg` is prepared but not yet wired to a separate packaging flow

## Note

이번 라운드에서는 기존 trial asset 이름을 유지하지 않고, `public/logos/` 아래 실제 최종 자산을 직접 참조한다.
