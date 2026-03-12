# Production Postgres Preflight Review

Date: 2026-03-12
Decision: GO for staging connection checks, HOLD for runtime cutover

## Scope

- Postgres 연결 옵션을 production-friendly 하게 정리한다.
- managed provider 의 SSL 요구사항을 코드와 운영 문서에 반영한다.
- 배포된 앱에서 owner-only preflight 를 실행할 수 있게 한다.

## Agent Discussion

### PM

- 지금 필요한 것은 `바로 Postgres 전환`이 아니라 `전환 전에 실패를 빨리 발견하는 장치`다.
- cutover 를 서두르기보다, staging DB 를 붙였을 때 운영자가 혼자서도 연결/SSL/migration 상태를 해석할 수 있어야 한다.
- 따라서 runtime switch 보다 preflight 와 가드가 먼저다.

### Feature

- preflight 는 단순 ping 이 아니라 `database + ssl + migration` 세 축을 함께 보여줘야 의미가 있다.
- app 내부 admin endpoint 와 CLI script 를 같이 제공해야 로컬과 Fly 양쪽에서 같은 절차를 사용할 수 있다.

### Builder

- `pg` 연결 옵션은 helper 로 분리해서 migration, repository, preflight 가 공통으로 써야 drift 가 줄어든다.
- SSL CA path 지원과 redacted database url 출력은 운영 중 필수다.
- app runtime 을 아직 SQLite 로 유지하더라도, owner-only preflight endpoint 는 지금 바로 배포 가치가 있다.

### QA

- 실제 DB 없이도 아래는 테스트 가능하다.
- connection helper redaction
- require mode ssl option 생성
- custom CA loading
- database url 미설정 시 clear guard error
- 기존 regression green 유지

## Implemented

- `src/db/postgres-connection.js`
- `src/db/postgres-preflight.js`
- `scripts/postgres-preflight.mjs`
- `GET /api/v1/admin/postgres-preflight`
- config 에 Postgres SSL / pool / application env 추가
- repository / migrator 가 공통 connection helper 사용
- `tests/postgres-runtime.test.js`

## PM Acceptance Check

- database url guard 가 명확하다: pass
- SSL require / CA path 둘 다 지원한다: pass
- CLI 와 admin endpoint 둘 다 있다: pass
- 기존 SQLite runtime regression 없음: pass
- runtime cutover readiness 까지 갔는가: no

## Current PM Judgment

- `staging Postgres 연결 점검`은 이제 진행 가능하다.
- 하지만 `실제 app runtime 을 Postgres 로 스위치`하기에는 아직 이르다.
- 다음 배치는 `PROD-06 실제 write/read adapter` 또는 `PROD-21 staging env split` 중 하나를 선택해 진행하는 것이 맞다.

## Recommended Next Step

1. staging Managed Postgres 준비
2. `npm run pg:preflight`
3. `npm run migrate:pg`
4. Fly admin preflight 확인
5. 그 다음 Postgres-backed runtime adapter 범위를 좁혀 구현