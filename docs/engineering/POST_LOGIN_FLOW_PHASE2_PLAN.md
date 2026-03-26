# POST_LOGIN_FLOW_PHASE2_PLAN

## Why this batch

- 로그인 이후 주 흐름은 좋아졌지만, 예외 상황에서 다시 현재 맥락을 잡기 어렵다.
- 특히 `세션 만료`, `로그아웃`, `OWNER 권한 부족`, `초대 발송 후 다음 행동`은 리다이렉트만으로는 충분히 설명되지 않는다.

## PM goal

- 사용자가 예외 상황에서도 "왜 이 화면으로 왔는지"를 바로 이해하게 만든다.
- 리다이렉트 이후 다음 행동이 추측이 아니라 안내로 읽히게 한다.

## Scope

### 1. Login return reasons

- `/app`, `/home`, `/ops`에서 세션이 만료되면 `/login?reason=session-expired&next=...`로 이동
- 수동 로그아웃은 `/login?reason=logged-out`
- 로그인 화면은 reason에 따라 상단 안내와 다음 행동을 다르게 보여준다
- 안전한 same-origin path면 로그인 후 `next` 경로로 복귀한다

### 2. Home return reasons

- OWNER가 아닌 사용자가 `/ops`를 열면 `/home?reason=owner-required`
- 홈 화면은 reason banner로 왜 돌아왔는지 설명한다
- 초대 발송 직후에는 "다음 단계"가 바뀌었다는 점을 더 직접적으로 보여준다

### 3. UX consistency

- 예외 banner는 경고로만 보이지 않고, 다음 행동 힌트까지 포함한다
- CTA는 현재 역할과 맥락에 따라 계속 일관되게 보인다

## Non-goals

- auth API 변경
- server-side next validation beyond basic same-origin path guard
- real mail cutover

## Success criteria

- 세션 만료 후 다시 로그인 화면에 왔을 때 이유를 바로 이해할 수 있다
- 로그인 성공 후 원래 가려던 화면으로 자연스럽게 돌아갈 수 있다
- OWNER가 아닌 사용자가 운영 콘솔에서 튕겼을 때, 홈에서 왜 그런지와 어디로 가야 하는지 바로 이해할 수 있다
