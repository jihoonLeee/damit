# Cloudflare CLI Tunnel Runbook For Damit

Date: 2026-03-26
Owner: PM

## PM recommendation

Yes, you can create the tunnel by command line.

For `damit`, the cleanest CLI approach is:

- create a separate locally-managed tunnel just for this app
- point `preview.damit.kr` and later `damit.kr` to that tunnel
- keep the other app and its tunnel untouched

This is safer than trying to mutate an unknown existing tunnel used by another project.

## Why this path

Cloudflare docs say:

- remotely-managed tunnels are recommended for most use cases
- locally-managed tunnels can be created by CLI with `cloudflared tunnel create <NAME>`
- CLI DNS routing uses `cloudflared tunnel route dns <UUID or NAME> <hostname>`

For this project, the CLI path is reasonable because:

- the server already has `cloudflared`
- we want a separate tunnel for `damit`
- we want reproducible command-line steps

## Target values

- tunnel name: `damit-home`
- preview hostname: `preview.damit.kr`
- root hostname: `damit.kr`
- local service: `http://127.0.0.1:3210`

## 1. Log in cloudflared on the server

On Ubuntu:

```bash
cloudflared tunnel login
```

This opens a browser auth flow and stores the Cloudflare certificate on the server.

Important:

- this is required for locally-managed tunnel creation and DNS routing

## 2. Create the tunnel

```bash
cloudflared tunnel create damit-home
```

Expected result:

- Cloudflare returns a tunnel UUID
- a credentials JSON file is created under `~/.cloudflared/`

## 3. Find the created tunnel

```bash
cloudflared tunnel list
```

Copy or note the UUID for `damit-home`.

## 4. Create the preview DNS route by CLI

```bash
cloudflared tunnel route dns damit-home preview.damit.kr
```

Later, after preview is stable:

```bash
cloudflared tunnel route dns damit-home damit.kr
```

Cloudflare docs say this creates the DNS record that points the hostname at the tunnel subdomain.

## 5. Create the tunnel config file

Create:

- `/home/jihoon/.cloudflared/config.yml`

Recommended content:

```yaml
tunnel: <TUNNEL-UUID>
credentials-file: /home/jihoon/.cloudflared/<TUNNEL-UUID>.json

ingress:
  - hostname: preview.damit.kr
    service: http://127.0.0.1:3210
  - hostname: damit.kr
    service: http://127.0.0.1:3210
  - service: http_status:404
```

Important:

- it is okay for `damit.kr` to exist in the config before its DNS route is created
- traffic will only arrive after the DNS route exists

## 6. Test-run the tunnel in the foreground

```bash
cloudflared tunnel --config /home/jihoon/.cloudflared/config.yml run damit-home
```

If it starts cleanly, stop it with `Ctrl+C` and continue to service installation.

## 7. Install as a service

```bash
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl restart cloudflared
sudo systemctl status cloudflared --no-pager
```

If your environment already uses a different service pattern, check the existing `cloudflared` setup before replacing it.

PM recommendation:

- if another app already depends on a system-wide `cloudflared`, confirm whether the service is driven by the same config path
- if unsure, back up the current config before changing anything

## 8. Preview-first rollout

### First create and validate preview only

CLI:

```bash
cloudflared tunnel route dns damit-home preview.damit.kr
```

App env:

```env
APP_PORT=3210
APP_BASE_URL=https://preview.damit.kr
TRUSTED_ORIGINS=https://preview.damit.kr
AUTH_ENFORCE_TRUSTED_ORIGIN=true
AUTH_DEBUG_LINKS=true
```

Redeploy app, then test:

```bash
curl --fail --silent --show-error https://preview.damit.kr/api/v1/health
curl -I https://preview.damit.kr/
```

## 9. Promote root after preview passes

Create the root DNS route:

```bash
cloudflared tunnel route dns damit-home damit.kr
```

Update env:

```env
APP_BASE_URL=https://damit.kr
TRUSTED_ORIGINS=https://damit.kr
```

Redeploy app, then test:

```bash
curl --fail --silent --show-error https://damit.kr/api/v1/health
curl -I https://damit.kr/
```

## 10. What still stays in the dashboard

Even if the tunnel is created by CLI, I still recommend doing this in the dashboard:

- `www.damit.kr -> damit.kr` redirect

This is cleaner than trying to force redirect behavior through the origin app for the `www` host.

## 11. Exact command sequence

If you want the shortest path:

```bash
cloudflared tunnel login
cloudflared tunnel create damit-home
cloudflared tunnel route dns damit-home preview.damit.kr
cloudflared tunnel list
```

Then create `/home/jihoon/.cloudflared/config.yml` with the tunnel UUID and:

```bash
cloudflared tunnel --config /home/jihoon/.cloudflared/config.yml run damit-home
```

After that:

```bash
cd /home/jihoon/damit/app
bash deploy/homelab/set-host-port.sh 3210
bash deploy/homelab/set-public-origin.sh --host preview.damit.kr --mode preview
bash deploy/homelab/deploy.sh
bash deploy/homelab/smoke.sh
curl --fail --silent --show-error https://preview.damit.kr/api/v1/health
```

## 12. PM caution

If another app is already using a system-wide locally-managed `cloudflared` config:

- inspect that setup first
- do not overwrite its `config.yml` blindly

In that case, the safe fallback is:

- either merge both apps into one ingress config
- or keep the other app as-is and manage `damit` through the dashboard with a remotely-managed tunnel

## Sources

- [Cloudflare Tunnel](https://developers.cloudflare.com/tunnel/)
- [Locally-managed tunnels](https://developers.cloudflare.com/tunnel/advanced/local-management/)
- [Create a locally-managed tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/get-started/create-local-tunnel/)
- [Tunnel DNS routing](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/routing-to-tunnel/dns/)
