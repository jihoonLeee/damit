# AI Implement System Alignment

Date: 2026-03-13
Source: `AI_IMPLEMENT_GUIDE_FROM_YOUTUBE.json`

## Core message
- AI 품질은 모델 자체보다 운영 시스템 설계에 더 크게 좌우된다.
- 따라서 이 저장소의 개선 방향은 새 agent 수를 늘리는 것보다, 기존 workflow 에 시스템 장치를 심는 쪽이어야 한다.

## Source systems mapped to this repository

### 1. 자동 매뉴얼 시스템
가이드 해석:
- 작업 시작 전과 종료 전 체크 장치를 둔다.
- 작업 유형에 맞는 매뉴얼이 자동으로 붙어야 한다.

저장소 적용:
- 각 `SKILL.md` 에 `시작 체크`, `완료 체크`, `matching rules` 를 더 명시한다.
- 각 단계 문서는 다음 단계가 재질문 없이 따라갈 수 있는 handoff packet 을 남긴다.
- `SKILL_STANDARDS.md` 에 이를 필수 항목으로 추가한다.

### 2. 작업 기억 시스템
가이드 해석:
- 계획, 중간 판단, 체크리스트, 마감 이유를 문서로 남겨 긴 작업의 맥락을 유지한다.

저장소 적용:
- 각 단계는 산출물 외에 최소 1개의 진행 기억 문서를 남긴다.
- 예: `DECISIONS`, `MID_PROJECT_LOG`, `QA_HANDOFF`, `REVIEW` 문서
- PM/Spec/Builder/QA 는 자신의 memory artifact 를 문서상 책임진다.

### 3. 자동 품질 검사 시스템
가이드 해석:
- 완료 보고 전에 자동 검증, 수정 기록, 재검증을 거치게 만든다.

저장소 적용:
- Builder 는 `구현 + 테스트 + QA handoff`가 모두 있어야 완료다.
- QA 는 `테스트 케이스 + 검증 결과 + blocker/risk + release 판단`을 남긴다.
- 각 단계는 종료 전 self-check 와 다음 단계 gate 를 명시한다.

### 4. 전문 에이전트 시스템
가이드 해석:
- 하나의 AI가 모든 판단을 하지 않고, 역할별 agent 가 서로 검증한다.

저장소 적용:
- 현재 체인 `PM -> UX -> Spec -> Builder -> QA`를 유지한다.
- 도메인 검증은 `move-in-cleaning-expert`, 보안 검증은 `security-hardening` 이 병행한다.
- `skill-steward` 가 역할 충돌과 출력 누락을 지속적으로 관리한다.

## PM decision
- Full agent proliferation: no
- Existing workflow reinforcement: yes
- New standard direction: `manual attach + memory artifact + QA gate + explicit handoff`

## Immediate improvement targets
1. `docs/skills/SKILL_STANDARDS.md`
2. `docs/skills/SKILL_CATALOG.md`
3. Core chain skills
- `pm-brainstorm`
- `ux-screen-design`
- `feature-spec`
- `builder-implementation`
- `qa-review`
- `skill-steward`

## Expected effect
- 단계 시작과 종료 기준이 더 분명해진다.
- 긴 프로젝트에서도 맥락 손실이 줄어든다.
- 문서만 많고 흐름은 약한 상태를 줄일 수 있다.
- agent 간 재질문과 역할 충돌이 줄어든다.
