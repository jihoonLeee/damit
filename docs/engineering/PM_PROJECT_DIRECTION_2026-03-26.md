# PM Project Direction

Date: 2026-03-26
Owner: PM

## Current verdict

- Product coherence: GO
- Local operational build: GO
- Self-host trusted environment: GO
- Public production cutover: HOLD
- Real mail login cutover: HOLD

## What is working well

- 브랜드와 제품 표면이 이제 하나의 `다밋` 경험으로 상당히 잘 묶였다.
- `landing -> start -> login -> home -> app -> ops -> account -> admin -> confirm` 흐름이 실제 제품처럼 읽힌다.
- 운영 콘솔과 작업 워크스페이스의 연속성이 좋아졌다.
- owner/account/admin 표면도 단순한 관리 페이지가 아니라 운영 제품의 일부처럼 정리됐다.
- 로컬과 self-host 기준 운영 안정성은 충분히 높아졌다.

## What is still not finished

- 실메일 발송은 도메인 검증 전까지 운영 전환 불가
- public production 인프라 증거는 아직 충분하지 않음
- 실제 사용 데이터가 적어서 위험 신호와 병목 우선순위가 아직 시뮬레이션 중심
- `/app` 내부의 마지막 10~15% polish 여지는 남아 있음

## PM assessment

지금 프로젝트는 `아이디어 검증용 MVP`를 넘어서 `운영형 단일 제품`까지는 올라왔다.
다만 아직 `대외 공개용 production SaaS`라고 부르기에는 이르다.

가장 중요한 점은, 지금은 더 많은 기능을 늘리는 것보다
이미 만든 표면을 더 날카롭게 다듬고 실제 운영 전환 조건을 닫는 쪽이 훨씬 가치가 크다는 것이다.

## Recommended next sequence

1. `/app` 마지막 polish
   - 종료 상태
   - 고객 확인 이후 흐름
   - 긴 타임라인/다중 작업 건 상황

2. `/ops` 위험도 판단 강화
   - 가장 위험한 작업 건 선별
   - 합의 지연/확인 지연/세션 이상 징후를 더 강하게 표시

3. 운영 데이터 가시화
   - account/admin/ops에서 실제 운영 의사결정에 필요한 요약 강화

4. 메일 cutover 준비 유지
   - 도메인 준비 전까지는 HOLD
   - 도메인 준비가 끝나면 즉시 smoke 재개

5. public production은 마지막
   - 지금은 self-host와 local 운영 품질을 계속 높이는 편이 더 합리적

## PM recommendation

다음 배치는 `새 기능 추가`보다
`/app + /ops`의 실제 운영 병목 가시화와 상태 판단 품질 강화`로 가는 것이 가장 좋다.
