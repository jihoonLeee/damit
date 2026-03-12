# MIGRATION_TOOL_DECISION

## 결정

- Production Batch A 의 migration 도구는 `versioned SQL files + lightweight custom runner`로 간다.
- 실행 런타임은 `pg` 클라이언트 기반 스크립트다.

## 이유

- 현재 단계에서 ORM 전체 도입보다 schema 변경 이력을 명시적으로 읽을 수 있는 구조가 더 중요하다.
- PM/Builder/QA가 같은 SQL 파일을 보고 검증할 수 있다.
- 배포와 schema 변경을 분리해 운영할 수 있다.

## 적용 산출물

- migration SQL: [0001_production_core.sql](/D:/AI_CODEX_DESKTOP/src/db/migrations/postgres/0001_production_core.sql)
- manifest: [migration-manifest.js](/D:/AI_CODEX_DESKTOP/src/db/migration-manifest.js)
- runner: [postgres-migrator.js](/D:/AI_CODEX_DESKTOP/src/db/postgres-migrator.js)
- 실행 스크립트: [migrate-postgres.mjs](/D:/AI_CODEX_DESKTOP/scripts/migrate-postgres.mjs)
- 상태 확인: [migration-status.mjs](/D:/AI_CODEX_DESKTOP/scripts/migration-status.mjs)

## PM 코멘트

- 지금은 도구의 화려함보다 운영 추적 가능성이 더 중요하다.
- 실제 beta 이후 schema 복잡도가 크게 올라가면 그때 ORM 또는 더 강한 migration framework 재검토는 가능하다.
