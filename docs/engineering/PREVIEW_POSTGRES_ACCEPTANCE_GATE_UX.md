# PREVIEW_POSTGRES_ACCEPTANCE_GATE_UX

## Tester experience

- the tester should not have to inspect database rows or decode raw cookies manually
- the bootstrap output should be a small artifact that clearly says:
  - who the session belongs to
  - which preview company it belongs to
  - which cookies to load
  - what the next URLs are

## UX principles

- no visible QA entry points in the product UI
- no product copy changes just to support QA
- keep the testing path outside the normal user-facing flow

## Output design

- output should include:
  - preview base URL
  - owner session summary
  - optional invitee session summary
  - browser cookie values
  - recommended next pages:
    - `/home`
    - `/account`
    - `/app`
    - `/ops`

## Acceptance usage flow

1. run the preview bootstrap script
2. load the returned cookies into a browser context
3. open preview pages in the intended order
4. record findings
5. run rollback proof after acceptance is complete
