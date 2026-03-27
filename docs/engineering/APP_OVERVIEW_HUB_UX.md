# APP_OVERVIEW_HUB_UX

## UX principle

- `/app` overview는 편집 화면이 아니라 허브 화면이어야 한다.
- 사용자는 이 화면에서 "현재 작업 건이 어디까지 왔는지"와 "어느 단계로 들어가야 하는지"만 빠르게 판단하면 된다.

## Layout

### Desktop

- 좌측: 작업 건 목록
- 우측:
  - 선택된 작업 건 요약
  - stage route hub 카드 4개
  - 진행 단계
  - 금액 summary

### Mobile

- detail hub를 목록보다 먼저 노출
- stage route 카드는 세로 stack
- 현재 선택된 작업 건 요약과 단계 이동이 fold 위에서 보이게 유지

## Stage hub cards

- 현장 기록
  - 아직 시작 전이면 primary
  - 이미 진행 중이어도 "기록 다시 보기" 성격
- 변경 견적
  - 금액 미저장: `우선 정리`
  - 금액 저장됨: `정리됨`
- 설명 초안
  - 초안 없음: `초안 필요`
  - 초안 있음: `준비됨`
- 확인과 합의
  - 링크/합의 없음: `마무리 필요`
  - 보류: `보류`
  - 합의 완료: `완료`

## Copy direction

- "이 단계로 이동"보다 구체적인 운영 문장을 쓴다.
- 예:
  - `변경 견적 정리하러 가기`
  - `고객 설명 문장 준비하기`
  - `확인과 합의 기록 보기`

## Visual review

- `/app` overview 전용 mobile capture 추가
- overview hub가 편집 카드 없이 허브처럼 보이는지 확인
