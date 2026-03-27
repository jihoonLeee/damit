# APP_OVERVIEW_HUB_PRD

## Summary

`/app` 호환 경로를 단계형 워크플로의 허브 화면으로 재정의한다. 현재 선택된 작업 건의 상태를 요약하고, `현장 기록 / 변경 견적 / 설명 초안 / 확인과 합의` 단계 화면으로 빠르게 이동할 수 있게 만든다.

## Product outcome

- 사용자는 `/app`를 "어디로 가야 하는지 결정하는 화면"으로 이해한다.
- 직접 편집은 단계 화면에서 하고, overview는 진행 파악과 이동에 집중한다.
- route split 전략이 제품 전체에서 더 일관되게 읽힌다.

## Requirements

### Functional

- `/app` overview에서 stage route hub 카드가 보인다.
- hub 카드는 선택된 작업 건 기준으로 동적 링크를 가진다.
- 작업 건이 없을 때는 시작 가이드 문구를 보여준다.
- `/app` overview에서 capture 입력 패널은 숨긴다.
- `/app` overview에서 quote/draft/confirm/agreement/records/timeline 편집 카드는 숨긴다.

### UX

- overview는 `현재 작업 건 요약 -> 단계 이동 카드 -> 진행 단계` 흐름으로 읽힌다.
- 모바일에서는 detail hub가 목록보다 먼저 오도록 배치한다.
- 카드 문구는 "지금 어디로 가야 하는지"가 먼저 읽히도록 짧게 쓴다.

## Release gate

- `/app` overview에서 stage hub가 정상 렌더링된다.
- `caseId`가 있을 때 stage 링크가 해당 작업 건으로 이어진다.
- visual review에 overview hub 증거가 추가된다.
