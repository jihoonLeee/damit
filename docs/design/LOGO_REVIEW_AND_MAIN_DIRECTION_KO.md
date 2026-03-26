# 로고 평가와 메인 로고 방향

## PM 결론

현재 워드마크 후보는 `랜딩용 디스플레이 워드마크`로는 가능성이 높지만,
`제품 메인 로고`로 바로 확정하기엔 아직 조정이 필요합니다.

핵심 이유는 간단합니다.

- 지금 안은 브랜드성은 좋다
- 하지만 운영 제품성은 아직 약하다
- 작은 크기와 제품 UI 적용성은 아직 부족하다

즉 지금 안은 `예쁜 로고`에 더 가깝고,
우리가 필요한 건 `제품에 오래 버티는 로고`입니다.

---

## 1. 현재 로고의 좋은 점

### 1. 브랜드 첫인상은 좋다

- AI 툴처럼 보이지 않는다
- 싸구려 SaaS 로고처럼 보이지 않는다
- 네이비 + 앰버 조합이 좋다

### 2. 기억 포인트가 있다

- `A` 안의 포인트가 있어서
- 그냥 평범한 타이포 로고보다 기억에 남는다

### 3. 차분하고 고급스럽다

- 과장되지 않는다
- `다밋`이 가진 차분한 신뢰감과는 어느 정도 맞는다

---

## 2. 왜 아직 메인 로고로는 아쉬운가

## 1. 운영 제품보다 라이프스타일/에디토리얼 브랜드에 더 가깝다

현재 로고는 매우 세련됐지만, 인상이 이렇게 읽힐 수 있습니다.

- 뷰티 브랜드
- 편집 숍
- 리빙 브랜드
- 프리미엄 매거진

반면 `다밋`은 실제로는:

- 현장 기록
- 변경 견적
- 고객 설명
- 합의와 증빙

을 다루는 운영 제품입니다.

그래서 지금보다 약간 더 `운영 도구`의 긴장감이 필요합니다.

## 2. `A`의 내부 형상이 물방울처럼 읽힌다

현재 포인트는 예쁘지만,
문서/도켓/증빙보다는 다음처럼 읽힐 가능성이 있습니다.

- 물방울
- 청소
- 뷰티
- 감성 브랜드 장식

우리는 오히려 이 부분이

- 도켓 탭
- 문서 펀칭
- 상태 인장
- 확인 포인트

처럼 읽히면 더 좋습니다.

## 3. 작은 크기에서 불리할 수 있다

세리프 대비가 강하고 획 차이가 커서,
아래 상황에서는 무너질 가능성이 있습니다.

- 브라우저 탭
- 작은 헤더
- 앱 아이콘 옆 워드마크
- 모바일 상단 로고

---

## 3. 어떻게 수정하면 더 좋아지는가

## 수정 1. 세리프 대비를 조금 줄이기

지금은 디도네 계열 느낌이 강합니다.
조금만 덜 극단적으로 만들면 운영 제품성에 더 맞습니다.

원하는 방향:

- 너무 날카로운 하이패션 느낌 감소
- 여전히 세련되지만 더 단단한 인상

즉:

- 얇은 획은 약간 두껍게
- 굵은 획은 약간 덜 무겁게

## 수정 2. `A` 내부 형상을 물방울에서 도켓/문서 감각으로 바꾸기

현재 포인트는 좋지만 해석이 너무 유동적입니다.

추천 방향:

- 물방울 대신 `문서 펀칭홀` 느낌
- 또는 `도켓 탭` 절개 느낌
- 또는 `상태 점`이 찍힌 기록 시트 느낌

즉 `예쁜 장식`보다 `기능적 의미`가 읽히게 해야 합니다.

## 수정 3. 앰버 점을 더 구조적으로 배치하기

현재 점은 기억에는 남지만,
조금 더 제품 의미와 연결되면 좋습니다.

추천:

- 단순 장식점이 아니라
- `확인됨`
- `기록됨`
- `포커스 포인트`

처럼 느껴지게 위치와 비율을 정리

## 수정 4. 자간을 약간 더 정리하기

특히 `A-M` 사이와 `M-I/T` 흐름이
조금 더 균형 잡히면 워드마크로서 완성도가 높아집니다.

## 수정 5. 앱 아이콘용 보조 체계를 같이 만들기

지금 워드마크가 좋아도,
제품 메인 로고 체계는 보통 2층이 더 좋습니다.

추천 구조:

- A안: `DAMIT` 워드마크
- B안: 작은 크기용 `D` 또는 `A` 기반 서브마크

---

## 4. 수정 지시 프롬프트

아래 프롬프트는 현재 안을 기반으로 다시 수정 요청할 때 쓰면 좋습니다.

### 프롬프트 1. 운영 제품성 강화

```text
Refine this DAMIT wordmark so it feels less like a lifestyle/editorial brand and more like a premium operations product.

Keep the elegance and restraint, but make it feel more structured, grounded, and product-like. Reduce the high-fashion serif feeling slightly. The result should still feel premium, but more operational and trustworthy.
```

### 프롬프트 2. A 내부 형상 수정

```text
Refine the A character so the inner shape feels less like a droplet and more like a docket tab, document cutout, punched record mark, or operational evidence detail.

Keep the distinctive character, but make it feel more connected to documentation, confirmation, and record-keeping.
```

### 프롬프트 3. 작은 크기 대응

```text
Refine this DAMIT wordmark so it remains strong and legible in smaller product UI contexts such as headers, browser tabs, app lockups, and mobile top bars.

Reduce overly delicate contrast and improve silhouette clarity while preserving the premium editorial tone.
```

### 프롬프트 4. 앰버 포인트 정리

```text
Keep the small amber accent, but make it feel more intentional and structural rather than decorative. It should suggest confirmation, focus, or a marked record point.
```

### 프롬프트 5. 제품 메인 로고 체계로 확장

```text
Create a DAMIT logo system based on this wordmark.

Include:
- the refined full DAMIT wordmark
- a compact small-size submark derived from the same logic

The full wordmark should be used for landing, login, and headers.
The compact submark should work for app icon, favicon, and small UI contexts.
```

---

## 5. 제품 메인 로고는 어떻게 가는 게 좋은가

PM 기준 추천은 `2층 구조`입니다.

## A. 메인 브랜드 워드마크

- `DAMIT`
- 지금 보고 있는 방향을 개선한 버전
- 랜딩, 로그인, 홈, 상단 헤더, 문서 상단에 사용

## B. 작은 크기용 서브마크

- `D` 기반 또는 `A` 기반
- 앱 아이콘
- 파비콘
- 작은 헤더
- 운영 화면의 compact brand

왜 이 구조가 좋은가:

- 워드마크는 브랜드 인지에 강함
- 서브마크는 제품 UI 실사용성에 강함

즉 둘 다 필요합니다.

---

## 6. 만약 하나만 써야 한다면

그래도 하나만 쓴다면
저는 이렇게 추천합니다.

### 추천

`DAMIT` 워드마크를 메인으로 사용

단:

- 지금 후보를 조금 더 운영 제품 쪽으로 다듬고
- 작은 크기 대응을 위한 단순화 버전을 같이 확보

즉 "완전 동일한 하나"가 아니라
`정식 버전 + compact 버전`
정도로는 나누는 게 좋습니다.

---

## 7. PM 최종 추천

가장 좋은 방향은 이겁니다.

1. 현재 워드마크의 기조는 유지
2. `A`를 더 도켓/문서 느낌으로 수정
3. 세리프 대비를 조금 줄여 운영 제품성 강화
4. `DAMIT` 정식 워드마크 확정
5. 같은 논리로 small-size 서브마크 제작

한 줄로 정리하면:

`지금 안은 버리지 말고, 패션감성을 조금 줄이고 운영 제품성을 올리는 방향으로 고쳐서 메인 로고 체계로 확장하는 게 가장 좋다.`
