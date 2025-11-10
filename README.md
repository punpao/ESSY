# 🛡️ SafePay Thailand - Social Commerce Escrow Platform MVP

**แพลตฟอร์มพักเงินสำหรับการซื้อขายปลอดภัยบนโซเชียลมีเดีย**

A Thailand-focused escrow platform that solves PayPal's pain points for social commerce on Facebook, Instagram, and LINE. Money is held in escrow until the buyer confirms receipt, protecting both parties from fraud.

## 🎯 Product Vision

### Core Problem
Second-hand buying/selling fraud on Thai social media platforms (FB/IG/LINE). Buyers send money via bank transfer, then sellers disappear or send fake goods.

### Solution
**SafePay Thailand** acts as a trusted intermediary:
1. Seller creates a payment link
2. Buyer pays via PromptPay QR → **Money held in escrow**
3. Seller ships item with tracking
4. Buyer confirms receipt → **Money released to seller**
5. If issues arise → **Dispute resolution with 24-72h SLA**

### Key Differentiators vs PayPal
✅ **PromptPay-first**: Instant QR payments, no card needed  
✅ **Thai UX**: Full Thai language, local payment methods  
✅ **Social-optimized**: Paylinks work in LINE/FB/IG chats  
✅ **Fast disputes**: 24-72h resolution, not weeks  
✅ **Seller KYC**: Verified Seller badges + reputation scores  

---

## 🏗️ Architecture

### Tech Stack

**Monorepo**: pnpm + TurboRepo  
**Backend**: Node.js + Fastify + TypeScript + Prisma ORM  
**Frontend**: Next.js 14 App Router + Tailwind CSS + shadcn/ui  
**Database**: PostgreSQL  
**Queue**: BullMQ (Redis)  
**Auth**: Email OTP (LINE Login ready)  
**Payments**: Mock PromptPay (ready for Omise/GB PrimePay/Xendit)  
**Container**: Docker Compose  
**Testing**: Vitest (unit) + Playwright (e2e)

### Project Structure

```
thai-escrow-platform/
├── apps/
│   ├── api/          # Fastify REST API + BullMQ worker
│   │   ├── src/
│   │   │   ├── routes/      # API endpoints
│   │   │   ├── lib/         # DB, auth helpers
│   │   │   ├── worker.ts    # Auto-release & reputation jobs
│   │   │   └── index.ts     # Server entry
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts      # Demo data
│   │   └── Dockerfile
│   └── web/          # Next.js frontend
│       ├── src/
│       │   ├── app/         # App Router pages
│       │   ├── components/  # UI components
│       │   └── lib/         # Utilities
│       └── Dockerfile
├── packages/
│   ├── core/         # Shared types + state machine
│   │   └── src/
│   │       ├── types.ts
│   │       ├── state/escrowMachine.ts
│   │       └── utils/reputation.ts
│   └── payment/      # Payment provider abstraction
│       └── src/
│           ├── types.ts
│           └── providers/mock-promptpay.ts
├── docker-compose.yml
├── turbo.json
└── pnpm-workspace.yaml
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **pnpm** 8+
- **Docker** & **Docker Compose** (for containerized setup)
- **PostgreSQL** 16+ (if running locally)
- **Redis** 7+ (if running locally)

### Option 1: Docker Compose (Recommended)

```bash
# 1. Clone the repo
git clone <repo-url>
cd thai-escrow-platform

# 2. Copy environment variables
cp .env.example .env
# Edit .env if needed (defaults work out of the box)

# 3. Start all services (Postgres, Redis, API, Web)
docker compose up -d

# 4. Run database migrations + seed
docker exec -it escrow-api sh -c "cd /app/apps/api && npx prisma migrate deploy && npx prisma db seed"

# 5. Open browser
# Frontend: http://localhost:3000
# API: http://localhost:4000/health
```

### Option 2: Local Development

```bash
# 1. Install dependencies
pnpm install

# 2. Start Postgres & Redis (via Docker or locally)
docker compose up -d postgres redis

# 3. Copy environment
cp .env.development .env

# 4. Run migrations + seed
pnpm db:migrate
pnpm db:seed

# 5. Start dev servers (runs all apps in parallel)
pnpm dev

# Frontend: http://localhost:3000
# API: http://localhost:4000
```

---

## 📊 Database Schema

### Key Tables

**User**: Stores buyers, sellers, and admins  
**SellerProfile**: KYC data, PromptPay info, reputation score  
**Deal**: Escrow transactions with state machine  
**Payment**: Payment records with provider references  
**Dispute**: Buyer-initiated disputes with evidence  
**Evidence**: Images/chatlogs uploaded during disputes  
**ReputationEvent**: Tracks seller reputation changes  
**DealEvent**: Audit trail for state transitions

### Escrow State Machine

```
PENDING → HOLD → SHIPPED → RELEASED
             ↓       ↓
          DISPUTE → REFUND or RELEASED
```

**Rules**:
- `PENDING`: Deal created, awaiting payment
- `HOLD`: Buyer paid, money escrowed
- `SHIPPED`: Seller added tracking
- `RELEASED`: Buyer confirmed or auto-released after 48h
- `DISPUTE`: Buyer opened dispute
- `REFUND`: Admin resolved dispute in buyer favor

See `packages/core/src/state/escrowMachine.ts` for full logic.

---

## 🔐 API Endpoints

Base URL: `http://localhost:4000/api/v1`

### Auth
```
POST /auth/email/request       # Request OTP
POST /auth/email/verify        # Verify OTP → JWT token
POST /auth/line/callback       # LINE OAuth callback
```

### Seller
```
GET  /seller/me                # Get seller profile
POST /seller/verify/basic      # Submit KYC (PromptPay ID)
POST /seller/verify/approve    # Admin: Approve KYC
```

### Deals
```
POST /deals                    # Create deal → paylink
GET  /deals/:id                # Get deal details
GET  /deals/paylink/:token     # Public: Get deal by paylink
POST /deals/:id/ship           # Seller: Add tracking
POST /deals/:id/confirm        # Buyer: Confirm receipt
POST /deals/:id/cancel         # Seller: Cancel (if unpaid)
```

### Payments
```
POST /payments/create          # Create payment → QR code
POST /payments/webhook/mock    # Mock webhook (simulates PSP)
POST /payments/:dealId/refund  # Admin: Refund payment
```

### Disputes
```
POST /disputes/:dealId/open    # Buyer: Open dispute
GET  /disputes/:id             # Get dispute details
POST /disputes/:id/evidence    # Upload evidence
POST /disputes/:id/resolve     # Admin: Resolve (refund/release)
```

### Admin
```
GET  /admin/deals              # List all deals (filter by status)
GET  /admin/disputes           # List disputes (with SLA labels)
POST /admin/deals/:id/release  # Force release
GET  /admin/stats              # Dashboard stats
```

---

## 🎨 Frontend Pages

### Public
- `/` - Landing page (Thai copy, explains escrow)
- `/pay/:token` - Payment page with PromptPay QR

### Auth
- `/auth/login` - Email OTP login

### Buyer
- `/buyer/deals` - My purchases
- `/buyer/dispute/:id` - Dispute details

### Seller
- `/seller/dashboard` - My sales + create paylink
- `/seller/kyc` - Submit KYC verification

### Admin
- `/admin/dashboard` - Overview stats
- `/admin/disputes` - Triage queue with SLA
- `/admin/deals` - All deals with filters

---

## 🧪 Testing

### Unit Tests (Vitest)

```bash
pnpm test              # Run all tests
pnpm test:watch        # Watch mode
```

Tests cover:
- State machine transitions (`packages/core/src/state/escrowMachine.test.ts`)
- Reputation calculation
- API input validation

### E2E Tests (Playwright)

```bash
pnpm test:e2e          # Run end-to-end tests
```

E2E scenarios:
1. Seller creates paylink → Buyer pays → HOLD
2. Seller ships → Buyer confirms → RELEASED
3. Buyer opens dispute → Admin refunds

---

## 🔄 Background Jobs (BullMQ)

### Auto-Release Worker

Runs every 15 minutes:
- Finds deals in `SHIPPED` status
- Checks if `autoReleaseAt` has passed
- Skips deals with open disputes
- Transitions to `RELEASED` if conditions met
- Updates seller reputation

### Reputation Recalculation

Triggered after each deal completion:
- Calculates score: `sigmoid(#released * 0.3 - #disputes * 1.0)`
- Normalized to 0-100 scale
- Updates `SellerProfile.reputationScore`

---

## 💳 Payment Integration

### Current: Mock PromptPay

- Generates QR codes with test data
- `/payments/webhook/mock` simulates PSP callback
- No real money movement

### Production: Thai PSPs

Ready to integrate:
1. **Omise/Opn** (https://www.opn.ooo/)
2. **GB PrimePay** (https://www.gbprimepay.com/)
3. **Xendit Thailand** (https://www.xendit.co/en-th/)

Implementation guide:
1. Implement `PaymentProvider` interface in `packages/payment`
2. Add webhook signature verification
3. Update environment variables
4. Handle real PSP callbacks

---

## 🌐 Demo Credentials

After seeding (`pnpm db:seed`):

| Role    | Email                  | OTP (MVP)       |
|---------|------------------------|-----------------|
| Buyer   | buyer@example.com      | Any 6 digits    |
| Seller  | seller@example.com     | Any 6 digits    |
| Admin   | admin@example.com      | Any 6 digits    |

**Note**: In MVP, any 6-digit code works. In production, send real OTP via email service (SendGrid/AWS SES).

---

## 📦 Scripts

```bash
# Development
pnpm dev               # Start all apps in watch mode
pnpm build             # Build all packages

# Database
pnpm db:migrate        # Run Prisma migrations
pnpm db:seed           # Seed demo data
pnpm db:studio         # Open Prisma Studio

# Testing
pnpm test              # Unit tests
pnpm test:e2e          # E2E tests
pnpm lint              # Lint all packages
pnpm format            # Format with Prettier

# Docker
docker compose up -d   # Start all services
docker compose down    # Stop all services
docker compose logs -f # Follow logs
```

---

## 🔒 Security Considerations

### Implemented (MVP)
✅ Role-based auth guards (buyer/seller/admin)  
✅ JWT token authentication  
✅ Zod input validation on all endpoints  
✅ State machine prevents invalid transitions  
✅ Audit trail (`DealEvent` table)  
✅ Environment variables for secrets  

### Production TODO
⚠️ Rate limiting (prevent abuse)  
⚠️ HTTPS/TLS termination  
⚠️ Real webhook signature verification  
⚠️ File upload sanitization (images)  
⚠️ SQL injection protection (Prisma handles this)  
⚠️ XSS protection (React handles this)  
⚠️ CSRF tokens for state-changing operations  

---

## 🚧 Out of Scope (MVP)

The following are **intentionally excluded** from MVP:

❌ **Real PSP integration** (licensing required)  
❌ **SMS OTP** (use email only)  
❌ **File uploads to S3** (URLs only)  
❌ **Email notifications** (console logs only)  
❌ **LINE Notify/Messaging API**  
❌ **Multi-currency support** (THB only)  
❌ **Installment payments**  
❌ **Seller payout scheduling**  
❌ **Advanced analytics dashboard**  
❌ **Mobile apps** (web-first)  

---

## 📈 Next Steps for Production

1. **Payments**: Integrate Omise/GB PrimePay for real PromptPay
2. **Notifications**: Add email (SendGrid) + LINE Notify
3. **KYC**: Implement liveness detection (NDID/ThaiD)
4. **Storage**: Upload images to S3/GCS
5. **Monitoring**: Add Sentry, DataDog, or New Relic
6. **CI/CD**: GitHub Actions for deploy
7. **Scaling**: Horizontal API scaling behind load balancer
8. **Compliance**: PCI DSS if storing card data (not needed for PromptPay)

---

## 🤝 Contributing

This is an MVP demo. For production use:

1. Fork the repo
2. Create a feature branch
3. Write tests for new features
4. Submit PR with clear description

---

## 📄 License

MIT License - feel free to use for learning or commercial projects.

---

## 🙏 Acknowledgments

- **shadcn/ui** for beautiful React components
- **Prisma** for type-safe database access
- **Fastify** for high-performance API
- **Next.js** for best-in-class React framework
- **BullMQ** for reliable background jobs

---

## 📞 Support

For questions or issues:
- Open a GitHub issue
- Email: support@safepay.co.th (example)

---

**Built with ❤️ for the Thai e-commerce community**
