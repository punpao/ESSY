# Repository Structure

```
/
├── apps/
│   ├── api/                          # Fastify REST API
│   │   ├── prisma/
│   │   │   └── schema.prisma         # Database schema
│   │   ├── src/
│   │   │   ├── index.ts              # Server entry point
│   │   │   ├── config.ts             # Configuration
│   │   │   ├── db.ts                 # Prisma client
│   │   │   ├── auth.ts               # Auth middleware
│   │   │   ├── queue.ts              # BullMQ workers
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts           # Auth endpoints
│   │   │   │   ├── seller.ts         # Seller/KYC endpoints
│   │   │   │   ├── deals.ts          # Deal management
│   │   │   │   ├── payments.ts       # Payment processing
│   │   │   │   ├── disputes.ts       # Dispute handling
│   │   │   │   └── admin.ts          # Admin endpoints
│   │   │   ├── scripts/
│   │   │   │   └── seed.ts           # Seed script
│   │   │   └── __tests__/
│   │   │       └── escrowMachine.test.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                           # Next.js 14 App Router
│       ├── src/
│       │   ├── app/
│       │   │   ├── layout.tsx         # Root layout
│       │   │   ├── page.tsx           # Landing page
│       │   │   ├── globals.css        # Global styles
│       │   │   ├── pay/[token]/       # Paylink page
│       │   │   ├── seller/
│       │   │   │   ├── dashboard/     # Seller dashboard
│       │   │   │   ├── deal/new/      # Create deal
│       │   │   │   └── kyc/           # KYC verification
│       │   │   ├── buyer/
│       │   │   │   ├── deals/         # Buyer deals list
│       │   │   │   └── dispute/[id]/  # Dispute page
│       │   │   └── admin/
│       │   │       └── disputes/      # Admin dispute queue
│       │   ├── components/
│       │   │   ├── ui/                # shadcn/ui components
│       │   │   │   ├── button.tsx
│       │   │   │   ├── card.tsx
│       │   │   │   └── badge.tsx
│       │   │   └── StatusBadge.tsx    # Deal status badge
│       │   └── lib/
│       │       └── utils.ts            # Utilities
│       ├── e2e/
│       │   └── escrow-flow.spec.ts    # E2E tests
│       ├── package.json
│       ├── next.config.js
│       ├── tailwind.config.ts
│       └── tsconfig.json
│
├── packages/
│   ├── core/                          # Shared core logic
│   │   ├── src/
│   │   │   ├── types.ts               # TypeScript types
│   │   │   ├── state/
│   │   │   │   └── escrowMachine.ts   # State machine
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── payment/                       # Payment provider abstraction
│   │   ├── src/
│   │   │   ├── PaymentProvider.ts     # Interface
│   │   │   ├── MockPromptPayProvider.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── ui/                            # Shared UI (placeholder)
│       ├── src/
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── infra/
│   ├── docker-compose.yml             # Docker Compose setup
│   ├── Dockerfile.api                 # API Dockerfile
│   └── Dockerfile.web                 # Web Dockerfile
│
├── .env.example                       # Environment template
├── .gitignore
├── .prettierrc
├── .eslintrc.json
├── package.json                       # Root package.json
├── pnpm-workspace.yaml                # pnpm workspace config
├── turbo.json                         # TurboRepo config
├── tsconfig.json                      # Root TypeScript config
├── README.md                          # Main documentation
└── REPOSITORY_STRUCTURE.md            # This file
```

## Key Files

### Backend (API)
- `apps/api/prisma/schema.prisma` - Complete database schema
- `apps/api/src/index.ts` - Fastify server setup
- `apps/api/src/routes/*.ts` - All REST API endpoints
- `apps/api/src/queue.ts` - Background workers (auto-release, reputation)
- `apps/api/src/scripts/seed.ts` - Demo data seeding

### Frontend (Web)
- `apps/web/src/app/page.tsx` - Landing page (Thai-first)
- `apps/web/src/app/pay/[token]/page.tsx` - Paylink page with QR
- `apps/web/src/app/seller/*` - Seller dashboard, create deal, KYC
- `apps/web/src/app/buyer/*` - Buyer deals, disputes
- `apps/web/src/app/admin/*` - Admin dispute management

### Core Packages
- `packages/core/src/state/escrowMachine.ts` - Pure state machine
- `packages/payment/src/MockPromptPayProvider.ts` - Mock payment provider

### Infrastructure
- `infra/docker-compose.yml` - Full stack Docker setup
- `.env.example` - All required environment variables

## Database Tables

1. **users** - User accounts (buyer/seller/admin)
2. **seller_profiles** - Seller verification & reputation
3. **deals** - Escrow deals with state machine
4. **payments** - Payment records
5. **disputes** - Dispute cases
6. **evidence** - Dispute evidence (images/chatlogs)
7. **reputation_events** - Seller reputation tracking

## API Routes Summary

- `/api/v1/auth/*` - Authentication (LINE, email OTP)
- `/api/v1/seller/*` - Seller profile & KYC
- `/api/v1/deals/*` - Deal CRUD, ship, confirm, cancel
- `/api/v1/payments/*` - Create charge, webhook, refund
- `/api/v1/disputes/*` - Open dispute, add evidence, resolve
- `/api/v1/admin/*` - Admin management endpoints

## State Machine Flow

```
PENDING → [PAYMENT_RECEIVED] → HOLD → [SHIPPED] → SHIPPED → [BUYER_CONFIRMED] → RELEASED
                                                              ↓
                                                          [AUTO_RELEASE_TRIGGERED]
                                                              ↓
                                                          RELEASED

HOLD → [DISPUTE_OPENED] → DISPUTE → [ADMIN_RESOLVED_REFUND] → REFUND
                                    [ADMIN_RESOLVED_RELEASE] → RELEASED
```
