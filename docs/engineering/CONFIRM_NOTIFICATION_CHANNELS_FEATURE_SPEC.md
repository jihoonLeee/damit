# Confirm Notification Channels Feature Spec

## Scope
- customer notification runtime config 추가
- ops runtime readiness 노출
- confirm 화면 안내 강화

## Config
- `CUSTOMER_NOTIFICATION_PRIMARY`
- `CUSTOMER_NOTIFICATION_FALLBACK`
- `KAKAO_BIZMESSAGE_PROVIDER`
- `SMS_PROVIDER`

## Backend
- 새 helper module에서 readiness 계산
- SQLite ops runtime에 customer notification fields 추가
- Postgres ops runtime에도 같은 fields 추가
- account overview security에도 같은 fields 추가

## Frontend
- `/app` confirm card guidance copy 보강
- `/ops` runtime detail rows 추가
- 필요 시 alert 추가

## Readiness States
- `MANUAL_ONLY`
- `KAKAO_CONFIG_REQUIRED`
- `SMS_FALLBACK_CONFIG_REQUIRED`
- `READY`

## QA
- default config에서 manual-only 표시
- kakao primary + sms fallback 미설정 조합에서 ops 경고 표시
- confirm 화면에 현재/목표 채널 안내 노출
