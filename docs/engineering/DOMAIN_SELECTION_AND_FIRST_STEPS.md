# Domain Selection And First Steps

Date: 2026-03-26
Owner: PM

## PM recommendation

Buy the domain first, before any further public-edge work.

For this product, the best order is:

1. choose the brand domain
2. buy it
3. put DNS on Cloudflare
4. publish `preview` through Cloudflare Tunnel
5. only then switch the canonical root

## 1. What I checked

I did a fast DNS-level check from the current machine.

### Currently resolving

- `damit.com`
- `damitapp.com`
- `damit.work`

### Currently not resolving

- `damit.kr`
- `damit.co.kr`
- `getdamit.com`
- `usedamit.com`
- `damit.so`

Important:

- no DNS resolution does **not** guarantee registrar availability
- but it is a useful signal for what is more promising right now

## 2. Recommended domain shortlist

### 1st choice: `damit.kr`

Best fit if:

- your first serious market is Korea
- you want the cleanest brand URL
- you want the shortest memorable address

Why I like it:

- shortest and strongest brand expression
- matches the Korean-first operating reality of the product
- feels like the main product, not a fallback domain

PM verdict:

- best primary domain if it is available

### 2nd choice: `damit.co.kr`

Best fit if:

- `damit.kr` is unavailable
- you still want the strongest Korea trust signal

Why I like it:

- more business-like and service-like than an unusual TLD
- still very aligned to the actual customer base

PM verdict:

- best fallback if `damit.kr` is gone

### 3rd choice: `getdamit.com`

Best fit if:

- you want a globally easier domain
- the plain brand domains are unavailable

Why I like it:

- cleaner than `damitapp.com`
- still readable and easy to say
- more product-like than `usedamit.com`

PM verdict:

- best `.com` fallback from the current shortlist

### 4th choice: `usedamit.com`

Why it is lower:

- usable, but slightly more awkward
- sounds more campaign-like than brand-like

PM verdict:

- acceptable fallback, not my first choice

### Not recommended as first choice

- `damit.com`
  - already resolves
- `damitapp.com`
  - already resolves
- `damit.work`
  - already resolves, and the TLD is weaker for this brand
- `damit.so`
  - interesting, but weaker than `.kr`, `.co.kr`, or a clean `.com` fallback

## 3. My exact buying recommendation

### If you want the best single-domain choice

Buy:

- `damit.kr`

### If you want the best practical pair

Buy:

- primary: `damit.kr`
- defensive/global redirect: `getdamit.com`

Why the pair is good:

- `damit.kr` becomes the real brand home
- `getdamit.com` can redirect and protect the name in a broader context

### If `damit.kr` is unavailable

Buy in this order:

1. `damit.co.kr`
2. `getdamit.com`
3. `usedamit.com`

## 4. First steps after purchase

### Step 1. Decide the canonical hostname

If you buy `damit.kr`, use:

- canonical product URL: `https://damit.kr`
- redirect only: `https://www.damit.kr`
- sender domain: `updates.damit.kr`
- preview environment: `preview.damit.kr`

If you buy `damit.co.kr`, use the same structure:

- `damit.co.kr`
- `www.damit.co.kr`
- `updates.damit.co.kr`
- `preview.damit.co.kr`

### Step 2. Put DNS on Cloudflare

Do this immediately after purchase:

- add the zone to Cloudflare
- switch nameservers if the registrar is not Cloudflare

### Step 3. Do **not** point the root domain to the home server yet

First create:

- `preview.<domain>`

Use that to test:

- login
- home
- app
- ops
- account
- admin
- confirm links

### Step 4. Install Cloudflare Tunnel on the Ubuntu server

Target:

- `preview.<domain>` -> `http://127.0.0.1:3210`

### Step 5. Update app runtime settings

Set:

- `APP_BASE_URL=https://preview.<domain>`
- `TRUSTED_ORIGINS=https://preview.<domain>`

### Step 6. Run a full smoke on the preview host

Check:

- homepage loads
- login works
- authenticated navigation works
- customer confirmation link works
- ops and account pages work

### Step 7. Promote the root domain

Only after preview is stable:

- route the root domain to the same tunnel
- set `www` redirect to the root
- update:
  - `APP_BASE_URL=https://<domain>`
  - `TRUSTED_ORIGINS=https://<domain>`

### Step 8. Prepare the sender domain but do not rush cutover

Create:

- `updates.<domain>`

Use it later for:

- Resend sender verification
- `MAIL_FROM=login@updates.<domain>`

## 5. What I recommend you do first

### My strongest recommendation

1. check and buy `damit.kr`
2. if unavailable, buy `damit.co.kr`
3. if you want a second defensive domain, also buy `getdamit.com`

After that, come back and we should do the Cloudflare setup in this order:

1. add zone
2. create `preview`
3. install `cloudflared`
4. connect preview
5. smoke test
6. promote root domain

## Sources

- [Cloudflare Registrar](https://developers.cloudflare.com/registrar/)
- [Cloudflare Tunnel](https://developers.cloudflare.com/tunnel/)
