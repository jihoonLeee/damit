# DB_DECISION

## Current conclusion

- live runtime today: `SQLite`
- current hosting model: `Fly.io app + Fly volume + SQLite file`
- first external Postgres target: `Supabase Free`
- PM judgment: this is the most realistic cost-conscious path

## Why this is the right split

- SQLite keeps the current pilot cheap and simple.
- Supabase Free gives us a real Postgres connection string without adding large fixed monthly cost too early.
- We can keep building the Postgres adapter without forcing an infrastructure cutover before the product is ready.

## Why not Fly Managed Postgres yet

- it is operationally neat but too expensive for the current stage
- the code still needs runtime Postgres read/write completion
- paying fixed DB cost before real external validation would be premature

## What Supabase Free is for

- staging DB validation
- preflight and migration rehearsal
- early beta DB connection tests

## What SQLite is still for

- current live pilot runtime
- low-cost iteration
- simple reset, backup, and rollback

## When to move past SQLite

Start the Postgres cutover path when at least one of these becomes real:

- multiple real users operate concurrently
- tenant isolation and auth behavior must be validated on an external DB
- data size and reporting needs are growing
- restore expectations are stricter than a single-file pilot model

## PM note

The short answer now is:

- app hosting stays on Fly.io
- the pilot runtime DB stays on SQLite
- the first external Postgres provider to prepare next is Supabase Free