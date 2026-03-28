# Customer Notification Automation PRD

Date: 2026-03-28
Stage: PRD
Status: Proposed

## Goal

고객 확인 링크 발급 직후, 조건이 맞으면 카카오 알림톡 또는 문자로 자동 전달하고, 실패 시에도 링크 발급은 유지하면서 운영자가 즉시 수동 후속 조치를 할 수 있게 만든다.

## Non-Goals

- 로그인/인증 채널 변경
- 친구톡/마케팅 메시지
- 대량 발송 캠페인
- 배송/과금 정산 시스템

## Success Criteria

- 작업 건 생성 시 고객 휴대폰 번호를 저장할 수 있다
- 고객 확인 링크 발급 응답이 전달 결과를 포함한다
- provider 설정이 없거나 번호가 없으면 수동 전달로 자연스럽게 fallback 된다
- `/ops`, `/account`, `/app/confirm`에서 전달 상태가 즉시 보인다
- 전달 실패가 링크 발급 자체를 실패시키지 않는다

## User Stories

- 사장님은 고객 번호를 저장하고 확인 링크를 자동 전달하고 싶다
- 현장 담당자는 실패했을 때 무엇을 직접 해야 하는지 바로 알고 싶다
- 운영자는 카카오/SMS 설정이 실제로 준비됐는지 `/ops`에서 확인하고 싶다

## Functional Requirements

- 작업 건 payload에 `customerPhoneNumber` 추가
- 고객 확인 링크 row에 전달 메타 저장
- Solapi Kakao AlimTalk send 지원
- Solapi SMS fallback send 지원
- 발송 시도 결과를 response, timeline, ops surface에 반영

## Failure Policy

- 링크 발급 성공 + 알림 실패: `200` 유지, delivery status는 실패/수동 후속 상태로 반환
- provider 설정 미완료: `200` 유지, delivery status는 manual required
- 고객 번호 없음: `200` 유지, delivery status는 manual required

## Rollout

1. 코드/테스트/문서 반영
2. 자격증명 없는 상태에서 manual fallback 검증
3. Solapi 템플릿/발신번호 준비
4. live smoke
