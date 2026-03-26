---
name: qa-review
description: 구현 결과를 명세 기준으로 검증하고 output/qa 아래 테스트 케이스, 검증 결과, 결함, 릴리즈 판단 메모를 남기는 QA 스킬
---

# QA Review

## 역할
- 구현 결과가 명세와 맞는지 검증한다.
- 회귀 위험과 미검증 영역을 분리해 보고한다.
- 릴리즈 가능 여부를 문서로 남긴다.

## 역할 경계
### 이 Skill 이 하는 일
- 테스트 시나리오 정의
- 실행 또는 실행 가능성 검토
- 결함과 리스크 정리
- 릴리즈 판단 메모 작성

### 이 Skill 이 하지 않는 일
- 구현 범위를 다시 정의하기
- 실패를 숨기고 통과 처리하기
- builder 의 작업 요약을 그대로 복사하기

## 언제 사용하나
- `builder-implementation` 이 끝난 뒤
- 릴리즈 여부를 판단해야 할 때

## 시작 체크
- builder handoff 와 핵심 명세 문서가 최신인지 확인한다.
- 검증할 코드 또는 배포 환경에 접근 가능한지 확인한다.
- 정상, 예외, 회귀, 미검증 영역을 분리해서 볼 준비를 한다.

## 입력
### 필수 입력
- 코드 변경 결과
- `docs/specs/FEATURE_SPECS.md`
- `docs/specs/API_SPEC.md`
- `docs/engineering/TEST_STRATEGY.md`
- `docs/engineering/QA_HANDOFF.md`

### 선택 입력
- `docs/specs/DOMAIN_MODEL.md`
- `docs/specs/VALIDATION_RULES.md`
- `docs/specs/ERROR_POLICY.md`
- 과거 버그 메모
- 보안 또는 배포 리뷰 메모

### 입력이 부족할 때 기본 가정
- 기능보다 사용자 시나리오 기준으로 검증한다.
- 미검증 영역은 통과로 취급하지 않는다.
- release 판단은 감각이 아니라 근거로 남긴다.

## 출력
- `output/qa/TEST_CASES.md`
- `output/qa/QA_SUMMARY.md`
- 필요 시 `output/qa/DEFECTS.md`
- 필요 시 `output/qa/RELEASE_RECOMMENDATION.md`

## 작업 기억
- blocker, medium risk, low risk, 미검증 영역을 분리해 남긴다.
- 재현 조건과 실제 결과를 숨기지 않는다.
- 릴리즈 판단 이유를 별도 메모 또는 summary 에 분명히 남긴다.

## 판단 원칙
- 기능보다 사용자 시나리오 기준으로 검증한다.
- 정상 플로우와 예외 플로우를 모두 본다.
- 미검증 영역은 통과로 취급하지 않는다.
- 릴리즈 판단은 감각이 아니라 근거로 남긴다.

## 작업 절차
1. specs 기준으로 핵심 시나리오를 뽑는다.
2. 정상, 예외, 회귀 케이스를 정의한다.
3. 가능한 범위에서 실행한다.
4. 실패, 불확실, 미검증을 분리해 적는다.
5. blocker 와 medium risk 를 정리한다.
6. 릴리즈 판단과 후속 액션을 정리한다.

## 완료 체크
- 테스트 케이스만이 아니라 결과 요약이 있는가
- blocker 와 미검증이 구분되는가
- 재현 가능하거나 검증 가능한 문장으로 적었는가
- builder 가 바로 수정할 수 있는 수준의 정보가 있는가
- 릴리즈 판단 근거가 명확한가

## 금지
- 테스트 케이스만 작성하고 끝났다고 판단하지 않는다.
- 실패를 요약 없이 나열만 하지 않는다.
- 미검증을 통과처럼 보이게 쓰지 않는다.

## 다음 단계 handoff
- 실패 시 다음 Skill: `builder-implementation`
- 통과 시 다음 단계: 사용자 또는 release 판단 단계
- handoff packet:
  - blocker
  - medium risk
  - 미검증 항목
  - 재현 조건
  - 재작업 우선순위
  - release recommendation

## 예시 입력
```md
### builder handoff
- 구현 범위: 구조화 결과 수정 폼
- 실행 테스트: 정상, 누락, 오류 API 케이스 통과
- 남은 리스크: 모바일 Safari 미검증
```

## 예시 출력
```md
### QA_SUMMARY 예시
- 검증 범위: 문의 수정, 저장 오류, 필수값 검증
- blocker: 없음
- medium risk: 모바일 Safari 미검증
- 릴리즈 판단: 제한적 통과

### DEFECTS 예시
- 재현: 고객명 없이 저장
- 실제 결과: 저장됨
- 기대 결과: 저장 차단
```
