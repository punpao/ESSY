# Architecture Overview - Thai Escrow MVP

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│  Seller Dashboard  │  Buyer Portal  │  Admin Panel  │  Payment  │
│  (LINE/FB share)   │  (My Deals)    │  (Triage)     │  Page     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS 14 APP ROUTER                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  app/seller  │  │  app/buyer   │  │  app/admin   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           API Client (src/lib/api.ts)                     │   │
│  │           JWT Token in localStorage                       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTP/REST
┌─────────────────────────────────────────────────────────────────┐
│                      FASTIFY API SERVER                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  JWT Auth Middleware (@fastify/jwt)                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  /auth   │  │  /deals  │  │ /payment │  │ /dispute │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│  ┌──────────┐  ┌──────────┐                                     │
│  │ /seller  │  │  /admin  │                                     │
│  └──────────┘  └──────────┘                                     │
└─────────────────────────────────────────────────────────────────┘
         │                │                │
         ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   PRISMA ORM │  │   BULLMQ     │  │   PAYMENT    │
│              │  │   WORKER     │  │   PROVIDER   │
│  State       │  │              │  │              │
│  Machine     │  │  Auto-Release│  │  Mock QR     │
│  Guards      │  │  Job (15min) │  │  Generator   │
└──────────────┘  └──────────────┘  └──────────────┘
         │                │                │
         ▼                ▼                │
┌──────────────┐  ┌──────────────┐        │
│  POSTGRESQL  │  │    REDIS     │        │
│              │  │              │        │
│  8 Tables    │  │  Job Queue   │        │
│  Relations   │  │  Cache       │        │
└──────────────┘  └──────────────┘        │
                                           ▼
                                   ┌──────────────┐
                                   │  EXTERNAL    │
                                   │  PSP         │
                                   │  (Future)    │
                                   └──────────────┘
```

---

## 📊 Data Flow: Create Deal → Payment → Release

### 1. Seller Creates Deal

```
Seller → Web UI → POST /api/v1/deals
                     │
                     ├─ Generate ULID (deal.id)
                     ├─ Generate paylink_token (pl_xxx)
                     ├─ Set status: PENDING
                     ├─ Create Deal record
                     └─ Create DealEvent (audit)
                     │
                     ▼
                 Return paylink URL
                 (e.g., /pay/pl_01h...)
```

### 2. Buyer Pays via PromptPay

```
Buyer → /pay/:token → GET deal by token
                         │
                         ▼
                     POST /api/v1/payments/create
                         │
                         ├─ Get seller PromptPay ID
                         ├─ Call MockPromptPayProvider.createCharge()
                         ├─ Generate QR data URL
                         └─ Create Payment record (status: INIT)
                         │
                         ▼
                     Display QR code
                         │
                         ▼ (User scans + pays in bank app)
                         │
                     POST /api/v1/payments/webhook/mock
                         │
                         ├─ Verify webhook signature
                         ├─ Update Payment (status: PAID)
                         ├─ State Machine: PENDING → HOLD
                         ├─ Set Deal.buyer_id
                         └─ Create DealEvent
```

### 3. Seller Ships

```
Seller → POST /api/v1/deals/:id/ship
            │
            ├─ Validate: status === HOLD
            ├─ State Machine: HOLD → SHIPPED
            ├─ Set tracking_number, courier
            ├─ Mock delivered_at = now + 3 days
            ├─ Calculate auto_release_at = delivered_at + 48h
            └─ Create DealEvent
```

### 4. Auto-Release or Manual Confirm

```
Option A: Auto-Release (BullMQ Worker)
    │
    ├─ Every 15 min: check deals where auto_release_at < now
    ├─ Guard: no open disputes
    ├─ State Machine: SHIPPED → RELEASED
    ├─ Update Deal status
    ├─ Create DealEvent
    └─ Update seller reputation (+1)

Option B: Buyer Confirms
    │
    ├─ POST /api/v1/deals/:id/confirm
    ├─ Validate: buyer_id matches, status === SHIPPED
    ├─ State Machine: SHIPPED → RELEASED
    ├─ Update Deal status
    ├─ Create DealEvent
    └─ Update seller reputation (+1)
```

### 5. Alternative: Dispute

```
Buyer → POST /api/v1/disputes/:dealId/open
           │
           ├─ Validate: status in [HOLD, SHIPPED]
           ├─ State Machine: current → DISPUTE
           ├─ Create Dispute record
           └─ Create DealEvent
           │
           ▼
Admin → POST /api/v1/disputes/:id/resolve
           │
           ├─ Choose: RESOLVED_REFUND or RESOLVED_RELEASE
           ├─ State Machine: DISPUTE → REFUND/RELEASED
           ├─ Update Dispute (resolved_at)
           ├─ Update Deal status
           ├─ If REFUND: call PaymentProvider.refund()
           └─ Update seller reputation (negative if refund)
```

---

## 🔐 Authentication Flow

```
┌─────────────┐
│   Browser   │
└─────────────┘
       │
       ▼ POST /api/v1/auth/email/request
┌─────────────┐
│  API Server │──> Generate 6-digit OTP
└─────────────┘──> Hash with bcrypt
       │         ──> Store in Redis (10 min TTL)
       │         ──> Log to console (dev mode)
       ▼
┌─────────────┐
│   Browser   │──> User enters OTP
└─────────────┘
       │
       ▼ POST /api/v1/auth/email/verify
┌─────────────┐
│  API Server │──> Verify bcrypt hash
└─────────────┘──> Delete OTP from Redis
       │         ──> Find or create User
       │         ──> Generate JWT token
       ▼
┌─────────────┐
│   Browser   │──> Store token in localStorage
└─────────────┘──> Include in Authorization header
       │
       ▼ All subsequent requests
┌─────────────┐
│  API Server │──> @fastify/jwt.verify()
└─────────────┘──> Decode user from token
       │         ──> Check role for authorization
       ▼
┌─────────────┐
│   Protected │
│   Resource  │
└─────────────┘
```

---

## 🎯 State Machine Diagram

```
                    ┌─────────────┐
                    │   PENDING   │ (Seller created deal)
                    └─────────────┘
                           │
                           │ PAYMENT_RECEIVED
                           │ (guard: hasPayment + hasBuyer)
                           ▼
                    ┌─────────────┐
            ┌──────▶│    HOLD     │◀──────┐
            │       └─────────────┘       │
            │              │              │
            │              │ ADD_TRACKING │
   OPEN_DISPUTE           │              │
            │              ▼              │
            │       ┌─────────────┐      │
            └───────│   SHIPPED   │      │
                    └─────────────┘      │
                           │             │
                           │ CONFIRM_RECEIVED
                           │ or AUTO_RELEASE   OPEN_DISPUTE
                           │                   │
                           ▼                   │
                    ┌─────────────┐            │
                    │  RELEASED   │            │
                    └─────────────┘            │
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │   DISPUTE   │
                                        └─────────────┘
                                               │
                                   ┌───────────┴───────────┐
                                   │                       │
                         RESOLVE_REFUND          RESOLVE_RELEASE
                             (admin)                 (admin)
                                   │                       │
                                   ▼                       ▼
                            ┌─────────────┐       ┌─────────────┐
                            │   REFUND    │       │  RELEASED   │
                            └─────────────┘       └─────────────┘

Terminal States: RELEASED, REFUND, CANCELLED
```

---

## 📦 Package Dependencies

```
thai-escrow-mvp (root)
│
├── apps/api
│   ├── @thai-escrow/core ────────┐
│   ├── @thai-escrow/payment ─────┤
│   ├── @prisma/client            │
│   ├── fastify                    │
│   ├── bullmq                     │
│   ├── ioredis                    │
│   └── zod                        │
│                                  │
├── apps/web                       │
│   ├── @thai-escrow/core ◀───────┤ (workspace:*)
│   ├── @thai-escrow/ui ◀─────────┤
│   ├── next                       │
│   └── tailwindcss                │
│                                  │
├── packages/core                  │
│   ├── ulid                       │
│   └── zod                        │
│                                  │
├── packages/payment ◀─────────────┘
│   ├── @thai-escrow/core
│   └── qrcode
│
└── packages/ui
    └── tailwind-merge
```

---

## 🚀 Deployment Architecture (Future)

```
┌─────────────────────────────────────────────────────────────┐
│                       CLOUDFLARE                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  CDN + DDoS Protection + SSL                          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
┌─────────────────────────┐   ┌─────────────────────────┐
│   VERCEL (Next.js)      │   │   RAILWAY/FLY.IO (API)  │
│   - Auto-scaling        │   │   - Docker container     │
│   - Edge functions      │   │   - Auto-restart         │
│   - Image optimization  │   │   - Health checks        │
└─────────────────────────┘   └─────────────────────────┘
                                            │
                ┌───────────────────────────┼───────────────────┐
                │                           │                   │
                ▼                           ▼                   ▼
┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────┐
│  SUPABASE (Postgres)│   │  UPSTASH (Redis)    │   │  OPENMISE (PSP)  │
│  - Managed DB       │   │  - Serverless Redis │   │  - PromptPay    │
│  - Auto backups     │   │  - Global edge      │   │  - QR webhook   │
└─────────────────────┘   └─────────────────────┘   └─────────────────┘
```

---

## 🔄 CI/CD Pipeline (Future)

```
┌─────────────┐
│  GitHub PR  │
└─────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│              GitHub Actions Workflow                     │
├─────────────────────────────────────────────────────────┤
│  1. Install dependencies (pnpm install)                  │
│  2. Type check (turbo run lint)                          │
│  3. Unit tests (turbo run test)                          │
│  4. Build packages (turbo run build)                     │
│  5. E2E tests (Playwright)                               │
│  6. Database migrations check (prisma migrate diff)      │
└─────────────────────────────────────────────────────────┘
       │
       ▼ (if main branch)
┌─────────────────────────────────────────────────────────┐
│              Deployment                                  │
├─────────────────────────────────────────────────────────┤
│  1. Deploy API → Railway/Fly.io (Docker)                │
│  2. Run migrations (prisma migrate deploy)               │
│  3. Deploy Web → Vercel (auto)                           │
│  4. Smoke tests                                          │
│  5. Notify Slack                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema Diagram

```
┌─────────────┐
│    User     │
│─────────────│
│ id (PK)     │
│ role        │───┐
│ email       │   │
│ line_sub    │   │
│ kyc_level   │   │
└─────────────┘   │
       │          │
       │          │
       ▼          │
┌─────────────────┐        ┌─────────────┐
│ SellerProfile   │        │    Deal     │
│─────────────────│        │─────────────│
│ id (PK)         │◀───┐   │ id (PK)     │
│ user_id (FK)    │    │   │ seller_id   │───┐
│ verified        │    │   │ buyer_id    │───┤
│ promptpay_id    │    │   │ status      │   │
│ reputation_score│    │   │ paylink_token│  │
└─────────────────┘    │   │ tracking_no │   │
       │               │   └─────────────┘   │
       │               │          │          │
       ▼               │          │          │
┌─────────────────┐   │          │          │
│ ReputationEvent │   │          │          │
│─────────────────│   │          │          │
│ seller_id (FK)  │───┘          │          │
│ type            │              │          │
│ weight          │              ▼          │
└─────────────────┘       ┌─────────────┐   │
                          │   Payment   │   │
                          │─────────────│   │
                          │ deal_id (FK)│───┘
                          │ provider    │
                          │ status      │
                          └─────────────┘
                                 │
                                 │
                          ┌─────────────┐
                          │  Dispute    │
                          │─────────────│
                          │ deal_id (FK)│───┐
                          │ opened_by   │───┤
                          │ status      │   │
                          └─────────────┘   │
                                 │          │
                                 ▼          │
                          ┌─────────────┐   │
                          │  Evidence   │   │
                          │─────────────│   │
                          │ dispute_id  │───┘
                          │ uploaded_by │───┘
                          │ kind        │
                          │ url         │
                          └─────────────┘
```

---

## 🔧 Monorepo Build Order (TurboRepo)

```
1. packages/core        (no dependencies)
   ├─ types.ts
   ├─ state/escrowMachine.ts
   └─ helpers.ts

2. packages/payment     (depends on: core)
   └─ providers/MockPromptPayProvider.ts

3. packages/ui          (depends on: core)
   └─ lib/utils.ts

4. apps/api             (depends on: core, payment)
   └─ All API routes

5. apps/web             (depends on: core, ui)
   └─ All Next.js pages
```

---

This architecture is designed for:
- ✅ **Fast iteration** (TurboRepo caching)
- ✅ **Type safety** (shared packages)
- ✅ **Horizontal scaling** (stateless API)
- ✅ **Easy deployment** (Docker + cloud-native)
- ✅ **Future extensibility** (plugin architecture for payments)
