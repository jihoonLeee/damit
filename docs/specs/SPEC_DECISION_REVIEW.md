# SPEC DECISION REVIEW

## 문서 목적

- `현장 추가금 합의 비서` 스펙 문서에 대해 `pm-brainstorm`, `feature-spec`, `builder-implementation` 관점으로 여러 라운드 토론을 수행한다.
- 열린 질문을 결정으로 바꾸고, 다음 패치에서 무엇을 어떻게 고칠지 합의한다.

## 참여 에이전트

- `pm-brainstorm`
- `feature-spec`
- `builder-implementation`

## 검토 대상

- `docs/specs/FEATURE_SPECS.md`
- `docs/specs/API_SPEC.md`
- `docs/specs/DOMAIN_MODEL.md`
- `docs/specs/VALIDATION_RULES.md`
- `docs/specs/PERMISSION_MATRIX.md`
- `docs/specs/ERROR_POLICY.md`

---

## Round 1. Open Questions 결정 회의

### 질문 1. 빠른 현장 기록은 한 번에 저장할 것인가, draft -> finalize 로 나눌 것인가

#### PM 관점

- MVP 핵심은 `문제가 보이면 사진부터 남긴다`는 행동을 끊지 않는 것이다.
- 사용자가 `저장했는데 사실 record 는 완성되지 않았다`는 상태를 많이 만나면 현장 신뢰가 떨어진다.
- 가능하면 사용자는 `저장 = 실제 기록 완료`로 이해해야 한다.

#### Feature-Spec 관점

- 현재 문서는 사진 필수라고 하면서도 API 는 `field-record` 생성과 `photo upload`를 분리하고 있어 계약 충돌이 있다.
- `draft -> finalize`는 명확하지만 MVP 규칙과 상태 설계가 더 많아진다.
- 단일 create API 가 지금 범위에는 가장 명료하다.

#### Builder 관점

- 2단계 생성은 구현 난이도보다 예외 처리 난이도가 커진다.
- 사진 없는 `field_record` 가 남으면 배치 정리나 orphan cleanup 이 필요해진다.
- MVP 에서는 `multipart/form-data` 하나로 record + photos + metadata 를 받는 방식이 가장 안전하다.

### Round 1 결정

- `빠른 현장 기록`은 `단일 생성 요청`으로 처리한다.
- 요청은 사진, 1차 사유, 2차 사유/메모를 함께 받는다.
- 별도 `POST /field-records/{id}/photos`는 MVP에서 제거한다.

### 결정 이유

- UX 의 `사진 필수`와 API 가 일치한다.
- 중간 불완전 상태를 줄인다.
- builder 가 가장 적은 예외 비용으로 구현할 수 있다.

---

### 질문 2. 상태 변경은 별도 status API 를 둘 것인가, agreement_record 생성만으로 처리할 것인가

#### PM 관점

- 이 제품의 핵심은 `상태값`이 아니라 `무엇을 설명했고 무엇에 동의했는지`다.
- 따라서 상태만 바꾸는 경로가 있으면 제품의 핵심 가치와 어긋난다.

#### Feature-Spec 관점

- 현재는 `agreement_record`와 `PATCH /status`가 둘 다 상태를 바꿀 수 있어 source of truth 가 흔들린다.
- MVP 에서는 `agreement_record`를 이벤트 원본으로 두고 `job_case.current_status`는 derived value 로 보는 것이 맞다.

#### Builder 관점

- 상태 변경 경로가 둘이면 동시성, 감사 로그, 테스트 케이스가 늘어난다.
- 단일 쓰기 경로가 훨씬 구현/테스트/디버깅에 유리하다.

### Round 1 결정

- MVP 에서는 별도 `PATCH /job-cases/{id}/status`를 제거한다.
- 상태 변경은 `POST /job-cases/{id}/agreement-records`에서만 일어난다.
- `job_case.current_status`는 최신 agreement_record 기반으로 갱신되는 파생 필드다.

### 결정 이유

- 합의 증빙 제품의 의미를 지킨다.
- 상태 변경의 감사 추적을 단일화한다.
- API 와 도메인 모델을 단순화한다.

---

## Round 2. API 실패 계약과 에러 코드 회의

### 쟁점

- 지금 API 스펙은 성공 응답만 있고 실패 응답 계약이 없다.
- ERROR_POLICY 는 상황 설명만 있고, 실제 에러 코드/HTTP status/field error 구조가 없다.

#### PM 관점

- 실패 케이스가 정의되지 않으면 현장형 제품에서 신뢰가 크게 떨어진다.
- 특히 `합의완료인데 금액 누락`, `이미 연결된 현장 기록`, `잘못된 상태 필터` 같은 경우는 반드시 일관된 문구와 처리가 필요하다.

#### Feature-Spec 관점

- 모든 엔드포인트는 최소한 성공/검증 오류/권한 오류/리소스 없음/충돌/서버 오류를 문서화해야 한다.
- 공통 에러 응답 스키마가 먼저 있어야 프론트와 백엔드가 같은 실패 계약을 가진다.

#### Builder 관점

- 에러 코드 없이는 UI 분기 구현이 난감하다.
- 문자열 메시지만 보면 다국어, 카피 수정, 로깅, 재시도 조건이 모두 불안정해진다.
- 적어도 machine-readable `code`는 꼭 필요하다.

### Round 2 결정

- `API_SPEC.md`에 공통 에러 응답 스키마를 추가한다.
- 모든 엔드포인트에 최소 아래를 명시한다.
  - 가능한 HTTP status
  - 대표 에러 코드
  - 언제 그 에러가 발생하는지
- `ERROR_POLICY.md`는 UX 문구 중심이 아니라 `에러 코드 카탈로그 + 사용자 메시지 매핑 + 복구 정책` 중심으로 재구성한다.

### 공통 에러 응답 초안

```json
{
  "error": {
    "code": "AGREEMENT_AMOUNT_REQUIRED",
    "message": "확정 금액을 입력해주세요",
    "fieldErrors": {
      "confirmedAmount": "REQUIRED"
    },
    "requestId": "req_123"
  }
}
```

### 우선 포함할 에러 코드 후보

- `VALIDATION_ERROR`
- `PHOTO_REQUIRED`
- `PRIMARY_REASON_REQUIRED`
- `SECONDARY_REASON_OR_NOTE_REQUIRED`
- `JOB_CASE_NOT_FOUND`
- `FIELD_RECORD_NOT_FOUND`
- `FIELD_RECORD_ALREADY_LINKED`
- `QUOTE_REQUIRED_FOR_DRAFT`
- `AGREEMENT_STATUS_REQUIRED`
- `AGREEMENT_CHANNEL_REQUIRED`
- `AGREEMENT_AMOUNT_REQUIRED`
- `INVALID_STATUS_FILTER`
- `FORBIDDEN`
- `UNAUTHORIZED`
- `INTERNAL_ERROR`

---

## Round 3. enum, 상태, 권한 범위 세부 토론

### 쟁점 1. enum 표기 규칙이 문서마다 다르다

#### Feature-Spec 관점

- `CUSTOMER_MESSAGE`와 `customer_message`, `KAKAO_OR_SMS`와 `KAKAO`가 섞이면 구현 초반부터 사고가 난다.
- enum 표기는 source of truth 하나로 통일해야 한다.

#### Builder 관점

- 가장 안전한 규칙은 `UPPER_SNAKE_CASE` 일관성이다.
- API request/response 와 DB enum, 프론트 상수까지 다 맞추기 쉽다.

#### PM 관점

- 사용자에게 보이는 라벨은 한글이어도 괜찮지만 내부 계약은 반드시 고정돼야 한다.

### Round 3 결정 A

- 내부 계약 enum 은 모두 `UPPER_SNAKE_CASE`로 통일한다.
- 사용자 표시용 한국어 라벨은 별도 매핑으로 처리한다.

---

### 쟁점 2. agreement_record.status 와 job_case.current_status 의 관계

#### PM 관점

- `합의완료`, `보류`, `작업 제외`는 모두 고객과의 커뮤니케이션 결과다.
- 그러므로 상태는 agreement_record 이벤트에서 파생되는 게 맞다.

#### Feature-Spec 관점

- 다만 최초 상태 `미설명`은 agreement_record 가 없을 수 있다.
- 따라서 `job_case.current_status`는 파생 필드지만, agreement_record 가 없을 때 기본값 `UNEXPLAINED`를 가진다고 정의해야 한다.

#### Builder 관점

- 구현상 `current_status`는 read optimization 용 denormalized field 로 두면 좋다.
- write path 는 agreement_record 하나만 두고, 저장 후 current_status 를 업데이트하면 된다.

### Round 3 결정 B

- `job_case.current_status`는 파생/캐시 필드다.
- agreement_record 가 없으면 기본값은 `UNEXPLAINED`다.
- agreement_record 생성 시 서버가 current_status 를 갱신한다.

---

### 쟁점 3. 권한 모델을 MVP에서 어디까지 가져갈 것인가

#### PM 관점

- MVP는 소수 파일럿용이라 단일 owner 가 더 현실적이다.
- 지금 역할을 늘리는 건 출시 속도만 늦춘다.

#### Feature-Spec 관점

- 문서에 미래 역할을 메모로 남길 수는 있지만, 구현 계약에는 넣지 않는 편이 낫다.

#### Builder 관점

- owner만 구현하면 권한 분기와 테스트 케이스가 크게 줄어든다.
- manager/viewer 는 이후 이슈로 넘기는 것이 안전하다.

### Round 3 결정 C

- MVP 구현 권한은 `owner` 단일 역할만 지원한다.
- `manager`, `viewer`는 비-MVP 메모로만 남긴다.

---

## Round 4. 추가 심층 토론: 놓치기 쉬운 세부 스펙

### 1. 목록 상태 필터와 API query 값 매핑

- PM: 사용자 라벨과 내부 enum 이 다르면 프론트 매핑표가 필요하다.
- Feature-Spec: `전체`, `미설명`, `설명완료`, `합의완료`, `보류`, `작업 제외`는 각각 내부 status enum 에 대응해야 한다.
- Builder: `ALL`은 실제 DB enum 이 아니라 query option 이므로 별도 값으로 정의해야 한다.

### 결정

- 목록 query status 는 `ALL | UNEXPLAINED | EXPLAINED | AGREED | ON_HOLD | EXCLUDED` 로 잠근다.

### 2. 2차 상세 사유의 모델링 수준

- PM: 고객 설득력 때문에 2차 상세 사유는 매우 중요하다.
- Feature-Spec: enum 으로 잠글지 자유 텍스트로 둘지 결정해야 한다.
- Builder: MVP는 `enum + OTHER_NOTE` 조합이 가장 안전하다.

### 결정

- 2차 상세 사유는 enum 기반으로 관리하고, 필요한 경우 메모를 추가로 받는다.
- `OTHER`만 자유 텍스트 허용한다.

### 3. 합의완료가 아닌 경우 확정 금액 규칙

- PM: 설명완료나 보류에서도 제안 금액을 남길 수 있으면 좋다.
- Feature-Spec: `confirmedAmount`라는 이름은 합의완료에만 어울린다.
- Builder: 필드 명을 `proposedAmount`와 `confirmedAmount`로 나누면 더 명확하지만 MVP 필드가 늘어난다.

### 결정
n- MVP에서는 필드 수를 줄이기 위해 `confirmedAmount` 하나만 유지한다.
- 다만 `EXPLAINED`와 `ON_HOLD`에서는 nullable 로 둔다.
- `AGREED`에서는 required, `EXCLUDED`에서는 optional 이다.

### 4. 설명 초안 저장 정책

- PM: 최신 초안 하나만 있어도 MVP에는 충분하다.
- Feature-Spec: 그러나 타임라인에는 생성 이벤트가 남아야 한다.
- Builder: `message_draft`는 최신본 1개 upsert, `timeline_event`로 이력 기록이 적절하다.

### 결정

- 작업 건당 최신 초안 1개만 유지한다.
- 생성/재생성 이력은 타임라인 이벤트로 남긴다.

---

## 최종 결정 요약

1. 빠른 현장 기록은 `단일 생성 요청`으로 처리한다.
2. 별도 status patch API 는 MVP에서 제거한다.
3. 상태 변경은 agreement_record 생성 경로 하나로 통일한다.
4. 모든 API 는 공통 에러 응답 스키마와 명시적 에러 코드를 가진다.
5. 각 엔드포인트는 성공/실패 status 와 대표 에러 코드를 문서화한다.
6. 내부 enum 은 전부 `UPPER_SNAKE_CASE`로 통일한다.
7. `job_case.current_status`는 파생 필드로 정의한다.
8. MVP 구현 권한은 `owner` 단일 역할만 지원한다.
9. 2차 상세 사유는 enum 기반 + `OTHER` 메모 조합으로 간다.
10. 초안은 최신 1개만 유지하고, 이력은 타임라인 이벤트로 남긴다.

## 다음 패치 범위

### 반드시 수정할 문서

- `docs/specs/API_SPEC.md`
- `docs/specs/ERROR_POLICY.md`
- `docs/specs/DOMAIN_MODEL.md`
- `docs/specs/VALIDATION_RULES.md`
- `docs/specs/PERMISSION_MATRIX.md`
- `docs/specs/FEATURE_SPECS.md`

### 패치 목표

- API 성공/실패 계약 정리
- 에러 코드 카탈로그 정리
- enum 일관성 통일
- source of truth 단일화
- MVP 권한 범위 축소
