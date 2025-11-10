# Repository Structure

## Monorepo Overview

```
/
├── apps/
│   ├── api/                    # Fastify Backend API
│   │   ├── prisma/
│   │   │   └── schema.prisma   # Database schema
│   │   ├── src/
│   │   │   ├── index.ts        # Fastify server entry
│   │   │   ├── lib/
│   │   │   │   ├── prisma.ts   # Prisma client
│   │   │   │   └── auth.ts     # Auth helpers
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts     # Auth endpoints
│   │   │   │   ├── seller.ts   # Seller/KYC endpoints
│   │   │   │   ├── deals.ts    # Deal management
│   │   │   │   ├── payments.ts # Payment processing
│   │   │   │   ├── disputes.ts # Dispute handling
│   │   │   │   └── admin.ts    # Admin endpoints
│   │   │   ├── workers/
│   │   │   │   └── index.ts    # BullMQ workers
│   │   │   ├── scripts/
│   │   │   │   └── seed.ts     # Seed script
│   │   │   └── test/
│   │   │       └── escrowMachine.test.ts
│   │   └── package.json
│   │
│   └── web/                    # Next.js Frontend
│       ├── src/
│       │   ├── app/            # Next.js App Router
│       │   │   ├── page.tsx    # Landing page
│       │   │   ├── pay/[token]/page.tsx
│       │   │   ├── seller/
│       │   │   │   ├── dashboard/page.tsx
│       │   │   │   ├── deal/new/page.tsx
│       │   │   │   └── kyc/page.tsx
│       │   │   ├── buyer/
│       │   │   │   ├── deals/page.tsx
│       │   │   │   └── dispute/[id]/page.tsx
│       │   │   └── admin/
│       │   │       ├── disputes/page.tsx
│       │   │       └── deals/page.tsx
│       │   ├── components/
│       │   │   ├── ui/         # shadcn/ui components
│       │   │   └── StatusBadge.tsx
│       │   └── lib/
│       │       ├── api.ts      # API client
│       │       └── utils.ts   # Utilities
│       ├── e2e/
│       │   └── basic-flow.spec.ts
│       └── package.json
│
├── packages/
│   ├── core/                   # Shared core types & logic
│   │   ├── src/
│   │   │   ├── types/
│   │   │   │   └── index.ts   # TypeScript types
│   │   │   ├── state/
│   │   │   │   └── escrowMachine.ts  # State machine
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── payment/                # Payment provider abstraction
│       ├── src/
│       │   ├── PaymentProvider.ts
│       │   ├── providers/
│       │   │   └── MockPromptPayProvider.ts
│       │   ├── types.ts
│       │   └── index.ts
│       └── package.json
│
├── infra/
│   ├── docker-compose.yml      # Docker setup
│   ├── Dockerfile.api
│   └── Dockerfile.web
│
├── package.json               # Root workspace config
├── pnpm-workspace.yaml
├── turbo.json
├── .env.example
└── README.md
```

## Key Files

### Backend (API)

1. **Prisma Schema** (`apps/api/prisma/schema.prisma`)
   - Complete database schema with all tables
   - Enums for statuses and types
   - Relationships and indexes

2. **State Machine** (`packages/core/src/state/escrowMachine.ts`)
   - Escrow state transitions
   - Validation functions
   - Exhaustive guards

3. **API Routes** (`apps/api/src/routes/`)
   - Auth: LINE OAuth, Email OTP
   - Seller: Profile, KYC verification
   - Deals: Create, ship, confirm, cancel
   - Payments: Create charge, webhook, refund
   - Disputes: Open, add evidence, resolve
   - Admin: List deals/disputes, force actions

4. **Workers** (`apps/api/src/workers/index.ts`)
   - Auto-release worker (checks every 15 min)
   - Reputation calculation worker

### Frontend (Web)

1. **Pages** (`apps/web/src/app/`)
   - Landing page with Thai copy
   - Paylink page with QR code display
   - Seller dashboard and deal creation
   - Buyer deals list and dispute flow
   - Admin panels

2. **Components** (`apps/web/src/components/`)
   - shadcn/ui components (Button, Card, Badge, etc.)
   - StatusBadge for deal status display

3. **API Client** (`apps/web/src/lib/api.ts`)
   - Typed API client functions
   - Token management

### Shared Packages

1. **Core** (`packages/core/`)
   - TypeScript types for all entities
   - Escrow state machine logic

2. **Payment** (`packages/payment/`)
   - PaymentProvider interface
   - MockPromptPayProvider implementation
   - Ready for real PSP integration

## Database Tables

- `User` - Users (buyer/seller/admin)
- `SellerProfile` - Seller profiles with KYC
- `Deal` - Escrow deals
- `Payment` - Payment records
- `Dispute` - Disputes
- `Evidence` - Dispute evidence
- `ReputationEvent` - Reputation tracking
- `DealEvent` - Audit trail

## Environment Variables

See `.env.example` for all required variables:
- `DATABASE_URL` - PostgreSQL connection
- `REDIS_URL` - Redis connection
- `JWT_SECRET` - JWT signing secret
- `APP_BASE_URL` - Base URL for paylinks
- `AUTO_RELEASE_HOURS` - Auto-release timeout (default: 48)

## Quick Start Commands

```bash
# Install dependencies
pnpm install

# Setup database
pnpm db:migrate
pnpm db:seed

# Run development servers
pnpm dev

# Run tests
pnpm test
pnpm test:e2e

# Docker
docker compose -f infra/docker-compose.yml up -d
```
