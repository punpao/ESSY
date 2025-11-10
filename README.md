# ESSY - Thailand Social-Commerce Escrow Platform MVP

> โอนแล้วพักเงินจนกว่าคุณจะกดยืนยัน

ESSY is a Thailand-focused Social-Commerce Escrow platform that solves second-hand social buying fraud (FB/IG/LINE). It provides PromptPay-first escrow, social chat paylinks, Thai UX, fast local dispute resolution, and Verified Seller + Reputation features.

## 🎯 Product Goal

Solve second-hand social buying fraud by providing a secure escrow service optimized for the Thai market.

**Core Differentiation vs PayPal:**
- ✅ PromptPay-first escrow
- ✅ Social chat paylink
- ✅ Thai UX
- ✅ Fast local dispute resolution
- ✅ Verified Seller + Reputation

## 🏗️ Architecture

### Tech Stack

- **Monorepo**: pnpm + TurboRepo
- **Backend**: Node.js + Fastify (TypeScript)
- **Frontend**: Next.js 14 App Router (TypeScript), Tailwind, shadcn/ui
- **Auth**: LINE Login OAuth2 (primary), fallback email OTP
- **DB**: PostgreSQL + Prisma ORM
- **Queue/Jobs**: BullMQ (Redis)
- **Payments**: PaymentProvider abstraction with Mock PromptPay QR provider
- **Containerization**: Docker Compose
- **Testing**: Vitest (unit) + Playwright (e2e)

### Project Structure

```
/
├── apps/
│   ├── api/          # Fastify REST API
│   └── web/          # Next.js frontend
├── packages/
│   ├── core/         # Shared types, state machine
│   ├── payment/      # PaymentProvider interface + MockPromptPay
│   └── ui/           # Shared UI components (shadcn)
└── infra/
    └── docker-compose.yml
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Docker & Docker Compose (optional, for containerized setup)
- PostgreSQL 15+ (if running locally)
- Redis 7+ (if running locally)

### Local Development

1. **Install dependencies**

```bash
pnpm install
```

2. **Setup environment**

```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Setup database**

```bash
# Start PostgreSQL and Redis (if using Docker)
docker compose -f infra/docker-compose.yml up -d postgres redis

# Run migrations
pnpm db:migrate

# Seed demo data
pnpm db:seed
```

4. **Start development servers**

```bash
# Start all apps (API + Web)
pnpm dev
```

- API: http://localhost:3001
- Web: http://localhost:3000

### Docker Setup

```bash
# Start all services
docker compose -f infra/docker-compose.yml up -d

# View logs
docker compose -f infra/docker-compose.yml logs -f

# Stop services
docker compose -f infra/docker-compose.yml down
```

## 📋 MVP User Journey

1. **Seller creates a Paylink** → Buyer receives link in chat
2. **Buyer pays via PromptPay QR** (mock gateway) → Money status = HOLD
3. **Seller adds tracking** → Status transitions to SHIPPED
4. **Buyer confirms received** (or auto-release after 48h) → RELEASE funds
5. **If problem** → Buyer opens Dispute → Ops can REFUND or RELEASE

## 🔄 Escrow State Machine

```
PENDING → HOLD → SHIPPED → RELEASED
              ↓
           DISPUTE → (REFUND | RELEASED)
```

**Auto-release rule**: If tracking says Delivered OR buyer silent for 48h after delivery → RELEASED.

## 🗄️ Database Schema

- **User**: Authentication, roles (buyer/seller/admin), KYC level
- **SellerProfile**: Verified status, PromptPay ID, reputation score
- **Deal**: Escrow transaction with status tracking
- **Payment**: Payment records with provider integration
- **Dispute**: Dispute management with evidence
- **Evidence**: Uploaded evidence (images, chatlogs)
- **ReputationEvent**: Seller reputation tracking
- **DealEvent**: Audit trail for all state changes

## 🔌 API Endpoints

### Auth
- `POST /api/v1/auth/line/callback` - LINE OAuth callback
- `POST /api/v1/auth/email/request` - Request OTP
- `POST /api/v1/auth/email/verify` - Verify OTP

### Seller & KYC
- `GET /api/v1/seller/me` - Get seller profile
- `POST /api/v1/seller/verify/basic` - Submit PromptPay ID + selfie
- `POST /api/v1/seller/verify/approve` - Admin approve verification

### Deal & Paylink
- `POST /api/v1/deals` - Create deal → returns paylink_url
- `GET /api/v1/deals?paylinkToken=xxx` - View deal (public)
- `GET /api/v1/deals/:id` - View deal (auth required)
- `POST /api/v1/deals/:id/ship` - Add tracking → SHIPPED
- `POST /api/v1/deals/:id/confirm` - Buyer confirms → RELEASED
- `POST /api/v1/deals/:id/cancel` - Cancel deal (PENDING only)

### Payment (Mock PromptPay)
- `POST /api/v1/payments/create` - Create charge → returns QR
- `POST /api/v1/payments/webhook/mock` - Simulate gateway callback
- `POST /api/v1/payments/:dealId/refund` - Admin refund

### Dispute
- `POST /api/v1/disputes/:dealId/open` - Open dispute
- `POST /api/v1/disputes/:id/evidence` - Upload evidence
- `POST /api/v1/disputes/:id/resolve` - Admin resolve

### Admin
- `GET /api/v1/admin/deals?status=...` - List deals
- `GET /api/v1/admin/disputes?status=...` - List disputes
- `POST /api/v1/admin/deals/:id/release` - Force release

## 🎨 Frontend Pages

- `/` - Landing page (Thai-first copy)
- `/pay/:paylink_token` - Buyer payment page with QR
- `/seller/dashboard` - Seller deal management
- `/seller/deal/new` - Create new paylink
- `/seller/kyc` - KYC verification
- `/buyer/deals` - Buyer's purchased deals
- `/buyer/dispute/:id` - Dispute management
- `/admin/disputes` - Admin dispute triage
- `/admin/deals` - Admin deal management

## 🧪 Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e
```

## 📝 Environment Variables

See `.env.example` for all required variables:

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT signing secret
- `APP_BASE_URL` - Base URL for the app
- `PAYMENT_WEBHOOK_SECRET` - Webhook verification secret
- `AUTO_RELEASE_HOURS` - Auto-release timeout (default: 48)

## 🔒 Security & Compliance (MVP Level)

- ✅ Role-based auth guards on all endpoints
- ✅ Input validation with Zod
- ✅ State transition validation
- ✅ Audit trail (deal_events log)
- ⚠️ Mock payment provider only (no real money handling)

## 🚧 What This MVP Does / Doesn't Do

### ✅ Included
- Complete escrow state machine
- Mock PromptPay QR payment flow
- Seller KYC verification flow
- Dispute management system
- Auto-release after delivery timeout
- Reputation scoring
- Thai-first UX and copy
- Docker Compose setup
- Seed data for demo

### ❌ Out of Scope (for MVP)
- Real payment gateway integration (Opn/Omise/Xendit)
- Real LINE OAuth (mock implementation)
- Real email OTP sending (console log in dev)
- Real file upload to S3 (URLs only)
- Real PSP licensing
- Production-grade security hardening
- Mobile app

## 🔮 Next Steps

1. **Integrate Real Thai PSP**
   - Implement Opn/Omise/Xendit providers
   - Replace MockPromptPayProvider
   - Add webhook signature verification

2. **Production Readiness**
   - Add rate limiting
   - Implement real file uploads (S3)
   - Add monitoring and logging
   - Set up CI/CD pipeline

3. **Features**
   - Mobile app (React Native)
   - Push notifications
   - Chat integration (LINE/IG)
   - Advanced reputation algorithms

## 📄 License

MIT

## 👥 Contributing

This is an MVP. For production use, please:
1. Replace mock payment provider
2. Implement real authentication
3. Add comprehensive error handling
4. Set up monitoring and alerts
5. Conduct security audit

---

Built with ❤️ for Thailand's social commerce community
