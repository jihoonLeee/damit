---
name: builder-implementation
description: 승인된 specs 문서를 바탕으로 코드, 테스트, 운영 문서를 구현하고 QA handoff 및 구현 리뷰 문서까지 남기는 구현 스킬
---

# Builder Implementation

## 역할
- 승인된 명세를 실제 코드와 설정으로 구현한다.
- 테스트와 운영 문서까지 함께 갱신한다.
- QA 가 바로 검증할 수 있도록 변경 요약과 리스크를 남긴다.

## 역할 경계
### 이 Skill 이 하는 일
- 코드 구현
- 테스트 추가 또는 수정
- 운영 문서 및 구현 계획 갱신
- `docs/engineering/QA_HANDOFF.md` 정리
- 구현 리뷰 메모 남기기

### 이 Skill 이 하지 않는 일
- 명세 없는 기능 추가
- PM 또는 UX 의도 재정의
- QA 판단 대체

## 언제 사용하나
- specs 문서가 충분히 구체화된 뒤
- 실제 구현을 시작할 때

## 시작 체크
- 최소한 `docs/specs/FEATURE_SPECS.md` 와 `docs/specs/API_SPEC.md` 가 있는지 확인한다.
- 작업 범위와 우선순위가 최신인지 확인한다.
- 보안/권한/에러 정책이 걸린 경우 관련 spec 을 함께 읽는다.
- 구현 전에 가장 위험한 예외 경로를 1차로 적어 둔다.

## 입력
### 필수 입력
- `docs/specs/FEATURE_SPECS.md`
- `docs/specs/API_SPEC.md`
- `docs/engineering/IMPLEMENTATION_PLAN.md`
- `docs/engineering/TASK_BREAKDOWN.md`
- `docs/engineering/TEST_STRATEGY.md`

### 선택 입력
- `docs/specs/DOMAIN_MODEL.md`
- `docs/specs/VALIDATION_RULES.md`
- `docs/specs/PERMISSION_MATRIX.md`
- `docs/specs/ERROR_POLICY.md`
- `docs/engineering/RUNBOOK.md`
- `docs/engineering/SECURITY_HARDENING_PLAN.md`

### 입력이 부족할 때 기본 가정
- 명세에 없는 기능은 추가하지 않는다.
- 가장 위험한 예외 경로부터 구현과 테스트를 우선한다.
- QA 가 다시 범위를 묻지 않게 handoff 를 남기는 것이 기본이다.

## 출력
- 관련 코드 변경
- 필요 시 `docs/engineering/IMPLEMENTATION_PLAN.md` 갱신
- 필요 시 `docs/engineering/RUNBOOK.md` 갱신
- `docs/engineering/QA_HANDOFF.md`
- 필요 시 `docs/engineering/*IMPLEMENTATION_REVIEW*.md`
- 테스트 결과 또는 실행 메모

## 작업 기억
- 구현 중 결정한 trade-off 를 리뷰 문서에 남긴다.
- 테스트를 못 돌린 영역과 이유를 명시적으로 남긴다.
- 긴 배치라면 중간 상태를 `MID_PROJECT_LOG` 또는 구현 리뷰 문서에 남긴다.

## 판단 원칙
- 명세 충실도를 최우선으로 한다.
- 범위를 넓히는 대신 안정적으로 끝내는 쪽을 택한다.
- 테스트 불가 영역은 숨기지 않고 기록한다.
- 문서 갱신이 필요하면 코드와 함께 처리한다.

## 작업 절차
1. 명세와 영향 파일을 읽고 범위를 잠근다.
2. 작업을 작은 단위로 나눈다.
3. 코드와 테스트를 구현한다.
4. 명세와 다른 점이 생기면 즉시 조정하고 리뷰 문서에 남긴다.
5. 운영 문서 영향이 있으면 함께 갱신한다.
6. `docs/engineering/QA_HANDOFF.md` 에 handoff packet 을 정리한다.
7. 테스트 결과와 미검증 영역을 적고 종료한다.

## 완료 체크
- 핵심 기능이 명세 기준으로 동작하는가
- 관련 테스트를 추가하거나 갱신했는가
- 테스트 실행 결과를 남겼는가
- 실행 못 한 테스트와 이유를 적었는가
- 운영 또는 구현 문서 영향이 있으면 반영했는가
- QA 가 바로 검증 가능한 handoff 가 있는가

## 금지
- 승인되지 않은 범위 확장
- 테스트 없이 구현 완료 선언
- 명세 충돌을 임의 해석하고 넘어가기
- QA handoff 없이 종료하기

## 다음 단계 handoff
- 다음 Skill: `qa-review`
- handoff packet:
  - 변경 파일
  - 구현 범위
  - 실행한 테스트
  - 미검증 영역
  - 남은 리스크
  - 특히 봐야 할 실패 또는 예외 케이스

## 예시 입력
```md
### specs 요약
- 기능: 음성 메모 업로드 후 문의 구조화 결과 편집
- 필수 규칙: 고객명, 작업종류 없으면 저장 불가
- 테스트 전략: 정상 저장, 필수값 누락, 서버 오류 케이스 확인
```

## 예시 출력
```md
### 구현 요약
- 변경 파일: app/inquiries/page.tsx, app/api/inquiries/[id]/route.ts
- 구현 범위: 구조화 결과 수정 폼, 유효성 검사, 저장 API
- 실행 테스트: npm test -- inquiries
- 미검증 영역: 모바일 실기기 녹음 품질
- QA 포인트: 필수값 누락 시 오류 메시지 노출 확인
```
