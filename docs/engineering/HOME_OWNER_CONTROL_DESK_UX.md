# Home Owner Control Desk UX

## Narrative
- `/home`는 출발점이다.
- OWNER에게만 "오늘 운영에서 뭐가 가장 급한가"를 먼저 보여준다.
- 하지만 `/home` 자체가 무거운 운영 콘솔이 되면 안 된다.

## Layout
- 기존 `Current Session / Next Action` 아래에 `Owner Control Desk` 섹션 추가
- 2단 구성
  - 상단: summary strip
    - 이번 달 합의 금액
    - 누적 합의 금액
    - 최근 합의 시각
  - 하단: 대표 action card
    - 가장 먼저 볼 작업 건
    - 왜 지금 봐야 하는지
    - 먼저 볼 카드
    - 완료 기준

## Copy Rules
- 정산 카드는 숫자보다 해석을 먼저 준다.
  - 예: "이번 달 마감 흐름"
  - 예: "누적 합의 금액"
- 대표 action card는 `/ops`의 경고 카피를 그대로 복사하지 않고 더 짧게 쓴다.
  - 왜 지금
  - 먼저 볼 것
  - 끝나면 어디로

## Empty State
- 합의가 아직 없으면
  - "이번 달 확정된 합의가 아직 없습니다"
- focus case가 없으면
  - "오늘 즉시 점검할 운영 병목은 없습니다"
  - CTA는 `/app/capture`

## Mobile
- summary strip은 1열로 내려간다.
- 대표 action card는 CTA를 세로로 쌓는다.
- `/home`가 너무 길어지지 않도록 control desk 안에는 최대 1개의 focus case만 보여준다.
