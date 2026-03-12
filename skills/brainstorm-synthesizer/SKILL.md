---
name: brainstorm-synthesizer
description: vision, practical, market, critic 결과를 통합해 docs/product/IDEA_SHORTLIST.md와 docs/product/IDEA_FINAL.md를 작성하고 PM 단계로 넘기는 최종 정리 스킬
---

# Brainstorm Synthesizer

## 역할
- 이전 네 개 brainstorm 결과를 한 프레임으로 합친다.
- shortlist 를 만들고 최종 우선순위를 정한다.
- 왜 선택했는지, 왜 버렸는지 모두 문서화한다.

## 역할 경계
### 이 Skill 이 하는 일
- 비교 기준 정의
- 후보 점수화 또는 비교 메모 작성
- 최종 1개 선정
- PM handoff 정리

### 이 Skill 이 하지 않는 일
- PRD 작성
- UX 설계
- 근거 없는 취향 선택

## 언제 사용하나
- vision/practical/market/critic 이 모두 완료된 뒤
- 실행할 아이디어를 한 개로 좁혀야 할 때

## 입력
### 필수 입력
- docs/product/IDEA_POOL.md 전체
- 사용자 우선순위: 수익성, 속도, 방어력, 확장성 등

### 선택 입력
- 이전 라운드의 shortlist/final 문서
- 플랫폼 중복 조사 메모

## 출력
- docs/product/IDEA_SHORTLIST.md
- docs/product/IDEA_FINAL.md

## 출력 계약
### IDEA_SHORTLIST
- 선정 기준
- 비교표 또는 점수표
- 상위 후보 2~3개
- 탈락 사유

### IDEA_FINAL
- 최종 선정 아이디어
- 선택 이유
- 핵심 타깃
- 30일 검증 계획
- PM handoff 메모

## 판단 원칙
- 사용자가 중요하게 본 기준을 우선한다.
- 플랫폼 독립성, 첫 매출 속도, 부업 친화성, 고객 임팩트, 확장성을 균형 있게 본다.
- 같은 총점이면 `첫 검증 속도`와 `메시지 선명도`를 우선한다.
- 버린 후보도 왜 버렸는지 남긴다.

## 작업 절차
1. 비교 기준을 먼저 고정한다.
2. 후보별 비교표를 만든다.
3. shortlist 를 정리한다.
4. 최종 1개를 고르고 선택 이유를 압축한다.
5. PM 이 바로 이어받을 수 있도록 가설과 범위를 handoff 한다.

## 품질 기준
- 최종 결론에 근거가 있다.
- 탈락 후보의 이유가 남아 있다.
- 최종안의 타깃이 좁혀져 있다.
- 다음 단계가 문서 작성에 바로 들어갈 수 있다.

## Self-Review
- 결론만 있고 비교 근거가 빠지지 않았는가
- shortlist 와 final 이 서로 모순되지 않는가
- 선택 이유가 사용자 목표와 연결되는가
- PM 단계가 다시 브레인스토밍할 필요가 없을 만큼 정리됐는가

## 금지
- 느낌만으로 최종안을 고르지 않는다.
- 탈락 후보를 기록 없이 지우지 않는다.
- PRD 수준 세부 요구사항까지 확정하지 않는다.

## 다음 단계 handoff
- 다음 Skill: `pm-brainstorm`
- handoff packet:
  - 최종안
  - 핵심 가설
  - 버린 옵션과 이유
  - 첫 타깃 업종/사용자
  - 검증 우선순위

## 예시 입력
```md
- 사용자 우선순위: 빠른 유료 검증 > 플랫폼 독립성 > 장기 확장성
- IDEA_POOL 요약: 현장 음성비서, 시공 리포트 비서, 옵션 견적 설명서가 상위권
```

## 예시 출력
```md
### IDEA_SHORTLIST
1. 현장 음성비서
2. 시공 리포트 비서
3. 옵션 견적 설명서

### IDEA_FINAL
- 최종 선정: 현장 음성비서
- 이유: 플랫폼 공백이 크고, 입력 피로라는 가장 강한 병목을 해결한다.
- PM handoff: 첫 타깃은 입주청소 업자, 핵심 가설은 음성 메모가 텍스트 입력보다 반복 사용된다.
```

