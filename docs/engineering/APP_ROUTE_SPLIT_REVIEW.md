# APP_ROUTE_SPLIT_REVIEW

## PM verdict

- GO

## What changed

- `/app/capture`, `/app/quote`, `/app/draft`, `/app/confirm` 경로를 추가했다.
- 1차는 새 HTML 파일을 여러 개 만드는 대신, 기존 `index.html + app.js` shared runtime을 경로 기준으로 다르게 보이게 하는 안전한 route split 방식으로 구현했다.
- `/app`는 기존 full workspace 호환 경로로 유지했다.
- `/home`의 기본 작업 진입은 `/app/capture`로 바꿨다.
- `/ops` handoff는 이유와 target card에 따라 적절한 단계 경로로 직접 연결되게 바꿨다.
- `/account`의 최근 합의 링크는 `/app/confirm?caseId=...`로 직접 연결되게 바꿨다.

## UX effect

- `capture`에서는 현장 기록과 작업 건 연결만 보인다.
- `quote`, `draft`, `confirm`에서는 불필요한 단계 카드를 줄이고 현재 단계 카드 중심으로 읽히게 바뀌었다.
- 모바일에서는 단계별 화면이 기존 full workspace보다 훨씬 덜 과밀하다.
- `capture` 화면에서 작업 건 연결이 끝나면 바로 `quote` 단계로 넘어가 흐름이 자연스럽다.

## Validation

- `node --check public/app.js`
- `node --check public/home.js`
- `node --check public/ops.js`
- `node --check src/http/static-routes.js`
- `node tests/api.test.js`
- `node tests/auth-foundation.test.js`
- `node tests/workspace-session.test.js`
- `node tests/customer-confirmation.test.js`
- `node scripts/visual-review.mjs`

## QA note

- 새 경로 정적 응답 테스트를 `api.test.js`에 추가했다.
- 기존 `/app` 호환 경로도 그대로 유지해서 현재 deep link와 운영 흐름을 깨지 않았다.
- 1차는 route split 중심이다. 단계별 HTML/JS 완전 분리는 후속 배치에서 검토하면 된다.

## Next recommendation

- `/ops`에서 `/app/quote`, `/app/draft`, `/app/confirm`으로 넘어간 뒤 해당 카드가 얼마나 빠르게 해결되는지 실제 사용 기준으로 다시 점검
- 모바일 기준으로 `quote`, `draft`, `confirm` 화면의 문구와 CTA 밀도 한 번 더 polish
- 필요하면 2차에서 `/app` 호환 경로를 overview hub로 재정의
