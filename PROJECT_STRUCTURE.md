# 📁 Complete Project Structure

```
thai-escrow-platform/
│
├── 📦 Root Configuration
│   ├── package.json              # Root workspace config
│   ├── pnpm-workspace.yaml       # pnpm workspace definition
│   ├── turbo.json                # TurboRepo pipeline config
│   ├── tsconfig.base.json        # Shared TypeScript config
│   ├── .prettierrc.json          # Code formatting rules
│   ├── .gitignore                # Git ignore rules
│   ├── .dockerignore             # Docker ignore rules
│   ├── .env.example              # Example environment variables
│   ├── .env.development          # Dev environment template
│   ├── .env                      # Local environment (gitignored)
│   ├── docker-compose.yml        # Container orchestration
│   ├── README.md                 # Main documentation
│   └── SETUP.md                  # Quick setup guide
│
├── 🎯 apps/
│   │
│   ├── 🔧 api/ (Fastify Backend)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── Dockerfile
│   │   │
│   │   ├── src/
│   │   │   ├── index.ts          # Server entry point
│   │   │   ├── worker.ts         # BullMQ background jobs
│   │   │   │
│   │   │   ├── lib/
│   │   │   │   ├── db.ts         # Prisma client
│   │   │   │   └── auth.ts       # JWT auth middleware
│   │   │   │
│   │   │   └── routes/
│   │   │       ├── auth.ts       # /api/v1/auth/*
│   │   │       ├── seller.ts     # /api/v1/seller/*
│   │   │       ├── deals.ts      # /api/v1/deals/*
│   │   │       ├── payments.ts   # /api/v1/payments/*
│   │   │       ├── disputes.ts   # /api/v1/disputes/*
│   │   │       └── admin.ts      # /api/v1/admin/*
│   │   │
│   │   └── prisma/
│   │       ├── schema.prisma     # Database schema
│   │       ├── seed.ts           # Demo data seeder
│   │       └── migrations/
│   │           └── 20240101000000_init/
│   │               └── migration.sql
│   │
│   └── 🌐 web/ (Next.js Frontend)
│       ├── package.json
│       ├── tsconfig.json
│       ├── next.config.js
│       ├── tailwind.config.ts
│       ├── postcss.config.js
│       ├── Dockerfile
│       │
│       └── src/
│           ├── app/              # Next.js 14 App Router
│           │   ├── layout.tsx    # Root layout
│           │   ├── page.tsx      # Landing page
│           │   ├── globals.css   # Tailwind styles
│           │   │
│           │   ├── auth/
│           │   │   └── login/
│           │   │       └── page.tsx    # Login page
│           │   │
│           │   ├── pay/
│           │   │   └── [token]/
│           │   │       └── page.tsx    # Payment page
│           │   │
│           │   ├── seller/
│           │   │   ├── dashboard/
│           │   │   └── kyc/
│           │   │
│           │   ├── buyer/
│           │   │   └── deals/
│           │   │
│           │   └── admin/
│           │       ├── dashboard/
│           │       └── disputes/
│           │
│           ├── components/
│           │   └── ui/           # shadcn/ui components
│           │       ├── button.tsx
│           │       ├── card.tsx
│           │       ├── badge.tsx
│           │       ├── input.tsx
│           │       ├── label.tsx
│           │       ├── toast.tsx
│           │       └── toaster.tsx
│           │
│           ├── lib/
│           │   └── utils.ts      # Shared utilities
│           │
│           └── hooks/
│               └── use-toast.ts  # Toast notifications
│
├── 📚 packages/
│   │
│   ├── 🧠 core/ (Shared Business Logic)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vitest.config.ts
│   │   │
│   │   └── src/
│   │       ├── index.ts
│   │       ├── types.ts          # Zod schemas + TS types
│   │       │
│   │       ├── state/
│   │       │   ├── escrowMachine.ts      # State transitions
│   │       │   └── escrowMachine.test.ts # Unit tests
│   │       │
│   │       └── utils/
│   │           └── reputation.ts         # Score calculation
│   │
│   └── 💳 payment/ (Payment Providers)
│       ├── package.json
│       ├── tsconfig.json
│       │
│       └── src/
│           ├── index.ts
│           ├── types.ts          # PaymentProvider interface
│           │
│           └── providers/
│               └── mock-promptpay.ts     # Mock implementation
│
└── 🐳 Docker Infrastructure
    ├── docker-compose.yml
    │   ├── postgres (PostgreSQL 16)
    │   ├── redis (Redis 7)
    │   ├── api (Fastify app)
    │   └── web (Next.js app)
    │
    └── Dockerfiles
        ├── apps/api/Dockerfile
        └── apps/web/Dockerfile
```

---

## 📊 Key Statistics

- **Total Lines of Code**: ~5,000+
- **API Endpoints**: 25+
- **Database Tables**: 8
- **React Components**: 15+
- **State Machine Transitions**: 8
- **Background Jobs**: 2 (auto-release, reputation)
- **Test Files**: 1 unit test suite (expandable)

---

## 🔄 Data Flow

```
┌──────────┐
│  Buyer   │
└────┬─────┘
     │
     │ 1. Opens paylink
     ├────────────────────────►┌──────────────┐
     │                          │   Next.js    │
     │                          │   Frontend   │
     │                          └──────┬───────┘
     │                                 │
     │ 2. Requests payment             │ 3. Create payment
     │                                 │
     │◄────────────────────────────────┤
     │    QR Code returned             │
     │                                 ▼
     │                          ┌──────────────┐
     │ 4. Mock payment          │   Fastify    │
     ├────────────────────────► │     API      │
     │                          └──────┬───────┘
     │                                 │
     │                          5. State machine
     │                          transition PENDING→HOLD
     │                                 │
     │                          ┌──────▼───────┐
     │                          │  PostgreSQL  │
     │                          │   (Prisma)   │
     │                          └──────────────┘
     │
     │                          ┌──────────────┐
     │ 6. Background job checks │    Redis     │
     │    auto-release          │   (BullMQ)   │
     │                          └──────────────┘
     │
     │ 7. Confirm receipt
     ├────────────────────────►
     │                          SHIPPED → RELEASED
     │
     │ 8. Funds released ✅
     └────────────────────────►┌──────────────┐
                                │   Seller     │
                                └──────────────┘
```

---

## 🎯 Core Files to Understand

### 1. State Machine
**File**: `packages/core/src/state/escrowMachine.ts`
**Purpose**: Enforces valid state transitions
**Key Function**: `transition(currentStatus, event) → { valid, newStatus, error }`

### 2. Payment Provider
**File**: `packages/payment/src/providers/mock-promptpay.ts`
**Purpose**: Mock PromptPay QR generation
**Interface**: `createCharge()`, `refund()`, `verifyWebhook()`

### 3. Database Schema
**File**: `apps/api/prisma/schema.prisma`
**Purpose**: Defines all tables, relations, indexes
**Key Models**: User, Deal, Payment, Dispute

### 4. API Routes
**Dir**: `apps/api/src/routes/`
**Files**: auth.ts, deals.ts, payments.ts, disputes.ts, admin.ts
**Pattern**: Fastify plugin per domain

### 5. Worker Jobs
**File**: `apps/api/src/worker.ts`
**Jobs**:
  - `auto_release`: Every 15 min, releases deals past 48h
  - `reputation_update`: Recalc seller score after each deal

### 6. Frontend Pages
**Dir**: `apps/web/src/app/`
**Key Pages**:
  - `page.tsx`: Landing (Thai copy)
  - `pay/[token]/page.tsx`: Payment flow
  - `auth/login/page.tsx`: Email OTP login

---

## 🔑 Configuration Files

| File | Purpose |
|------|---------|
| `turbo.json` | Defines build pipeline + caching |
| `pnpm-workspace.yaml` | Links apps/ and packages/ |
| `docker-compose.yml` | Orchestrates 4 services |
| `.env.example` | Template for environment vars |
| `tsconfig.base.json` | Shared TS compiler options |

---

## 🧪 Testing Strategy

### Unit Tests
- Location: `*.test.ts` files
- Runner: Vitest
- Coverage: State machine, utils

### E2E Tests
- Tool: Playwright (scaffolded, not implemented in MVP)
- Scenarios: Full user journeys

### Manual Testing
- Seed data: 4 deals across all states
- 3 users: buyer, seller, admin
- 1 open dispute with evidence

---

## 🚀 Deployment Architecture

```
┌─────────────────────────────────────────────┐
│            Load Balancer (Nginx)            │
└──────────┬──────────────────────┬───────────┘
           │                      │
    ┌──────▼──────┐        ┌──────▼──────┐
    │  Next.js    │        │  Next.js    │
    │  Instance 1 │        │  Instance 2 │
    └──────┬──────┘        └──────┬──────┘
           │                      │
           └──────────┬───────────┘
                      │
              ┌───────▼────────┐
              │  Fastify API   │
              │   + Worker     │
              └───────┬────────┘
                      │
         ┌────────────┼────────────┐
         │            │            │
    ┌────▼────┐  ┌────▼────┐  ┌───▼────┐
    │ Postgres│  │  Redis  │  │  S3    │
    │  (RDS)  │  │(ElastiC)│  │(Upload)│
    └─────────┘  └─────────┘  └────────┘
```

---

**For full documentation, see README.md**
