# Repository Tree

```
essy-monorepo/
├── .env.example                    # Environment variables template
├── .eslintrc.json                  # ESLint configuration
├── .gitignore                      # Git ignore rules
├── .prettierrc                     # Prettier configuration
├── package.json                    # Root package.json (pnpm workspace)
├── pnpm-workspace.yaml             # pnpm workspace configuration
├── README.md                       # Main documentation
├── REPOSITORY_TREE.md              # This file
├── turbo.json                      # TurboRepo configuration
│
├── apps/
│   ├── api/                        # Fastify REST API
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── .eslintrc.json
│   │   ├── vitest.config.ts        # Vitest configuration
│   │   ├── prisma/
│   │   │   └── schema.prisma        # Database schema
│   │   └── src/
│   │       ├── index.ts            # Fastify server entry
│   │       ├── config/
│   │       │   ├── database.ts     # Prisma client
│   │       │   ├── redis.ts        # Redis client
│   │       │   └── env.ts          # Environment validation
│   │       ├── middleware/
│   │       │   └── auth.ts         # JWT authentication
│   │       ├── routes/
│   │       │   ├── index.ts
│   │       │   ├── auth.ts         # LINE/Email OAuth
│   │       │   ├── seller.ts       # Seller profile & KYC
│   │       │   ├── deals.ts        # Deal CRUD & state transitions
│   │       │   ├── payments.ts     # Payment creation & webhooks
│   │       │   ├── disputes.ts     # Dispute management
│   │       │   └── admin.ts        # Admin endpoints
│   │       ├── utils/
│   │       │   ├── jwt.ts          # JWT helpers
│   │       │   ├── ulid.ts         # ULID generation
│   │       │   └── dealEvents.ts   # Audit logging
│   │       ├── workers/
│   │       │   └── index.ts        # BullMQ workers (auto-release, reputation)
│   │       ├── scripts/
│   │       │   └── seed.ts         # Database seeding
│   │       └── tests/
│   │           └── escrowMachine.test.ts
│   │
│   └── web/                        # Next.js 14 App Router
│       ├── package.json
│       ├── tsconfig.json
│       ├── next.config.js
│       ├── tailwind.config.ts
│       ├── postcss.config.js
│       ├── playwright.config.ts
│       ├── .eslintrc.json
│       ├── src/
│       │   ├── app/
│       │   │   ├── layout.tsx      # Root layout
│       │   │   ├── page.tsx        # Landing page
│       │   │   ├── globals.css     # Global styles
│       │   │   ├── pay/
│       │   │   │   └── [token]/
│       │   │   │       └── page.tsx # Public paylink page
│       │   │   ├── seller/
│       │   │   │   ├── dashboard/
│       │   │   │   │   └── page.tsx # Seller dashboard
│       │   │   │   └── deal/
│       │   │   │       └── new/
│       │   │   │           └── page.tsx # Create paylink
│       │   │   ├── buyer/
│       │   │   │   └── deals/
│       │   │   │       └── page.tsx # Buyer deals list
│       │   │   └── admin/
│       │   │       └── disputes/
│       │   │           └── page.tsx # Admin dispute management
│       │   ├── components/
│       │   │   ├── ui/
│       │   │   │   ├── button.tsx
│       │   │   │   ├── card.tsx
│       │   │   │   ├── badge.tsx
│       │   │   │   ├── input.tsx
│       │   │   │   └── textarea.tsx
│       │   │   └── StatusBadge.tsx # Deal status badge (Thai)
│       │   └── lib/
│       │       ├── utils.ts        # Utility functions
│       │       └── api.ts          # API client
│       └── tests/
│           └── e2e/
│               └── basic-flow.spec.ts
│
├── packages/
│   ├── core/                       # Shared core types & state machine
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── types.ts            # TypeScript types
│   │       └── state/
│   │           └── escrowMachine.ts # Escrow state machine
│   │
│   ├── payment/                    # Payment provider abstraction
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── types.ts
│   │       ├── PaymentProvider.ts  # Interface
│   │       └── MockPromptPayProvider.ts # Mock implementation
│   │
│   └── ui/                         # Shared UI components (placeholder)
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           └── index.ts
│
└── infra/
    ├── docker-compose.yml          # Docker Compose configuration
    ├── Dockerfile.api              # API Dockerfile
    └── Dockerfile.web              # Web Dockerfile
```

## Key Files Summary

### Backend (apps/api)
- **schema.prisma**: Complete database schema with all tables
- **routes/**: All REST API endpoints (auth, deals, payments, disputes, admin, seller)
- **workers/index.ts**: BullMQ workers for auto-release and reputation
- **scripts/seed.ts**: Seed script with demo data

### Frontend (apps/web)
- **app/page.tsx**: Landing page with Thai copy
- **app/pay/[token]/page.tsx**: Public paylink page with QR code
- **app/seller/**: Seller dashboard and deal creation
- **app/buyer/**: Buyer deals and dispute management
- **app/admin/**: Admin dispute resolution

### Core Packages
- **packages/core**: Escrow state machine and shared types
- **packages/payment**: PaymentProvider interface + MockPromptPayProvider

### Infrastructure
- **infra/docker-compose.yml**: Full stack Docker setup
- **.env.example**: All required environment variables

## Database Tables

1. **users** - User accounts (buyer/seller/admin)
2. **seller_profiles** - Seller verification & reputation
3. **deals** - Escrow transactions
4. **payments** - Payment records
5. **disputes** - Dispute cases
6. **evidence** - Dispute evidence uploads
7. **reputation_events** - Seller reputation tracking
8. **deal_events** - Audit trail for state changes

## API Endpoints

All endpoints are prefixed with `/api/v1`:

- **Auth**: `/auth/line/callback`, `/auth/email/*`
- **Deals**: `/deals`, `/deals/:id/*`
- **Payments**: `/payments/create`, `/payments/webhook/mock`
- **Disputes**: `/disputes/:dealId/open`, `/disputes/:id/*`
- **Seller**: `/seller/me`, `/seller/verify/*`
- **Admin**: `/admin/deals`, `/admin/disputes`
