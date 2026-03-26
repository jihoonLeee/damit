# Recraft 바로 붙여넣는 다밋 로고 프롬프트

## 목적

이 문서는 Recraft에 바로 복붙해서
`다밋` 로고 콘셉트를 빠르게 탐색할 수 있도록 만든
초압축 실전 프롬프트 모음입니다.

함께 보면 좋은 문서:

- [DAMIT_LOGO_DIRECTIONS_KO.md](D:\AI_CODEX_DESKTOP\docs\design\DAMIT_LOGO_DIRECTIONS_KO.md)
- [LOGO_TOOL_AND_PROMPT_GUIDE_KO.md](D:\AI_CODEX_DESKTOP\docs\design\LOGO_TOOL_AND_PROMPT_GUIDE_KO.md)

---

## 사용 방법

추천 순서:

1. 방향 1 프롬프트로 5개 생성
2. 방향 2 프롬프트로 5개 생성
3. 방향 3 프롬프트로 5개 생성
4. 총 15개 중 3개만 남김
5. 제품 화면 위에 올려봄
6. 마지막에 벡터 정리

추천 옵션:

- 스타일은 `flat`, `vector`, `minimal`
- 너무 장식적인 옵션은 피하기
- 배경은 가능하면 `light`, `neutral`, `paper-like`

---

## 공통 네거티브 프롬프트

아래 문구는 방향별 프롬프트 뒤에 같이 붙이면 좋습니다.

```text
Avoid chat bubbles, sparkles, AI brain motifs, neural nodes, infinite loops, generic startup icons, shiny gradients, 3D effects, playful mascot style, and futuristic SaaS branding.
```

---

## 1. 도켓 탭형 프롬프트

```text
Design a flat vector logo for a Korean B2B field-operations product named `다밋 (DAMIT)`.

The logo should feel like a docket tab, indexed evidence folder, or clipped operating label. It should communicate organization, field documentation, and trust.

Use deep navy as the main color and a very small muted amber accent. The structure should be strong, editorial, and professional. It may contain a subtle hidden `D`, but should not become a literal obvious lettermark.

The mark must work as:
- app icon
- favicon
- product header mark
- document corner mark

The overall feeling should be:
- calm
- structured
- credible
- operational
- premium but restrained
```

### PM 메모

가장 추천.

---

## 2. 스탬프 씰형 프롬프트

```text
Design a flat vector logo for a Korean B2B operations product named `다밋 (DAMIT)`.

The logo should feel like a refined approval stamp, confirmation seal, or proof mark for an operations workflow. It should suggest verified records, customer confirmation, and documented agreement, without looking legalistic or governmental.

Use deep navy as the main color and a very small muted amber accent. The shape should be compact, balanced, and strong at small sizes.

The result should feel:
- trustworthy
- verified
- calm
- authoritative
- not bureaucratic
```

### PM 메모

좋지만 너무 행정 서비스처럼 보이면 탈락.

---

## 3. 폴더/문서 절개형 프롬프트

```text
Design a flat vector logo for a Korean B2B field-operations product named `다밋 (DAMIT)`.

The logo should feel like a document corner, layered record, folder silhouette, or clipped evidence sheet. It should communicate documentation, operational clarity, and record-keeping.

Use deep navy as the main color and a very small muted amber accent. The form should be simple, scalable, and refined. A subtle hidden `D` is allowed if it feels natural.

The mood should be:
- operational
- calm
- clear
- document-first
- not generic
```

### PM 메모

무난하지만 너무 일반적인 문서앱처럼 보이면 탈락.

---

## 4. 워드마크 포함 프롬프트

```text
Design a symbol + wordmark logo system for `다밋 (DAMIT)`.

The symbol should feel like a docket tab, evidence folder, or operational record mark. The wordmark should feel editorial, solid, and business-like rather than startup-like.

Use a flat vector style. Main color deep navy, very small muted amber accent. The system should work on warm paper-colored UI backgrounds and white backgrounds.

The overall impression should be:
- calm
- premium
- operational
- trustworthy
- not futuristic
- not playful
```

---

## 5. 앱 아이콘 중심 프롬프트

```text
Design an app-icon-ready logo for `다밋 (DAMIT)`.

It must remain legible at very small sizes and still feel like a serious operations product. The icon should suggest a docket tab, evidence record, or operating mark.

Flat vector style only. Deep navy main color. Tiny muted amber accent allowed. Strong silhouette. No decorative details that disappear at small size.
```

---

## 6. 가장 추천하는 시작 세트

Recraft에서는 아래 3개부터 시작하는 걸 추천합니다.

### 1차

- 도켓 탭형 프롬프트
- 스탬프 씰형 프롬프트
- 폴더/문서 절개형 프롬프트

### 2차

그중 괜찮은 방향 하나를 고른 뒤:

- 워드마크 포함 프롬프트
- 앱 아이콘 중심 프롬프트

---

## 7. 결과물 고르는 기준

좋은 후보:

- 한눈에 구조가 읽힘
- 작은 크기에서도 안 무너짐
- 제품 화면 위에 올려도 자연스러움
- AI 로고 생성 느낌이 적음
- 다밋이 하는 일과 정서가 맞음

버릴 후보:

- 너무 스타트업 같음
- 너무 AI 서비스 같음
- 너무 문서관리 SaaS 같음
- 너무 법률/회계/행정 서비스 같음
- 너무 귀엽거나 장난스러움

---

## 8. PM 추천

가장 먼저 써볼 프롬프트는 이겁니다.

1. 도켓 탭형
2. 워드마크 포함
3. 앱 아이콘 중심

이 세 개 조합이 가장 빨리 `다밋다운` 방향을 잡을 가능성이 높습니다.
