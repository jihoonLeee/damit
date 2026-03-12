# SKILL CATALOG

| Skill | 목적 | 언제 쓰나 | 주요 출력 | 상태 | 그룹 |
|---|---|---|---|---|---|
| skill-steward | Skill 체계 리뷰, 중복 정리, 개선 backlog 운영 | skill 품질 점검, 새 skill 생성/수정 판단 시 | docs/skills/*, output/skill-reviews/* | active | meta |
| brainstorm-vision | 문제 중심 아이디어 발산 | 아이디어가 없거나 선택지를 넓혀야 할 때 | docs/product/IDEA_POOL.md | active | brainstorm |
| brainstorm-practical | MVP 현실성 검토 | 발산된 후보를 실제 검증 가능한 크기로 줄일 때 | docs/product/IDEA_POOL.md | active | brainstorm |
| brainstorm-market | 지불 이유, 채널, 경쟁, 플랫폼 중복 평가 | 출시 가능한 후보의 시장성을 비교할 때 | docs/product/IDEA_POOL.md | active | brainstorm |
| brainstorm-critic | 실패 시나리오와 kill signal 점검 | 최종 선정 전 리스크를 냉정하게 볼 때 | docs/product/IDEA_POOL.md | active | brainstorm |
| brainstorm-synthesizer | 결과 통합, shortlist/final 선정 | brainstorm 4단계가 끝난 뒤 | docs/product/IDEA_SHORTLIST.md, docs/product/IDEA_FINAL.md | active | brainstorm |
| pm-brainstorm | 최종 아이디어를 PRD/MVP 로 구체화 | 최종 후보가 정해진 뒤 | docs/product/PRD.md, docs/product/MVP_SCOPE.md | active | product |
| move-in-cleaning-expert | 입주청소 현장 운영, 추가금, 범위 설명, 분쟁 포인트를 도메인 시각으로 검증 | 입주청소 대상 아이디어, PRD, UX, 카피, QA 를 현실 검증할 때 | docs/* review notes, 현장 검증 메모 | active | domain |
| ux-screen-design | PRD 를 IA/Flow/Wireframe/Screen Spec 으로 변환 | PM 문서가 준비된 뒤 | docs/ux/* | active | ux |
| feature-spec | UX 를 구현 가능한 기능/API/규칙 명세로 변환 | UX 설계가 끝난 뒤 | docs/specs/* | active | spec |
| builder-implementation | specs 기반 구현, 테스트, 문서 반영 | 명세가 확정된 뒤 실제 코드 작업 시 | 코드, docs/engineering/* | active | engineering |
| qa-review | 구현 검증, 테스트 케이스, 릴리즈 판단 | 구현 후 검증 단계 | output/qa/* | active | qa |

## 읽는 방법
- 브레인스토밍 흐름: `brainstorm-vision -> brainstorm-practical -> brainstorm-market -> brainstorm-critic -> brainstorm-synthesizer`
- 제품 설계 흐름: `pm-brainstorm -> ux-screen-design -> feature-spec`
- 도메인 검증 흐름: `pm-brainstorm` 또는 `ux-screen-design` 이후 `move-in-cleaning-expert` 를 병행해 현장 현실성을 점검
- 실행 흐름: `builder-implementation -> qa-review`
- 거버넌스 흐름: `skill-steward`

## 예시 사용 흐름
1. 새 서비스 아이디어를 찾는다.
2. brainstorm 계열 5개 skill 로 후보를 넓히고 좁힌다.
3. pm-brainstorm 으로 PRD 와 MVP 범위를 만든다.
4. 필요하면 move-in-cleaning-expert 로 입주청소 현장 현실성을 다시 검증한다.
5. ux-screen-design 과 feature-spec 으로 설계를 잠근다.
6. builder-implementation 과 qa-review 로 구현과 검증을 진행한다.
