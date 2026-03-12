# QA HANDOFF

## 구현 범위

- 무의존성 Node 기반 MVP 서버 추가
- 정적 프런트엔드 UI 추가
- `빠른 현장 기록 -> 작업 건 생성/연결 -> 변경 견적 -> 설명 초안 -> 합의 기록 -> 타임라인` 흐름 구현
- JSON 파일 저장소와 업로드 저장소 추가
- 모바일 동선 개선: 상세 우선 이동, 단계 안내, 액션 비활성화 가드
- 런칭 점검용 `GET /api/v1/health` 추가
- 기본 API 계약 테스트 추가

## 변경 파일

- `package.json`
- `server.js`
- `src/config.js`
- `src/store.js`
- `src/http.js`
- `src/multipart.js`
- `src/domain.js`
- `src/validation.js`
- `src/app.js`
- `public/index.html`
- `public/styles.css`
- `public/app.js`
- `tests/api.test.js`
- `data/db.json`
- `docs/engineering/RUNBOOK.md`
- `docs/engineering/PM_SECOND_REVIEW.md`

## 실행한 테스트

- `node tests/api.test.js`
- `npm start` smoke on port `3002` + `GET /api/v1/health`

## QA가 특히 볼 포인트

- 사진 없는 현장 기록 저장 차단
- 기존 작업 건 재연결 차단
- 변경 금액 없는 설명 초안 생성 차단
- `AGREED`인데 확정 금액 없는 합의 기록 저장 차단
- 목록/상세/타임라인 상태 일관성
- 모바일에서 작업 건 선택 후 상세 패널로 자연스럽게 이어지는지
- clipboard 복사 버튼이 실제 브라우저에서 동작하는지

## 남은 리스크

- 브라우저 엔진 부재로 이 환경에서 실제 렌더링 스크린샷 검증은 못 함
- multipart 파서는 MVP 수준의 단순 구현이라 대용량/복합 폼 케이스는 추가 검증이 필요함
- 파일 기반 저장소라 동시성, 복구, 운영성은 제한적임
- 설명 초안 문구 품질은 실제 파일럿 피드백으로 한 차례 더 다듬어야 함
- Windows에서 저장된 JSON BOM 이슈는 `readDb`에서 방어했지만, 장기적으로는 저장 포맷을 더 엄격히 통일하는 편이 좋음
