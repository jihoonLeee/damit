# LIVE_SMOKE_REPORT

## 실행 일시

- UTC: `2026-03-11T15:03:01Z`
- 환경: `Fly.io production`
- URL: [https://field-agreement-jihoon.fly.dev/](https://field-agreement-jihoon.fly.dev/)

## 실행 명령

```bash
OWNER_TOKEN=*** BASE_URL=https://field-agreement-jihoon.fly.dev npm run smoke:live
```

## 결과

- 결론: `PASS`
- 저장 엔진: `SQLITE`
- 핵심 추가 검증: `multipart 한글 메모 보존 정상`
- 종료 후 counts: `jobCases=0, fieldRecords=0, agreements=0`

## 단계별 확인

1. `GET /api/v1/health` 응답 정상
2. 사전 백업 생성 정상
3. 현장 기록 생성 정상
4. 현장 기록 응답에서 한글 메모 보존 확인
5. 작업 건 생성 정상
6. 현장 기록 연결 정상
7. 변경 견적 저장 정상
8. 설명 초안 생성 정상
9. 합의 기록 저장 정상
10. 상세 상태 `AGREED` 확인
11. 상세 화면 데이터에서 한글 메모 보존 확인
12. 타임라인 4개 이벤트 확인
13. 데이터 초기화 정상
14. 초기화 후 health 재확인 정상

## 주요 산출값

- fieldRecordId: `fr_ba368d306df9`
- jobCaseId: `jc_b84e870f2513`
- draftId: `draft_a25a555df1d6`
- agreementId: `ar_a1b9a342f4ff`
- pre-reset backup: `sqlite-live-smoke-before-2026-03-11T15-03-01-55-2026-03-11T15-03-04-960Z.db`

## PM 판단

- 현재 배포본은 `파일럿 가능`을 넘어 `내부 운영 검수 가능한 수준`이다.
- 한글 깨짐 원인이었던 multipart 텍스트 디코딩 문제는 수정됐고, 배포 환경에서도 재현되지 않았다.
- 다음 우선순위는 `새 기능 추가`보다 `실서비스 버전 전환 계획에 맞춘 인증, DB, 운영 구조 개편`이다.
