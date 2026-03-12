# PILOT_HARDENING_CHECKLIST

## 목적

- 외부 파일럿 전에 `작동은 하지만 거친 상태`를 `작동 + 운영 가능한 상태`로 끌어올린다.
- PM이 파일럿 직전 `GO / NO-GO`를 판단할 수 있게 한다.

## PM 판단

- 현재 상태: `GO with hardening tasks completed in this round`
- 핵심 판단: P0 사용자 흐름은 작동하고, 파일럿 운영 안전장치와 SQLite 저장소가 추가됐다.

## 이번 라운드에서 완료한 안정화

- [x] 저장 엔진을 `SQLite`로 전환했다.
- [x] 기본 DB는 빈 상태로 정리했다.
- [x] 샘플 데이터는 런타임 기본값이 아니라 `seed:demo` 스크립트로 분리했다.
- [x] health 응답에 `storageEngine`을 노출해 운영 확인이 쉬워졌다.
- [x] `admin/storage-status` 조회를 추가했다.
- [x] `admin/backup` 백업 경로를 추가했다.
- [x] `admin/reset-data` 파일럿 리셋 경로를 추가했다.
- [x] 잘못된 리셋 요청은 명시적 에러로 막는다.
- [x] 운영 스크립트 `reset:data`, `seed:demo`를 package script로 노출했다.
- [x] 관련 API 테스트를 추가했다.
- [x] Fly.io volume 배포 설정 초안을 추가했다.

## 파일럿 전 필수 확인

- [ ] `npm start` 후 `GET /api/v1/health`가 `200`인지 확인
- [ ] `storageEngine=SQLITE`가 응답에 보이는지 확인
- [ ] 실제 모바일 브라우저에서 사진 업로드 1회 확인
- [ ] `copy-draft` 후 카카오톡 또는 메모 앱 붙여넣기 1회 확인
- [ ] 파일럿 시작 전 `npm run reset:data` 수행
- [ ] 데모가 필요할 때만 `npm run seed:demo` 사용
- [ ] 파일럿 시작 직전 `admin/backup` 또는 파일 백업 1회 수행

## 남은 현실적 리스크

### P1

- 현재 SQLite는 파일럿에 충분하지만 단일 머신 전제가 있다.
- 업로드 파일 정리 정책은 아직 수동 운영에 가깝다.

### P2

- 초안 문구 품질은 여전히 파일럿 피드백으로 조정해야 한다.
- 관리자 화면이 없어 백업/리셋은 API 또는 스크립트 중심이다.

## PM 결론

- `사장님 1~2명 / 3~5건` 수준의 작은 외부 파일럿은 가능하다.
- 다음 단계의 핵심은 기능 추가보다 실제 파일럿 회고와 운영 패치다.
