# MAIL_CUTOVER_HOLD_NOTE

## PM decision

- `실메일 운영 cutover`는 여전히 `HOLD`다.

## Why it is on hold

- `RESEND_API_KEY`와 로그인 링크 발송 코드 경로는 이미 동작 증거가 있다.
- 현재 blocker는 코드가 아니라 `발신 도메인 미검증`이다.
- 따라서 지금 단계에서 가장 좋은 대응은 메일 기능 개발을 더 넓히는 것이 아니라, 제품과 운영 문서에 현재 상태를 더 명확히 드러내는 것이다.

## Current stance

- 로그인 플로우 자체는 `GO`
- 실제 메일 발송은 `도메인 검증 완료 전까지 HOLD`
- 개발/운영 준비도 확인은 `/ops`와 로컬 smoke로 계속 유지

## Re-open condition

- Resend에서 발신 도메인 또는 서브도메인 검증 완료
- `MAIL_FROM`이 검증된 도메인 기반 주소로 고정
- `npm run smoke:mail:production-local` 재실행 성공
