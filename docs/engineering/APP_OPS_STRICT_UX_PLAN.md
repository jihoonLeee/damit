# App/Ops Strict UX Plan

## Goal
- 운영자가 첫 5초 안에 현재 상태와 다음 액션을 이해할 수 있게 `/app`, `/ops`, 랜딩의 정보 우선순위를 다시 정리한다.
- 보기 좋은 화면보다 판단이 빠른 화면을 우선한다.

## PM criteria
- 첫 시선이 제목이 아니라 `다음 액션`으로 이어져야 한다.
- 장식 카드보다 운영 신호 카드가 먼저 읽혀야 한다.
- 카드 내부 텍스트 대비가 충분해야 한다.
- 같은 상태를 여러 카드에서 반복 설명하지 않는다.

## Review findings
1. `/app` 상단 signal board는 의도는 좋지만 실제 DOM 바인딩 누락 때문에 일부 요약이 갱신되지 않는다.
2. 작업 건 목록은 상태는 보이지만 `지금 뭘 해야 하는지`가 카드 한 장만 보고는 약하다.
3. `/ops`는 정보가 많아졌지만 아직 `지금 바로 할 일`이 상단에서 분리되어 보이지 않는다.
4. 랜딩 highlight 첫 카드의 대비가 약해 브랜드 신뢰를 깎는다.
5. 현재 visual review는 로그인 후 운영 화면 캡처가 아니라 비로그인 표면 위주라 엄격한 UX 검증 증거가 부족하다.

## Change set
- `/app`에 상단 priority strip 추가
- 작업 건 카드에 `다음 액션` 마이크로카피 추가
- `/ops`에 상단 운영 priority checklist 추가
- 랜딩 strong card 대비 강화
- visual review에 authenticated `/app`, `/ops` 캡처 추가
