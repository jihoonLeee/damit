# Production Customer Confirmation Review

Date: 2026-03-12
Stage: Production Batch A extension
Decision: GO

## Scope

- 내부 beta workspace 에서 고객 확인 링크를 발급할 수 있어야 한다.
- 고객은 로그인 없이 링크를 열고 설명/사진/변경 금액을 확인할 수 있어야 한다.
- 고객의 열람/확인 흔적이 내부 작업 건 detail 과 timeline 에 남아야 한다.

## Agent Discussion

### PM

- 단순 링크 생성보다 `열람 -> 확인 -> 내부 증빙`이 이어져야 제품 가치가 생긴다.
- 고객 확인은 법적 계약 대체가 아니라 설명 확인 흔적이어야 한다.
- 내부 담당자가 다시 같은 링크를 복사할 수 없는 구조는 아쉽지만, beta 단계에서는 `재발급`으로 대체 가능하다.

### Feature

- 도메인을 `customer_confirmation_link` 와 public confirm flow 로 분리하면 auth/RBAC 와 충돌이 적다.
- link status 는 `ISSUED -> VIEWED -> CONFIRMED`, 예외로 `REVOKED`, `EXPIRED`로 두는 게 충분하다.
- agreement_record 와 customer confirmation 은 합치지 않고 분리해 두는 편이 분쟁 책임 범위를 덜 흐린다.

### Builder

- 기존 snapshot store 에 억지로 우겨 넣기보다 별도 SQLite module 로 분리하는 편이 구현 안정성이 높다.
- public confirm route 는 page 와 API 를 나눠야 브라우저 렌더링과 테스트가 단순해진다.
- beta workspace UI 는 새 card 하나로 붙이고, 발급/복사/열기/status 확인만 제공하는 것이 현재 범위에 맞다.

### QA

- 최소 통합 증거는 `발급`, `public 열람`, `public 확인`, `detail status 반영`, `timeline 이벤트 반영` 5개다.
- 이 배치에서는 `tests/customer-confirmation.test.js` 로 위 흐름을 끝까지 검증했다.
- 회귀 범위는 API/auth/repository/beta-workspace/customer-confirmation 다섯 세트가 모두 green 이어야 한다.

## Implemented

- `POST /api/v1/job-cases/{id}/customer-confirmation-links`
- `GET /api/v1/public/confirm/{token}`
- `POST /api/v1/public/confirm/{token}/acknowledge`
- `GET /confirm/{token}` public page shell
- beta workspace customer confirmation card
- public confirmation page UI
- timeline append on issue / acknowledge
- detail response includes `latestCustomerConfirmationLink`

## PM Acceptance Check

- 설명 초안과 변경 금액 없이 링크 발급 불가: pass
- 고객 로그인 없이 확인 가능: pass
- 열람/확인 흔적 남음: pass
- 내부 detail 에 최신 상태 보임: pass
- 기존 auth / tenant / pilot API 회귀 없음: pass

## Remaining Risks

- 현재는 마지막으로 발급한 raw url 을 서버가 재노출하지 않으므로, 재복사가 필요하면 재발급해야 한다.
- customer confirmation audit 는 별도 SQLite module 이라 business timeline 과 완전한 단일 transaction 은 아니다.
- object storage 전환 전까지 사진 레이어는 local volume 기반이다.

## Next Recommended Step

1. Managed Postgres 실제 연결
2. object storage adapter 도입
3. customer confirmation 재발급/히스토리 UI
4. mail provider 실연동 후 링크 발송 UX 연결