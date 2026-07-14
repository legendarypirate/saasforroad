# Caddy once — auto HTTPS for any registered custom domain

## What you get

| Host | App | Cert |
|------|-----|------|
| `admin.rcos.mn` | admin `:3002` | Auto |
| `api.rcos.mn` | road `:3201` | Auto |
| `*.rcos.mn` | zam `:3000` | Auto |
| `teensclub.mn` (in DB) | zam `:3000` | **On-demand** (no VPS edit) |

New tenant / new custom domain → **only DNS + admin DB**. No nginx, no certbot.

Caddy asks your API before issuing a cert:

`GET http://127.0.0.1:3201/api/tenant/ssl-allowed?domain=teensclub.mn`

- `200` → allow cert  
- `404` → refuse (stops strangers pointing domains at you)

---

## 0. Prerequisites

```bash
# road API running (needed for ask + ssl-allowed)
curl -s "http://127.0.0.1:3201/api/tenant/ssl-allowed?domain=vlemj.rcos.mn"
# expect: ok

# zam on 3000, admin on 3002
curl -sI http://127.0.0.1:3000/ | head -1
curl -sI http://127.0.0.1:3002/ | head -1
```

Tenant `teensclub.mn` must exist in admin (domain or alias).

DNS A records for custom domains → **this VPS IP** (same as `vlemj.rcos.mn`).

---

## 1. Install Caddy (Ubuntu)

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
  | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
  | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy
caddy version
```

---

## 2. Stop nginx from holding ports 80/443

Caddy and nginx cannot both listen on 80/443.

```bash
sudo systemctl stop nginx
sudo systemctl disable nginx
# keep config as backup: /etc/nginx/sites-available/*
```

(Or uninstall nginx later once Caddy is stable.)

---

## 3. Install Caddyfile

```bash
sudo cp /var/www/saasforroad/deploy/Caddyfile /etc/caddy/Caddyfile
# edit email if needed:
sudo nano /etc/caddy/Caddyfile

sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl enable caddy
sudo systemctl restart caddy
sudo systemctl status caddy
```

Logs:

```bash
sudo journalctl -u caddy -f
```

---

## 4. Firewall

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw status
```

---

## 5. Test

```bash
# SaaS subdomain
curl -sI https://vlemj.rcos.mn/ | head -5

# Custom domain (after DNS points here)
curl -sI https://teensclub.mn/ | head -5
curl -sI https://www.teensclub.mn/ | head -5

# Cert must be for teensclub.mn, NOT admin.rcos.mn
echo | openssl s_client -connect teensclub.mn:443 -servername teensclub.mn 2>/dev/null \
  | openssl x509 -noout -subject -ext subjectAltName
```

First HTTPS hit to a new custom domain may take a few seconds while Caddy gets a Let’s Encrypt cert.

---

## 6. Per new tenant forever after this

1. Create/edit tenant in `admin.rcos.mn` (domain = `customer.mn`)
2. Customer sets A record → your VPS IP  
3. Open `https://customer.mn` — done  

No Caddyfile change. No certbot. No `sites-available`.

Also works: `https://{slug}.rcos.mn` (always).

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `ssl-allowed` 404 | Domain not in tenants.domain / domains aliases |
| Cert still admin.rcos.mn | nginx still running — `sudo systemctl stop nginx` |
| Caddy fail start | `sudo ss -tlnp \| grep -E ':80\|:443'` — free ports |
| On-demand blocked | Ensure `{ on_demand_tls { ask … } }` is in global block |
| API down | Caddy ask fails → no custom certs until road is up |

---

## Note on nginx

You can keep nginx files as backup, but **do not start nginx** while Caddy owns 80/443.  
Caddy replaces the public edge completely.
