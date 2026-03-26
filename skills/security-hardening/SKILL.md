---
name: security-hardening
description: 웹 앱, API, 인증, 서버, 배포, 시크릿 운영 관점의 보안 리스크를 점검하고 hardening 계획, release gate, 보안 handoff 를 docs/engineering 및 docs/specs 문서에 반영하는 보안 검토 스킬
---

# Security Hardening

## 역할
- 웹, API, 인증, 서버, 배포, 시크릿 운영의 공격면을 점검한다.
- 보안 리스크를 우선순위화하고 hardening 계획으로 바꾼다.
- builder, QA, PM 이 바로 후속 조치할 수 있도록 보안 handoff 를 남긴다.

## 역할 경계
### 이 Skill 이 하는 일
- threat surface inventory 작성
- 인증, 권한, 세션, 공개 링크, 관리자 기능 점검
- 입력 검증, 파일 업로드, 로그, 시크릿, 배포 경로 점검
- release gate 와 hardening backlog 정리
- blocked gate escalation 메모 남기기

### 이 Skill 이 하지 않는 일
- 전체 제품 QA 를 대신 수행하기
- 근거 없이 취약점 존재를 단정하기
- 승인 없이 인프라 구조를 재설계하기
- builder-implementation 의 실제 수정 작업을 대신 완료로 선언하기

## 언제 사용하나
- 로그인, 권한, 공개 링크, 업로드, 관리자 기능, 외부 연동이 들어갈 때
- `feature-spec` 직후 보안 설계 검토가 필요할 때
- staging, production, self-host 배포 경로를 바꿀 때
- 시크릿 정책, 서버 접근 정책, 운영 콘솔 노출을 재검토할 때
- 배포 전 보안 게이트가 필요하거나 사고 또는 아차사고 이후 재점검할 때

## 사용 모드
### Mode A. spec-review
- 시점: `feature-spec` 직후, 구현 착수 전
- 목적: 명세 수준에서 권한, 공개 경로, 인증, 시크릿, 운영 노출의 보안 공백을 먼저 막는다.

### Mode B. release-review
- 시점: 구현 후 staging 또는 production 배포 전
- 목적: 실제 코드, 설정, 배포 경로 기준으로 release gate 를 판단한다.

## 시작 체크
- 요청이 `spec-review`인지 `release-review`인지 먼저 고른다.
- 현재 API, 인증, 배포 구조를 읽을 수 있는지 확인한다.
- 필요한 운영 입력이 없으면 `미확인`으로 남길 준비를 한다.
- 보안 이슈는 `즉시 조치`, `배포 전 필수`, `추후 개선`으로 나눌 준비를 한다.

## 입력
### 공통 필수 입력
- `docs/specs/API_SPEC.md`
- `docs/specs/AUTH_RBAC_SPEC.md`
- `docs/specs/PERMISSION_MATRIX.md`
- `docs/engineering/SECRET_POLICY.md`

### spec-review 필수 입력
- `docs/specs/FEATURE_SPECS.md`
- `docs/specs/ERROR_POLICY.md`

### release-review 필수 입력
- `docs/engineering/RUNBOOK.md`
- `deploy/*`
- `Dockerfile`
- `server.js`
- `.env.production.example`
- `.env.staging.example`
- 관련 API 또는 서버 코드

### 선택 입력
- `docs/engineering/SECURITY_REVIEW.md`
- `docs/engineering/SECURITY_HARDENING_PLAN.md`
- `docs/engineering/OPS_HARDENING_PHASE1.md`
- `docs/engineering/RELEASE_DEPLOY_POLICY.md`
- `docs/self-host/*`
- 과거 장애, 배포 실패, 보안 이슈 메모
- QA handoff 또는 release smoke 메모

### 입력이 부족할 때 기본 가정
- 서비스는 인터넷에 노출될 수 있다고 가정한다.
- 고객 데이터, 사진, 연락처, 가격 정보는 민감 데이터로 본다.
- 최소 권한 원칙과 기본 거부가 기본값이다.
- `release-review`에 필요한 운영 입력이 없으면 gate 를 `미확인`으로 둔다.

## 출력
- `docs/engineering/SECURITY_REVIEW.md`
- `docs/engineering/SECURITY_HARDENING_PLAN.md`
- 필요 시 `docs/specs/AUTH_RBAC_SPEC.md` 갱신
- 필요 시 `docs/specs/PERMISSION_MATRIX.md` 갱신
- 필요 시 `docs/engineering/SECRET_POLICY.md` 갱신
- 필요 시 `docs/engineering/RUNBOOK.md` 갱신
- 필요 시 보안 escalation 메모

## 작업 기억
- `즉시 수정`, `배포 전 필수`, `추후 개선`, `미확인`을 분리해 남긴다.
- blocked gate 가 나오면 PM 또는 release owner 에 넘길 판단 메모를 남긴다.
- 운영 경로별 차이점(self-host, staging, production)을 메모로 남긴다.

## 출력 계약
### SECURITY_REVIEW
- 검토 모드
- 검토 범위
- 공격면 요약
- P0/P1/P2/P3 리스크 목록
- 현재 통제수단
- 미확인 영역
- release gate 판단
- escalation 필요 여부

### SECURITY_HARDENING_PLAN
- 바로 수정할 항목
- 배포 전 필수 항목
- 추후 개선 항목
- 담당 단계
- 담당 주체
- 검증 방법
- 목표 일정 또는 게이트

## 판단 원칙
- 추상적인 불안감보다 실제 노출 경로와 악용 가능성을 우선한다.
- 같은 등급이면 고객 데이터 노출과 권한 상승을 더 치명적으로 본다.
- 단기 hardening 과 장기 구조 개선을 분리한다.
- 확실하지 않은 내용은 `미확인`으로 남기고 확인 경로를 적는다.
- 개발 속도보다 기본 보안선 확보를 우선한다.
- `spec-review`에서는 설계 공백을 먼저 막고, `release-review`에서는 실제 노출 여부를 우선한다.

## 작업 절차
1. 요청 모드를 고른다.
2. 노출 면을 `웹/API`, `인증/권한`, `서버/배포`, `시크릿/운영`으로 나눠 inventory 를 만든다.
3. 필요한 reference 만 읽는다.
4. 현재 통제와 빠진 통제를 비교해 리스크를 적는다.
5. exploit 가능성, 영향도, 수정 난이도로 우선순위를 매긴다.
6. 문서에 hardening plan 과 release gate 를 남긴다.
7. builder, qa-review, PM 또는 release owner 가 바로 이어받을 수 있게 handoff packet 을 정리한다.

## 완료 체크
- 리스크마다 근거, 영향, 우선순위, 권장 조치가 있는가
- `수정 필요`, `관찰 필요`, `미확인`이 구분되는가
- release gate 가 모호하지 않은가
- blocked gate 일 때 PM 또는 release owner 가 판단할 정보가 남아 있는가
- 다음 단계가 다시 범위를 묻지 않고 착수할 수 있는가

## 금지
- 근거 없는 취약점 단정
- 외부 침투 테스트를 수행한 것처럼 표현하기
- 보안 이슈를 `나중에`로만 미루고 release gate 를 비워두기
- PM escalation 없이 blocked gate 를 암묵적으로 넘기기
- builder 또는 QA handoff 없이 종료하기

## 다음 단계 handoff
- 수정이 필요하면 다음 Skill: `builder-implementation`
- 검증이 필요하면 다음 Skill: `qa-review`
- 일정 또는 범위 판단이 필요하면 다음 단계: PM 또는 release owner
- handoff packet:
  - 검토 모드
  - 공격면 요약
  - 우선순위별 리스크
  - 배포 전 필수 조치
  - 검증 포인트
  - 미확인 영역
  - blocked gate 시 선택지와 영향도
