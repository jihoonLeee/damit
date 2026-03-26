---
name: pm-brainstorm
description: 최종 선정된 아이디어를 실행 가능한 제품 정의로 압축하고 docs/product/PRD.md, docs/product/MVP_SCOPE.md, 결정 메모까지 남겨 UX가 바로 이어받게 만드는 PM 스킬
---

# PM Brainstorm

## 역할
- 최종 아이디어를 실행 가능한 제품 정의로 바꾼다.
- 타깃, 문제, 가치, 범위, 성공 지표를 명확히 한다.
- UX 가 바로 설계할 수 있도록 사용자 흐름과 제품 제약을 남긴다.

## 역할 경계
### 이 Skill 이 하는 일
- PRD 작성
- MVP 범위 정의
- 핵심 가설과 성공 기준 정리
- PM 결정 메모 남기기

### 이 Skill 이 하지 않는 일
- 화면 설계 확정
- API 계약 정의
- 구현 상세 확정

## 언제 사용하나
- `brainstorm-synthesizer` 가 최종 아이디어를 고른 뒤
- 설계와 구현 전 제품 정의를 잠가야 할 때

## 시작 체크
- `docs/product/IDEA_FINAL.md` 가 최신인지 확인한다.
- 최소 하나의 타깃 사용자 또는 업종이 정해졌는지 확인한다.
- 브레인스토밍 결과보다 범위를 넓히지 않는다는 원칙을 다시 확인한다.

## 입력
### 필수 입력
- `docs/product/IDEA_FINAL.md`
- `docs/product/IDEA_SHORTLIST.md`
- 사용자 제약조건과 목표

### 선택 입력
- `docs/product/DECISIONS.md`
- 기존 제품 문서
- 경쟁 또는 판매 메모

### 입력이 부족할 때 기본 가정
- MVP 는 4~6주 안에 검증 가능한 범위여야 한다.
- 타깃은 한 업종 또는 한 사용자군으로 좁힌다.
- PRD 는 UX 가 착수할 만큼 구체적이어야 하되 구현 계약까지는 넘지 않는다.

## 출력
- `docs/product/PRD.md`
- `docs/product/MVP_SCOPE.md`
- 필요 시 `docs/product/DECISIONS.md`
- 필요 시 `docs/product/PM_HANDOFF.md`

## 작업 기억
- 최소 1개의 PM 판단 흔적을 남긴다.
- 우선순위 문구, 제외한 범위, kill signal, unresolved question 을 문서로 남긴다.

## 출력 계약
### PRD
- 제품명 또는 포지셔닝
- 문제 정의
- 타깃 사용자
- 가치 제안
- 핵심 시나리오
- 성공 지표
- 리스크와 가설

### MVP_SCOPE
- 목표
- 검증 가설
- In Scope / Out of Scope
- 핵심 화면 또는 기능 범위
- 성공 또는 실패 기준
- 릴리즈 전략

### PM_HANDOFF 또는 DECISIONS
- UX 가 먼저 읽어야 할 제약
- 절대 넓히면 안 되는 범위
- 이후 검증이 필요한 open question

## 판단 원칙
- 최종안보다 범위를 넓히지 않는다.
- 타깃은 가능하면 한 업종, 한 사용자군으로 좁힌다.
- MVP 는 4~6주 검증 범위를 넘지 않게 자른다.
- UX 와 spec 이 이어받을 만큼 구체적이되 구현 계약까지는 넘지 않는다.
- 논쟁 포인트는 문서로 남기고 다음 단계에 넘긴다.

## 작업 절차
1. 최종 아이디어를 한 줄 정의로 다시 정리한다.
2. 타깃 사용자와 핵심 문제를 좁힌다.
3. PRD 에 문제, 가치, 시나리오, 지표를 쓴다.
4. MVP_SCOPE 에서 In Scope 와 Out of Scope 를 강하게 자른다.
5. PM 결정 메모를 남긴다.
6. UX handoff packet 을 정리한다.

## 완료 체크
- 타깃과 문제 정의가 구체적인가
- 가치 제안이 대체재와 구분되는가
- MVP 범위가 작고 검증 가능한가
- UX 가 다시 PM 판단을 물어보지 않아도 되는가
- 제외한 범위와 open question 이 문서에 남았는가

## 금지
- 새 기능을 임의로 추가해 범위를 넓히지 않는다.
- 최종안에서 합의되지 않은 타깃으로 확장하지 않는다.
- 구현 상세나 API 계약을 미리 잠그지 않는다.

## 다음 단계 handoff
- 다음 Skill: `ux-screen-design`
- handoff packet:
  - 핵심 사용자 흐름
  - 핵심 화면 후보
  - MVP 제외 항목
  - 비즈니스상 반드시 지켜야 할 제약
  - unresolved question

## 예시 입력
```md
### IDEA_FINAL 요약
- 서비스명: 현장 음성비서
- 포지셔닝: 리드 인입이 아니라 리드 후처리 속도를 파는 도구
- 첫 타깃: 입주청소 업자
```

## 예시 출력
```md
### PRD 핵심
- 문제: 통화 직후 기록 누락으로 견적 응답이 늦어진다.
- 가치 제안: 음성 메모 하나로 문의를 견적 가능한 상태로 만든다.

### MVP_SCOPE 핵심
- In Scope: 음성 메모 등록, 구조화 결과, 견적 초안
- Out of Scope: 당근 직접 연동, 자동 발송, 다업종 지원

### PM_HANDOFF 핵심
- UX 우선순위: 기록 먼저, 설명은 나중
- 절대 제외 금지: 현장 직후 입력 속도
```
