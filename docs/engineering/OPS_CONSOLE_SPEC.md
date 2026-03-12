# OPS_CONSOLE_SPEC

## Purpose

Provide a small internal operations console for a single-node DAMIT deployment.

## PM scope

This screen is for operators, not end customers. It exists to reduce uncertainty during local and self-host operation.

## Entry path

- `/ops`

## Required data

- `GET /api/v1/health`
- `GET /api/v1/admin/ops-snapshot`

## Required actions

- refresh operational snapshot
- create a named backup

## Information shown

### Health

- service status
- storage engine
- record counts

### Runtime

- node environment
- object storage provider
- app base URL when present

### Backups

- latest backup entries
- type
- size
- updated time

## Deliberately excluded

- destructive reset controls
- tenant management
- invitation management
- full audit browser

## PM note

For the current single-node stage, a simple read-first ops console plus backup trigger is enough.
