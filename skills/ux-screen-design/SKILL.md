---
name: ux-screen-design
description: PRD와 MVP 범위를 정보구조, 사용자 흐름, 와이어프레임, 화면 명세로 바꾸고 UX 검토 메모까지 남겨 feature-spec 이 바로 이어받게 만드는 UX 설계 스킬
---

# UX Screen Design

## 역할
- 제품 정의를 실제 사용 흐름과 화면 구조로 변환한다.
- 사용자가 어디서 막히는지, 어떤 상태를 보게 되는지 설계한다.
- `feature-spec` 이 구현 명세를 만들 수 있게 UX 근거를 남긴다.

## 역할 경계
### 이 Skill 이 하는 일
- IA 작성
- 화면 흐름 설계
- 와이어프레임 작성
- 화면 명세 작성
- UX 검토 메모 남기기

### 이 Skill 이 하지 않는 일
- API 계약 정의
- 도메인 모델 정의
- 구현 기술 선택

## 언제 사용하나
- PRD 와 MVP_SCOPE 가 확정된 뒤
- 기능을 실제 사용 흐름으로 풀어야 할 때

## 시작 체크
- `docs/product/PRD.md` 와 `docs/product/MVP_SCOPE.md` 가 최신 상태인지 확인한다.
- 핵심 사용자 여정이 적어도 1개 이상 정리돼 있는지 확인한다.
- MVP 에 없는 기능을 화면으로 끌어들이지 않겠다는 원칙을 확인한다.

## 입력
### 필수 입력
- `docs/product/PRD.md`
- `docs/product/MVP_SCOPE.md`

### 선택 입력
- 기존 `docs/ux/*` 문서
- 기존 디자인 시스템 또는 토큰 문서
- 현장 피드백 또는 인터뷰 메모

### 입력이 부족할 때 기본 가정
- MVP 에 없는 기능은 화면에도 추가하지 않는다.
- 예쁜 화면보다 핵심 흐름 마찰 제거를 우선한다.
- 오류, 빈 상태, 수정 흐름을 정상 플로우만큼 중요하게 본다.

## 출력
- `docs/ux/IA.md`
- `docs/ux/SCREEN_FLOW.md`
- `docs/ux/WIREFRAMES.md`
- `docs/ux/SCREEN_SPECS.md`
- 필요 시 `docs/ux/DESIGN_TOKENS.md`
- 필요 시 `docs/ux/UX_REVIEW.md`

## 작업 기억
- UX 는 상태, 빈 화면, 예외 흐름, open question 을 문서로 남긴다.
- 추상적인 예쁨 평가 대신 `어디서 막히는지`를 기억 문서에 남긴다.

## 판단 원칙
- 예쁜 화면보다 핵심 흐름의 마찰 제거를 우선한다.
- MVP 에 없는 기능은 화면으로도 추가하지 않는다.
- 상태와 예외를 정상 플로우만큼 중요하게 본다.
- `feature-spec` 이 이어받기 쉽게 행동과 상태를 분리해 적는다.

## 작업 절차
1. 핵심 사용자 여정을 1~3개로 고정한다.
2. IA 를 만든다.
3. SCREEN_FLOW 로 상태 전환을 정의한다.
4. WIREFRAMES 로 구조를 그린다.
5. SCREEN_SPECS 에 화면별 목적과 상태를 적는다.
6. UX 검토 메모와 spec handoff packet 을 만든다.

## 완료 체크
- 핵심 시나리오가 끊김 없이 이어지는가
- 오류, 빈 상태, 수정 흐름이 빠지지 않았는가
- 화면별 목적과 액션이 분명한가
- feature-spec 이 다시 UX 판단을 묻지 않아도 되는가
- open question 과 unresolved state 가 문서에 남았는가

## 금지
- 구현 상세나 API 계약을 여기서 확정하지 않는다.
- 시각 취향만으로 UX 핵심 결정을 대체하지 않는다.
- 기존 PM 가정을 임의 변경하지 않는다.

## 다음 단계 handoff
- 다음 Skill: `feature-spec`
- handoff packet:
  - 화면별 상태
  - 사용자 액션
  - 예외 또는 오류 처리
  - 데이터가 필요한 지점
  - 권한 차이 또는 역할 차이
  - UX open question

## 예시 입력
```md
### PRD 요약
- 핵심 시나리오: 통화 후 음성 메모 -> 구조화 확인 -> 견적 초안 확인
- MVP 제외: 자동 메시지 발송, 고급 대시보드
```

## 예시 출력
```md
### IA 예시
- 문의 목록
- 음성 메모 등록
- 구조화 결과 확인
- 견적 초안
- 문의 상세

### UX_REVIEW 예시
- 위험: 빈 상태에서 다음 행동이 약함
- 결정: 첫 입력 CTA 를 상단에 둔다
```
