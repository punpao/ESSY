# ESSY - Thailand Social-Commerce Escrow Platform MVP

> **โอนแล้วพักเงินจนกว่าคุณจะกดยืนยัน**

ESSY is a Thailand-focused escrow platform that solves second-hand social buying fraud (FB/IG/LINE). It provides PromptPay-first escrow, social chat paylinks, Thai-first UX, fast local dispute resolution, and Verified Seller + Reputation systems.

## 🎯 What This MVP Does

- ✅ **Escrow Flow**: PENDING → HOLD → SHIPPED → RELEASED with auto-release after delivery
- ✅ **Dispute System**: Buyer can open disputes, admin can resolve (REFUND or RELEASE)
- ✅ **Payment**: Mock PromptPay QR provider (ready for real PSP integration)
- ✅ **Seller KYC**: Basic verification with PromptPay ID + selfie
- ✅ **Reputation**: Simple scoring system for sellers
- ✅ **Thai-First UX**: All copy and messaging in Thai
- ✅ **State Machine**: Exhaustive guards for all transitions

## 🚫 What This MVP Doesn't Do

- ❌ Real payment processing (mock only)
- ❌ Real LINE OAuth (simulated)
- ❌ Real file uploads (URLs only)
- ❌ Real email OTP (hardcoded for demo)
- ❌ Production-grade security hardening
- ❌ Real PSP licensing/compliance

## 🏗️ Architecture

```
Monorepo (pnpm + TurboRepo)
├── apps/
│   ├── api/          # Fastify REST API
│   └── web/          # Next.js 14 App Router
├── packages/
│   ├── core/         # Types, state machine
│   ├── payment/      # PaymentProvider abstraction
│   └── ui/           # Shared shadcn/ui components
└── infra/
    └── docker-compose.yml
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Docker & Docker Compose (optional, for full stack)

### Local Development

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

3. **Start database & Redis (Docker)**
   ```bash
   docker compose -f infra/docker-compose.yml up -d postgres redis
   ```

   Or use local PostgreSQL/Redis:
   ```bash
   # Update DATABASE_URL and REDIS_URL in .env
   ```

4. **Run migrations & seed**
   ```bash
   pnpm db:migrate
   pnpm db:seed
   ```

5. **Start dev servers**
   ```bash
   pnpm dev
   ```

   - API: http://localhost:3001
   - Web: http://localhost:3000

### Docker (Full Stack)

```bash
docker compose -f infra/docker-compose.yml up -d
```

This starts:
- PostgreSQL (port 5432)
- Redis (port 6379)
- API (port 3001)
- Web (port 3000)

## 📋 Demo Flows

### 1. Seller Creates Paylink

1. Go to `/seller/dashboard`
2. Click "สร้าง Paylink"
3. Fill form (title, price in THB)
4. Get paylink URL

### 2. Buyer Pays

1. Open paylink (e.g., `/pay/{token}`)
2. See QR code (mock)
3. Click "อัปสลิป (Mock Payment)"
4. Status changes to HOLD

### 3. Seller Ships

1. Seller adds tracking number
2. Status changes to SHIPPED
3. Auto-release scheduled (48h default)

### 4. Buyer Confirms

1. Buyer clicks "ยืนยันรับของ"
2. Status changes to RELEASED
3. Funds released to seller

### 5. Dispute Flow

1. Buyer opens dispute (`/buyer/dispute/{id}`)
2. Admin reviews (`/admin/disputes`)
3. Admin resolves (REFUND or RELEASE)

## 🧪 Testing

### Unit Tests
```bash
pnpm test
```

### E2E Tests
```bash
pnpm test:e2e
```

## 📁 Key Files

- **State Machine**: `packages/core/src/state/escrowMachine.ts`
- **Prisma Schema**: `apps/api/prisma/schema.prisma`
- **API Routes**: `apps/api/src/routes/`
- **Frontend Pages**: `apps/web/src/app/`
- **Payment Provider**: `packages/payment/src/mockPromptPay.ts`

## 🔌 API Endpoints

### Auth
- `POST /api/v1/auth/line/callback` - LINE OAuth callback
- `POST /api/v1/auth/email/request` - Request OTP
- `POST /api/v1/auth/email/verify` - Verify OTP

### Seller
- `GET /api/v1/seller/me` - Get seller profile
- `POST /api/v1/seller/verify/basic` - Submit KYC

### Deals
- `POST /api/v1/deals` - Create deal
- `GET /api/v1/deals/:id` - Get deal
- `POST /api/v1/deals/:id/ship` - Add tracking
- `POST /api/v1/deals/:id/confirm` - Buyer confirms

### Payments
- `POST /api/v1/payments/create` - Create charge
- `POST /api/v1/payments/webhook/mock` - Mock webhook
- `POST /api/v1/payments/:dealId/refund` - Refund (admin)

### Disputes
- `POST /api/v1/disputes/:dealId/open` - Open dispute
- `POST /api/v1/disputes/:id/evidence` - Add evidence
- `POST /api/v1/disputes/:id/resolve` - Resolve (admin)

### Admin
- `GET /api/v1/admin/deals` - List deals
- `GET /api/v1/admin/disputes` - List disputes

## 🔄 State Machine

```
PENDING → HOLD (payment received)
  ↓
HOLD → SHIPPED (tracking added)
  ↓
SHIPPED → RELEASED (buyer confirms OR auto-release)
  ↓
HOLD/SHIPPED → DISPUTE (buyer opens)
  ↓
DISPUTE → REFUND (admin resolves)
DISPUTE → RELEASED (admin resolves)
```

## 🔐 Environment Variables

See `.env.example` for all required variables.

Key ones:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT signing secret
- `APP_BASE_URL` - Base URL for paylinks
- `AUTO_RELEASE_HOURS` - Hours before auto-release (default: 48)

## 🎨 UI Components

Uses shadcn/ui components from `packages/ui`. All pages are in Thai with proper messaging about escrow protection.

## 📦 Seed Data

Seeded users:
- `buyer@example.com` - Buyer role
- `seller@example.com` - Seller role (verified)
- `admin@example.com` - Admin role

Seeded deals:
- Deal 1: HOLD status (with dispute)
- Deal 2: PENDING status
- Deal 3: RELEASED status

## 🚧 Next Steps (Production)

1. **Real Payment Integration**
   - Replace `MockPromptPayProvider` with real PSP (Opn, Omise, Xendit, GB PrimePay)
   - Implement webhook signature verification
   - Add refund handling

2. **Real LINE OAuth**
   - Register LINE Channel
   - Implement OAuth flow
   - Store LINE user data

3. **File Uploads**
   - Integrate S3/Cloud Storage
   - Handle selfie uploads for KYC
   - Store evidence files

4. **Email OTP**
   - Use SendGrid/SES
   - Store OTPs in Redis with TTL
   - Rate limiting

5. **Security**
   - Rate limiting on API
   - CSRF protection
   - Input sanitization
   - Audit logging

6. **Compliance**
   - PSP licensing
   - KYC/AML compliance
   - Data protection (PDPA)

## 📝 License

MIT

## 👥 Contributing

This is an MVP. For production use, please:
1. Add comprehensive tests
2. Implement real payment providers
3. Add proper authentication
4. Harden security
5. Add monitoring & logging

---

Built with ❤️ for Thailand's social commerce ecosystem
