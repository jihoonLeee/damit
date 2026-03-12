# LIVE_SMOKE_RUNBOOK

## 목적

- 배포된 파일럿 URL에서 핵심 P0 흐름이 실제로 작동하는지 재실행 가능한 방식으로 확인한다.
- 점검 후 라이브 데이터를 다시 비워 파일럿 시작 상태를 유지한다.

## 실행 조건

- 배포 URL이 살아 있어야 한다.
- `OWNER_TOKEN`을 알고 있어야 한다.
- 운영자가 `reset-data`를 실행해도 되는 타이밍이어야 한다.

## 권장 명령

```bash
OWNER_TOKEN=... BASE_URL=https://field-agreement-jihoon.fly.dev npm run smoke:live
```

## 스크립트가 하는 일

1. `GET /api/v1/health` 확인
2. 배포 전 상태 백업 생성
3. 빠른 현장 기록 생성
4. 작업 건 생성
5. 현장 기록과 작업 건 연결
6. 변경 견적 저장
7. 설명 초안 생성
8. 합의 기록 저장
9. 상세와 타임라인 검증
10. 라이브 데이터 초기화
11. 초기화 후 health 재확인

## 운영 주의

- 이 스크립트는 기본적으로 마지막에 `reset-data`를 실행한다.
- 실제 파일럿 세션 중이라면 `RESET_AFTER=false`로 바꿔야 한다.
- 결과 JSON은 실행 로그로 남기고, 주요 포인트만 [RUNBOOK.md](/D:/AI_CODEX_DESKTOP/docs/engineering/RUNBOOK.md) 운영 기록에 요약한다.

## PM 기준 통과 조건

- 모든 단계가 `ok: true`로 종료된다.
- `draft` 단계에서 변경 금액이 문구에 반영된다.
- `agreement` 이후 상세 상태가 `AGREED`로 일치한다.
- `reset-after` 이후 health counts 가 모두 0이다.
