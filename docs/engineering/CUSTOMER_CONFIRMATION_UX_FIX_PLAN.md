# Customer Confirmation UX Fix Plan

## Goal
- 고객 확인 링크 화면이 처음 보는 사용자도 신뢰하고 완료할 수 있게 정리한다.
- 확인 완료 후 아무 반응이 없는 것처럼 보이는 상태를 제거한다.
- `/app`의 합의 완료 이후 상태를 `추가 액션 없음`에 가깝게 명확히 표현한다.

## PM findings
1. `confirm.html`, `confirm.js` 한글 인코딩이 깨져 신뢰를 크게 해친다.
2. 고객 확인 완료 버튼을 눌러도 성공 상태가 눈에 띄게 바뀌지 않아 완료 여부를 확신하기 어렵다.
3. 합의 완료 이후 `/app` 문구가 `마무리 점검` 중심이라 현업 사용자가 아직 할 일이 남았다고 느낀다.
4. 고객 확인 카드 내부 간격과 레이아웃 규칙도 메인 제품 표면과 통일성이 약하다.

## Change set
- `confirm.html` 전면 재작성
- `confirm.js` 전면 재작성
- confirm 전용 spacing/layout styles 추가
- `/app` 완료 상태 문구를 `추가 조치 없음 / 기록 확인용` 중심으로 조정
- visual feedback 문구를 더 명확하게 변경
