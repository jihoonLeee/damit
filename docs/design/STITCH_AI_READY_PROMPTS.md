# STITCH AI 바로 붙여넣는 완성 프롬프트

## 목적

이 문서는 Stitch AI에 바로 붙여넣을 수 있도록,

- `Global direction prompt`
- `Shared art direction`
- `Screen prompt`

를 화면별로 이미 합쳐놓은 실전용 프롬프트 모음입니다.

즉, 이 문서는 **복붙해서 바로 쓰는 버전**입니다.

함께 보면 좋은 문서:

- [STITCH_AI_GUIDE_KO.md](D:\AI_CODEX_DESKTOP\docs\design\STITCH_AI_GUIDE_KO.md)
- [STITCH_AI_PROMPT_PACK.md](D:\AI_CODEX_DESKTOP\docs\design\STITCH_AI_PROMPT_PACK.md)

---

## 사용 방식

가장 추천하는 방식:

1. 아래에서 원하는 화면 프롬프트 하나를 복사
2. Stitch에 입력
3. 데스크톱 버전 먼저 생성
4. 마음에 드는 방향을 하나 고른 뒤
5. 같은 화면의 모바일 프롬프트를 추가로 입력

주의:

- 처음부터 모든 화면을 한 번에 만들지 말 것
- 한 화면씩 방향을 고정하면서 갈 것
- 마음에 안 들면 "더 예쁘게"가 아니라 `더 문서처럼`, `더 운영 도구처럼`, `더 다밋답게`라고 수정 요청할 것

---

## 1. 랜딩 페이지 프롬프트

```text
Design a Korean B2B operations product called `다밋 (DAMIT)`.

This product is not a chatbot, not a futuristic AI dashboard, and not a startup landing page. It is an owner-facing operating tool for messy field work: changed estimates, customer explanation, confirmation, agreement logging, and evidence tracking.

The brand should feel like:
- a calm field desk
- an evidence ledger
- a clipped operations folder
- stamped status labels
- a trustworthy owner tool

The visual system should feel:
- warm, grounded, paper-based
- structured and editorial
- calm but confident
- premium without looking luxurious
- practical rather than flashy

Use these design principles:
- warm paper backgrounds, not cold white-blue gradients
- deep navy ink typography
- one strong work-blue for action confidence
- amber only as a caution or human follow-up signal
- green only for closure, verified proof, or stable states
- strong card borders, document-like panels, visible structure
- minimal blur, almost no glassmorphism
- no floating neon AI bubbles
- no generic SaaS dashboard look
- no decorative illustrations that compete with the first action
- no purple-heavy palette

Typography should feel editorial and decisive. Use a Korean product style that feels closer to a modern business newspaper or operating file than a startup template.

Shared art direction:
- background should feel like warm sand or paper beige
- cards should feel like clipped paper panels
- one stronger top card per page for the main focus
- compact uppercase mini labels should read like docket markers
- badges should feel like status stamps, not decorative chips
- section spacing should have strong rhythm
- avoid a wall of equal cards
- primary card should always win visually
- interaction tone should feel decisive, calm, and operational

Write all UI copy in Korean.
Use realistic product copy, not lorem ipsum.
Make the design look shippable, not conceptual.
Avoid glossy AI SaaS hero sections, giant rounded blobs, over-animated dashboards, excessive icon noise, and visuals that look interchangeable with generic AI startup templates.

Now design the landing page for `다밋`.

This should feel like a premium but grounded landing page for a Korean B2B operations product.

Main message:
- 설명은 빠르게, 기록은 분명하게.

Page goals:
- make the product feel credible
- explain the workflow clearly
- create one strong brand moment
- lead users into 시작하기 or 로그인

Required sections:
- brand-led hero with one strong headline and short subcopy
- primary CTA: 사장님 시작하기
- secondary CTA: 로그인
- concise explanation of product value
- 3-card explanation of what the product solves
- 4-step workflow section
- subtle trust-oriented product framing, not marketing fluff

Visual direction:
- warm paper background
- deep navy typography
- one strong brand card in the hero
- document-like structure
- strong but restrained hierarchy

Avoid:
- startup gradient hero
- floating AI blobs
- giant illustration
- too many fake trust logos
```

---

## 2. 시작하기 페이지 프롬프트

```text
Design a Korean B2B operations product called `다밋 (DAMIT)`.

This product is not a chatbot, not a futuristic AI dashboard, and not a startup landing page. It is an owner-facing operating tool for messy field work: changed estimates, customer explanation, confirmation, agreement logging, and evidence tracking.

The brand should feel like:
- a calm field desk
- an evidence ledger
- a clipped operations folder
- stamped status labels
- a trustworthy owner tool

The visual system should feel:
- warm, grounded, paper-based
- structured and editorial
- calm but confident
- premium without looking luxurious
- practical rather than flashy

Use these design principles:
- warm paper backgrounds, not cold white-blue gradients
- deep navy ink typography
- one strong work-blue for action confidence
- amber only as a caution or human follow-up signal
- strong card borders, document-like panels, visible structure
- minimal blur
- no glass dashboard look

Shared art direction:
- cards should feel like clipped paper panels
- labels should feel like docket markers
- this page should feel narrower, calmer, and more focused than the landing page
- first action must be extremely obvious

Write all UI copy in Korean.
Use realistic product copy.
Avoid generic SaaS onboarding UI.

Now design the `다밋 시작하기` page.

Goals:
- explain how first access works
- reduce anxiety
- make email-link login feel operational and trustworthy

Required sections:
- strong header with DAMIT lockup
- explanation that this product uses email link login instead of password-first signup
- primary CTA: 이메일로 시작 링크 받기
- secondary CTA: 기존 계정 로그인
- 3-step onboarding explanation:
  - 시작 링크 요청
  - 첫 로그인 설정
  - 운영 흐름 시작

Tone:
- reassuring
- simple
- deliberate
- practical, not magical

Visual direction:
- same paper-ledger system as landing
- one explanatory top block and three step cards
- trust-first rather than marketing-first
```

---

## 3. 로그인 페이지 프롬프트

```text
Design a Korean B2B operations product called `다밋 (DAMIT)`.

This product is an owner-facing operating tool for field changes, revised estimates, customer explanations, confirmations, and evidence tracking. It must not feel like a consumer app or AI playground.

Brand feel:
- calm field desk
- evidence ledger
- trustworthy owner tool

Visual system:
- warm paper background
- deep navy ink typography
- one work-blue for confident actions
- amber only for human follow-up
- visible structure, clear borders, low-gloss surfaces
- no glassmorphism
- no startup-style shiny hero

Shared art direction:
- cards should feel like operational documents
- labels should feel like docket markers
- hierarchy should feel editorial and decisive
- one clear primary action

Write all UI copy in Korean.
Use realistic product copy.

Now design the DAMIT login page for email magic-link login.

Goals:
- make the login flow obvious
- explain what happens next
- show login status clearly

Required sections:
- DAMIT lockup
- title: 로그인
- short explanation of email magic-link login
- 3-step flow card:
  - 로그인 링크 요청
  - 메일함에서 링크 열기
  - 운영 홈에서 회사 확인
- email input form
- primary CTA: 로그인 링크 보내기
- quiet helper copy for preview/dev state if needed

Avoid:
- password-first patterns
- social login clutter
- magical/futuristic tone
```

---

## 4. 운영 홈 페이지 프롬프트

```text
Design a Korean B2B operations product called `다밋 (DAMIT)`.

This is an owner-facing operations product, not a generic dashboard SaaS.

Brand feel:
- calm field desk
- routing desk
- evidence-first workflow

Visual rules:
- warm paper base
- navy ink typography
- strong but restrained blue for actions
- visible borders and structured cards
- low decoration, high hierarchy

Shared art direction:
- route cards should feel intentional and clearly prioritized
- one strongest route must stand out
- supporting routes must still belong to the same visual family
- cards should feel like dispatch or routing cards, not marketing blocks

Write all UI copy in Korean.

Now design the authenticated `운영 홈` for DAMIT.

This page is a routing desk, not the main work surface.

Goals:
- show current company context
- explain the next best action
- clearly separate primary routes from supporting routes

Required sections:
- current session / current company summary
- next action panel
- company switcher
- membership summary
- route cards for:
  - 작업 워크스페이스
  - 운영 콘솔
  - 사장님 마이페이지
  - 시스템 관리자 (only as internal route)
- footer actions and logout

Visual direction:
- dispatch desk
- calm but decisive
- obvious next route
- product-like, not settings-like
```

---

## 5. 메인 작업 워크스페이스 프롬프트

```text
Design a Korean B2B operations product called `다밋 (DAMIT)`.

This product manages changed work, revised estimates, customer explanations, confirmations, agreement records, and evidence.

The brand must feel:
- operational
- calm
- evidence-first
- owner-trustworthy

Shared art direction:
- warm paper-like backgrounds
- strong visible borders
- clipped document-style cards
- labels that feel like docket markers
- blue only for committed action
- amber only for human caution
- green only for stable or closed states
- avoid equal visual weight across all cards

Write all UI copy in Korean.
Make the design look shippable and highly practical.

Now design the main DAMIT operating workspace.

This is the densest and most important screen in the product. It manages:
- field capture
- case binding
- revised quote
- customer explanation draft
- customer confirmation
- agreement record
- timeline

Goals:
- make the workflow obvious
- reduce confusion about what to do next
- make terminal states feel truly finished
- keep heavy information readable on both desktop and mobile

Required layout:
- header with operating context
- workflow strip showing the sequence
- operator signal board
- 지금 바로 할 일 section
- structured workspace:
  - field capture / case binding
  - case list
  - selected case detail

Selected case detail must include:
- current stage card
- focus / next-action card
- revised quote card
- explanation draft card
- customer confirmation card
- agreement card
- field records
- timeline rail

Critical UX rules:
- if a case is AGREED, make it feel closed and review-only
- if a case is EXCLUDED, make it feel closed and non-primary
- long timeline should feel bounded and manageable
- warnings should be short and instantly scannable
- if coming from ops handoff, explain why this case was opened now

Avoid:
- generic project-management app look
- dashboard BI look
- overuse of decorative badges
```

---

## 6. 고객 확인 페이지 프롬프트

```text
Design a Korean B2B operations product called `다밋 (DAMIT)`.

This page is customer-facing, but still belongs to the same DAMIT family.

Brand feel:
- trustworthy
- calm
- clear
- document-like

Visual rules:
- fewer cards
- better spacing rhythm
- simpler than the operator workspace
- no internal jargon
- still warm and premium, but not decorative

Write all UI copy in Korean.

Now design a customer-facing confirmation page for reviewing changed work and confirming understanding.

Goals:
- explain changed work clearly
- show evidence without overwhelming
- make the confirmation action feel explicit
- make completion feedback obvious

Required sections:
- concise header with DAMIT brand presence
- changed work summary
- evidence image block
- revised amount / key detail card
- concise explanation text
- clear CTA: 내용 확인 완료
- completed state after action

Critical UX rules:
- strong spacing consistency
- clear action confirmation
- clear "done" state after submission
- must feel trustworthy on mobile
```

---

## 7. 운영 콘솔 프롬프트

```text
Design a Korean B2B operations product called `다밋 (DAMIT)`.

This is an owner-facing operations console, not a vanity analytics dashboard.

Brand feel:
- dispatch desk
- operating ledger
- calm but high-confidence internal console

Visual rules:
- warm paper base
- visible structure
- first focus card should stand out immediately
- urgent items should be obvious without becoming loud
- compact but calm

Write all UI copy in Korean.

Now design the DAMIT operations console.

Goals:
- make the highest-risk item visible in under 10 seconds
- show whether the system is healthy
- show where to go next

Required sections:
- verdict panel
- priority checklist
- ops-to-app handoff section
- top signal cards:
  - 서비스 상태
  - 최신 백업
  - 배포 버전
  - 저장 모드
- operational warning list
- workflow signal cards:
  - 합의 흐름
  - 고객 확인
  - 최근 타임라인
  - 로그인/세션
- quick actions
- operational snapshot
- recent customer confirmations
- recent timeline
- recent auth delivery
- data explorer
- recent activity / backups

Avoid:
- BI chart dashboard
- generic admin widgets
- overly bright warning colors
```

---

## 8. 사장님 마이페이지 프롬프트

```text
Design a Korean B2B operations product called `다밋 (DAMIT)`.

This page is the owner control surface, not a generic settings page.

Brand feel:
- owner desk
- security and invitation control
- calm operational authority

Visual rules:
- warm paper cards
- stronger hierarchy for active items
- history should feel secondary
- active account/security items should feel immediate and easy to scan

Write all UI copy in Korean.

Now design the DAMIT owner account page.

Goals:
- make security and active company context easy to understand
- let owners manage invitations with confidence
- keep history secondary

Required sections:
- account verdict panel
- current company / security / recent login / internal access summary cards
- profile edit card
- company switch card
- membership list
- owner-only invitation management
- current session
- other active sessions
- closed session history
- recent login activity
- recent account activity
- security posture summary
- route cards to app / ops / account / admin

Critical UX rules:
- active items first, history second
- invitation states must read quickly:
  - 응답 대기
  - 재전송
  - 취소
  - 합류 완료
- session states must read quickly:
  - 현재 세션
  - 다른 활성 세션
  - 최근 종료 세션

Avoid:
- generic settings page layout
- too many equal cards above the fold
- weak primary action hierarchy
```

---

## 9. 시스템 관리자 페이지 프롬프트

```text
Design a Korean B2B operations product called `다밋 (DAMIT)`.

This page is for internal operators only. It must feel constrained, read-only, and audit-like.

Brand feel:
- internal audit room
- dossier / archive / evidence review
- same DAMIT family, but quieter than owner-facing surfaces

Visual rules:
- calmer than `/ops`
- less action-heavy
- stronger read-only tone
- structured data surface, not an enterprise admin toy

Write all UI copy in Korean.

Now design the DAMIT internal admin page.

Goals:
- make the page feel clearly internal
- keep it quieter than owner-facing product surfaces
- support global inspection without looking like a generic admin dashboard

Required sections:
- verdict panel
- principles row:
  - 읽기 전용
  - JSON 내보내기
  - 운영 표면과 분리
- top counts
- current admin viewer card
- global snapshot
- data explorer
- selected dataset focus card
- export action

Avoid:
- dangerous action buttons
- colorful admin toys
- generic enterprise admin visuals
```

---

## 10. 공통 모바일 프롬프트

이 프롬프트는 위 화면 중 하나를 먼저 만든 뒤, 같은 화면의 모바일 버전을 요청할 때 붙입니다.

```text
Now adapt this DAMIT screen into a mobile version.

Rules:
- preserve the first action above the fold
- keep card spacing rhythmic and calm
- make status badges readable without crowding
- avoid stacking too many equal cards before the key action
- if content is long, use bounded rails, collapsible sections, or clearer grouping
- make tap targets generous without turning the UI into a consumer app
- keep the same DAMIT brand family: paper, ink, ledger, docket labels, restrained action color

The mobile layout should still feel like a disciplined operating tool, not a simplified startup mobile app.

Write all UI copy in Korean.
```

---

## 11. 로고 탐색 프롬프트

```text
Design a refined brand mark for a Korean B2B field-operations product named `다밋 (DAMIT)`.

This is not an AI chatbot brand and not a futuristic startup logo.

The mark should feel like:
- a modern evidence folder
- an operating ledger
- a docket tab
- a stamped status mark

Requirements:
- simple enough to scale to app icon size
- premium but restrained
- not playful
- not futuristic
- should pair well with warm paper backgrounds
- should feel credible in both product UI and documents

Visual cues:
- a document corner, tab, clip, docket edge, or stamped circle
- deep navy as the main color
- one small muted amber accent
- optional hidden `D` structure inside the mark

Avoid:
- sparkles
- chat bubbles
- neural nodes
- infinite loops
- generic geometric startup marks
- shiny gradients
- 3D effects

The result should work as:
- app icon
- favicon
- product mark inside a warm paper-based UI system
```

---

## 12. 가장 추천하는 실제 진행 순서

1. 랜딩
2. 시작하기
3. 로그인
4. 운영 홈
5. 메인 작업 워크스페이스
6. 운영 콘솔
7. 사장님 마이페이지
8. 시스템 관리자
9. 고객 확인 페이지
10. 마지막에 로고

---

## 13. PM 최종 체크

Stitch 결과가 아래처럼 보이면 버리는 게 좋습니다.

- 너무 AI 서비스 같음
- 너무 스타트업 랜딩 템플릿 같음
- 너무 반짝거림
- 너무 일반적인 SaaS 대시보드 같음
- 화면마다 다른 제품처럼 보임

반대로 아래처럼 보이면 좋은 방향입니다.

- 문서 데스크 같다
- 운영 도구 같다
- 차분한데 밀도 있다
- 첫 액션이 분명하다
- 증빙/기록/설명 흐름이 읽힌다
- `다밋`만의 표정이 있다
