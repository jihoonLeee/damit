## App Workspace Recovery Plan

### Goal
- Recover the broken `/app` workspace script so the page parses and loads again.
- Replace broken or placeholder Korean copy with operator-friendly production copy.
- Keep the current production workspace structure and make the flow easier to read:
  - field capture
  - case binding
  - quote update
  - draft creation
  - customer confirmation
  - agreement record

### PM Decision
- Fixing `public/app.js` is the highest-priority task.
- No new feature scope is added in this batch.
- Preserve current HTML structure and align JavaScript to that structure.

### Implementation Scope
- Rebuild `public/app.js` to a known-good, readable state.
- Clean up broken text in `public/index.html` where static copy is still corrupted.
- Keep the existing backend API contract unchanged.

### Verification
- `node --check public/app.js`
- `node tests/api.test.js`
- `node tests/auth-foundation.test.js`
- `node tests/workspace-session.test.js`
- `node tests/customer-confirmation.test.js`
- `node scripts/visual-review.mjs`

### Out of Scope
- Real email cutover
- Postgres runtime cutover
- New workflow branches beyond the current operator flow
