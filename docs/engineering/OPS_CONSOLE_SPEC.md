# OPS_CONSOLE_SPEC

## Purpose

Provide a small internal operations console for a single-node DAMIT deployment.

## PM scope

This screen is for operators, not end customers. It exists to reduce uncertainty during local and self-host operation.

The console should now support:

- immediate operational confidence
- backup freshness checks
- release/version awareness
- lightweight anomaly spotting
- flow visibility around agreements, customer confirmation, timeline activity, login-link delivery, and session health
- fast owner actions without exposing destructive controls

## Entry path

- `/ops`

## Required data

- `GET /api/v1/health`
- `GET /api/v1/admin/ops-snapshot`

## Required actions

- refresh operational snapshot
- create a named backup

## Required information hierarchy

### 1. Top decision layer

This is what the operator should be able to understand in under 10 seconds.

- overall service health
- current deployment version
- last backup freshness
- current storage engine and object storage mode
- whether there is any operational warning that needs attention

### 2. Workflow signal layer

The operator should quickly understand whether work is moving.

- agreement flow signal
- customer confirmation signal
- recent timeline signal`r`n- auth delivery and session signal

### 3. Operational summary layer

- record counts
- current runtime metadata
- app base URL when present
- release published time when present
- backup directory summary when present

### 4. Recent activity layer

- recent operational events or audit entries
- recent customer confirmation feed
- recent timeline feed
- recent backup list
- timestamps in readable local format

## Information shown

### Health

- service status
- storage engine
- record counts
- last snapshot loaded time

### Runtime

- node environment
- object storage provider
- app base URL when present
- release tag and publish time when present

### Workflow signals

- recent agreements in the last 7 days
- currently open or stale customer confirmation links
- recent timeline activity in the last 24 hours
- top recent status or event mix when available

### Warnings

- no recent backup
- release metadata missing
- storage mode mismatch
- empty workspace state
- stale customer confirmation links
- no recent timeline movement despite operational data

Warnings are advisory, not blocking.

### Backups

- latest backup entries
- type
- size
- updated time
- backup freshness summary

### Activity

- latest audit or operator events when available
- recent customer confirmation items
- recent timeline items
- action summary
- timestamp

## Deliberately excluded

- destructive reset controls in the main UI
- tenant management
- invitation management
- full audit browser
- configuration mutation beyond named backup creation
- charts or long-range BI reporting

## PM note

For the current single-node stage, the right target is not a full admin suite.
It is a read-first, signal-rich console that helps an owner decide:

- is the system healthy
- do I have a recent backup
- what version is running
- was there recent operator activity
- are agreements, customer confirmation, and timeline movement progressing


## Priority checklist
- /ops 상단에서 운영자가 지금 바로 처리해야 하는 1~3개 액션을 별도 checklist로 보여준다.
- checklist는 백업, 고객 확인 지연, 로그인 전달 실패, 오래된 세션, 릴리즈 메타 누락을 우선순위로 계산한다.

