# OPS_DASHBOARD_PHASE3_PLAN

## Goal

Bring the operations dashboard closer to a real daily operations surface.

This phase focuses on three operator questions:

- how agreements are moving
- whether customer confirmation links are waiting or stalled
- what kind of timeline activity is happening most recently

## PM decision

Do not build a full BI dashboard.

Instead, add a thin operational visibility layer that helps an owner answer:

- did recent agreements actually happen
- are issued customer confirmation links getting stuck
- are recent timeline events healthy and moving

## Scope

### Data

Extend `GET /api/v1/admin/ops-snapshot` with:

- agreement signal summary
- customer confirmation signal summary
- timeline signal summary
- recent customer confirmation feed
- recent timeline feed

### UI

Add three signal cards:

- 합의 흐름
- 고객 확인
- 최근 타임라인

Add two feed panels:

- 최근 고객 확인
- 최근 작업 이력

Keep the existing:

- verdict
- alerts
- backup workflow
- snapshot details
- recent audit activity
- recent backups

## Alert refinement

Add advisory warning when:

- open customer confirmation links are stale
- there is operational data but no recent timeline movement

Warnings remain advisory, not blocking.

## Deliberately excluded

- charts
- tenant analytics
- revenue reporting
- user-level funnels
- destructive controls beyond existing reset path

## PM success criteria

The owner should be able to answer in under 10 seconds:

- are agreements happening recently
- is customer confirmation waiting on follow-up
- what was the latest operational movement
