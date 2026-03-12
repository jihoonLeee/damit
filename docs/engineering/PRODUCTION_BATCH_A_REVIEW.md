# PRODUCTION_BATCH_A_REVIEW

## 목적

- `PM`, `Builder`, `Feature`, `QA` 관점으로 Production Batch A 산출물을 교차 검증한 기록을 남긴다.
- 만족스러운 수준이 될 때까지 어떤 지점이 수정됐는지 추적한다.

## Round 1

### Builder 제안

- `pg` 의존성 추가
- versioned SQL migration 구조 추가
- Postgres schema 초안 작성
- repository bundle factory 추가

### Feature 피드백

- schema 에 `company_id`, `created_by_user_id`, `visibility`가 실제로 들어가야 한다.
- auth / customer confirmation 엔티티가 schema 에 포함되어야 한다.

### QA 피드백

- migration 파일 존재 여부와 repository contract 자체를 테스트해야 한다.
- `DATABASE_URL` 미설정 시 Postgres bundle 실패가 명확해야 한다.

### PM 피드백

- 방향은 맞지만 이메일 발송 인프라, object storage, OWNER-only invitation 같은 최근 결정이 코드/문서에 덜 반영돼 있다.
- `visibility`와 파일 이관 계획도 같이 연결돼야 한다.

## Round 2

### Builder 수정

- config 에 `DATABASE_URL`, cookie 이름, object storage env 추가
- schema 에 `visibility`, `storage_provider`, `object_key`, auth/audit/customer confirmation 테이블 반영
- Postgres migrator 와 status script 구현
- repository contracts 와 SQLite/Postgres bundle 추가
- foundation 테스트 추가

### Feature 재검증

- `AUTH_RBAC_SPEC`의 OWNER-only invitation, magic link only, cookie/CSRF 방향과 현재 foundation 구조가 일치하는지 확인
- Postgres schema 가 다음 배치 auth/company 모델을 받을 수 있는지 확인

### QA 재검증

- migration manifest test
- repository contract test
- SQL 구조 검증 test

### PM 재검토

- Batch A 범위에서는 충분히 합리적이다.
- 아직 app 전체가 repository bundle 로 전환된 것은 아니지만, 다음 배치에서 들어갈 foundation 은 갖춰졌다.
- 판단: `Batch A GO`

## 남은 리스크

- Postgres adapter 는 아직 foundation scaffold 수준이다.
- 현재 앱 런타임은 여전히 SQLite store 중심이다.
- object storage 는 계획과 구조만 반영됐고 실제 provider 연동은 다음 batch 작업이다.

## 최종 PM 판단

- `문서만 있는 상태`는 넘었다.
- `실제 migration runner`, `schema`, `repository contract`, `task breakdown`, `review trail`이 생겼으므로 다음 단계 구현에 들어가도 된다.
- 다음 우선순위는 `PROD-07 ~ PROD-12`가 아니라, 순서대로 `PROD-07 ~ PROD-10`부터 auth foundation 을 붙이는 것이다.
