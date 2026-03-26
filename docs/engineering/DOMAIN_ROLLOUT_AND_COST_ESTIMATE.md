# Domain Rollout And Cost Estimate

Date: 2026-03-26
Owner: PM

## PM summary

If the goal is to move from trusted self-host to a cleaner public-facing setup without overspending, the best order is:

1. buy the domain
2. move DNS to Cloudflare
3. expose the existing home-server app through Cloudflare Tunnel
4. keep SSH and operator access on Tailscale
5. only when public beta gets real, move DB to Supabase Postgres
6. then move files to Cloudflare R2
7. then resume real mail cutover with Resend

This sequence gives the biggest safety and trust gain for the least cost.

## 1. Recommended rollout order

### Step 1. Choose the canonical hostname

PM recommendation:

- main product: `yourdomain.com`
- redirect only: `www.yourdomain.com`
- mail sender domain: `updates.yourdomain.com`
- optional later asset host: `assets.yourdomain.com`

Keep one canonical product origin first because the current cookie/session model is simplest on one host.

### Step 2. Buy the domain

Best path:

- buy via Cloudflare Registrar if your TLD is supported

Fallback:

- buy anywhere you want, but still put DNS on Cloudflare

Cloudflare Registrar says it sells domains at cost with no markup.

### Step 3. Put DNS on Cloudflare

Create the zone and prepare:

- apex/root
- `www`
- later `updates`

### Step 4. Stage safely before cutting the main domain

Recommended trial hostname before switching the root:

- `preview.yourdomain.com`

Route `preview.yourdomain.com` first to the home server through Cloudflare Tunnel.
This lets you test:

- login
- home
- app
- ops
- account
- admin
- confirm

without changing the final public entry yet.

### Step 5. Install and configure Cloudflare Tunnel on the Ubuntu server

Target local origin:

- `http://127.0.0.1:3210`

This keeps:

- no router port-forwarding
- no public app port
- simpler rollback than a public reverse-proxy stack on the home network

### Step 6. Switch the canonical domain

After `preview.yourdomain.com` is stable:

- point `yourdomain.com` to the tunnel route
- set `www` to redirect to `yourdomain.com`
- update `APP_BASE_URL`
- update `TRUSTED_ORIGINS`

### Step 7. Keep Tailscale as the operator path

Do not replace Tailscale with Cloudflare.

Use:

- Cloudflare = public traffic
- Tailscale = operator SSH and private maintenance

### Step 8. Delay DB migration until the public-beta threshold

Stay on SQLite while:

- access is still trusted and limited
- data volume is small
- support/uptime expectations are low

Move to Supabase Postgres before:

- broader public beta
- real shared/team usage
- higher-value customer data accumulation

### Step 9. Move files after DB, not before

After Postgres is cut over:

- move uploads and evidence files to Cloudflare R2
- keep local files only as a temporary migration bridge

### Step 10. Resume mail cutover only after the sender domain is verified

Use:

- `updates.yourdomain.com`
- `MAIL_FROM=login@updates.yourdomain.com`

### Step 11. Add abuse protection before broader public launch

Recommended order:

1. app-level rate limit
2. Cloudflare edge rules
3. Turnstile on login or invite forms if abuse starts showing up

## 2. Cost model assumptions

These estimates assume:

- you already own the home server
- electricity is excluded from the table below
- the app compute remains on the home server
- the product uses one database project
- files are relatively small field photos and backup bundles, not heavy media

## 3. Cost estimate by phase

### Phase A. Today: trusted pilot on the current self-host runtime

| Item | Estimated cost | Basis |
| --- | --- | --- |
| Domain | TLD-dependent annual fee | Cloudflare Registrar charges at cost, no markup |
| Cloudflare DNS | effectively included with the domain/DNS setup | DNS zone on Cloudflare |
| Cloudflare Tunnel | I would budget `$0` incremental to start | inference: Tunnel docs say available on all plans and I did not find a separate Tunnel line item |
| Tailscale | `$0` to start on personal/small-use paths, depending on your current account setup | not newly required by this step if you already use it |
| Database | `$0` | keep SQLite locally |
| File storage | `$0` service fee | keep local disk |
| Mail | `$0` | keep mail cutover on hold or file/debug mode |

### PM reading

This phase is basically:

- domain cost
- plus your existing home-server cost

If you want the cheapest viable public-facing next step, this is it.

### Phase B. Small external beta with the recommended hybrid architecture

| Item | Estimated cost | Basis |
| --- | --- | --- |
| Domain | TLD-dependent annual fee | still registrar-dependent |
| Cloudflare Tunnel | budget `$0` incremental to start | same inference as above |
| Supabase Free | `$0` if usage stays inside free limits | 2 free projects, 500 MB DB per project |
| Cloudflare R2 | often `$0` initially or near-zero | 10 GB-month free, 1M Class A, 10M Class B free |
| Resend Free | `$0` | 100 emails/day, 3,000 emails/month |

### PM reading

This phase can still be nearly free in service fees, but it has caveats:

- Supabase Free is useful for early validation, not for a high-confidence public runtime
- it may be enough for a low-volume external beta
- it is not the stability target I would choose for real paying-customer operations

### Phase C. More dependable public beta

| Item | Estimated cost | Basis |
| --- | --- | --- |
| Domain | TLD-dependent annual fee | registrar-dependent |
| Cloudflare Tunnel | still likely `$0` incremental at this scale | same inference as above |
| Supabase Pro + one Micro project | about `$25/month` total | Supabase docs show Pro `$25`, with `$10` compute credits covering a single Micro example total |
| Cloudflare R2 | low single-digit dollars or `$0` if tiny | storage is `$0.015/GB-month` after the 10 GB free tier |
| Resend | `$0` on Free or `$20/month` on Pro if you outgrow the free tier | Free = 3,000 emails/month, Pro = 50,000/month |

### PM reading

This is the first configuration I would consider "serious beta".
The first real recurring monthly cost is usually the database, not Cloudflare or file storage.

## 4. Most realistic budget scenarios

### Scenario 1. Cheapest sensible upgrade from today

- home server compute
- Cloudflare domain + DNS
- Cloudflare Tunnel
- SQLite local
- local uploads
- Tailscale for admin

Expected service-fee shape:

- near zero monthly
- plus the annual domain cost

PM judgment:

- good for trusted pilot and early external evaluation
- not my final answer for sustained public usage

### Scenario 2. Best value public-beta setup

- home server compute
- Cloudflare domain + Tunnel
- Supabase Pro
- R2
- Resend Free or Pro depending on volume

Expected service-fee shape:

- roughly `$25/month` plus domain
- maybe a few additional dollars later for R2 or paid mail

PM judgment:

- this is the best value-for-safety operating point for this product

### Scenario 3. Overbuilt too early

- move app compute away from the home server immediately
- pay for managed DB
- pay for object storage
- pay for mail

PM judgment:

- too early right now
- not recommended unless uptime expectations suddenly become contractual

## 5. What I would do in your place

### Immediate next steps

1. buy the domain
2. put DNS on Cloudflare
3. create `preview.yourdomain.com`
4. install `cloudflared` on the Ubuntu server
5. route `preview.yourdomain.com` to `127.0.0.1:3100`
6. test the full product on the preview hostname
7. move the canonical root to Cloudflare Tunnel

### After that

8. keep SQLite for now
9. once public beta becomes real, move DB to Supabase Pro
10. after DB cutover, move files to R2
11. after domain verification, enable Resend live login mail

## 6. PM final recommendation

If you want one sentence:

Start with `Cloudflare domain + Cloudflare Tunnel + home server`, then make `Supabase Postgres` the first paid external service when the product crosses into real public beta.

That path gives you:

- the lowest complexity now
- the clearest upgrade path later
- the best safety gain per dollar spent

## Sources

- [Cloudflare Registrar overview](https://developers.cloudflare.com/registrar/)
- [Cloudflare Tunnel overview](https://developers.cloudflare.com/tunnel/)
- [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/)
- [Cloudflare Turnstile get started](https://developers.cloudflare.com/turnstile/get-started/)
- [Supabase billing](https://supabase.com/docs/guides/platform/billing-on-supabase)
- [Supabase compute usage](https://supabase.com/docs/guides/platform/manage-your-usage/compute)
- [Supabase connecting to Postgres](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Resend pricing](https://resend.com/pricing/)
- [Resend quotas and limits](https://resend.com/docs/knowledge-base/account-quotas-and-limits)
