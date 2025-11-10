# 🛡️ Thai Escrow Platform - MVP

> **Thailand-focused Social Commerce Escrow Platform**  
> Solving second-hand marketplace fraud on Facebook, Instagram, and LINE with PromptPay-first escrow, Thai UX, and fast local dispute resolution.

---

## 📖 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Core Flows](#core-flows)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Security & Compliance](#security--compliance)
- [Roadmap](#roadmap)
- [License](#license)

---

## 🎯 Overview

### The Problem

Thai buyers and sellers on social platforms (Facebook Marketplace, Instagram Shops, LINE Shopping) face **trust issues**:
- No buyer protection - money sent before receiving goods
- Seller fraud - goods don't match description or never arrive
- PayPal is not Thai-friendly (high fees, bank account requirements, English-only)

### The Solution

**Thai Escrow Platform** provides:

✅ **PromptPay-first escrow** - Money is held until buyer confirms receipt  
✅ **Social chat paylinks** - Share payment links in any chat app  
✅ **Thai language UX** - Native Thai interface and support  
✅ **Fast local dispute resolution** - 24-72h SLA with Thai-speaking team  
✅ **Verified Seller system** - KYC + Reputation scores  
✅ **Auto-release protection** - Funds released automatically after 48h if no issues

---

## ✨ Key Features

### For Buyers
- 💰 **Money held safely** until you confirm receipt
- 📱 **Pay via PromptPay QR** - Works with all Thai banks
- 🔍 **Verified Seller badges** - Know who you're buying from
- ⚖️ **Easy dispute process** - Thai language, local team
- ⏱️ **Auto-protection** - Refund if seller doesn't ship

### For Sellers
- 🚀 **Create paylinks in seconds** - Share anywhere
- ✅ **Verified Seller status** - Build trust & reputation
- 📦 **Tracking integration** - Auto-updates on delivery
- 💵 **Fast payouts** - 48h auto-release after delivery
- 📊 **Reputation system** - Grow your seller score

### For Platform
- 🔐 **Secure state machine** - No manual money handling
- 🤖 **Auto-release worker** - BullMQ background jobs
- 📈 **Dispute management** - Admin dashboard with SLA tracking
- 🏛️ **Audit trail** - Full event log for compliance

---

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Thai Escrow Platform                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────┐      ┌──────────┐      ┌──────────────┐     │
│  │  Next.js  │─────▶│ Fastify  │─────▶│ PostgreSQL   │     │
│  │  Frontend │      │   API    │      │   Database   │     │
│  └───────────┘      └──────────┘      └──────────────┘     │
│                           │                                   │
│                           ├────────▶ Redis (BullMQ)          │
│                           │                                   │
│                           └────────▶ MockPromptPay Provider  │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Background Workers                                   │   │
│  │  • Auto-release checker (every 15 min)             │   │
│  │  • Reputation calculator                            │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Escrow State Machine

```
PENDING ──[Pay]──▶ HOLD ──[Ship]──▶ SHIPPED ──[Confirm/Auto]──▶ RELEASED
   │                │                   │
   │                └──────[Dispute]────┴──────▶ DISPUTE
   │                                                 │
   └──[Cancel]──▶ (deleted)                         ├──[Admin Resolve]──▶ REFUND
                                                     └──[Admin Resolve]──▶ RELEASED
```

---

## 🛠️ Tech Stack

### Monorepo
- **pnpm** - Fast, disk space efficient package manager
- **TurboRepo** - High-performance build system

### Backend
- **Node.js 18+** - Runtime
- **Fastify** - Fast, low-overhead web framework
- **TypeScript** - Type safety
- **Prisma ORM** - Database toolkit
- **PostgreSQL 15** - Primary database
- **BullMQ** - Redis-based job queue
- **Redis** - Cache & queue storage

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **shadcn/ui** - Accessible component library
- **Lucide Icons** - Icon set

### Payments
- **Mock PromptPay** - QR code generation (demo)
- **Payment Provider Abstraction** - Ready for Omise, GB PrimePay, Xendit

### Auth
- **JWT** - Token-based authentication
- **LINE Login OAuth2** - Primary (mock in demo)
- **Email OTP** - Magic link fallback

### DevOps
- **Docker Compose** - Local development
- **Vitest** - Unit testing
- **Playwright** - E2E testing

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+**
- **pnpm 8+** (`npm install -g pnpm`)
- **Docker & Docker Compose** (optional but recommended)
- **PostgreSQL 15** (if not using Docker)
- **Redis 7** (if not using Docker)

### Quick Start (Docker - Recommended)

```bash
# 1. Clone repository
git clone <repo-url>
cd thai-escrow-platform

# 2. Copy environment file
cp .env.example .env

# 3. Install dependencies
pnpm install

# 4. Start Docker services (Postgres + Redis + API + Web + Worker)
docker compose up -d

# 5. Run migrations
pnpm db:migrate

# 6. Seed demo data
pnpm db:seed

# 7. Open browser
# Frontend: http://localhost:3000
# API: http://localhost:4000
# API Health: http://localhost:4000/health
```

### Manual Start (Without Docker)

```bash
# 1. Install dependencies
pnpm install

# 2. Start PostgreSQL and Redis locally
# Make sure they're running on default ports

# 3. Set up environment
cp .env.example .env
# Edit .env with your database credentials

# 4. Run migrations
pnpm db:migrate

# 5. Seed data
pnpm db:seed

# 6. Start all services
pnpm dev

# Frontend will be on http://localhost:3000
# API will be on http://localhost:4000
```

### Using Makefile

```bash
make install      # Install dependencies
make docker-up    # Start Docker services
make db-migrate   # Run migrations
make db-seed      # Seed database
make dev          # Start dev servers
make test         # Run tests
make clean        # Clean build artifacts
```

---

## 📁 Project Structure

```
thai-escrow-platform/
├── apps/
│   ├── api/                    # Fastify REST API
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Database schema
│   │   │   └── seed.ts         # Seed data
│   │   └── src/
│   │       ├── index.ts        # Main server
│   │       ├── routes/         # API endpoints
│   │       │   ├── auth.ts     # Authentication
│   │       │   ├── deals.ts    # Deal management
│   │       │   ├── payments.ts # Payment & webhooks
│   │       │   ├── disputes.ts # Dispute handling
│   │       │   ├── seller.ts   # Seller & KYC
│   │       │   └── admin.ts    # Admin endpoints
│   │       ├── workers/
│   │       │   └── auto-release.ts  # BullMQ worker
│   │       └── lib/
│   │           ├── prisma.ts   # DB client
│   │           ├── jwt.ts      # Auth helpers
│   │           └── payment.ts  # Payment provider
│   │
│   └── web/                    # Next.js frontend
│       └── src/
│           ├── app/
│           │   ├── page.tsx               # Landing page
│           │   ├── pay/[token]/page.tsx   # Payment page
│           │   ├── seller/
│           │   │   ├── dashboard/page.tsx # Seller dashboard
│           │   │   ├── deal/new/page.tsx  # Create deal
│           │   │   └── kyc/page.tsx       # KYC verification
│           │   ├── buyer/
│           │   │   └── deals/page.tsx     # Buyer deals list
│           │   └── admin/
│           │       └── disputes/page.tsx  # Admin dispute queue
│           └── lib/
│               └── api.ts      # API client
│
├── packages/
│   ├── core/                   # Shared business logic
│   │   └── src/
│   │       ├── types.ts        # TypeScript types & Zod schemas
│   │       └── state/
│   │           └── escrowMachine.ts  # State machine
│   │
│   ├── payment/                # Payment abstraction
│   │   └── src/
│   │       ├── PaymentProvider.ts       # Interface
│   │       └── providers/
│   │           └── MockPromptPayProvider.ts
│   │
│   └── ui/                     # Shared UI components
│       └── src/
│           └── components/
│               ├── button.tsx
│               ├── card.tsx
│               ├── badge.tsx
│               └── status-badge.tsx
│
├── docker-compose.yml          # Docker orchestration
├── turbo.json                  # TurboRepo config
├── pnpm-workspace.yaml         # Workspace config
├── Makefile                    # Helper commands
└── README.md                   # This file
```

---

## 🔄 Core Flows

### 1. Create Deal Flow (Seller)

```
1. Seller clicks "สร้าง Paylink"
2. Fills form: Title, Amount, Notes
3. System creates Deal (status: PENDING)
4. Generates unique paylink_token
5. Seller copies link and shares in chat
```

**API:** `POST /api/v1/deals`

### 2. Payment Flow (Buyer)

```
1. Buyer opens paylink URL
2. Clicks "สร้าง QR Code PromptPay"
3. System calls MockPromptPayProvider.createCharge()
4. QR code displayed
5. Buyer scans with banking app
6. [Demo] Clicks "จำลองการชำระเงิน"
7. Webhook triggered: POST /api/v1/payments/webhook/mock
8. Deal status: PENDING → HOLD
9. Payment status: INIT → PAID
```

**APIs:**
- `POST /api/v1/payments/create`
- `POST /api/v1/payments/webhook/mock`

### 3. Shipping Flow (Seller)

```
1. Seller sees deal in HOLD state
2. Clicks "เพิ่มเลขพัสดุ"
3. Enters tracking number + courier
4. System transitions: HOLD → SHIPPED
5. Sets delivered_at and auto_release_at (now + 48h)
```

**API:** `POST /api/v1/deals/:id/ship`

### 4. Confirmation Flow (Buyer)

```
1. Buyer receives item
2. Clicks "ยืนยันรับของแล้ว"
3. System transitions: SHIPPED → RELEASED
4. Seller gets positive reputation event
5. Funds are released
```

**API:** `POST /api/v1/deals/:id/confirm`

### 5. Auto-Release Flow (Background)

```
1. BullMQ worker runs every 15 minutes
2. Finds deals with auto_release_at < now
3. Checks no open disputes
4. Transitions: SHIPPED/HOLD → RELEASED
5. Logs event, updates reputation
```

**Worker:** `apps/api/src/workers/auto-release.ts`

### 6. Dispute Flow (Buyer)

```
1. Buyer clicks "เปิด Dispute"
2. Selects reason: not_delivered | item_mismatch | other
3. Writes description
4. System transitions: HOLD/SHIPPED → DISPUTE
5. Uploads evidence (images, chat logs)
6. Admin reviews and resolves
7. Admin clicks "Refund" or "Release"
8. System transitions: DISPUTE → REFUND/RELEASED
```

**APIs:**
- `POST /api/v1/disputes/:dealId/open`
- `POST /api/v1/disputes/:id/evidence`
- `POST /api/v1/disputes/:id/resolve`

---

## 📡 API Documentation

### Base URL
```
Development: http://localhost:4000/api/v1
Production: https://api.thai-escrow.com/api/v1
```

### Authentication

All protected endpoints require JWT token in header:
```
Authorization: Bearer <token>
```

### Endpoints

#### Auth
- `POST /auth/email/request` - Request OTP
- `POST /auth/email/verify` - Verify OTP & get token
- `POST /auth/line/callback` - LINE OAuth callback
- `GET /auth/me` - Get current user

#### Deals
- `POST /deals` - Create deal (seller only)
- `GET /deals/:id` - Get deal details
- `POST /deals/:id/ship` - Add tracking
- `POST /deals/:id/confirm` - Buyer confirms receipt
- `POST /deals/:id/cancel` - Cancel pending deal

#### Payments
- `POST /payments/create` - Generate PromptPay QR
- `POST /payments/webhook/mock` - Mock payment webhook
- `POST /payments/:dealId/refund` - Refund payment (admin)

#### Disputes
- `POST /disputes/:dealId/open` - Open dispute
- `POST /disputes/:id/evidence` - Upload evidence
- `POST /disputes/:id/resolve` - Resolve dispute (admin)
- `GET /disputes/:id` - Get dispute details

#### Seller
- `GET /seller/me` - Get seller profile
- `POST /seller/verify/basic` - Submit KYC
- `POST /seller/verify/approve` - Approve KYC (admin)

#### Admin
- `GET /admin/deals?status=DISPUTE` - List deals
- `GET /admin/disputes?status=OPEN` - List disputes
- `POST /admin/deals/:id/release` - Force release

---

## 💻 Development

### Running Dev Servers

```bash
# Start all services (API + Web + Worker)
pnpm dev

# Or start individually
pnpm --filter @thai-escrow/api dev
pnpm --filter @thai-escrow/web dev
```

### Database Commands

```bash
# Create migration
cd apps/api
pnpm prisma migrate dev --name add_new_field

# Apply migrations
pnpm db:migrate

# Reset database (WARNING: destroys data)
pnpm db:reset

# Seed data
pnpm db:seed

# Open Prisma Studio
pnpm db:studio
```

### Code Quality

```bash
# Format code
pnpm format

# Lint
pnpm lint

# Type check
pnpm build
```

---

## 🧪 Testing

### Unit Tests (Vitest)

```bash
# Run all unit tests
pnpm test

# Watch mode
pnpm --filter @thai-escrow/core test:watch

# Run specific test
pnpm --filter @thai-escrow/api test deals.test.ts
```

### E2E Tests (Playwright)

```bash
# Install Playwright browsers (first time)
cd apps/web
npx playwright install

# Run E2E tests
pnpm test:e2e

# Run in UI mode
npx playwright test --ui

# Run specific test
npx playwright test basic-flow.spec.ts
```

### Test Coverage

```bash
# Generate coverage report
pnpm test --coverage
```

---

## 🚢 Deployment

### Environment Variables

Required for production:

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/db"

# Redis
REDIS_URL="redis://host:6379"

# Auth
JWT_SECRET="<generate strong secret>"
NEXTAUTH_SECRET="<generate strong secret>"
LINE_CHANNEL_ID="<real LINE channel>"
LINE_CHANNEL_SECRET="<real LINE secret>"

# App
APP_BASE_URL="https://your-domain.com"
API_BASE_URL="https://api.your-domain.com"
NODE_ENV="production"

# Payment
PAYMENT_WEBHOOK_SECRET="<webhook signature secret>"
```

### Docker Production Build

```bash
# Build production images
docker compose -f docker-compose.prod.yml build

# Run
docker compose -f docker-compose.prod.yml up -d
```

### Deploy to Cloud

#### Option 1: Railway / Render

1. Connect GitHub repo
2. Set environment variables
3. Deploy API + Web + Worker as separate services
4. Add PostgreSQL and Redis add-ons

#### Option 2: AWS / GCP / Azure

1. Build Docker images
2. Push to container registry
3. Deploy to ECS / Cloud Run / Container Instances
4. Set up managed PostgreSQL and Redis
5. Configure load balancer

#### Option 3: DigitalOcean App Platform

1. Connect repo
2. Auto-detect services
3. Add database + Redis
4. Deploy

---

## 🔒 Security & Compliance

### MVP Security Measures

✅ **Implemented:**
- JWT token-based authentication
- Role-based access control (buyer, seller, admin)
- Input validation with Zod schemas
- State machine guards (prevents invalid transitions)
- SQL injection protection (Prisma ORM)
- Audit trail (DealEvent log)

⚠️ **Out of Scope for MVP:**
- Real payment gateway integration
- PCI-DSS compliance
- Payment institution licensing
- KYC document verification (mock only)
- Rate limiting
- DDoS protection
- Webhook signature verification (basic only)

### Data Privacy (PDPA Compliance)

- User consent required for KYC data
- Personal data encrypted at rest
- Audit logs for data access
- Right to deletion (user can request)

### Next Steps for Production

1. Integrate real Thai PSP (Omise, GB PrimePay, or Xendit)
2. Implement proper webhook signature verification (HMAC-SHA256)
3. Add rate limiting (express-rate-limit or similar)
4. Set up SSL/TLS certificates
5. Implement proper KYC verification (partner with Thai KYC provider)
6. Add 2FA for admin accounts
7. Security audit and penetration testing

---

## 🗺️ Roadmap

### Phase 1: MVP (Current)
- ✅ Core escrow state machine
- ✅ Mock PromptPay payments
- ✅ Basic dispute resolution
- ✅ Seller verification (KYC)
- ✅ Auto-release worker
- ✅ Thai language UI

### Phase 2: Production-Ready
- [ ] Real PSP integration (Omise/GB PrimePay)
- [ ] Email/SMS notifications
- [ ] LINE OA integration for updates
- [ ] Proper KYC verification
- [ ] Rate limiting & security hardening
- [ ] Mobile responsive optimizations

### Phase 3: Scale
- [ ] Mobile app (React Native)
- [ ] Seller reputation algorithm v2
- [ ] Dispute resolution AI assistant
- [ ] Multi-currency support (SGD, MYR)
- [ ] Escrow insurance partnership
- [ ] API for third-party integrations

### Phase 4: Features
- [ ] Installment payments
- [ ] Group buying / co-op deals
- [ ] Seller analytics dashboard
- [ ] Buyer protection insurance
- [ ] Smart contract integration (blockchain)

---

## 🧑‍💻 Demo Users

After running `pnpm db:seed`, you'll have:

### Users
- **Buyer:** `buyer@example.com` (ID: `buyer-001`)
- **Seller:** `seller@example.com` (ID: `seller-001`, Verified ✅)
- **Admin:** `admin@example.com` (ID: `admin-001`)

### Demo Deals
1. **PENDING:** iPhone 13 Pro (฿25,000) - awaiting payment
2. **HOLD:** MacBook Air M2 (฿38,000) - paid, waiting shipment
3. **SHIPPED:** AirPods Pro (฿8,900) - tracking added, auto-release in 48h
4. **DISPUTE:** Galaxy S23 (฿32,000) - buyer opened dispute
5. **RELEASED:** PlayStation 5 (฿18,900) - completed successfully

---

## 📝 License

This project is for educational and demonstration purposes.  
Not licensed for commercial use without proper PSP integration and compliance.

---

## 🙏 Acknowledgments

- **PayPal** - Inspiration for escrow model
- **PromptPay** - Thai national QR payment standard
- **Lazada/Shopee** - Thai e-commerce UX patterns
- **Thai FinTech Community** - Feedback and validation

---

## 📞 Support

For questions or issues:
- **Documentation:** This README
- **Issues:** GitHub Issues
- **Email:** support@thai-escrow.com (demo)

---

## 🎉 Quick Start Summary

```bash
# 1. Install
pnpm install

# 2. Start services
docker compose up -d

# 3. Migrate
pnpm db:migrate

# 4. Seed
pnpm db:seed

# 5. Develop
pnpm dev

# 6. Test
pnpm test
pnpm test:e2e

# 7. Build
pnpm build
```

**Access:**
- 🌐 Web: http://localhost:3000
- 🔌 API: http://localhost:4000
- 📊 DB: `pnpm db:studio`

---

**Built with ❤️ for the Thai market** 🇹🇭
