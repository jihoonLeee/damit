# 다밋 로고 툴 추천 및 프롬프트 가이드

## PM 결론

`다밋` 로고는 `Stitch`에서 억지로 해결하기보다,

- 로고 콘셉트 탐색은 로고/벡터에 강한 도구에서 하고
- 제품 화면 안 적용과 검수는 Stitch 또는 Figma류에서 하는

2단계 방식이 가장 좋습니다.

짧게 말하면:

- `화면`: Stitch
- `로고 콘셉트`: Recraft 또는 Illustrator AI
- `최종 벡터 마감`: Illustrator / Affinity Designer / Inkscape

---

## 왜 Stitch가 메인이 아니냐

Stitch는 공식적으로 UI, 화면, 프로토타입 쪽에 더 맞는 도구입니다.

로고는 아래 기준이 훨씬 중요합니다.

- 아주 작은 크기에서도 읽히는가
- SVG/벡터로 정리되는가
- 획, 모서리, 비율을 사람이 다시 다듬을 수 있는가
- 파비콘, 앱 아이콘, 헤더, 문서에 다 쓰기 쉬운가

즉 로고는 결국 `벡터 정리`가 필요합니다.

---

## 추천 툴 우선순위

## 1순위. Recraft + Illustrator

### 추천 이유

이 조합이 지금 가장 현실적입니다.

- Recraft는 공식적으로 벡터 스타일, 로고 생성, SVG 출력 방향이 강합니다.
- Illustrator는 최종 로고 정리와 벡터 마감의 표준 도구에 가깝습니다.

### 언제 좋나

- 빠르게 여러 콘셉트를 보고 싶을 때
- AI가 여러 안을 만들어주되, 마지막은 사람이 정교하게 다듬고 싶을 때
- 로고와 앱 아이콘까지 같이 생각할 때

### 역할 분담

- Recraft: 콘셉트 10~20개 탐색
- Illustrator: 최종 1개를 벡터 정리

### 공식 자료

- Recraft 로고 생성 가이드: [How to generate a logo](https://www.recraft.ai/docs/using-recraft/image-generation/how-to-generate-a-logo)
- Recraft 벡터/브랜드 일관성: [Recraft V2](https://www.recraft.ai/docs/recraft-models/recraft-V2)
- Illustrator 텍스트 to 벡터: [Text to Vector Graphic](https://www.adobe.com/products/illustrator/text-to-vector-graphic.html)
- Illustrator 개요/가격: [Illustrator overview](https://www.adobe.com/products/illustrator.html), [Illustrator pricing](https://www.adobe.com/products/illustrator/pricing-info.html)

### PM 판단

가장 추천.

---

## 2순위. Illustrator 단독

### 추천 이유

로고를 최종 품질까지 가장 안정적으로 만들 수 있습니다.

- 벡터 수정
- 타이포 정리
- 그리드/비율 조정
- SVG/PNG 출력
- 작은 크기 검증

까지 한 도구에서 해결됩니다.

### 언제 좋나

- 이미 어느 정도 방향이 정해져 있을 때
- AI보다 직접 정교하게 다듬는 쪽이 중요할 때
- 최종 상용 로고 품질이 우선일 때

### 단점

- 콘셉트 탐색 속도는 AI 전용 도구보다 느릴 수 있음

### 공식 자료

- [Illustrator overview](https://www.adobe.com/products/illustrator.html)
- [Text to Vector Graphic](https://www.adobe.com/products/illustrator/text-to-vector-graphic.html)
- [Illustrator pricing](https://www.adobe.com/products/illustrator/pricing-info.html)

### PM 판단

`최종 마감용`으로는 최고.

---

## 3순위. Affinity Designer

### 추천 이유

구독 없이 벡터 작업을 하고 싶다면 현실적인 대안입니다.

- 로고
- 아이콘
- UI용 심볼
- 벡터 편집

에 충분히 강합니다.

### 언제 좋나

- Adobe 구독을 당장 원치 않을 때
- 정적인 벡터 작업 중심일 때

### 공식 자료

- Universal licence: [Affinity universal licence](https://affinity.serif.com/en-us/universal-licence/)
- Affinity Designer가 로고/아이콘에 쓰인다는 소개: [Affinity press note](https://affinity.serif.com/en-us/press/newsroom/affinity-prices-cut-by-50-percent-in-the-serif-spring-sale/)

### PM 판단

가성비 좋은 대안.

---

## 4순위. Inkscape

### 추천 이유

무료로 시작하려면 가장 현실적인 벡터 도구입니다.

### 언제 좋나

- 무료로 시작해야 할 때
- 최종 벡터 편집만 필요할 때

### 단점

- 상업 로고 마감 속도나 편의성은 Illustrator보다 떨어질 수 있음

### 공식 자료

- Inkscape 소개: [Inkscape](https://inkscape.org/en/us/)
- 벡터 편집 설명: [Vector and bitmap](https://wiki.inkscape.org/wiki/Vector_and_bitmap)

### PM 판단

무료 시작용으로 좋음.

---

## 5순위. Figma

### 추천 이유

메인 로고 제작 도구라기보다,
만든 로고를 실제 제품 화면에 끼워 보며 검수하기 좋습니다.

### 언제 좋나

- 로고를 랜딩/앱/UI 위에 바로 얹어보고 싶을 때
- 팀과 빠르게 비교하고 검토할 때

### 공식 자료

- Figma vector tools: [Vector tools](https://help.figma.com/hc/en-us/sections/31585889321751-Design-with-vector-tools)
- Figma Vectorize: [Vectorize](https://www.figma.com/blog/introducing-vectorize/)

### PM 판단

메인 제작 툴보다 `실사용 검수 툴`에 가깝습니다.

---

## 가장 추천하는 실제 작업 흐름

## 옵션 A. 가장 추천

1. Recraft로 로고 콘셉트 10~20개 탐색
2. 3개 정도로 압축
3. Illustrator에서 최종 벡터 정리
4. Figma 또는 Stitch 화면에 넣어서 제품 적합성 확인

## 옵션 B. 비용 아끼는 현실안

1. Recraft 또는 손스케치로 콘셉트 탐색
2. Affinity Designer 또는 Inkscape로 벡터 정리
3. 제품 화면에 넣어 검수

## 옵션 C. 완전 수작업 중심

1. Illustrator에서 직접 방향 탐색
2. Text to Vector는 참고만 사용
3. 직접 그리드와 비율을 잡아 정리

---

## 다밋 로고에 맞는 방향

`다밋`은 이런 방향이 가장 맞습니다.

- 증빙 폴더
- 도켓 탭
- 문서 모서리
- 상태 스탬프
- 잉크 블록
- 운영 레저

이런 건 피하는 게 좋습니다.

- 챗버블
- 반짝이
- AI 두뇌
- 뉴럴 노드
- 무한루프
- 스타트업스러운 기하학 추상 마크
- 너무 귀여운 앱 아이콘

---

## 다밋 로고 핵심 규칙

1. 작은 크기에서도 읽혀야 함
2. 앱 아이콘으로도 써야 함
3. 따뜻한 종이 배경 위에서 잘 살아야 함
4. 네이비가 메인이고, 앰버는 아주 작은 포인트만 사용
5. 구조가 단단해야 함
6. "AI 서비스"처럼 보이면 실패

---

## 바로 쓸 수 있는 로고 프롬프트

## 프롬프트 1. 콘셉트 탐색용

```text
한국 B2B 현장 운영 제품 `다밋 (DAMIT)`의 로고를 디자인해줘.

이 브랜드는 챗봇이나 AI 서비스가 아니라,
현장 설명, 변경 견적, 고객 확인, 합의 기록, 증빙을 정리하는 운영 제품이다.

로고는 아래 느낌을 가져야 한다.

- 차분한 현장 운영 데스크
- 증빙 폴더
- 도켓 탭
- 상태 스탬프
- 문서 레저

시각 조건:

- 메인 컬러는 짙은 네이비
- 작은 포인트로만 앰버 사용
- 따뜻한 종이색 배경에서도 잘 보여야 함
- 너무 장난스럽지 않을 것
- 너무 미래적이지 않을 것
- 너무 스타트업 SaaS 같지 않을 것
- 단단하고 신뢰감 있는 구조일 것
- 앱 아이콘 크기에서도 읽혀야 할 것

가능하면 문서 모서리, 탭, 클립, 인장, 증빙 라벨 같은 요소를 은유적으로 활용해줘.
숨은 `D` 구조는 가능하지만, 너무 대놓고 문자 로고처럼 보이지 않게 해줘.

피해야 할 요소:

- 챗버블
- 반짝이
- AI 뇌 / 뉴럴 노드
- 무한루프
- shiny gradient
- 3D 효과
- generic startup mark
```

## 프롬프트 2. 벡터 정리용

```text
`다밋 (DAMIT)`의 로고를 플랫 벡터 스타일로 정리해줘.

조건:

- 단색 또는 2색 중심
- 메인 네이비 + 작은 앰버 포인트
- 강한 실루엣
- 24px, 48px, 128px에서 모두 읽히는 구조
- warm paper background와 white background 모두에 잘 어울릴 것
- 증빙 폴더, 도켓 탭, 운영 문서 레저 느낌
- 단단하고 균형 잡힌 구조
- 과한 장식 없음

결과물은:

- 앱 아이콘
- 파비콘
- 제품 헤더 로고
- 문서 워터마크

로 모두 쓰기 좋아야 한다.
```

## 프롬프트 3. 워드마크 포함 버전

```text
`다밋 (DAMIT)`의 심볼 + 워드마크 로고 시스템을 디자인해줘.

심볼은 문서/증빙/운영 데스크 느낌을 가져야 하고,
워드마크는 지나치게 스타트업스럽지 않고,
차분하고 단단한 비즈니스 제품 느낌이어야 한다.

원하는 인상:

- calm
- operational
- editorial
- trustworthy
- not futuristic

심볼은 단독으로도 써야 하고,
워드마크와 합쳐도 균형이 맞아야 한다.
```

---

## PM 추천 최종 선택 기준

로고 후보를 고를 때는 아래 순서로 보세요.

1. 작은 크기에서 읽히는가
2. 앱 아이콘으로 괜찮은가
3. 랜딩/로그인/앱 헤더에 넣었을 때 어울리는가
4. `다밋`만의 운영 제품 느낌이 있는가
5. AI 회사처럼 보이지 않는가

가장 중요한 질문 하나:

`이 마크가 증빙 문서 왼쪽 위에 찍혀 있어도 어색하지 않은가?`

이 질문에 `예`면 좋은 방향일 가능성이 높습니다.
