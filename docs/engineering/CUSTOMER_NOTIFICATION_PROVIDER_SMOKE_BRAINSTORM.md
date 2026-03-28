# Customer Notification Provider Smoke Brainstorm

Date: 2026-03-28
Status: GO

## Problem

- customer confirmation auto-delivery foundation is now live in code
- PM still lacks a repeatable preview-side proof for real provider delivery
- ad-hoc manual clicking is too ambiguous for a release gate

## Options considered

### 1. Direct provider ping only

- pros:
  - simple
- cons:
  - does not prove app flow
  - does not prove persisted delivery metadata

### 2. Local runtime smoke with real provider

- pros:
  - controlled
- cons:
  - does not prove preview runtime
  - depends on local env parity

### 3. Preview runtime smoke with bootstrap session

- pros:
  - proves real preview runtime
  - proves API route, persistence, timeline, and detail state together
  - can be repeated before every real cutover discussion
- cons:
  - needs a deliberate test phone and live provider config

## Decision

- choose option 3
- bootstrap a preview owner session directly against preview Postgres
- call the real preview API to create a job case and issue a customer confirmation link
- assert the delivery result returned by the runtime

## Success shape

- one CLI command
- one explicit test phone input
- one JSON result showing:
  - preview base URL
  - job case id
  - confirmation URL
  - delivery status
  - whether the result was truly automatic

