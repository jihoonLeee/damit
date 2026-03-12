---
name: skill-steward
description: 저장소의 Skill 체계를 검토하고 중복, 역할 충돌, 출력 누락, handoff 누락을 관리하며 docs/skills와 output/skill-reviews 아래 개선 문서를 유지하는 거버넌스 스킬
---

# Skill Steward

## 역할
- 저장소의 Skill 체계 품질을 관리한다.
- 새 Skill 생성, 기존 Skill 수정, 병합, 은퇴를 판단한다.
- review queue, changelog, standards, per-skill review 를 유지한다.

## 역할 경계
### 이 Skill 이 하는 일
- skill inventory
- 구조적 품질 진단
- 중복/모호성/출력 누락/handoff 누락 점검
- 개선 backlog 운영

### 이 Skill 이 하지 않는 일
- 근거 없이 skill 수를 늘리기
- review 없이 즉시 역할 재편하기
- 다른 skill 의 실제 작업을 대신 수행하기

## 언제 사용하나
- 새 skill 이 필요할 때
- 기존 skill 이 모호하거나 겹친다고 느껴질 때
- workflow handoff 품질을 점검할 때
- 대규모 리팩토링 전후로 governance 점검이 필요할 때

## 입력
### 필수 입력
- skills/*/SKILL.md
- docs/skills/SKILL_STANDARDS.md
- docs/skills/SKILL_IMPROVEMENT_PLAYBOOK.md
- docs/skills/SKILL_REVIEW_QUEUE.md

### 선택 입력
- docs/skills/SKILL_CATALOG.md
- docs/skills/SKILL_CHANGELOG.md
- output/skill-reviews/*

## 출력
- docs/skills/SKILL_REVIEW_QUEUE.md
- docs/skills/SKILL_CHANGELOG.md
- 필요 시 docs/skills/SKILL_CATALOG.md
- output/skill-reviews/<skill-name>-review.md
- 필요 시 output/skill-reviews/<skill-name>-improvement.md

## severity 기준
- P0: 실행 자체가 안 될 정도로 입력/출력/역할이 비어 있음
- P1: 역할 충돌, handoff 누락, 출력 누락 등 구조적 문제
- P2: 명확성/일관성 문제
- P3: 문장 개선, 예시 보강 등 경미한 개선

## 결정 규칙
- create: 기존 skill 이 책임지기 어려운 새로운 반복 작업이 생겼을 때
- revise: 역할은 맞지만 입력/출력/금지/handoff 가 약할 때
- merge: 두 skill 이 같은 문서를 같은 기준으로 다룰 때
- retire: 더 이상 쓰지 않거나 다른 skill 에 흡수됐을 때

## 판단 원칙
- skill 수를 늘리는 것보다 책임을 선명하게 만드는 것을 우선한다.
- 짧은 description 보다 실제 운영 가능한 구조를 우선한다.
- 입력/출력/handoff 가 약하면 높은 우선순위로 본다.
- builder/spec/qa 같은 실행 축의 모호성은 더 치명적으로 본다.

## 작업 절차
1. skill inventory 를 만든다.
2. 각 skill 을 역할/입력/출력/금지/handoff 기준으로 진단한다.
3. severity 를 매긴다.
4. review queue 에 우선순위를 반영한다.
5. per-skill review 문서를 작성한다.
6. 실제 수정이 승인되면 changelog 를 남긴다.

## 품질 기준
- 각 skill 의 경계가 설명 가능하다.
- review queue 와 실제 skill 상태가 일치한다.
- 중복/역할 충돌/누락이 문서로 추적 가능하다.
- skill 수정 이력이 changelog 에 남는다.

## Self-Review
- 너무 많은 create 제안으로 흘러가고 있지 않은가
- revise/merge 로 해결 가능한 문제를 create 로 넘기지 않았는가
- severity 판단이 일관적인가
- governance 문서와 실제 skill 파일이 어긋나지 않는가

## 금지
- 근거 없이 새 skill 을 늘리지 않는다.
- 기존 skill 의 역할 경계를 흐린다.
- review 없이 실제 수정을 먼저 밀어붙이지 않는다.
- changelog 없이 큰 구조 변경을 마무리하지 않는다.

## 다음 단계 handoff
- 실제 수정이 필요하면 해당 skill owner 또는 구현 작업으로 넘긴다.
- handoff packet:
  - severity
  - 핵심 문제
  - 권장 수정 방향
  - 영향 skill
  - 영향 문서

## 예시 입력
```md
- 대상 스킬: builder-implementation
- 관찰 문제: 입력/출력은 있으나 예시 입출력 샘플이 없음
- 요청 목적: 신규 팀원이 읽어도 바로 이해되게 개선
```

## 예시 출력
```md
### review queue 반영 예시
| Skill | 현재 문제 | 우선순위 | 제안 액션 | 상태 |
|---|---|---|---|---|
| builder-implementation | 예시 입출력 샘플 없음 | P2 | 예시 입력/출력 섹션 추가 | reviewed |

### review 메모 예시
- 현재 문제: handoff 는 있지만 실제 출력 결과 샘플이 없어 이해 속도가 느리다.
- 개선 제안: 구현 요약과 QA handoff 예시를 문서에 추가한다.
```

