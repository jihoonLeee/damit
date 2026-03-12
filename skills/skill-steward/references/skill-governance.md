# Skill Governance Guide

## 목적
Skill 이 많아질수록 중복, 모호성, 품질 저하가 발생하므로
일관된 기준으로 생성, 수정, 폐기, 개선을 관리한다.

## 운영 원칙
- Skill 은 하나의 핵심 책임만 가진다.
- SKILL.md 는 짧되, 호출 경계는 명확해야 한다.
- description 은 호출 트리거를 담는다.
- 출력 파일 경로가 없는 Skill 은 불완전한 Skill 로 본다.
- 비슷한 Skill 이 둘 이상이면 병합 후보로 등록한다.
- 각 Skill 은 다음 단계 핸드오프를 가져야 한다.

## 개선 우선순위
1. 모호한 Skill 명/설명 수정
2. 입력/출력 누락 보강
3. 중복 제거
4. 선행 조건 및 핸드오프 명시
5. 평가/리뷰 기준 추가

## 상태 정의
- draft: 초안
- active: 사용 중
- review-needed: 개선 필요
- deprecated: 사용 중단 예정
- archived: 보관
