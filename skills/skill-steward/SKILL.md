---
name: skill-steward
description: 저장소의 skill 체계를 검토하고 중복, 역할 충돌, 출력 누락, handoff 누락을 관리하며 docs/skills 와 output/skill-reviews 아래 개선 문서를 유지하는 거버넌스 스킬
---

# Skill Steward

## 역할
- 저장소의 skill 체계 품질을 관리한다.
- 새 skill 생성, 기존 skill 수정, 병합, 은퇴를 판단한다.
- review queue, changelog, standards, per-skill review 를 유지한다.
- workflow 가 `자동 매뉴얼 + 작업 기억 + QA gate + 전문 에이전트 협업` 구조를 따르는지 점검한다.

## 역할 경계
### 이 Skill 이 하는 일
- skill inventory
- 구조적 품질 진단
- 중복, 모호성, 출력 누락, handoff 누락 점검
- 개선 backlog 운영
- 운영 시스템 정렬 점검

### 이 Skill 이 하지 않는 일
- 근거 없이 skill 수를 늘리기
- review 없이 즉시 역할 재편하기
- 다른 skill 의 실제 작업을 대신 수행하기

## 언제 사용하나
- 새 skill 이 필요할 때
- 기존 skill 이 모호하거나 겹친다고 느껴질 때
- workflow handoff 품질을 점검할 때
- 대규모 리팩토링 전후로 governance 점검이 필요할 때

## 시작 체크
- 현재 저장소의 `skills/*/SKILL.md` 와 governance 문서에 접근 가능한지 확인한다.
- 실제 수정인지, 진단만 필요한지 요청 범위를 확인한다.
- skill 수를 늘리기보다 책임 경계를 선명하게 만드는 것을 우선한다는 기준을 다시 확인한다.

## 입력
### 필수 입력
- `skills/*/SKILL.md`
- `docs/skills/SKILL_STANDARDS.md`
- `docs/skills/SKILL_REVIEW_QUEUE.md`

### 선택 입력
- `docs/skills/SKILL_CATALOG.md`
- `docs/skills/AI_IMPLEMENT_SYSTEM_ALIGNMENT.md`
- `docs/skills/SKILL_CHANGELOG.md`
- `output/skill-reviews/*`
- 최근 사용자 피드백 또는 사용 사례

### 입력이 부족할 때 기본 가정
- skill 수를 늘리기보다 책임 경계를 선명하게 만드는 쪽을 우선한다.
- 입력, 출력, 금지, handoff 가 약하면 높은 우선순위로 본다.
- 실행 축인 PM, UX, spec, builder, QA 모호성은 더 치명적으로 본다.

## 출력
- `docs/skills/SKILL_REVIEW_QUEUE.md`
- `docs/skills/SKILL_CHANGELOG.md`
- 필요 시 `docs/skills/SKILL_CATALOG.md`
- `output/skill-reviews/<skill-name>-review.md`
- 필요 시 `output/skill-reviews/<skill-name>-improvement.md`

## 작업 기억
- review queue 와 changelog 를 항상 최신 기준으로 맞춘다.
- alignment review, merge 판단, retire 판단 같은 구조 결정을 문서로 남긴다.

## severity 기준
- P0: 실행 자체가 안 될 정도로 입력, 출력, 역할이 비어 있거나 인코딩이 깨짐
- P1: 역할 충돌, handoff 누락, output contract 누락, 시작/완료 체크 부재
- P2: 작업 기억 문서 부족, 예시 부족, 명확성 문제
- P3: 문장 개선, 보강 예시 등 경미한 개선

## 판단 원칙
- skill 수를 늘리는 것보다 책임을 선명하게 만드는 것을 우선한다.
- 짧은 description 보다 실제 운영 가능한 구조를 우선한다.
- 입력, 출력, handoff 가 약하면 높은 우선순위로 본다.
- Builder, spec, QA 같은 실행 축의 모호성은 더 치명적으로 본다.
- manual attach, memory artifact, QA gate, handoff packet 이 없으면 구조적 결함으로 본다.

## 작업 절차
1. skill inventory 를 만든다.
2. 각 skill 을 역할, 시작 체크, 입력, 출력, 완료 체크, 금지, handoff 기준으로 진단한다.
3. severity 를 매긴다.
4. review queue 에 우선순위를 반영한다.
5. per-skill review 문서를 작성한다.
6. 실제 수정이 승인되면 standards, catalog, changelog 를 갱신한다.

## 완료 체크
- 각 skill 의 경계가 설명 가능한가
- review queue 와 실제 skill 상태가 일치하는가
- 중복, 역할 충돌, 누락이 문서로 추적 가능한가
- 운영 시스템 정렬 여부가 반영됐는가
- skill 수정 이력이 changelog 에 남는가

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
  - 운영 시스템 관점의 누락 항목
