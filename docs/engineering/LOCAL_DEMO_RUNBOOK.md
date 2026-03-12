# LOCAL_DEMO_RUNBOOK

## Goal

Show the product as a believable working tool, not just a prototype screen.

The recommended local demo uses:

- `/app` for the pilot workspace
- `/login` and `/beta-home` only if the audience wants to see the production path

## Recommended setup

1. Start the app with `npm start`
2. Open `/app`
3. Confirm the workspace meta area shows runtime and case count
4. Decide one of two demo modes:
   - clean demo: reset data and walk through one full job case
   - seeded demo: use existing data to jump directly into detail, draft, and agreement sections

## Demo sequence

### 1. Explain the product framing

- this is not a lead-generation app
- this is a post-inquiry processing tool for field operators
- the core value is faster explanation, cleaner evidence, and fewer missed follow-ups

### 2. Show fast field capture

- upload one photo
- select a reason
- leave a short note
- save the field record

Explain:

- the app starts from the field problem, not from admin data entry

### 3. Show job case linkage

- create a new job case
- connect the new field record
- point out that the detail panel becomes active

Explain:

- the workflow pushes the user toward a quote-ready state

### 4. Show quote and scope comparison

- update revised quote
- highlight original, revised, and delta values
- explain the base scope vs extra work summary

### 5. Show customer-facing communication

- generate the draft
- copy the draft
- show that the app is useful in the exact moment the owner needs to explain extra cost

### 6. Show agreement evidence

- save agreement status, channel, amount, and note
- point to the timeline

Explain:

- the point is not legal-signature complexity
- the point is operational clarity and evidence continuity

## Optional production-path add-on

If the audience asks whether this scales beyond pilot mode:

- open `/login`
- explain the beta auth path
- mention company context and invitation flow
- do not over-demo staging Postgres because runtime cutover is still intentionally on hold

## Demo risks to avoid

- do not start with empty explanations about infrastructure
- do not switch between too many modes in one run
- do not use broken or obviously fake Korean copy in the primary moment of the demo
- do not promise runtime Postgres cutover as complete

## PM talking points

- local runtime quality: `GO`
- staging runtime Postgres proof: `HOLD`
- production cutover: `HOLD`
- current strength: local workflow integrity and recoverability
- current next step: keep tightening local polish and proof before broader cutover claims
