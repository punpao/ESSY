# Thai Escrow Platform MVP

> Thailand-focused Social-Commerce Escrow platform solving second-hand marketplace fraud on Facebook/Instagram/LINE

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)

## 🎯 What This MVP Does

This platform provides a **secure escrow service** for social commerce in Thailand, addressing PayPal's pain points:

### ✅ **Core Features Implemented**

1. **PromptPay-First Escrow**
   - Seller creates shareable Paylink
   - Buyer pays via PromptPay QR (mock gateway)
   - Money held in escrow (status: HOLD)
   - Auto-release after 48 hours OR buyer confirmation

2. **Full Escrow State Machine**
   - `PENDING` → `HOLD` → `SHIPPED` → `RELEASED`
   - Dispute branch: `→ DISPUTE → (REFUND | RELEASED)`
   - Comprehensive guards and validations

3. **Dispute Resolution**
   - Buyers can open disputes (Thai UI)
   - Upload evidence (images, chat logs)
   - Admin triage with 24-72h SLA tracking
   - Resolve with REFUND or RELEASE

4. **Verified Seller System**
   - KYC with PromptPay ID + selfie (mock)
   - Reputation score (sigmoid function)
   - Verified badge display

5. **Thai-First UX**
   - All copy in Thai language
   - Clear escrow messaging: "เงินยังไม่เข้าผู้ขาย จนกว่าคุณจะกดยืนยัน"
   - PromptPay native experience

---

## 🏗 Architecture

### Monorepo Structure

```
thai-escrow-platform/
├── apps/
│   ├── api/              # Fastify REST API + BullMQ workers
│   └── web/              # Next.js 14 App Router frontend
├── packages/
│   ├── core/             # Shared types, state machine, helpers
│   └── payment/          # Payment provider abstraction
├── tests/
│   └── e2e/              # Playwright E2E tests
├── docker-compose.yml
├── turbo.json
└── pnpm-workspace.yaml
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, TypeScript, Tailwind, shadcn/ui |
| **Backend** | Fastify, TypeScript, Zod validation |
| **Database** | PostgreSQL 15, Prisma ORM |
| **Queue** | BullMQ + Redis |
| **Auth** | JWT, LINE OAuth2 (mock), Email OTP |
| **Payments** | Mock PromptPay provider (interface for real PSPs) |
| **Testing** | Vitest (unit), Playwright (e2e) |
| **Container** | Docker Compose |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18
- **pnpm** >= 8
- **Docker** & **Docker Compose** (optional but recommended)

### Option 1: Docker (Recommended)

```bash
# 1. Clone and install
git clone <repo-url>
cd thai-escrow-platform
pnpm install

# 2. Copy environment variables
cp .env.example .env

# 3. Start all services (Postgres, Redis, API, Web)
docker compose up -d

# 4. Run migrations & seed data
docker compose exec api pnpm prisma migrate deploy
docker compose exec api pnpm prisma db seed

# 5. Open browser
# Frontend: http://localhost:3000
# API: http://localhost:4000
# API Health: http://localhost:4000/health
```

### Option 2: Local Development

```bash
# 1. Install dependencies
pnpm install

# 2. Start Postgres & Redis (if not running)
docker compose up -d postgres redis

# 3. Setup database
pnpm db:migrate
pnpm db:seed

# 4. Start dev servers (Turbo will run all apps in parallel)
pnpm dev

# Frontend: http://localhost:3000
# API: http://localhost:4000
```

---

## 📝 Demo Accounts (from seed)

| Role | Email | Password | Use Case |
|------|-------|----------|----------|
| **Buyer** | `buyer@example.com` | Use OTP flow | Purchase items, open disputes |
| **Seller** | `seller@example.com` | Use OTP flow | Create paylinks, add tracking |
| **Admin** | `admin@example.com` | Use OTP flow | Resolve disputes, manage deals |

### Getting OTP for Login

In development mode, OTP codes are printed to console:

```bash
# Watch API logs
docker compose logs -f api

# Or if running locally
# Check terminal where pnpm dev is running
```

Look for: `OTP for user@example.com: 123456`

---

## 🎬 User Flows

### Flow 1: Happy Path (Seller → Buyer → Release)

1. **Seller creates Paylink**
   - Go to `/seller/dashboard`
   - Click "สร้าง Paylink ใหม่"
   - Fill: Title, Amount (THB)
   - Get shareable link: `/pay/{token}`

2. **Buyer pays**
   - Open paylink URL
   - Click "สร้าง QR Code"
   - In MVP: Click "จำลองการชำระเงินสำเร็จ" (mock payment)
   - Deal status → `HOLD`

3. **Seller ships**
   - Add tracking number & courier
   - Deal status → `SHIPPED`
   - Auto-release timer starts (48h)

4. **Buyer confirms**
   - Click "ยืนยันรับสินค้า"
   - Deal status → `RELEASED`
   - Money released to seller

### Flow 2: Dispute Path

1. Follow steps 1-3 above
2. **Buyer opens dispute**
   - Click "เปิดข้อพิพาท"
   - Select reason: ไม่ได้รับของ / ไม่ตรงปก / อื่นๆ
   - Upload evidence (images/chat logs)
   - Deal status → `DISPUTE`

3. **Admin resolves**
   - Go to `/admin/disputes`
   - Review evidence
   - Click "คืนเงินให้ผู้ซื้อ" OR "โอนเงินให้ผู้ขาย"
   - Deal status → `REFUND` or `RELEASED`

---

## 🔧 Development Commands

```bash
# Install dependencies
pnpm install

# Development (all apps)
pnpm dev

# Build for production
pnpm build

# Database
pnpm db:migrate        # Run migrations
pnpm db:seed           # Seed demo data
pnpm db:studio         # Open Prisma Studio
pnpm db:push           # Push schema changes (dev only)

# Testing
pnpm test              # Run unit tests (Vitest)
pnpm test:e2e          # Run E2E tests (Playwright)

# Linting & Formatting
pnpm lint
pnpm format

# Docker
docker compose up -d              # Start all services
docker compose down               # Stop all services
docker compose logs -f api        # View API logs
docker compose exec api sh        # Shell into API container
```

---

## 📊 Database Schema

Key tables with relations:

```
User (buyer/seller/admin)
  ├─ SellerProfile (1:1)
  │   └─ ReputationEvent (1:n)
  ├─ Deal as seller (1:n)
  │   ├─ Payment (1:n)
  │   ├─ Dispute (1:n)
  │   │   └─ Evidence (1:n)
  │   └─ DealEvent (audit log)
  └─ Deal as buyer (1:n)
```

**State transitions enforced at DB + App level**

---

## 🧪 Testing

### Unit Tests (Vitest)

```bash
# Run all unit tests
pnpm test

# Watch mode
pnpm test --watch

# Coverage
pnpm test --coverage
```

Key test file: `packages/core/src/__tests__/escrowMachine.test.ts`

### E2E Tests (Playwright)

```bash
# Run E2E tests
pnpm test:e2e

# Run with UI
pnpm test:e2e --ui

# Debug mode
pnpm test:e2e --debug
```

---

## 🔐 Security Notes

### ✅ Implemented

- Role-based access control (RBAC)
- Zod input validation on all endpoints
- State machine guards prevent invalid transitions
- JWT authentication
- Audit trail (DealEvent table)
- Mock payment provider (no real money)

### ⚠️ MVP Limitations (TODO for Production)

- [ ] Real LINE Login OAuth2 (currently mock)
- [ ] HTTPS/TLS encryption
- [ ] Rate limiting
- [ ] CSRF protection
- [ ] File upload sanitization (currently URL-only)
- [ ] Real PSP integration (Omise/GB PrimePay)
- [ ] KYC with actual liveness detection
- [ ] Webhook signature verification (partially implemented)

---

## 🚧 What This MVP Does NOT Include

This is a **working prototype** optimized for speed. Out of scope:

- ❌ Real payment processing (mock only)
- ❌ Production-ready error handling
- ❌ Comprehensive E2E test coverage
- ❌ Mobile app (web-responsive only)
- ❌ Email/SMS notifications
- ❌ Multi-currency support
- ❌ Advanced analytics dashboard
- ❌ Rate limiting / DDoS protection
- ❌ CDN for static assets
- ❌ Load balancing

---

## 🛣 Roadmap to Production

### Phase 1: Payment Integration (2-4 weeks)

- [ ] Integrate real Thai PSP (Omise/GB PrimePay/Xendit)
- [ ] Add webhook signature verification
- [ ] Implement refund API with real provider
- [ ] Test with sandbox THB transactions

### Phase 2: Auth & Security (1-2 weeks)

- [ ] Real LINE Login OAuth2
- [ ] Add rate limiting (fastify-rate-limit)
- [ ] HTTPS enforcement
- [ ] Helmet.js security headers
- [ ] File upload with S3/DO Spaces

### Phase 3: Compliance & KYC (3-4 weeks)

- [ ] Partner with KYC provider (e.g., NDID in Thailand)
- [ ] Liveness detection for selfies
- [ ] Bank account verification
- [ ] Obtain PSP licensing (if holding funds)

### Phase 4: Production Ops (2-3 weeks)

- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Production Docker images (multi-stage)
- [ ] Kubernetes deployment OR VPS setup
- [ ] Monitoring (Sentry, Datadog)
- [ ] Logging (ELK stack or CloudWatch)
- [ ] Backup strategy for Postgres

---

## 🤝 Contributing

This is an MVP demo. If you'd like to contribute:

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## 📄 License

MIT License - see LICENSE file

---

## 💬 Contact & Support

For questions or demo requests:

- **GitHub Issues**: [Create an issue](https://github.com/yourusername/thai-escrow-platform/issues)
- **Email**: your-email@example.com

---

## 🙏 Acknowledgments

- **Inspiration**: Solving fraud in Thai social commerce
- **Design**: shadcn/ui components
- **Thai Payment Standards**: PromptPay QR specification

---

## 📸 Screenshots

_TODO: Add screenshots after initial deployment_

1. Landing page
2. Seller dashboard
3. Payment QR page
4. Admin dispute resolution

---

**Built with ❤️ for the Thai e-commerce community**
