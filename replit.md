# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Mobile**: Expo Router (Expo Go compatible)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── mobile/             # Expo React Native app (Hub Marketplace)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts
├── pnpm-workspace.yaml     # pnpm workspace
├── tsconfig.base.json      # Shared TS options
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## Hub Marketplace App Features

- **Authentication**: Register/Login with email and password (JWT-based, stored in AsyncStorage)
- **Dashboard**: Stats overview (products, stock, low stock, synced platforms)
- **Inventory**: Product management with full CRUD, search, stock badges
- **Sync**: Synchronize products with Mercado Livre, Shopee, and Amazon
- **Profile**: User account info, connected platforms, logout

## Database Schema

- `users` - User accounts (id, email, name, passwordHash, createdAt)
- `products` - Product catalog (id, userId, name, sku, price, stockQuantity, category, mercadoLivreId, shopeeId, amazonId, ...)
- `sync_logs` - Marketplace sync history (id, userId, platform, status, message, syncedAt)

## API Routes

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login
- `GET /api/products?userId=` - List user products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/products/dashboard?userId=` - Dashboard stats
- `POST /api/sync` - Sync with a marketplace platform
- `GET /api/sync/logs?userId=` - Sync history

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server with routes for auth, products, and sync.

### `artifacts/mobile` (`@workspace/mobile`)

Expo React Native app. Hub Marketplace with:
- Dark theme with electric blue accents
- 4-tab navigation (Dashboard, Inventory, Sync, Profile)
- Auth flow (Welcome, Login, Register)
- Product CRUD modal screen

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL.

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec + Orval codegen config.

Run codegen: `pnpm --filter @workspace/api-spec run codegen`
