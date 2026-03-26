# SECURITY HARDENING PLAN SAMPLE

## 배치 정보
- 대상 기능/배치: magic link 로그인, 고객 공개 확인 링크, `/ops` 운영 화면
- 기준 리뷰 문서: `docs/engineering/SECURITY_REVIEW_SAMPLE.md`
- 현재 게이트 상태: `blocked`
- 목표 배포 시점: P1 해결 후 재검토

## 즉시 수정 항목

| ID | 항목 | 이유 | 담당 주체 | 완료 기준 | 검증 방법 |
|---|---|---|---|---|---|
| S-01 | customer confirm token 재발급 시 기존 token revoke 처리 구현 확인 | 공개 링크 재사용 위험 방지 | builder | 재발급 후 이전 token 접근 실패 | API 통합 테스트 |
| S-02 | `/ops` 접근 로그 필드 보강 | 운영 화면 접근 재구성 가능해야 함 | builder | actor, request id, result 가 로그에 남음 | 로그 샘플 확인 |

## 배포 전 필수 항목

| ID | 항목 | 이유 | 담당 주체 | 게이트 | 완료 기준 | 검증 방법 |
|---|---|---|---|---|---|---|
| G-01 | `/ops` 접근 제한 명시 및 검증 | 운영 화면 노출 방지 | builder / ops | release-review | staging 에서 비권한 접근 차단 확인 | manual smoke + QA summary |
| G-02 | confirm token revoke 시나리오 검증 | 고객 공개 링크 재사용 방지 | builder / qa | release-review | 재발급 후 이전 token 이 `REVOKED` 또는 실패 응답 | API test + QA summary |

## 추후 개선 항목

| ID | 항목 | 이유 | 담당 주체 | 권장 시점 | 검증 방법 |
|---|---|---|---|---|---|
| B-01 | auth challenge IP rate limit 튜닝 | 공격 방어선 개선 | builder | next batch | burst test 로그 검토 |
| B-02 | secret rotation runbook 상세화 | 사고 대응 속도 개선 | pm / ops | next batch | tabletop review |

## 문서 갱신 필요 항목
- 갱신할 specs 문서: `docs/specs/AUTH_RBAC_SPEC.md`
- 갱신할 engineering 문서: `docs/engineering/RUNBOOK.md`, `docs/engineering/SECRET_POLICY.md`
- 갱신 이유: revoke, 운영 접근, 회전 절차를 현재 구현 기준으로 맞추기 위함

## 검증 계획
- builder 검증: revoke 통합 테스트, `/ops` 접근 제한 구현 확인
- qa-review 검증: 공개 링크 재발급, 비권한 운영 접근, STAFF 범위 제한 회귀
- release-review 재검토 조건: P1 모두 close
- 운영 확인 항목: staging secret 분리, `/ops` 비공개 접근 방식 확인

## PM / Release Owner 결정 포인트
- 일정 조정이 필요한 항목: P1 두 건 해결 전 production 연기 여부
- 우회 가능한 항목: confirm 재발급 임시 제한, `/ops` 외부 비노출 유지
- 우회 불가 항목: 공개 링크 무효화, 운영 화면 접근 제한
- 결정 기한: release-review 재실행 전

## 종료 조건
- `blocked` 게이트 항목이 없다.
- 배포 전 필수 항목의 담당자와 검증 방법이 비어 있지 않다.
- PM 또는 release owner 판단이 필요한 항목은 결정 상태가 기록돼 있다.
