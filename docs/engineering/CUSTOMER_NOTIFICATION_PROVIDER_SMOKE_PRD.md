# Customer Notification Provider Smoke PRD

Date: 2026-03-28
Status: GO

## Goal

Create a repeatable preview-side smoke command for customer confirmation delivery providers.

## User

- PM
- operator
- builder doing rollout checks

## User story

- as an operator, I want one command that proves preview can issue a customer confirmation link and actually attempt provider delivery, so I can trust the runtime before broader rollout decisions

## Scope

- preview runtime only
- owner session bootstrap
- job case create
- field record create/link
- quote update
- draft generation
- confirmation link issuance
- delivery status assertion

## Non-goals

- production root cutover
- bulk delivery
- dashboard UI redesign

## Acceptance criteria

- command supports `.env.production.local`
- command supports `--phone=...`
- command hits `https://preview.damit.kr`
- command returns structured JSON
- command can fail clearly when:
  - test phone is missing
  - preview is not on Postgres
  - delivery result is not automatic when auto is required

