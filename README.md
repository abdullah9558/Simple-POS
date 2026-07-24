# POS System Demo

Electron desktop point-of-sale with offline-first multi-store support and optional cloud sync.

On first launch, a fresh database is populated with representative catalog, sales, inventory, and users. A default **Business** plus stores (Main + Downtown) are bootstrapped so inventory is store-scoped while products/categories/customers/suppliers stay shared within the business.

## Architecture

`Electron → IPC → Services → Repositories → SQLite → SyncQueue → HTTPS REST → cloud-api → PostgreSQL`

The desktop app never opens PostgreSQL. Checkout always writes to SQLite first.

## Demo accounts

Password for all: `Test@123`

- Admin: `admin@simplepos.com`
- Manager: `manager@simplepos.com`
- Cashier: `cashier@simplepos.com`

Sign in on the login screen when the desktop app starts.

## Run locally

```powershell
npm install
npm run dev
```

Header controls: **store switcher** and **Sync Now** status.

## Cloud API (optional)

```powershell
cd cloud-api
npm install
npm run dev
```

Set `CLOUD_API_BASE_URL=http://localhost:8787` so the Sync Queue can push. Without it, the POS stays fully local and pending mutations remain queued.

Postgres (for production cloud hosts): see `cloud-api/docker-compose.yml` and `cloud-api/.env.example`.

## Build

```powershell
npm run build
npm run build:all
```
