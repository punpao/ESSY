# ESSY - Thailand Social-Commerce Escrow Platform MVP

> **โอนแล้วพักเงินจนกว่าคุณจะกดยืนยัน**

ESSY is a Thailand-focused escrow platform designed to solve second-hand social buying fraud on Facebook, Instagram, and LINE. It provides PromptPay-first escrow, social chat paylinks, Thai-first UX, fast local dispute resolution, and Verified Seller + Reputation systems.

## 🎯 What This MVP Does

### Core Features
- ✅ **Escrow State Machine**: PENDING → HOLD → SHIPPED → RELEASED (with DISPUTE branch)
- ✅ **PromptPay Integration**: Mock PromptPay QR code generation and payment webhooks
- ✅ **Paylink System**: Sellers create shareable payment links for buyers
- ✅ **Auto-Release**: Automatic fund release after 48 hours of delivery confirmation
- ✅ **Dispute Resolution**: Buyer-initiated disputes with evidence upload and admin resolution
- ✅ **Seller Verification**: KYC flow with PromptPay ID verification
- ✅ **Reputation System**: Weighted reputation scoring for sellers
- ✅ **Thai-First UX**: All UI copy in Thai language

### User Journeys (Fully Implemented)
1. **Seller Flow**: Create Paylink → Share in chat → Receive payment → Add tracking → Funds released
2. **Buyer Flow**: Receive Paylink → Pay via PromptPay QR → Confirm receipt → Funds released
3. **Dispute Flow**: Buyer opens dispute → Upload evidence → Admin resolves (REFUND or RELEASE)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm 8+
- Docker & Docker Compose (optional, for containerized setup)
- PostgreSQL 15+ (if running locally)
- Redis 7+ (if running locally)

### Option 1: Docker Compose (Recommended)

```bash
# Clone and setup
git clone <repo>
cd essy-monorepo

# Copy environment variables
cp .env.example .env

# Start all services
docker compose -f infra/docker-compose.yml up -d

# Run migrations and seed
docker compose -f infra/docker-compose.yml exec api pnpm db:migrate
docker compose -f infra/docker-compose.yml exec api pnpm db:seed

# Access the app
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
# Prisma Studio: docker compose -f infra/docker-compose.yml exec api pnpm db:studio
```

### Option 2: Local Development

```bash
# Install dependencies
pnpm install

# Setup environment
cp .env.example .env
# Edit .env with your local database/redis URLs

# Start PostgreSQL and Redis (or use Docker)
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:15-alpine
docker run -d -p 6379:6379 redis:7-alpine

# Run migrations
pnpm db:migrate

# Seed database
pnpm db:seed

# Start dev servers
pnpm dev
```

The app will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

## 📁 Project Structure

```
essy-monorepo/
├── apps/
│   ├── api/              # Fastify REST API
│   │   ├── src/
│   │   │   ├── routes/   # API endpoints
│   │   │   ├── middleware/
│   │   │   ├── workers/  # BullMQ workers
│   │   │   └── scripts/  # Seed scripts
│   │   └── prisma/       # Prisma schema & migrations
│   └── web/              # Next.js 14 App Router
│       └── src/
│           ├── app/      # Pages (App Router)
│           └── components/
├── packages/
│   ├── core/             # Shared types & state machine
│   └── payment/          # PaymentProvider abstraction
├── infra/
│   ├── docker-compose.yml
│   └── Dockerfile.*
└── README.md
```

## 🗄️ Database Schema

### Core Tables
- **User**: Authentication, roles (buyer/seller/admin), KYC levels
- **SellerProfile**: Verification status, PromptPay info, reputation score
- **Deal**: Escrow transactions with state machine status
- **Payment**: Payment records with provider references
- **Dispute**: Buyer-initiated disputes with evidence
- **Evidence**: Uploaded evidence (images, chat logs)
- **ReputationEvent**: Seller reputation tracking
- **DealEvent**: Audit trail for all state transitions

See `apps/api/prisma/schema.prisma` for full schema.

## 🔌 API Endpoints

### Authentication
- `POST /api/v1/auth/line/callback` - LINE OAuth callback
- `POST /api/v1/auth/email/request` - Request email OTP
- `POST /api/v1/auth/email/verify` - Verify email OTP

### Deals & Paylinks
- `POST /api/v1/deals` - Create deal (seller only)
- `GET /api/v1/deals?paylinkToken=...` - Get deal by paylink (public)
- `GET /api/v1/deals/:id` - Get deal details (auth required)
- `POST /api/v1/deals/:id/ship` - Add tracking, transition to SHIPPED
- `POST /api/v1/deals/:id/confirm` - Buyer confirms receipt → RELEASED
- `POST /api/v1/deals/:id/cancel` - Cancel deal (PENDING only)

### Payments
- `POST /api/v1/payments/create` - Create payment charge (returns QR)
- `POST /api/v1/payments/webhook/mock` - Mock webhook endpoint
- `POST /api/v1/payments/:dealId/refund` - Admin refund

### Disputes
- `POST /api/v1/disputes/:dealId/open` - Open dispute (buyer)
- `POST /api/v1/disputes/:id/evidence` - Upload evidence
- `POST /api/v1/disputes/:id/resolve` - Admin resolve (REFUND/RELEASE)

### Seller & KYC
- `GET /api/v1/seller/me` - Get seller profile
- `POST /api/v1/seller/verify/basic` - Submit KYC (PromptPay + selfie)
- `POST /api/v1/seller/verify/approve` - Admin approve verification

### Admin
- `GET /api/v1/admin/deals?status=...` - List deals
- `GET /api/v1/admin/disputes?status=...` - List disputes
- `POST /api/v1/admin/deals/:id/release` - Force release

## 🎨 Frontend Pages

- `/` - Landing page (Thai copy)
- `/pay/:token` - Public paylink page (QR code, payment flow)
- `/seller/dashboard` - Seller deals list
- `/seller/deal/new` - Create new paylink
- `/seller/kyc` - KYC verification form
- `/buyer/deals` - Buyer's deals (confirm receipt, open dispute)
- `/buyer/dispute/:id` - Dispute detail with evidence upload
- `/admin/disputes` - Admin dispute triage
- `/admin/deals` - Admin deal management

## 🔄 Escrow State Machine

```
PENDING → HOLD (payment received)
  ↓
HOLD → SHIPPED (tracking added)
  ↓
SHIPPED → RELEASED (buyer confirms OR auto-release after 48h)
  ↓
Any state → DISPUTE (buyer opens dispute)
  ↓
DISPUTE → REFUND (admin resolves) OR RELEASED (admin resolves)
```

See `packages/core/src/state/escrowMachine.ts` for implementation.

## 💳 Payment Provider

The MVP includes a **Mock PromptPay Provider** that simulates:
- QR code generation
- Payment webhooks
- Refund processing

**To integrate real providers** (Opn, Omise, Xendit, GB PrimePay):
1. Implement `IPaymentProvider` interface in `packages/payment/src/`
2. Update `apps/api/src/routes/payments.ts` to use the real provider
3. Configure webhook endpoints and signature verification

## 🧪 Testing

```bash
# Unit tests (Vitest)
pnpm test

# E2E tests (Playwright)
pnpm test:e2e
```

## 📊 Seed Data

The seed script creates:
- 3 users: buyer, seller (verified), admin
- 3 deals across different states (HOLD, SHIPPED, RELEASED)
- 1 open dispute with 2 evidence items
- Reputation events for the seller

```bash
pnpm db:seed
```

## 🔒 Security & Compliance (MVP Level)

- ✅ Role-based authentication guards
- ✅ Zod input validation
- ✅ State transition validation
- ✅ Audit trail (DealEvent logs)
- ⚠️ **Mock payment provider only** (no real money handling)
- ⚠️ **No real PSP licensing** (out of scope for MVP)

## 🚧 What's NOT Included (Out of Scope)

- Real payment provider integration (Opn/Omise/Xendit)
- Real LINE OAuth implementation (mock only)
- Real email OTP service (mock only)
- File upload to S3 (URLs only)
- Real KYC/liveness verification (mock only)
- Production-grade error handling
- Rate limiting (basic implementation)
- Webhook signature verification (mock only)

## 🛠️ Development Scripts

```bash
# Install dependencies
pnpm install

# Run all apps in dev mode
pnpm dev

# Build all packages
pnpm build

# Run tests
pnpm test
pnpm test:e2e

# Database
pnpm db:migrate    # Run migrations
pnpm db:seed       # Seed database
pnpm db:studio     # Open Prisma Studio

# Lint & format
pnpm lint
pnpm format
```

## 📝 Environment Variables

See `.env.example` for all required variables:

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT signing secret (min 32 chars)
- `LINE_CHANNEL_ID` / `LINE_CHANNEL_SECRET` - LINE OAuth (optional)
- `NEXTAUTH_SECRET` - NextAuth secret (min 32 chars)
- `APP_BASE_URL` - Frontend URL
- `PAYMENT_WEBHOOK_SECRET` - Webhook verification secret
- `AUTO_RELEASE_HOURS` - Auto-release delay (default: 48)

## 🎯 Next Steps for Production

1. **Integrate Real Payment Providers**
   - Replace MockPromptPayProvider with Opn/Omise/Xendit
   - Implement webhook signature verification
   - Add payment retry logic

2. **Real Authentication**
   - Complete LINE OAuth integration
   - Add email OTP service (Twilio/SendGrid)
   - Implement refresh tokens

3. **File Storage**
   - Integrate S3/Cloudinary for evidence uploads
   - Add image optimization
   - Implement file size limits

4. **KYC Verification**
   - Integrate real liveness detection
   - Add ID card verification
   - Implement document upload

5. **Monitoring & Observability**
   - Add Sentry for error tracking
   - Implement structured logging
   - Add metrics (Prometheus/Grafana)

6. **Performance**
   - Add Redis caching
   - Implement database query optimization
   - Add CDN for static assets

## 📄 License

MIT

## 👥 Contributing

This is an MVP. For production use, please:
- Complete security audit
- Add comprehensive tests
- Integrate real payment providers
- Obtain necessary licenses for PSP operations in Thailand

---

**Built with ❤️ for Thailand's social commerce ecosystem**
