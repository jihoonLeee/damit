# SKILL CHANGELOG
## 2026-03-13 skill sample artifacts added
- docs/engineering/SECURITY_REVIEW_SAMPLE.md: security-hardening release-review 예시 추가
- docs/engineering/SECURITY_HARDENING_PLAN_SAMPLE.md: hardening plan 예시 추가
- output/reviews/move-in-cleaning-sample-review.md: 도메인 현장 검증 메모 예시 추가
- output/qa/TEST_CASES.md, QA_SUMMARY.md, DEFECTS.md: qa-review sample artifact 추가
- 관련 skill 문서에 sample artifact 참조 섹션 추가
## 2026-03-13 skill system normalization
- docs/skills/SKILL_SYSTEM_SCORECARD_2026-03-13.md: 전체 skill 점수표와 개선 backlog 추가
- docs/skills/SKILL_REVIEW_QUEUE.md: 3차 검증 기준으로 전면 갱신
- brainstorm-* 계열: 선행 조건, 기본 가정, 출력 계약 문체를 통일하고 AI 친화적으로 정리
- pm-brainstorm, ux-screen-design, feature-spec: 입력 부족 시 기본 가정과 handoff 구조 보강
- builder-implementation: `docs/engineering/QA_HANDOFF.md` 중심의 구현 handoff 구조로 정리
- qa-review: `output/qa/DEFECTS.md` 포함 QA 산출물 구조 보강
- move-in-cleaning-expert: 인코딩 복구 및 현장 검증 스킬로 전면 재작성
- skill-steward: scorecard 기반 governance 문맥 반영
## 2026-03-12 security-hardening strengthened
- security-hardening: `spec-review` / `release-review` 이중 모드로 입력 계약과 작업 절차를 분리
- security-hardening: blocked gate 시 PM 또는 release owner escalation 규칙 추가
- docs/engineering/SECURITY_REVIEW.md: 보안 리뷰 템플릿 신규 추가
- docs/engineering/SECURITY_HARDENING_PLAN.md: hardening plan 템플릿 신규 추가
## 2026-03-12 security-hardening added
- security-hardening: 웹, API, 인증, 서버, 배포, 시크릿 운영을 함께 보는 보안 검토 스킬 추가
- security-hardening/references/web-api-security.md: 세션, 권한, 공개 링크, 업로드, rate limit, 브라우저 방어선 기준 정리
- security-hardening/references/server-infra-security.md: 서버 접근, 포트 노출, 컨테이너, 백업, 내부 도구 보안 기준 정리
- security-hardening/references/secret-ops-security.md: 시크릿 분리, 회전, 로그 위생, 배포 게이트, 사고 대응 기준 정리
- SKILL_CATALOG.md: security 그룹과 보안 검증 흐름 반영


## 2026-03-10 move-in-cleaning-expert added
- move-in-cleaning-expert: 입주청소 현장 운영, 추가금 설명, 작업 범위, 사진 증빙, 고객 반응 검증용 도메인 스킬 추가
- move-in-cleaning-expert/references/field-guide.md: 현장 흐름, 추가금 대표 상황, 고객 반응, 증빙 최소 요건 정리
- SKILL_CATALOG.md: domain 그룹과 도메인 검증 흐름 반영

## 2026-03-10 second-pass validation
- SKILL_STANDARDS.md 전면 정리: 필수 구성요소, 품질 기준, handoff packet, 2차 검증 기준 추가
- SKILL_IMPROVEMENT_PLAYBOOK.md 전면 정리: 개선 절차와 공통 실패 패턴 보강
- brainstorm-vision: 역할 경계, 선행 조건, 판단 원칙, self-review 추가
- brainstorm-practical: 운영 현실성 중심 판단 원칙과 출력 계약 보강
- brainstorm-market: 플랫폼 중복도와 가격 방어 기준을 더 구체화
- brainstorm-critic: 리스크 축, kill signal, 품질 기준 세분화
- brainstorm-synthesizer: tie-break 성격의 판단 원칙과 PM handoff packet 보강
- pm-brainstorm: 선행 조건, 출력 계약, 품질 기준, UX handoff 보강
- ux-screen-design: 출력 계약, 판단 원칙, spec handoff packet 보강
- feature-spec: 구현 규칙 중심 명세 기준, builder handoff packet 강화
- builder-implementation: 완료 기준, 출력 계약, self-review, 예외/테스트 기준 대폭 강화
- qa-review: 릴리즈 판단 기준, 재현 조건, builder feedback packet 강화
- skill-steward: governance 판단 원칙, severity 운영, self-review 강화

## 2026-03-10 first-pass rewrite
- brainstorm-vision: 입력, 출력 형식, 금지, practical handoff 추가
- brainstorm-practical: feasibility 평가 기준과 market handoff 추가
- brainstorm-market: 가격/채널/플랫폼 중복 평가 구조 추가
- brainstorm-critic: 리스크 등급, kill signal, synthesizer handoff 추가
- brainstorm-synthesizer: shortlist/final 기준과 PM handoff 추가
- pm-brainstorm: 이름 정리, PRD/MVP 작성 기준과 UX handoff 추가
- ux-screen-design: SCREEN_SPECS 포함, feature-spec handoff 보강
- feature-spec: 관련 specs 확장 규칙과 builder handoff 추가
- builder-implementation: 입력, 완료 기준, 금지, QA handoff 대폭 보강
- qa-review: QA_SUMMARY와 릴리즈 판단 구조 추가
- skill-steward: severity, create/revise/merge/retire 규칙 추가
- all skills: example input/output sample sections added for faster onboarding and more consistent usage
- SKILL_CATALOG.md: rewritten in readable Korean with workflow-oriented summaries



## 2026-03-13 AI implement system alignment
- docs/skills/AI_IMPLEMENT_SYSTEM_ALIGNMENT.md: 유튜브 가이드 기반 운영 시스템 정렬 문서 추가
- docs/skills/SKILL_STANDARDS.md: 시작 체크, 작업 기억, QA gate, 전문 에이전트 handoff 기준 추가
- docs/skills/SKILL_CATALOG.md: 작업 기억 컬럼과 운영 체계 설명 추가
- pm-brainstorm, ux-screen-design, feature-spec: 단계별 memory artifact 와 handoff 강화
- builder-implementation, qa-review: 자동 품질 검사 시스템 관점으로 시작 체크/완료 체크/리스크 기록 강화
- skill-steward: 운영 시스템 정렬 점검 책임 추가
## 2026-03-14 AI implement alignment expanded
- docs/skills/AI_IMPLEMENT_ALIGNMENT_REVIEW.md: 브레인스토밍/도메인/보안 스킬까지 운영 시스템 정렬 리뷰 추가
- brainstorm-vision, brainstorm-practical, brainstorm-market, brainstorm-critic, brainstorm-synthesizer: 시작 체크, 작업 기억, 완료 체크, handoff 강화
- move-in-cleaning-expert: 현장 검증 메모 + 현장 테스트 가설 중심으로 출력 계약 강화
- security-hardening: mode 선택, 작업 기억, blocked gate escalation, release handoff 강화
