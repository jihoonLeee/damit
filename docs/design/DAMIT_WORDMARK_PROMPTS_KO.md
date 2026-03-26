# DAMIT 워드마크 로고 프롬프트

## PM 판단

이번 방향은 심볼보다 `DAMIT` 워드마크 자체를 로고로 쓰는 방식입니다.

이 방식의 장점:

- 가장 단순하다
- 브랜드 이름이 바로 읽힌다
- AI가 과하게 해석해서 이상한 심볼을 붙일 위험이 적다
- 제품 화면, 문서, 헤더, 랜딩에 바로 적용하기 쉽다

주의할 점:

- 단순한 텍스트 로고일수록 폰트 느낌, 자간, 획 대비, 끝처리가 중요하다
- "예쁜 폰트"보다 `다밋`의 성격에 맞는 톤이 중요하다

`DAMIT` 워드마크는 이렇게 보여야 한다.

- 차분하다
- 단단하다
- 운영 도구 같다
- 스타트업 같지 않다
- AI 서비스 같지 않다
- 문서/증빙/현장 운영 제품에 어울린다

---

## 공통 방향

### 원하는 인상

- editorial
- operational
- trustworthy
- calm
- structured
- premium but restrained

### 피해야 할 것

- futuristic
- shiny
- startup-ish
- playful
- too geometric
- overly techy
- AI-tool 느낌

### 색 방향

- 메인: deep navy
- 포인트가 필요하면 아주 작은 muted amber
- 기본은 단색 워드마크 우선

---

## 1. Recraft용 프롬프트

```text
Design a wordmark logo using the exact text `DAMIT`.

This is for a Korean B2B field-operations product. The wordmark should feel calm, editorial, trustworthy, and operational. It should look like the name of a serious product used by real business owners, not a startup, not a futuristic AI service, and not a playful app.

Use a flat vector style. Focus on typography, spacing, weight, and subtle character refinement rather than decorative symbols. The result should feel premium but restrained.

Visual direction:
- deep navy main color
- optional very small muted amber accent only if truly necessary
- strong readability
- clean silhouette
- works on warm paper backgrounds and white backgrounds
- suitable for product header, landing page, login page, document top area, and app icon lockup

The wordmark should feel closer to:
- editorial business software
- operating ledger
- documented workflow

And farther from:
- AI startup
- consumer app
- fintech logo
- legal firm logo

Avoid:
- chat bubble motifs
- sparkles
- tech gradients
- 3D effects
- overly futuristic letter shaping
- generic geometric startup wordmarks
- playful rounded letters
```

### Recraft 수정 프롬프트

조금 더 원하는 방향으로 조정할 때:

#### 더 단단하게

```text
Make the wordmark more structured, more editorial, and more grounded. Reduce any startup feeling and make it feel more like a serious operations product.
```

#### 더 운영 도구답게

```text
Make the wordmark feel more like an operating ledger or documented workflow product, and less like a generic software startup.
```

#### 더 절제되게

```text
Reduce stylistic flourishes and make the typography more restrained, calm, and premium.
```

---

## 2. nanobanana2용 프롬프트

```text
Create a clean wordmark logo using the exact text `DAMIT`.

This wordmark is for a Korean B2B field-operations product. It should feel calm, trustworthy, editorial, structured, and operational. It must not feel like a futuristic AI brand, a playful startup, or a consumer app.

Use deep navy as the main color. If needed, add only a very small muted amber detail, but keep the design mostly typographic. Focus on the letterforms, spacing, rhythm, and overall silhouette of the wordmark.

The result should work well on warm paper-colored backgrounds, white backgrounds, landing pages, login screens, product headers, and document-like UI.

Preferred feeling:
- calm
- premium
- restrained
- business-like
- owner-trustworthy

Avoid:
- shiny gradients
- 3D effects
- AI-looking styling
- generic startup logo feel
- playful rounded toy-like typography
- decorative symbols around the letters

Flat vector wordmark, centered composition, plain neutral or warm paper background, no mockup, no device frame.
```

### nanobanana2 수정 프롬프트

#### 더 브랜드답게

```text
Refine the wordmark so it feels more distinctive and premium, but still restrained and practical. Keep it typographic, not symbolic.
```

#### 더 문서 제품처럼

```text
Make the wordmark feel more like a product used for records, agreements, and operational documents, and less like a modern tech startup.
```

#### 더 작은 크기 대응형으로

```text
Simplify the wordmark so it remains strong and legible in small header usage and compact UI placements.
```

---

## PM 추천 사용 순서

### 먼저 Recraft

1. Recraft 기본 프롬프트
2. 수정 프롬프트로 2~3회 조정

### 그 다음 nanobanana2

1. nanobanana2 기본 프롬프트
2. 더 문서 제품처럼 / 더 작은 크기 대응형으로 조정

### 마지막 판단 기준

좋은 안은 아래 느낌이 납니다.

- `DAMIT`만 봐도 제품 이름 같고 신뢰감 있음
- 화면 위에 올렸을 때 과장되지 않음
- `다밋`의 운영/기록/증빙 성격과 어울림

나쁜 안은 아래 느낌이 납니다.

- AI 툴 브랜드 같음
- 너무 예쁘기만 함
- 스타트업 로고 같음
- 너무 개성이 없어서 아무 제품이나 쓸 수 있을 것 같음
