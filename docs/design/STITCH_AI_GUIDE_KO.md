# STITCH AI 사용 가이드

## 목적

이 문서는 `다밋` 디자인을 Stitch AI로 새로 잡을 때,

- 무엇부터 만들어야 하는지
- 어떤 순서로 넣어야 하는지
- 웹/모바일을 어떻게 나눠 뽑아야 하는지
- 결과물을 어떤 기준으로 버리고 고를지

를 한글로 바로 따라 할 수 있게 정리한 운영 가이드입니다.

함께 보면 좋은 문서:

- [STITCH_AI_PROMPT_PACK.md](D:\AI_CODEX_DESKTOP\docs\design\STITCH_AI_PROMPT_PACK.md)
- [STITCH_AI_USAGE_NOTE.md](D:\AI_CODEX_DESKTOP\docs\design\STITCH_AI_USAGE_NOTE.md)
- [STITCH_AI_READY_PROMPTS.md](D:\AI_CODEX_DESKTOP\docs\design\STITCH_AI_READY_PROMPTS.md)
- [BRAND.md](D:\AI_CODEX_DESKTOP\docs\product\BRAND.md)

---

## 먼저 알아둘 원칙

### 1. 한 번에 모든 화면을 만들지 않는다

Stitch에 처음부터 모든 화면을 한 번에 요청하면 보통 이런 문제가 생깁니다.

- 화면마다 스타일이 조금씩 달라짐
- 너무 AI가 만든 템플릿처럼 보임
- 예쁘긴 한데 제품 같지는 않음
- 브랜드가 아니라 "무난한 SaaS"처럼 나옴

그래서 `다밋`은 반드시 아래 순서로 가야 합니다.

1. 브랜드 방향 고정
2. 핵심 진입면 3개 먼저
3. 핵심 업무 화면
4. 운영 화면
5. 계정/관리 화면
6. 마지막에 로고

### 2. 웹 먼저, 모바일은 그 다음

모바일까지 처음부터 같이 뽑으면 레이아웃이 흐려질 수 있습니다.

추천 방식:

1. 데스크톱 버전 먼저 생성
2. 방향이 맞는 안을 고름
3. 같은 화면을 모바일 adaptation prompt로 다시 생성

### 3. 예쁜 것보다 `다밋답다`가 우선

좋은 결과물의 기준은 "화려함"이 아닙니다.

좋은 결과물은:

- 현장 운영 도구처럼 보이고
- 설명/기록/증빙 흐름이 읽히고
- 사장님이 실제로 쓸 것 같고
- 한 제품군처럼 보입니다

---

## 준비물

Stitch에 넣기 전에 아래 문서를 같이 켜두는 걸 추천합니다.

1. [STITCH_AI_PROMPT_PACK.md](D:\AI_CODEX_DESKTOP\docs\design\STITCH_AI_PROMPT_PACK.md)
2. [STITCH_AI_USAGE_NOTE.md](D:\AI_CODEX_DESKTOP\docs\design\STITCH_AI_USAGE_NOTE.md)
3. 현재 캡처
   - [desktop-overview.png](D:\AI_CODEX_DESKTOP\output\visual-review\desktop-overview.png)
   - [desktop-home-authenticated.png](D:\AI_CODEX_DESKTOP\output\visual-review\desktop-home-authenticated.png)
   - [desktop-app-authenticated.png](D:\AI_CODEX_DESKTOP\output\visual-review\desktop-app-authenticated.png)
   - [desktop-ops-authenticated.png](D:\AI_CODEX_DESKTOP\output\visual-review\desktop-ops-authenticated.png)
   - [desktop-account-authenticated.png](D:\AI_CODEX_DESKTOP\output\visual-review\desktop-account-authenticated.png)
   - [desktop-admin-authenticated.png](D:\AI_CODEX_DESKTOP\output\visual-review\desktop-admin-authenticated.png)

---

## 실제 사용 순서

바로 복붙해서 쓰고 싶다면:

- [STITCH_AI_READY_PROMPTS.md](D:\AI_CODEX_DESKTOP\docs\design\STITCH_AI_READY_PROMPTS.md)

을 먼저 사용하면 됩니다.

## 1단계. 전역 브랜드 프롬프트 넣기

가장 먼저 해야 할 일은 `전역 브랜드 프롬프트`를 넣는 것입니다.

위치:
- [STITCH_AI_PROMPT_PACK.md](D:\AI_CODEX_DESKTOP\docs\design\STITCH_AI_PROMPT_PACK.md)
- `1. Global direction prompt`

이 프롬프트의 역할:

- 다밋이 어떤 제품인지 설명
- 어떤 느낌이면 안 되는지 차단
- 모든 화면이 같은 제품군으로 보이게 기준 고정

이 단계에서는 화면 하나를 만들기보다,
`브랜드 방향을 먼저 잡는다`고 생각하면 됩니다.

### PM 체크

이 단계 결과가 아래처럼 보이면 통과입니다.

- 범용 AI SaaS처럼 안 보임
- 종이/문서/운영 데스크 느낌이 있음
- 차갑고 미래적인 느낌보다 차분하고 실무적인 느낌이 강함

---

## 2단계. 진입면 3개부터 만든다

가장 먼저 만들 화면:

1. landing
2. start
3. login

왜 이 순서냐면,
이 세 화면이 전체 첫인상을 결정하기 때문입니다.

### 넣는 순서

1. landing page prompt
2. start page prompt
3. login page prompt

위치:
- [STITCH_AI_PROMPT_PACK.md](D:\AI_CODEX_DESKTOP\docs\design\STITCH_AI_PROMPT_PACK.md)
- `4.1 Landing`
- `4.2 Start`
- `4.3 Login`

### 이 단계에서 확인할 것

- 세 화면이 한 제품처럼 보이는지
- CTA 우선순위가 명확한지
- `다밋`이 AI 서비스가 아니라 운영 제품처럼 보이는지
- 시작/로그인 화면이 "불안한 인증 화면"이 아니라 "차분한 진입면"처럼 보이는지

---

## 3단계. 운영 흐름의 뼈대를 만든다

그다음은 아래 두 화면입니다.

1. home
2. app workspace

이유:

- home은 경로를 정하는 라우팅 데스크
- app은 실제 제품 핵심

### 넣는 순서

1. home page prompt
2. main app workspace prompt

위치:
- [STITCH_AI_PROMPT_PACK.md](D:\AI_CODEX_DESKTOP\docs\design\STITCH_AI_PROMPT_PACK.md)
- `4.4 Home`
- `4.5 Main app workspace`

### 이 단계에서 특히 볼 것

- home에서 `어디로 가야 하는지` 한눈에 보이는지
- app에서 `지금 몇 단계인지`, `다음에 뭘 해야 하는지` 바로 읽히는지
- app이 대시보드가 아니라 `증빙 흐름`처럼 보이는지

---

## 4단계. 운영 화면을 만든다

그다음은 아래 두 화면입니다.

1. ops
2. customer confirmation

이유:

- ops는 owner 운영 콘솔
- customer confirmation은 고객에게 보여지는 유일한 외부 표면

### 넣는 순서

1. operations console prompt
2. customer confirmation page prompt

위치:
- [STITCH_AI_PROMPT_PACK.md](D:\AI_CODEX_DESKTOP\docs\design\STITCH_AI_PROMPT_PACK.md)
- `4.6 Customer confirmation`
- `4.7 Operations console`

### 이 단계에서 볼 것

- ops가 분석 대시보드처럼 보이지 않는지
- 고객 확인 화면이 복잡하지 않고 신뢰감 있게 보이는지
- 내부 화면과 외부 화면이 같은 브랜드지만 다른 밀도를 갖는지

---

## 5단계. 계정/관리 화면을 만든다

마지막으로 아래 두 화면을 만듭니다.

1. account
2. admin

이유:

- account는 owner control surface
- admin은 internal audit surface

이 둘은 제품 전체 구조가 잡힌 뒤 만들어야
정체성이 덜 흔들립니다.

### 넣는 순서

1. owner account page prompt
2. internal admin page prompt

위치:
- [STITCH_AI_PROMPT_PACK.md](D:\AI_CODEX_DESKTOP\docs\design\STITCH_AI_PROMPT_PACK.md)
- `4.8 Owner account`
- `4.9 Internal admin`

### 이 단계에서 볼 것

- account가 설정 모음집처럼 보이지 않는지
- admin이 화려한 대시보드가 아니라 조용한 내부 감사 화면처럼 보이는지

---

## 6단계. 모바일 버전을 만든다

각 화면마다 데스크톱 안이 어느 정도 마음에 들면,
그 다음에 모바일 프롬프트를 붙입니다.

위치:
- [STITCH_AI_PROMPT_PACK.md](D:\AI_CODEX_DESKTOP\docs\design\STITCH_AI_PROMPT_PACK.md)
- `5. Mobile adaptation prompt`

### 사용 방법

예를 들어 landing을 모바일로 다시 만들고 싶으면:

1. landing 결과물 선택
2. 그 결과물 컨텍스트 유지
3. mobile adaptation prompt 추가

### 모바일에서 특히 볼 것

- 첫 액션이 폴드 위에 있는지
- 카드 간격이 답답하지 않은지
- 상태 배지가 과밀하지 않은지
- 운영 도구 느낌이 유지되는지

---

## 7단계. 마지막에 로고를 만든다

로고는 가장 마지막입니다.

왜냐하면 로고를 먼저 만들면
오히려 제품 화면과 안 맞는 경우가 많기 때문입니다.

추천 순서:

1. 제품 화면군 방향 먼저 확정
2. 그 다음 로고 콘셉트 탐색
3. 마지막에 벡터 정리

로고 관련 프롬프트 위치:
- [STITCH_AI_PROMPT_PACK.md](D:\AI_CODEX_DESKTOP\docs\design\STITCH_AI_PROMPT_PACK.md)
- `6. Logo direction`

다밋 로고는 이렇게 가는 게 맞습니다.

- AI 서비스 로고처럼 보이면 안 됨
- 문서/증빙/도켓/폴더 같은 감각
- 짙은 네이비 메인
- 작은 앰버 포인트
- 과한 장식 없음

---

## Stitch에 실제로 넣는 방식

## 가장 추천하는 방식

각 화면마다 아래 순서로 넣습니다.

1. 전역 브랜드 프롬프트
2. 해당 화면 프롬프트
3. 필요하면 네거티브 프롬프트 재강조
4. 결과물 확인
5. 괜찮은 안 하나 선택
6. 그 안으로 모바일 버전 요청

### 예시 순서

1. global direction prompt
2. landing prompt
3. 결과 확인
4. 수정 요청
5. landing mobile prompt

그다음

1. global direction prompt
2. login prompt
3. 결과 확인
4. 수정 요청
5. login mobile prompt

이렇게 반복합니다.

---

## 추천 수정 요청 방식

Stitch 결과가 조금 아쉬울 때는
아래처럼 수정하는 게 좋습니다.

### 좋은 수정 요청

- 첫 CTA가 더 분명하게 보이게 해줘
- 카드 간격을 더 통일해줘
- 지금 화면이 너무 일반적인 SaaS처럼 보여서 더 종이 문서 느낌으로 바꿔줘
- 경고 상태가 더 눈에 띄되 시끄럽지 않게 정리해줘
- owner용 화면답게 설정 페이지보다 운영 데스크처럼 보여줘

### 나쁜 수정 요청

- 더 세련되게
- 더 예쁘게
- 더 멋있게
- 더 미래적으로

이런 요청은 다시 AI 템플릿 느낌으로 돌아갈 확률이 높습니다.

---

## PM 기준 결과물 합격 체크리스트

Stitch 결과를 볼 때 아래를 체크하면 됩니다.

### 공통

- 범용 AI SaaS처럼 보이지 않는가
- 같은 제품군처럼 보이는가
- 첫 액션이 시선상 이기는가
- 카드 간격이 일정한가
- 정보 위계가 명확한가

### landing

- 브랜드 첫인상이 차분하고 신뢰감 있는가
- 과장 광고처럼 안 보이는가

### login/start

- 시작 흐름이 불안하지 않은가
- "마법 링크"보다 "운영 진입"처럼 보이는가

### home

- 어디로 가야 하는지 바로 읽히는가

### app

- 증빙 흐름처럼 보이는가
- 종료 상태가 정말 끝난 것처럼 보이는가

### ops

- 분석 대시보드보다 dispatch console처럼 보이는가

### account

- 설정 페이지가 아니라 owner control desk처럼 보이는가

### admin

- 읽기 전용 internal audit surface처럼 보이는가

### mobile

- 폴드 위 첫 액션이 명확한가
- 밀도가 과하지 않은가

---

## PM 추천 실제 실행 순서

가장 추천하는 현실적 순서:

1. landing
2. login
3. home
4. app
5. ops
6. account
7. admin
8. customer confirmation
9. logo

`start`는 landing/login 사이에 같이 만들어도 됩니다.

---

## 마지막 팁

Stitch에서 가장 중요한 건 "한 번에 완성"이 아닙니다.

제일 좋은 방법은:

- 방향 먼저 고정
- 핵심 화면 먼저 고르고
- 그 스타일을 나머지 화면에 확장
- 마지막에 모바일과 로고 정리

입니다.

`다밋`은 화려한 AI 서비스가 아니라,
현장 기록과 운영 설명을 분명하게 정리하는 제품이어야 합니다.

그래서 결과물이 조금 덜 화려해 보여도,
더 차분하고 더 문서 같고 더 실무적이면
그 방향이 맞습니다.
