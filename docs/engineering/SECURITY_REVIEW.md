# SECURITY REVIEW

## 문서 목적

- 현재 배치 또는 기능의 보안 노출면을 문서로 먼저 고정한다.
- `spec-review`와 `release-review` 결과를 같은 형식으로 누적한다.
- builder, QA, PM, release owner 가 같은 보안 게이트를 보게 한다.

## 기본 정보

- 검토 일자:
- 검토 모드: `spec-review` | `release-review`
- 대상 기능/배치:
- 검토자:
- 관련 문서:
  - `docs/specs/FEATURE_SPECS.md`
  - `docs/specs/API_SPEC.md`
  - `docs/specs/AUTH_RBAC_SPEC.md`
  - `docs/specs/PERMISSION_MATRIX.md`
  - `docs/engineering/SECRET_POLICY.md`
  - 필요 시 `docs/engineering/RUNBOOK.md`

## 검토 범위

- 포함 범위:
- 제외 범위:
- 환경:
- 가정:

## 공격면 요약

| 구역 | 현재 노출면 | 현재 통제 | 우려 사항 |
|---|---|---|---|
| 웹/API |  |  |  |
| 인증/권한 |  |  |  |
| 서버/배포 |  |  |  |
| 시크릿/운영 |  |  |  |

## 리스크 목록

| 우선순위 | 항목 | 근거 | 영향 | 권장 조치 | 상태 |
|---|---|---|---|---|---|
| P0 |  |  |  |  | open |
| P1 |  |  |  |  | open |
| P2 |  |  |  |  | open |
| P3 |  |  |  |  | open |

## 현재 통제수단

- 인증:
- 권한:
- 공개 링크:
- 파일 업로드:
- 시크릿 분리:
- 관리자 접근:
- 로그/감사:

## 미확인 영역

- 확인되지 않은 항목:
- 확인에 필요한 입력 또는 테스트:
- 확인 담당:

## Release Gate

- 판단: `go` | `conditional-go` | `blocked` | `unknown`
- 근거:
- 배포 전 반드시 해결할 항목:
- 배포 후 추적 가능한 항목:

## Escalation

- PM 또는 release owner 판단 필요 여부: `yes` | `no`
- 필요한 결정:
- 일정 영향:
- 우회안 가능 여부:
- 반드시 유지할 보안선:

## 다음 단계 handoff

- builder-implementation 에게 넘길 항목:
- qa-review 에게 넘길 항목:
- PM 또는 release owner 에게 넘길 항목:
