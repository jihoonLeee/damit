# nanobanana2 로고 프롬프트

## 목적

이 문서는 `nanobanana2` 같은 이미지 생성 모델에
바로 넣을 수 있는 `다밋` 로고 프롬프트를 정리한 문서입니다.

Recraft용 프롬프트보다 더 직접적이고,
이미지 모델이 흔히 빠지는 함정을 줄이도록 구성했습니다.

함께 보면 좋은 문서:

- [DAMIT_LOGO_SHORTLIST_KO.md](D:\AI_CODEX_DESKTOP\docs\design\DAMIT_LOGO_SHORTLIST_KO.md)
- [RECRAFT_READY_LOGO_PROMPTS_KO.md](D:\AI_CODEX_DESKTOP\docs\design\RECRAFT_READY_LOGO_PROMPTS_KO.md)
- [LOGO_TOOL_AND_PROMPT_GUIDE_KO.md](D:\AI_CODEX_DESKTOP\docs\design\LOGO_TOOL_AND_PROMPT_GUIDE_KO.md)

---

## PM 기준 사용 원칙

`nanobanana2`에는 한 번에 너무 많은 걸 넣지 않는 게 좋습니다.

추천 방식:

1. 한 번에 한 방향만 생성
2. 텍스트 없는 심볼 버전 먼저
3. 그 다음 워드마크 포함 버전
4. 마지막에 앱 아이콘 중심 버전

처음부터 하지 말아야 할 것:

- 3방향을 한 프롬프트에 다 넣기
- 너무 많은 형용사 넣기
- "예쁘게", "세련되게" 같은 추상적 요청만 하기

---

## 공통 규칙

아래 규칙은 모든 프롬프트에 같이 붙이는 걸 추천합니다.

### 공통 요구사항

- flat vector logo
- centered composition
- plain warm paper background
- no mockup
- no hands
- no device frame
- no 3D
- no glossy gradient
- no text unless explicitly requested
- high contrast
- usable as app icon and favicon

### 공통 네거티브

```text
Avoid chat bubbles, sparkles, AI brain motifs, neural nodes, robot themes, infinity loops, shiny gradients, 3D rendering, mascots, playful startup icons, generic SaaS logo style, legal-firm crest style, tax-accounting-office style.
```

---

## 1. 도켓 탭형 심볼 프롬프트

가장 먼저 돌릴 프롬프트입니다.

```text
Design a flat vector logo symbol for a Korean B2B field-operations product named DAMIT.

The symbol should feel like a docket tab, indexed evidence folder, clipped document label, or operational record marker. It should communicate organization, field documentation, customer explanation workflow, and trust.

Use deep navy as the main color and a very small muted amber accent. The form should be simple, structured, editorial, and highly legible at small size. A subtle hidden D is allowed, but it must not become an obvious literal lettermark.

Make it feel calm, premium, operational, and trustworthy. It should look like a serious product mark that could sit on an evidence folder or operating ledger.

Flat vector logo, centered composition, plain warm paper background, no text, no mockup, no 3D, no glossy effect.

Avoid chat bubbles, sparkles, AI brain motifs, neural nodes, robot themes, infinity loops, shiny gradients, mascots, generic startup icon style.
```

### PM 메모

이게 1순위입니다.

---

## 2. 도켓 탭형 + 워드마크 프롬프트

이건 심볼 방향이 괜찮다고 느껴질 때 바로 이어서 돌리면 됩니다.

```text
Design a flat vector logo system for DAMIT, a Korean B2B field-operations product.

Create a symbol plus wordmark composition. The symbol should feel like a docket tab, evidence folder, clipped record label, or operational ledger mark. The wordmark should read DAMIT and feel editorial, solid, restrained, and premium, not startup-like and not futuristic.

Use deep navy as the main color and a very small muted amber accent. The overall system should work on warm paper backgrounds and white backgrounds. The symbol must also work independently as an app icon.

The feeling should be calm, operational, trustworthy, structured, and specific to a real product used by small-business owners.

Flat vector logo, centered presentation, clean background, no mockup, no 3D, no shiny gradients.

Avoid chat bubbles, sparkles, AI motifs, neural graphics, generic SaaS startup branding, or playful app icon style.
```

### PM 메모

실제 랜딩/헤더 적용성 확인용.

---

## 3. 앱 아이콘 중심 프롬프트

이건 작은 크기 적합성 확인용입니다.

```text
Design an app-icon-ready flat vector logo for DAMIT, a Korean B2B field-operations product.

The icon should feel like a document tab, evidence marker, clipped record, or operational docket symbol. It must remain strong and legible at very small sizes such as favicon, browser tab icon, and app icon.

Use deep navy as the main color and a tiny muted amber accent. Strong silhouette, minimal detail, high contrast, calm and trustworthy feeling. It should feel like a serious operating product, not a consumer app or AI service.

Flat vector icon, centered, square composition, plain warm paper background, no text, no mockup, no 3D, no gradients.

Avoid sparkles, chat bubbles, brain icons, infinite loops, futuristic visuals, toy-like rounded mascot style, generic startup geometry.
```

### PM 메모

작은 크기에서 무너지면 바로 탈락.

---

## 4. 백업용 4번째 프롬프트

혹시 위 3개가 너무 약하거나 전부 범용적으로 느껴질 때만 추가로 돌립니다.

```text
Design a flat vector logo symbol for DAMIT, a Korean B2B operations product, based on a refined proof-stamp or confirmation-seal concept.

The symbol should suggest verified records, customer confirmation, and documented agreement, but must not look bureaucratic, legalistic, or institutional.

Use deep navy as the main color and a very small muted amber accent. The shape should be compact, balanced, highly legible, and premium. It should still feel like a modern product brand, not a government seal or accounting office mark.

Centered flat vector symbol, plain warm paper background, no text, no mockup, no 3D, no shiny effects.

Avoid legal-firm crest style, official government stamp style, AI motif style, or generic startup brand icon style.
```

### PM 메모

이건 보조 후보입니다. 1차 3개가 별로일 때만.

---

## 5. 결과물 고르는 기준

좋은 후보는 보통 이렇습니다.

- 작은 크기에서도 silhouette가 강함
- 문서/증빙/운영 제품 느낌이 있음
- 네이비가 중심이고 앰버는 정말 작게만 들어감
- 차분하고 신뢰감 있음
- AI 회사처럼 안 보임

버려야 할 후보는 보통 이렇습니다.

- 반짝임
- 스타트업 SaaS 느낌
- 너무 귀여움
- 너무 복잡함
- 너무 법률/행정/세무 서비스 느낌
- 말풍선, 로봇, AI 뇌 같은 상징

---

## 6. 가장 추천하는 실제 실행 순서

1. `도켓 탭형 심볼 프롬프트`
2. `앱 아이콘 중심 프롬프트`
3. `도켓 탭형 + 워드마크 프롬프트`

이 순서가 가장 효율적입니다.

이유:

- 먼저 심볼 구조를 확인하고
- 작은 크기에서 버틸지 보고
- 마지막에 워드마크를 붙여 보는 게
  가장 실전적이기 때문입니다.

---

## 7. 후속 수정 프롬프트

첫 생성 결과가 조금 아쉬울 때는 아래처럼 짧게 붙이면 좋습니다.

### 더 단단하게

```text
Make the silhouette more structured, calmer, and more editorial. Reduce decorative detail and make it feel more like an operations mark on a document.
```

### 더 앱 아이콘답게

```text
Simplify the shape so it remains strong and legible at favicon size. Increase silhouette clarity and reduce small internal details.
```

### 더 다밋답게

```text
Make it feel less like a startup logo and more like a serious evidence-folder or operating-ledger mark used by real business owners.
```

### 너무 제도권 느낌일 때

```text
Reduce the legal or institutional feeling. Keep it trustworthy, but make it feel more like a modern product brand and less like a formal seal.
```

---

## PM 최종 추천

지금 바로 `nanobanana2`에 넣을 첫 프롬프트는 이것입니다.

`도켓 탭형 심볼 프롬프트`

그 다음 바로

- `앱 아이콘 중심`
- `도켓 탭형 + 워드마크`

순서로 가는 게 가장 좋습니다.
