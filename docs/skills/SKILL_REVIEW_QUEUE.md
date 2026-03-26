# SKILL REVIEW QUEUE

| Skill | 현재 문제 | 우선순위 | 제안 액션 | 상태 |
|---|---|---|---|---|
| brainstorm-vision | 구조는 안정적. 유지보수 시 예시와 실제 사용 사례만 누적 점검 필요 | P3 | 실제 사용 예시 보강 | validated-3rd-pass |
| brainstorm-practical | 구조 통일 완료. 운영 병목 예시를 실제 사례로 계속 보강하면 더 좋아짐 | P3 | 운영 병목 사례 보강 | validated-3rd-pass |
| brainstorm-market | 문장 품질 및 기본 가정 정리 완료 | P3 | 실제 채널 실험 사례 보강 | validated-3rd-pass |
| brainstorm-critic | 구조 안정적. kill signal 예시만 실제 운영 데이터로 누적 필요 | P3 | kill signal 사례 보강 | validated-3rd-pass |
| brainstorm-synthesizer | 비교 기준 구조 안정적. scoring 예시를 더 쌓으면 재사용성 상승 | P3 | 비교표 예시 보강 | validated-3rd-pass |
| pm-brainstorm | PM 산출물 구조 안정적. 성공 지표 예시만 더 쌓으면 좋음 | P3 | KPI 예시 보강 | validated-3rd-pass |
| ux-screen-design | UX handoff 구조 안정적. 상태 예시는 계속 축적 권장 | P3 | 상태/예외 예시 보강 | validated-3rd-pass |
| feature-spec | 구현 착수용 구조 안정적. 도메인별 spec 예시 누적 권장 | P3 | spec 예시 보강 | validated-3rd-pass |
| security-hardening | review 모드 분리, gate 구조, sample review 문서까지 정리 완료 | P2 | 실전 배치 사례 누적 | validated-3rd-pass |
| builder-implementation | QA handoff 경로까지 정리 완료 | P3 | 테스트/운영 문서 예시 보강 | validated-3rd-pass |
| qa-review | QA 산출물 구조와 sample artifact 정리 완료 | P3 | 실전 defect 사례 누적 | validated-3rd-pass |
| skill-steward | governance 구조 안정적. scorecard 기반 정기 리뷰 루틴만 추가 검토 | P2 | 분기별 재평가 루틴 검토 | validated-3rd-pass |
| move-in-cleaning-expert | 인코딩 복구, 전면 재작성, sample review 추가 완료 | P1 | 실사용 리뷰 2~3회 후 보정 | validated-3rd-pass |

## 3차 검증 요약
- 모든 Skill 에 `역할`, `역할 경계`, `선행 조건`, `입력이 부족할 때 기본 가정`, `출력 계약`, `handoff packet`을 갖췄다.
- 전 skill 이 공통 기준으로 읽히도록 섹션 순서를 사실상 통일했다.
- `move-in-cleaning-expert` 의 인코딩 문제를 해결하고 실전 사용 가능한 수준으로 재작성했다.
- `builder-implementation`, `qa-review`, `security-hardening` 은 실제 문서 경로를 더 직접적으로 드러내도록 정리했다.
- 전체 평가와 backlog 는 `docs/skills/SKILL_SYSTEM_SCORECARD_2026-03-13.md` 에 기록했다.


## 2026-03-13 AI implement alignment pass
- 기준: 자동 매뉴얼, 작업 기억, 자동 품질 검사, 전문 에이전트 협업
- 조치: standards, catalog, core chain skill 재정렬 완료
- 다음 보강 후보: brainstorm 계열과 move-in-cleaning-expert 에 동일한 memory/gate 패턴을 점진 반영
- 2026-03-14 alignment pass: brainstorm/domain/security skill 군에 manual/memory/gate/handoff 패턴 반영 완료
- 남은 개선: 각 skill 의 실사용 사례 누적과 sample artifact 확장 중심
