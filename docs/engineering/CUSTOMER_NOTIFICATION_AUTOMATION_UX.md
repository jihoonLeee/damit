# Customer Notification Automation UX

Date: 2026-03-28
Stage: UX

## Capture / Job Case Creation

- 고객 표시 이름 아래에 `고객 휴대폰 번호` 입력 필드를 추가한다
- 입력은 숫자 중심으로 유도하되 하이픈 입력도 허용하고 저장 시 정규화한다
- 번호가 비어 있어도 작업 건 생성은 가능하지만, 확인 단계에서 manual fallback 이유가 분명히 보여야 한다

## Confirm Stage

- 고객 확인 카드에 `전달 상태`를 별도 줄로 보여준다
- 가능한 상태:
  - 자동 전달 완료
  - 카카오 전달 완료
  - 문자 전달 완료
  - 전달 실패, 수동 전달 필요
  - 고객 번호 없음, 수동 전달 필요
  - provider 설정 필요
- 링크 발급 성공 피드백은 `링크 발급`과 `전달 결과`를 분리해 설명한다

## Ops

- runtime readiness와 별도로 최신 customer confirmation delivery 상태를 읽을 수 있어야 한다
- “카카오 설정 필요”, “문자 fallback 없음”, “수동 전달로 남은 작업 건” 경고를 우선 노출한다

## Account / Home

- 사장님은 운영 데스크에서 현재 자동 전달 준비 여부를 읽을 수 있어야 한다
- 상세 숫자보다 “자동 전달 준비됨/수동 운영 중” 판단이 먼저 보여야 한다
