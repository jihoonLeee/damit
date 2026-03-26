# AUTHENTICATED_FLOW_QUALITY_GATE_PLAN

## Why this batch

- `/login`, `/home`, `/app`, `/ops` 흐름이 기능적으로는 이어지지만, 시각 검수 증거는 아직 `/app`과 `/ops` 중심이다.
- 운영 홈(`/home`)은 현재 역할과 다음 이동을 설명하는 허브인데, 회귀 캡처와 품질 기준이 상대적으로 약하다.
- 운영 품질을 더 올리려면 `현재 컨텍스트`, `추천 경로`, `보조 경로`가 화면에서도 즉시 구분되어야 한다.

## PM goal

- `/home`를 로그인 이후 운영 허브로 더 분명하게 만든다.
- 인증된 상태의 `/home`, `/app`, `/ops`를 같은 품질 게이트 안에서 캡처하고 비교할 수 있게 만든다.

## Scope

### 1. Home information hierarchy polish

- `/home`의 이동 카드에서 `추천 경로`, `보조 경로`, `OWNER 전용` 같은 차이를 더 명확하게 보여준다.
- 현재 역할에 따라 무엇이 주 작업 화면인지 한눈에 읽히게 한다.
- CTA hierarchy가 현재 역할과 컨텍스트에 맞게 보이도록 정리한다.

### 2. Authenticated visual review expansion

- visual review 스크립트에 인증된 `/home` 캡처를 추가한다.
- `/home`, `/app`, `/ops`가 같은 흐름 안에서 검수되도록 출력 파일 체계를 확장한다.

## Non-goals

- 메일 로그인 cutover
- auth/session API 변경
- 홈 화면에 새 관리 기능 추가

## Success criteria

- `/home`에서 추천 이동 경로가 카드 레벨에서도 바로 구분된다.
- `node scripts/visual-review.mjs` 실행 결과에 인증된 `/home` 캡처가 추가된다.
- 운영 흐름의 핵심 화면 3개(`/home`, `/app`, `/ops`)를 같은 기준으로 다시 점검할 수 있다.
