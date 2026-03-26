# ACCOUNT SURFACES PHASE 1 REVIEW

## PM verdict

- status: `GO`
- scope: `start`, `login`, `home`, `account`, `admin` surface alignment
- judgment: sustainable enough to continue

## What shipped

- added `/start` as an explicit owner onboarding entry point
- clarified `/login` so `start` entry and `login` entry read differently
- added `/account` as the owner-facing account page
- added `/admin` as a separate internal system-admin surface
- updated `/home` so it links to `/account` and conditionally exposes `/admin`
- kept `/ops` as owner-company operations, not a global internal admin surface

## Product decisions locked

- signup remains `magic link + first-login onboarding`, not a separate password form
- owner account management belongs to `/account`
- system admin belongs to `/admin`
- `/home` is an operating hub, not a catch-all summary page

## Evidence

- `node --check public/login.js`
- `node --check public/home.js`
- `node --check public/account.js`
- `node --check public/admin.js`
- `node tests/auth-foundation.test.js`
- `node tests/api.test.js`
- `node tests/workspace-session.test.js`

## Risks still open

- `/account` currently focuses on visibility and company switching; deeper owner settings can still expand
- `/admin` is intentionally read-only in this batch
- real mail cutover still depends on verified sender-domain setup and remains separate

## Next recommended batch

1. polish account-level owner actions such as invite management or profile editing
2. design the first true system-admin action set carefully, instead of mixing it into `/ops`
3. keep mail cutover separate until sender-domain verification exists
