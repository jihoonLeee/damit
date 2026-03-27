# APP_OVERVIEW_HUB_BRAINSTORM

## Problem

- `/app` 호환 경로가 아직 예전 full workspace 성격을 많이 유지하고 있다.
- route split 이후에는 `capture / quote / draft / confirm`이 주 동선인데, `/app`이 여전히 직접 입력과 편집을 다 보여줘 단계 분리 의도가 약해진다.
- 모바일에서는 특히 `/app`가 한 번에 너무 많은 문맥을 보여줘 허브라기보다 "예전 전체 화면"처럼 느껴진다.

## Goal

- `/app`를 진짜 `overview hub`로 바꾼다.
- overview에서는 현재 선택된 작업 건 상태를 바탕으로 어느 단계 화면으로 가야 하는지 먼저 보여준다.
- 실제 입력/편집은 stage route로 보내고, `/app`는 단계 이동과 진행 상황 파악에 집중한다.

## Direction

1. `/app` overview에서 capture 입력 패널은 숨긴다.
2. `/app` overview detail 영역에는 stage route 카드와 현재 작업 건 기준 진입 링크를 보여준다.
3. overview에서는 detail 편집 카드 대신 progress, summary, route hub를 우선 노출한다.
4. 모바일에서는 overview detail이 목록보다 먼저 오게 해서 "현재 작업 건 기준 이동"이 먼저 보이게 한다.

## Success criteria

- `/app`에 들어가면 가장 먼저 "어느 단계로 갈지"가 보인다.
- `/app`에서 직접 모든 편집을 하려는 인상이 줄어든다.
- 모바일에서 overview가 허브처럼 더 짧고 명확하게 읽힌다.
