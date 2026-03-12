# PERMISSION MATRIX

## MVP 실제 구현 범위

| 역할 | 리소스 | 액션 | 허용 여부 | 비고 |
|---|---|---|---|---|
| `OWNER` | `job_case` | 생성/조회/수정 | 허용 | MVP 유일 역할 |
| `OWNER` | `field_record` | 생성/연결/조회 | 허용 | MVP 유일 역할 |
| `OWNER` | `message_draft` | 생성/조회 | 허용 | MVP 유일 역할 |
| `OWNER` | `agreement_record` | 생성/조회 | 허용 | MVP 유일 역할 |
| `OWNER` | `timeline_event` | 조회 | 허용 | MVP 유일 역할 |

## 비-MVP 메모

- `MANAGER`, `VIEWER` 같은 다중 역할은 이후 팀 확장 단계에서 다시 정의한다.
- 현재 API/프론트/백엔드는 `OWNER` 단일 역할만 구현 대상으로 본다.
- MVP 단계에서 권한 오류는 사실상 인증 실패 또는 리소스 소유 불일치 케이스만 고려한다.
- production 권한 모델은 [AUTH_RBAC_SPEC.md](/D:/AI_CODEX_DESKTOP/docs/specs/AUTH_RBAC_SPEC.md)를 source of truth 로 사용한다.
