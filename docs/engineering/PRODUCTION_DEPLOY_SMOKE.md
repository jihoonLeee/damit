# PRODUCTION_DEPLOY_SMOKE

## 배포 대상

- 앱: `field-agreement-jihoon`
- URL: `https://field-agreement-jihoon.fly.dev/`
- 배포 시각: 2026-03-12

## 이번 배포 포함 사항

- company context API 추가
- owner-only invitation API 추가
- invitation link -> magic link token 보존
- refresh cookie rotation 보강
- beta home 에 회사 전환 / 멤버 리스트 / 초대 UI 추가

## 로컬 검증

- `node tests/auth-foundation.test.js` pass
- `node tests/repository-batch-a.test.js` pass
- `node tests/api.test.js` pass

## 라이브 스모크

- `GET /api/v1/health` -> 200
- `GET /` -> 200
- `GET /beta-home` -> 200

## PM 판정

- 이번 배포는 `GO`다.
- 이유는 인증/회사 컨텍스트/초대 흐름이 라이브에서도 entry surface 기준으로 정상 응답하고, 기존 pilot workspace 와도 충돌하지 않기 때문이다.

## 다음 우선순위

- production mail provider credential 연결
- Postgres 실제 연결 및 migration 적용
- tenantized workspace integration
