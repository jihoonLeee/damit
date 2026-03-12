# Production Customer Confirmation Deploy Smoke

Date: 2026-03-12
Target: https://field-agreement-jihoon.fly.dev/
Decision: GO with known follow-ups

## Live Checks

- `GET /api/v1/health` -> 200
- `GET /beta-app` -> 200
- `GET /confirm/demo-token` -> 200

## Health Snapshot

- storageEngine: `SQLITE`
- counts.jobCases: `0`
- counts.fieldRecords: `0`
- counts.agreements: `0`

## What Was Verified Locally Before Deploy

- `node tests/api.test.js`
- `node tests/auth-foundation.test.js`
- `node tests/repository-batch-a.test.js`
- `node tests/beta-workspace.test.js`
- `node tests/customer-confirmation.test.js`

## PM Checkpoint

- 기존 beta workspace 진입면 유지: pass
- public confirmation page shell 노출: pass
- customer confirmation integration regression: pass (local end-to-end)
- live mutation smoke: skip
  - 이유: 운영 데이터를 더럽히지 않기 위해 라이브 DB는 비워둔 상태 유지

## Follow-ups

1. live staging data 기준 customer confirmation full smoke
2. object storage migration batch
3. managed Postgres 연결
4. mail provider 실연동 후 링크 발송 UX 연결