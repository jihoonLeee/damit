# Stitch Integration Plan

## 목표
- `output/stitch` 시안의 강점을 현재 제품에 반영해, `다밋`이 더 이상 범용 AI SaaS처럼 보이지 않고 `운영 문서 도구`처럼 보이도록 만든다.

## 이번 배치 범위

### 1. 디자인 시스템 반영
- `styles.css`
- 반영 요소:
  - flat surface
  - hard border
  - tighter typography hierarchy
  - sharper action button language
  - reduced roundedness and reduced shadow dependence

### 2. 핵심 표면 정리
- `start.html`
- `account.html`
- `admin.html`

### 3. 사용자 문구 복구
- `account.js`
- `admin.js`

## 이번 배치에서 하지 않을 것
- `/app` 전체 구조를 사이드바 셸로 재구성
- `/ops`를 Stitch HTML로 직접 치환
- Tailwind 기반 시안을 런타임 코드로 그대로 복사

## 기대 결과
- 제품 전체가 더 단단하고 운영 제품처럼 보인다.
- `start/account/admin`의 한글 깨짐이 사라진다.
- `landing/login/home/ops/app/account/admin`이 같은 디자인 언어로 더 잘 묶인다.

## 검증 계획
- `node --check` for modified JS files
- `node tests/auth-foundation.test.js`
- `node tests/api.test.js`
- `node scripts/visual-review.mjs`

