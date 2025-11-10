# ESSY - Thailand Social-Commerce Escrow Platform MVP

ระบบ Escrow สำหรับการซื้อขายออนไลน์ในประเทศไทย ที่แก้ปัญหาการโกงในการซื้อขายผ่าน Facebook, Instagram, และ LINE

## 🎯 เป้าหมาย

แก้ปัญหาการโกงในการซื้อขายของมือสองผ่านโซเชียลมีเดีย โดยใช้ระบบ Escrow ที่:
- **PromptPay-first**: ชำระผ่าน PromptPay QR Code
- **Social Chat Paylink**: สร้างลิงก์ชำระเงินในแชท
- **Thai UX**: อินเทอร์เฟซภาษาไทย
- **Fast Local Dispute**: จัดการข้อพิพาทได้รวดเร็ว
- **Verified Seller + Reputation**: ระบบยืนยันตัวตนและคะแนนชื่อเสียง

## 🏗️ สถาปัตยกรรม

### Monorepo Structure
```
├── apps/
│   ├── api/          # Fastify REST API
│   └── web/          # Next.js 14 App Router
├── packages/
│   ├── core/         # Shared types & state machine
│   ├── payment/      # PaymentProvider abstraction
│   └── ui/           # Shared UI components
└── infra/
    └── docker-compose.yml
```

### Tech Stack
- **Monorepo**: pnpm + TurboRepo
- **Backend**: Node.js + Fastify (TypeScript)
- **Frontend**: Next.js 14 App Router + Tailwind + shadcn/ui
- **Auth**: LINE Login OAuth2 + Email OTP (mock)
- **DB**: PostgreSQL + Prisma ORM
- **Queue**: BullMQ (Redis)
- **Payments**: Mock PromptPay (ready for real providers)
- **Testing**: Vitest (unit) + Playwright (e2e)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm 8+
- Docker & Docker Compose

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

3. **Start infrastructure**
```bash
docker compose -f infra/docker-compose.yml up -d postgres redis
```

4. **Run migrations & seed**
```bash
pnpm db:migrate
pnpm db:seed
```

5. **Start development servers**
```bash
pnpm dev
```

- API: http://localhost:3001
- Web: http://localhost:3000

### Docker (Full Stack)

```bash
docker compose -f infra/docker-compose.yml up -d
```

## 📋 MVP User Journey

### 1. Seller creates Paylink
- Seller goes to `/seller/deal/new`
- Fills product title, price (THB)
- Gets paylink URL to share in chat

### 2. Buyer pays via PromptPay QR
- Buyer opens paylink (`/pay/:token`)
- Sees QR code, scans and pays (mock)
- Money status = **HOLD** (not released to seller yet)

### 3. Seller adds tracking
- Seller goes to `/seller/dashboard`
- Adds tracking number & courier
- Deal status = **SHIPPED**

### 4. Buyer confirms OR auto-release
- Buyer confirms receipt → **RELEASED**
- OR auto-release after 48h if delivered → **RELEASED**

### 5. Dispute flow (if problem)
- Buyer opens dispute (`/buyer/dispute/:id`)
- Uploads evidence (images, chat logs)
- Admin resolves: **REFUND** or **RELEASED**

## 🔐 Escrow State Machine

```
PENDING → HOLD (payment received)
  ↓
SHIPPED (tracking added)
  ↓
RELEASED (buyer confirms OR auto-release)

Branches:
- HOLD/SHIPPED → DISPUTE → (REFUND | RELEASED)
- PENDING → REFUND (cancelled)
```

## 📊 Database Schema

Key tables:
- `User` - Users (buyer/seller/admin)
- `SellerProfile` - Seller verification & reputation
- `Deal` - Escrow deals with status tracking
- `Payment` - Payment records (provider abstraction)
- `Dispute` - Dispute cases
- `Evidence` - Dispute evidence (images, chat logs)
- `ReputationEvent` - Seller reputation events
- `DealEvent` - Audit trail for state changes

See `apps/api/prisma/schema.prisma` for full schema.

## 🔌 API Endpoints

### Auth
- `POST /api/v1/auth/line/callback` - LINE OAuth callback
- `POST /api/v1/auth/email/request` - Request OTP
- `POST /api/v1/auth/email/verify` - Verify OTP

### Seller
- `GET /api/v1/seller/me` - Get seller profile
- `POST /api/v1/seller/verify/basic` - Submit KYC (PromptPay + selfie)
- `POST /api/v1/seller/verify/approve` - Admin: Approve verification

### Deals
- `POST /api/v1/deals` - Create deal → returns paylink_url
- `GET /api/v1/deals/:id` - View deal
- `POST /api/v1/deals/:id/ship` - Add tracking → SHIPPED
- `POST /api/v1/deals/:id/confirm` - Buyer confirms → RELEASED
- `POST /api/v1/deals/:id/cancel` - Cancel deal

### Payments
- `POST /api/v1/payments/create` - Create charge → returns QR
- `POST /api/v1/payments/webhook/mock` - Mock webhook (simulates payment)
- `POST /api/v1/payments/:dealId/refund` - Admin: Refund

### Disputes
- `POST /api/v1/disputes/:dealId/open` - Open dispute
- `POST /api/v1/disputes/:id/evidence` - Add evidence
- `POST /api/v1/disputes/:id/resolve` - Admin: Resolve

### Admin
- `GET /api/v1/admin/deals?status=...` - List deals
- `GET /api/v1/admin/disputes?status=...` - List disputes
- `POST /api/v1/admin/deals/:id/release` - Force release

## 🧪 Testing

### Unit Tests
```bash
pnpm test
```

### E2E Tests
```bash
pnpm test:e2e
```

## 🔄 Background Workers

- **Auto-release**: Checks every 15min for deals that can auto-release
- **Reputation**: Recalculates seller reputation after each deal

## 💳 Payment Provider Abstraction

Current implementation: `MockPromptPayProvider`

Ready for integration:
- Opn (PromptPay)
- Omise
- Xendit
- GB PrimePay

See `packages/payment/src/PaymentProvider.ts` for interface.

## 🚧 What's NOT Included (Out of Scope)

- Real payment gateway integration (mock only)
- Real PSP licensing/compliance
- Production-grade file upload (mock S3 URLs)
- Production auth (mock LINE OAuth, simple OTP)
- Real email/SMS sending
- Production monitoring/logging

## 📝 Seed Data

Default seed includes:
- 3 users: buyer, seller (verified), admin
- 3 deals: HOLD, SHIPPED, DISPUTE
- 1 open dispute with 2 evidence items

## 🔜 Next Steps

1. **Integrate real Thai PSP** (Opn/Omise/Xendit)
2. **Real file upload** (S3/Cloudflare R2)
3. **Production auth** (real LINE OAuth, email service)
4. **Mobile app** (React Native)
5. **Advanced reputation** (ML-based scoring)
6. **Multi-currency** support
7. **Chat integration** (LINE/WhatsApp bots)

## 📄 License

MIT

## 👥 Contributing

This is an MVP. For production use, ensure:
- Proper security audits
- PSP licensing
- Legal compliance (Thailand)
- Production monitoring
- Real authentication
- File storage security

---

Built with ❤️ for Thailand's social commerce community
