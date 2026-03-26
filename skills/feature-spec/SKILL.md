---
name: feature-spec
description: PRD와 UX 설계를 구현 가능한 기능, 데이터, API, 검증 규칙 명세로 풀고 builder handoff 와 스펙 검토 메모까지 남기는 스킬
---

# Feature Spec

## 역할
- 제품 요구사항과 UX 를 개발 가능한 규칙과 계약으로 구체화한다.
- 기능, 상태, 예외, 검증 규칙, API 영향, 권한 영향을 명세한다.
- builder 가 질문 없이 착수할 수 있는 수준의 구체성을 만든다.

## 역할 경계
### 이 Skill 이 하는 일
- 기능 명세 작성
- API 계약 정리
- 필요한 도메인, 검증, 권한 문서 갱신
- builder handoff 메모 남기기

### 이 Skill 이 하지 않는 일
- 코드 구현
- 테스트 실행
- UX 의도 재정의

## 언제 사용하나
- UX 설계가 끝난 뒤
- 구현 전에 규칙과 계약을 잠가야 할 때

## 시작 체크
- `docs/product/PRD.md`, `docs/product/MVP_SCOPE.md`, `docs/ux/*` 가 최신 상태인지 확인한다.
- 핵심 사용자 흐름과 화면 상태가 정리됐는지 확인한다.
- 화면 설명을 반복하지 않고 구현 규칙으로 번역하겠다는 원칙을 확인한다.

## 입력
### 필수 입력
- `docs/product/PRD.md`
- `docs/product/MVP_SCOPE.md`
- `docs/ux/IA.md`
- `docs/ux/SCREEN_FLOW.md`
- `docs/ux/SCREEN_SPECS.md`

### 선택 입력
- `docs/ux/DESIGN_TOKENS.md`
- 기존 `docs/specs/*` 문서
- 보안 또는 도메인 검토 메모

### 입력이 부족할 때 기본 가정
- 화면 설명을 반복하지 말고 구현 규칙으로 번역한다.
- 기능별로 `정상`, `예외`, `권한`을 같이 본다.
- MVP 범위 밖 요구는 명세에 넣지 않는다.

## 출력
- `docs/specs/FEATURE_SPECS.md`
- `docs/specs/API_SPEC.md`
- 필요 시 `docs/specs/DOMAIN_MODEL.md`
- 필요 시 `docs/specs/VALIDATION_RULES.md`
- 필요 시 `docs/specs/PERMISSION_MATRIX.md`
- 필요 시 `docs/specs/ERROR_POLICY.md`
- 필요 시 `docs/specs/SPEC_REVIEW.md`

## 작업 기억
- 구현 전 결정 포인트와 미결정 포인트를 review 문서 또는 decisions 에 남긴다.
- Builder 가 막힐 가능성이 높은 영역은 handoff 에 먼저 적는다.

## 판단 원칙
- 화면 설명을 반복하지 말고 구현 규칙으로 번역한다.
- 기능별 `정상`, `예외`, `권한`을 같이 본다.
- MVP 범위 밖 요구는 명세에 넣지 않는다.
- Builder 가 실제로 겪을 결정 포인트를 먼저 명시한다.

## 작업 절차
1. UX 흐름을 기능 단위로 나눈다.
2. 기능별 목표와 사용자 행동을 정리한다.
3. 상태, 예외, 권한 차이를 적는다.
4. API 와 데이터 영향을 정의한다.
5. validation 또는 error policy 가 필요하면 별도 문서를 갱신한다.
6. spec review 와 builder handoff packet 을 만든다.

## 완료 체크
- 구현자가 질문 없이 시작할 수 있는가
- 상태와 예외가 빠지지 않았는가
- API, 도메인, 검증 규칙이 일관적인가
- PM 과 UX 의 의도와 어긋나지 않는가
- 미결정 사항이 문서에 명시됐는가

## 금지
- 추상적인 요구사항만 남기고 세부 규칙을 생략하지 않는다.
- 구현 편의를 위해 제품 의미를 임의 변경하지 않는다.
- builder 단계의 판단을 여기서 숨기지 않는다.

## 다음 단계 handoff
- 다음 Skill: `builder-implementation`
- handoff packet:
  - 우선 구현 순서
  - 영향 파일 또는 영역
  - 핵심 리스크
  - 미결정 사항
  - 테스트 시 특히 봐야 할 예외

## 예시 입력
```md
### UX handoff
- 화면: 구조화 결과 확인
- 사용자 액션: 고객명, 평수, 희망 일정 수정
- 예외: 음성이 짧아 주요 필드가 비어 있을 수 있음
```

## 예시 출력
```md
### FEATURE_SPECS 예시
- 기능명: 문의 구조화 결과 편집
- 규칙: 고객명, 연락처, 작업종류는 저장 전 필수
- 예외: 필수값 누락 시 저장 불가

### SPEC_REVIEW 예시
- 미결정: 자동 저장 여부
- Builder 주의: 연락처 정규화 규칙 필요
```
