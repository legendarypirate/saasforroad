# Zero VPS edits per tenant

## Default (recommended): `{slug}.rcos.mn`

Already covered by one wildcard cert + `sites-available/tenants`.

- Create tenant `vlemj` → `https://vlemj.rcos.mn` works immediately.
- **No nginx change** when a new tenant is created.

## Optional custom domain (`teensclub.mn`)

You cannot issue a free Let’s Encrypt cert for every random `.mn` domain
without either:

1. **Cloudflare proxy (DNS-only product work)** — recommended  
2. Caddy on-demand TLS (set up once on the VPS)

### Option A — Cloudflare (no certbot per tenant)

**Once on VPS** (nginx catch-all → zam `:3000`):

```bash
sudo cp deploy/nginx-custom-domains.conf /etc/nginx/sites-available/custom-domains
sudo ln -sf /etc/nginx/sites-available/custom-domains /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

**Each customer:**

1. Platform admin: set domain = `teensclub.mn` (DB only)
2. Move/use domain on Cloudflare
3. DNS:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | `@` | your VPS IP | **Proxied (orange)** |
| A | `www` | your VPS IP | **Proxied (orange)** |

4. SSL/TLS mode in Cloudflare: **Flexible** (or Full if you also terminate HTTPS on origin)

Browser talks HTTPS to Cloudflare (correct cert for `teensclub.mn`).  
Cloudflare talks to your VPS; catch-all routes Host → zam.  
App matches `teensclub.mn` in the tenants table.

**Never put Caddyfile into nginx `sites-available`.**

### Option B — Stay on `{slug}.rcos.mn` only

Skip custom domains. Tell every company:

> Your URL is `https://yourcompany.rcos.mn`

Zero custom SSL forever.

## Why the browser said “certificate is from admin.rcos.mn”

`www.teensclub.mn` hit the VPS on **443** without its own cert, so nginx
served the **default** HTTPS site (`admin.rcos.mn`). That is fixed by either
Cloudflare (SSL at edge) or a dedicated cert / Caddy — not by editing the
tenant form again.

## Aliases

Saving a custom primary domain automatically keeps `{slug}.rcos.mn` as an
alias so both URLs open the same tenant.
