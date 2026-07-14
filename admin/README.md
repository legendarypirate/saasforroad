# Multi-tenant SaaS (platform admin + single-tenant zam)

## Apps

| App | Path | Port | Domain |
|-----|------|------|--------|
| **road** API | `road/` | 3201 | shared backend + Postgres |
| **zam** | `zam/` | 3000 | per-tenant: `tenant1.mn`, `tenant2.mn`, … |
| **admin** | `admin/` | **3002** | `admin.rcos.mn` |

## Platform admin (`admin`)

Default login (seeded on API boot):

- user: `platform` (override with `PLATFORM_ADMIN_USER`)
- password: `platform123` (override with `PLATFORM_ADMIN_PASSWORD`)

Capabilities:

1. Register tenants (domain → `tenant1.mn`)
2. Enable/disable zam modules per tenant
3. Create **one** superadmin per tenant
4. Edit role permissions for a tenant

## Tenant apps (zam + road)

- Resolve tenant from `Host` / `X-Tenant-Domain`
- Login is scoped to that tenant
- Roles, users, projects are `tenant_id`-scoped
- Superadmin has Admin role and can manage RBAC inside their zam

## Env notes

### road

```
PLATFORM_ADMIN_DOMAIN=admin.rcos.mn
PLATFORM_ADMIN_USER=platform
PLATFORM_ADMIN_PASSWORD=platform123
DEFAULT_TENANT_SLUG=default
DEFAULT_TENANT_DOMAIN=localhost
JWT_SECRET=your_secret_key
```

### admin

```
NEXT_PUBLIC_API_URL=http://localhost:3201
```

### zam

```
NEXT_PUBLIC_API_URL=http://localhost:3201
# optional override when Host is not the tenant domain (e.g. local):
# NEXT_PUBLIC_TENANT_DOMAIN=tenant1.mn
```

## Run locally

```bash
# API
cd road && pnpm start

# Tenant ERP
cd zam && pnpm dev

# Platform admin
cd admin && npm run dev   # http://localhost:3002
```
