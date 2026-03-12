# PRODUCTION_POSTGRES_AUTH_RUNTIME_DEPLOY_ATTEMPT.md

Date: 2026-03-12
Environment: `field-agreement-jihoon-staging`
Target URL: [field-agreement-jihoon-staging.fly.dev](https://field-agreement-jihoon-staging.fly.dev/)
Target config: [fly.staging.toml](/D:/AI_CODEX_DESKTOP/fly.staging.toml)

## Goal

- deploy staging with `STORAGE_ENGINE=POSTGRES`
- run session-based runtime smoke using [postgres-runtime-auth-smoke.mjs](/D:/AI_CODEX_DESKTOP/scripts/postgres-runtime-auth-smoke.mjs)

## Attempted command

```powershell
$env:FLY_CONFIG_DIR='D:\AI_CODEX_DESKTOP\.fly-config'
C:\Users\jihoo\.fly\bin\flyctl.exe deploy -c D:\AI_CODEX_DESKTOP\fly.staging.toml
```

## Result

- config validation passed
- app config verification passed
- deploy did not start because Fly rejected the account state

## Blocking error

```text
trial has ended, please add a credit card by visiting https://fly.io/trial
```

## Interpretation

- the new staging runtime deploy was not applied
- the currently running staging app remains on the last successful deployed image/runtime
- this does not indicate a code failure in the auth/runtime batch
- this is an external billing gate on the Fly account

## What is already ready once unblocked

- runtime config switch in [fly.staging.toml](/D:/AI_CODEX_DESKTOP/fly.staging.toml)
- repository-backed auth/session/company context in app code
- smoke script in [postgres-runtime-auth-smoke.mjs](/D:/AI_CODEX_DESKTOP/scripts/postgres-runtime-auth-smoke.mjs)

## Next exact steps after unblock

1. add billing to the Fly account
2. rerun `flyctl deploy -c D:\AI_CODEX_DESKTOP\fly.staging.toml`
3. run `node D:\AI_CODEX_DESKTOP\scripts\postgres-runtime-auth-smoke.mjs` with:
   - `BASE_URL=https://field-agreement-jihoon-staging.fly.dev`
   - `OWNER_TOKEN=<staging owner token>`
4. record the result and reopen PM cutover readiness review

## PM judgment

Decision: `HOLD on staging runtime proof until Fly billing unblock`
