# SKILL SYSTEM SCORECARD 2026-03-13

## 목적
- 저장소의 전체 skill 세트를 같은 기준으로 다시 점검한다.
- AI가 읽고 실행하기 쉬운 구조가 실제로 반영됐는지 확인한다.
- 이후 `skill-steward` 가 같은 기준으로 유지보수할 수 있게 현재 상태 점수표를 고정한다.

## 평가 기준

| 기준 | 설명 |
|---|---|
| 전문성 | 해당 역할의 실무 판단 기준이 충분히 녹아 있는가 |
| AI 실행성 | 입력, 출력, 절차, handoff 가 분명해서 AI가 안정적으로 수행할 수 있는가 |
| 포맷 안정성 | 섹션 구조, 인코딩, 예시, 파일 경로가 일관적인가 |
| 팀 적합성 | 현재 저장소의 문서 우선, handoff 중심 workflow 와 잘 맞는가 |

## 현재 점수표

| Skill | 전문성 | AI 실행성 | 포맷 안정성 | 팀 적합성 | 총점 | 현재 판단 |
|---|---:|---:|---:|---:|---:|---|
| brainstorm-vision | 8.6 | 9.0 | 9.1 | 8.8 | 89 | 발산용으로 안정적이며 기본 가정까지 갖춤 |
| brainstorm-practical | 8.7 | 9.0 | 9.0 | 8.9 | 89 | MVP 현실화 구조가 명확하고 handoff 가 좋음 |
| brainstorm-market | 8.6 | 8.9 | 8.9 | 8.8 | 88 | 시장성 판단 문장이 정리돼 AI 해석성이 좋아짐 |
| brainstorm-critic | 8.7 | 8.9 | 9.0 | 8.9 | 89 | 리스크 구조와 kill signal 흐름이 좋음 |
| brainstorm-synthesizer | 8.8 | 9.0 | 9.0 | 9.0 | 90 | 비교, 선정, PM handoff 가 잘 닫힘 |
| pm-brainstorm | 8.9 | 9.0 | 9.0 | 9.1 | 90 | 제품 정의 축으로 안정적 |
| ux-screen-design | 8.9 | 9.0 | 9.0 | 9.1 | 90 | UX 산출물 계약과 spec handoff 가 좋음 |
| feature-spec | 9.1 | 9.2 | 9.1 | 9.2 | 92 | 구현 착수용 명세로 매우 강함 |
| security-hardening | 9.2 | 9.3 | 9.3 | 9.4 | 93 | 모드 분리, gate 구조, sample review 까지 갖춘 보안 스킬 |
| builder-implementation | 9.2 | 9.4 | 9.2 | 9.4 | 93 | 가장 실전형이며 QA handoff 경로가 선명함 |
| qa-review | 9.1 | 9.3 | 9.3 | 9.2 | 92 | sample artifact 까지 갖춰 실행성이 더 좋아짐 |
| skill-steward | 9.1 | 9.0 | 9.1 | 9.1 | 91 | governance 판단 기준이 가장 선명한 축 중 하나 |
| move-in-cleaning-expert | 9.1 | 9.1 | 9.2 | 9.3 | 92 | 인코딩 복구 후 현장 샘플까지 갖춘 강한 도메인 스킬 |

## 이번 정리로 완료된 항목
- 전 skill 공통으로 `선행 조건`, `입력이 부족할 때 기본 가정`, `출력 계약`, `handoff packet`을 갖췄다.
- 모든 skill 이 같은 읽는 순서로 해석될 수 있게 섹션 구조를 통일했다.
- `move-in-cleaning-expert` 의 인코딩 문제를 해결하고 현장 검증 스킬로 재구성했다.
- `builder-implementation`, `qa-review`, `security-hardening` 은 실제 문서 경로와 sample artifact 를 직접 드러내도록 정리했다.

## 남은 개선 backlog

### High
- 실제 사용 2~3회 후 현재 샘플을 실전 사례로 교체
- security-hardening release-review 샘플을 실제 배치 기준으로 확장
- move-in-cleaning-expert 샘플을 실제 현장 피드백 기반으로 다변화

### Medium
- brainstorm 계열 비교표와 scoring 샘플 누적
- skill-steward 에 분기별 재평가 루틴 추가 검토
- 자주 쓰는 skill 의 sample artifact 참조 방식을 더 통일

### Low
- 자주 쓰는 skill 부터 `agents/openai.yaml` 동기화 검토
- 점수표를 분기별 또는 큰 개편 후 다시 갱신

## 현재 결론
- 전체 skill 세트는 AI가 이해하고 수행하기 좋은 구조로 올라왔고, 핵심 실행 축에는 sample artifact 도 갖춰졌다.
- `pm -> ux -> spec -> security -> builder -> qa` 라인은 바로 실무에 써도 될 정도로 안정적이다.
- 가장 큰 리스크였던 domain skill 인코딩 문제도 해소됐다.


