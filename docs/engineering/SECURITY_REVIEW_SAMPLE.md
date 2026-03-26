# SECURITY REVIEW SAMPLE

## 문서 목적
- `security-hardening` 의 `release-review` 결과가 어떤 밀도로 작성되어야 하는지 보여준다.
- 실제 production 배포 직전 보안 게이트 문서 예시로 사용한다.

## 기본 정보
- 검토 일자: 2026-03-13
- 검토 모드: `release-review`
- 대상 기능/배치: magic link 로그인, 고객 공개 확인 링크, `/ops` 운영 화면
- 검토자: security-hardening sample run
- 관련 문서:
  - `docs/specs/FEATURE_SPECS.md`
  - `docs/specs/API_SPEC.md`
  - `docs/specs/AUTH_RBAC_SPEC.md`
  - `docs/specs/PERMISSION_MATRIX.md`
  - `docs/engineering/SECRET_POLICY.md`
  - `docs/engineering/RUNBOOK.md`

## 검토 범위
- 포함 범위: 인증 흐름, 공개 링크, 관리자 화면, 시크릿 분리, rate limit 정책
- 제외 범위: 외부 침투 테스트, 인프라 취약점 스캔, 제3자 공급망 점검
- 환경: self-host staging 기준 배포 전 검토
- 가정: production 은 인터넷 노출 환경이며 고객 사진과 연락처를 다룬다.

## 공격면 요약

| 구역 | 현재 노출면 | 현재 통제 | 우려 사항 |
|---|---|---|---|
| 웹/API | magic link verify, customer confirm API, `/ops` 접근 | cookie 기반 세션, 문서화된 권한 모델 | customer link 재발급 무효화 규칙 구현 확인 필요 |
| 인증/권한 | OWNER / MANAGER / STAFF 분리, public confirm token | RBAC spec 존재, token hash 저장 원칙 존재 | STAFF 범위 제한 테스트가 실제 코드에 반영됐는지 확인 필요 |
| 서버/배포 | self-host staging, admin preflight endpoint | env validation, runbook 존재 | `/ops` 노출 범위와 운영 접근 제한 확인 필요 |
| 시크릿/운영 | staging / production secret 분리 | SECRET_POLICY 존재 | 관리자 토큰 회전 절차와 사고 대응 문서 보강 필요 |

## 리스크 목록

| 우선순위 | 항목 | 근거 | 영향 | 권장 조치 | 상태 |
|---|---|---|---|---|---|
| P1 | customer confirmation link 재발급 시 기존 토큰 폐기 규칙 검증 부족 | spec 은 있으나 release-review 근거 문서 없음 | 공개 링크 재사용 가능성, 고객 데이터 노출 위험 | 재발급 시 기존 token revoke 테스트 및 로그 검증 추가 | open |
| P1 | `/ops` 운영 화면 접근 제한 기준 불충분 | 내부 도구 존재 문서는 있으나 인증 방식과 감사 로그 기준이 약함 | 운영 화면 노출 시 민감 정보 노출 가능 | `/ops` 접근 권한, 감사 로그, staging/production 노출 차이 문서화 및 테스트 | open |
| P2 | auth challenge IP 기준 rate limit 검증 누락 | AUTH_RBAC_SPEC 에 정책은 있으나 실제 검증 메모 없음 | brute-force 시도 방어 확인 부족 | staging 에서 request burst 테스트 후 결과 기록 | open |
| P2 | 시크릿 회전 runbook 미흡 | SECRET_POLICY 는 있으나 실제 회전 절차가 짧음 | 사고 시 대응 지연 | runbook 에 revoke / rotate / verify 절차 추가 | open |

## 현재 통제수단
- 인증: magic link 기반 challenge, cookie 세션, token hash 저장 원칙
- 권한: OWNER / MANAGER / STAFF 역할 모델, selected company context
- 공개 링크: customer confirm link 만료 및 hash 저장 원칙
- 파일 업로드: 이 배치 범위 외
- 시크릿 분리: staging / production 별도 값 요구
- 관리자 접근: `/ops`, admin preflight endpoint 존재
- 로그/감사: auth, invitation, confirm event audit log 정책 존재

## 미확인 영역
- 확인되지 않은 항목: `/ops` 실 접근 제어, customer confirm revoke 동작, IP 기준 rate limit 결과
- 확인에 필요한 입력 또는 테스트: staging smoke, admin 접근 로그, confirm token 재발급 테스트
- 확인 담당: builder + qa-review + release owner

## Release Gate
- 판단: `blocked`
- 근거: P1 두 건이 고객 데이터 노출 및 운영 화면 노출과 연결됨
- 배포 전 반드시 해결할 항목: confirm token revoke 검증, `/ops` 접근 제한 및 감사 로그 검증
- 배포 후 추적 가능한 항목: IP rate limit tuning, secret rotation runbook 고도화

## Escalation
- PM 또는 release owner 판단 필요 여부: `yes`
- 필요한 결정: P1 선해결 전 배포 연기 여부
- 일정 영향: 최소 1~2일 검증 및 보강 필요
- 우회안 가능 여부: `/ops` 비공개 유지, confirm link 재발급 기능 임시 제한은 가능
- 반드시 유지할 보안선: 공개 링크 무효화, 운영 화면 제한, 감사 로그 확보

## 다음 단계 handoff
- builder-implementation 에게 넘길 항목: confirm revoke 테스트, `/ops` 접근 제어 구현 또는 보강, runbook 업데이트
- qa-review 에게 넘길 항목: 공개 링크 재발급, STAFF 접근 제한, `/ops` 접근 실패 시나리오 검증
- PM 또는 release owner 에게 넘길 항목: 배포 일정 조정, 우회안 승인 여부
