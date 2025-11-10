# ESSY - Thailand Social-Commerce Escrow Platform MVP

A complete MVP for a Thailand-focused Social-Commerce Escrow platform that fixes PayPal's pain points in Thailand. Built with a monorepo architecture, optimized for "shipping fast but safe".

## 🎯 Product Goal

Solve second-hand social buying fraud (FB/IG/LINE).

**Core differentiation vs PayPal:**
- ✅ PromptPay-first escrow
- ✅ Social chat paylink
- ✅ Thai-first UX
- ✅ Fast local dispute resolution
- ✅ Verified Seller + Reputation system

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
- **Testing**: Vitest (unit) + Playwright (E2E)

### Project Structure

```
/
├── apps/
│   ├── api/          # Fastify REST API
│   └── web/           # Next.js frontend
├── packages/
│   ├── core/          # Shared types, state machine
│   ├── payment/       # PaymentProvider interface + MockPromptPay
│   └── ui/            # Shared UI components (shadcn)
├── infra/
│   ├── docker-compose.yml
│   └── Dockerfile.*
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Docker & Docker Compose
- PostgreSQL 15+ (or use Docker)
- Redis 7+ (or use Docker)

### Local Development

1. **Clone and install dependencies:**

```bash
pnpm install
```

2. **Setup environment:**

```bash
cp .env.example .env
# Edit .env with your values
```

3. **Setup database:**

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed demo data
pnpm db:seed
```

4. **Start services with Docker:**

```bash
cd infra
docker compose up -d postgres redis
```

5. **Start development servers:**

```bash
# Terminal 1: API
cd apps/api
pnpm dev

# Terminal 2: Web
cd apps/web
pnpm dev
```

Or use Turbo:

```bash
pnpm dev
```

### Docker Compose (Full Stack)

```bash
cd infra
docker compose up -d
```

This starts:
- PostgreSQL (port 5432)
- Redis (port 6379)
- API server (port 3001)
- Web app (port 3000)

## 📋 MVP User Journey

### Seller Flow

1. **Create Paylink**: Seller creates a deal → gets paylink URL
2. **Share in Chat**: Share paylink in FB/IG/LINE chat
3. **Buyer Pays**: Buyer scans PromptPay QR → payment webhook → status = HOLD
4. **Ship**: Seller adds tracking number → status = SHIPPED
5. **Release**: Buyer confirms OR auto-release after 48h → status = RELEASED

### Buyer Flow

1. **Receive Paylink**: Click link from seller
2. **Pay**: Scan QR code, mock payment → status = HOLD
3. **Wait for Shipment**: Seller adds tracking
4. **Confirm**: Click "ยืนยันรับของ" → status = RELEASED
5. **Or Dispute**: Open dispute if problem → admin resolves

### Admin Flow

1. **View Disputes**: Triage queue with SLA labels
2. **Resolve**: Choose REFUND or RELEASE
3. **Manage Deals**: Force release/refund if needed

## 🔄 Escrow State Machine

```
PENDING → HOLD → SHIPPED → RELEASED
              ↓
           DISPUTE → (REFUND | RELEASED)
```

**Auto-release rule**: If tracking says "Delivered" OR buyer silent for 48h after delivery → RELEASED.

## 🗄️ Database Schema

- **User**: id, role, email, line_sub, kyc_level
- **SellerProfile**: verified, promptpay_id, reputation_score
- **Deal**: status, paylink_token, tracking_number, auto_release_at
- **Payment**: provider, provider_ref, status
- **Dispute**: reason_text, status, resolution_note
- **Evidence**: url, kind (image/chatlog/other)
- **ReputationEvent**: type, weight

See `apps/api/prisma/schema.prisma` for full schema.

## 🔌 API Endpoints

### Auth
- `POST /api/v1/auth/line/callback` - LINE OAuth callback
- `POST /api/v1/auth/email/request` - Request OTP
- `POST /api/v1/auth/email/verify` - Verify OTP

### Seller
- `GET /api/v1/seller/me` - Get seller profile
- `POST /api/v1/seller/verify/basic` - Submit KYC
- `POST /api/v1/seller/verify/approve` - Admin: approve KYC

### Deals
- `POST /api/v1/deals` - Create deal (returns paylink)
- `GET /api/v1/deals/:id` - Get deal
- `GET /api/v1/deals?token=xxx` - Get deal by paylink token
- `POST /api/v1/deals/:id/ship` - Add tracking
- `POST /api/v1/deals/:id/confirm` - Buyer confirms receipt
- `POST /api/v1/deals/:id/cancel` - Cancel deal

### Payments
- `POST /api/v1/payments/create` - Create charge (returns QR)
- `POST /api/v1/payments/webhook/mock` - Mock webhook (simulate payment)
- `POST /api/v1/payments/:dealId/refund` - Admin: refund

### Disputes
- `POST /api/v1/disputes/:dealId/open` - Open dispute
- `POST /api/v1/disputes/:id/evidence` - Add evidence
- `POST /api/v1/disputes/:id/resolve` - Admin: resolve

### Admin
- `GET /api/v1/admin/deals?status=...` - List deals
- `GET /api/v1/admin/disputes?status=...` - List disputes
- `POST /api/v1/admin/deals/:id/release` - Force release

## 🎨 Frontend Pages

- `/` - Landing page (Thai copy)
- `/pay/:token` - Paylink page (QR code + mock payment)
- `/seller/dashboard` - Seller deals list
- `/seller/deal/new` - Create new deal
- `/seller/kyc` - KYC verification
- `/buyer/deals` - Buyer's deals
- `/buyer/dispute/:id` - Open/view dispute
- `/admin/disputes` - Admin dispute queue
- `/admin/deals` - Admin deals management

## 🧪 Testing

### Unit Tests

```bash
pnpm test
```

Tests cover:
- Escrow state machine transitions
- API validation
- Payment provider logic

### E2E Tests

```bash
pnpm test:e2e
```

E2E flows:
- Seller creates paylink → Buyer pays → HOLD
- Seller adds tracking → Buyer confirms → RELEASED
- Buyer opens dispute → Admin resolves refund

## 📦 Seed Data

The seed script creates:
- 3 users: buyer, seller (verified), admin
- 3 deals across different states
- 1 open dispute with 2 evidence items
- Reputation events

Run: `pnpm db:seed`

## 🔐 Security & Compliance (MVP Level)

- ✅ Role-based auth guards on all endpoints
- ✅ Zod validation for all inputs
- ✅ State transition guards (invalid transitions rejected)
- ✅ File uploads as URLs (mock S3)
- ✅ Audit trail: deal_events log (TODO: implement)

**Note**: This MVP uses a mock payment provider. Do NOT handle real money without proper PSP licensing and compliance.

## 🌐 Environment Variables

See `.env.example` for all required variables:

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT signing secret
- `LINE_CHANNEL_ID` / `LINE_CHANNEL_SECRET` - LINE OAuth (mock for MVP)
- `APP_BASE_URL` - Base URL for paylinks
- `PAYMENT_WEBHOOK_SECRET` - Webhook verification secret
- `AUTO_RELEASE_HOURS` - Hours until auto-release (default: 48)

## 🚧 What This MVP Does

✅ Complete escrow flow (PENDING → HOLD → SHIPPED → RELEASED)  
✅ Mock PromptPay QR payment  
✅ Dispute system with evidence  
✅ Seller KYC verification  
✅ Auto-release after 48h  
✅ Reputation system  
✅ Thai-first UI/UX  
✅ Docker Compose setup  
✅ Unit + E2E tests  

## 🚫 What This MVP Doesn't Do

❌ Real payment processing (mock only)  
❌ Real LINE OAuth (mock implementation)  
❌ Real file uploads (mock URLs)  
❌ Real KYC liveness check (mock)  
❌ Email/SMS notifications  
❌ Real-time chat integration  
❌ Advanced analytics  
❌ Multi-currency support  

## 🔜 Next Steps

1. **Integrate Real Thai PSP**:
   - Opn (formerly Omise)
   - Xendit
   - GB PrimePay

2. **Real LINE OAuth**: Complete LINE Login integration

3. **File Storage**: Integrate S3/Cloudflare R2 for evidence uploads

4. **Notifications**: Email/SMS for state changes

5. **Real-time**: WebSocket for live updates

6. **Analytics**: Dashboard for sellers/admins

## 📝 License

This is an MVP for demonstration purposes. Not for production use without proper licensing and compliance.

## 🤝 Contributing

This is a private MVP. For questions or issues, please contact the development team.

---

**Built with ❤️ for Thailand's social commerce ecosystem**
