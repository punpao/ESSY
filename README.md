# Thai Escrow MVP - Social Commerce Escrow Platform

A Thailand-focused social commerce escrow platform that solves PayPal's pain points by offering **PromptPay-first escrow**, **social chat paylinks**, **Thai UX**, **fast local dispute resolution**, and **Verified Seller reputation system**.

## 🎯 What This MVP Does

### Core User Journey (Fully Implemented)

1. **Seller creates a Paylink** in chat → Share with buyer on LINE/FB/IG
2. **Buyer pays via PromptPay QR** (mock gateway) → Money status = HOLD (not sent to seller yet)
3. **Seller adds tracking** → Status = SHIPPED
4. **Buyer confirms received** (or auto-release after 48 hours) → RELEASE funds to seller
5. **If problem** → Buyer opens Dispute → Ops can REFUND or RELEASE

### Key Differentiators vs PayPal

✅ **PromptPay QR-first** - No credit card needed, instant Thai bank transfer  
✅ **Social paylinks** - Share in LINE/FB/IG chats directly  
✅ **Thai language 100%** - All copy, UI, and support in Thai  
✅ **Fast dispute resolution** - 24-72h SLA with Thai ops team  
✅ **Verified Seller badges** - KYC + reputation score for trust  

---

## 🏗️ Tech Stack

### Monorepo
- **pnpm** + **TurboRepo** - Fast, efficient monorepo management

### Backend
- **Node.js + Fastify** (TypeScript) - High-performance REST API
- **PostgreSQL + Prisma ORM** - Type-safe database access
- **BullMQ + Redis** - Background jobs (auto-release worker)
- **JWT** - Authentication

### Frontend
- **Next.js 14 App Router** (TypeScript) - React framework with SSR
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui concepts** - Shared UI components

### Payment
- **Mock PromptPay Provider** - Abstraction layer ready for real PSPs
- Real providers TODO: Opn/Omise, Xendit, GB PrimePay

### DevOps
- **Docker Compose** - Full stack containerization
- **Playwright** - E2E testing
- **Vitest** - Unit testing

---

## 📂 Project Structure

```
thai-escrow-mvp/
├── apps/
│   ├── api/                 # Fastify REST API + webhooks
│   │   ├── src/
│   │   │   ├── routes/      # Auth, Deals, Payments, Disputes, Admin
│   │   │   ├── worker.ts    # BullMQ auto-release job
│   │   │   └── index.ts     # Server entry
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       └── seed.ts      # Demo data
│   └── web/                 # Next.js 14 App Router
│       ├── src/app/
│       │   ├── page.tsx              # Landing page
│       │   ├── auth/login/           # Email OTP + LINE OAuth
│       │   ├── seller/               # Dashboard, KYC, Create Deal
│       │   ├── buyer/                # My Deals, Open Dispute
│       │   ├── admin/                # Disputes triage, Deals management
│       │   └── pay/[token]/          # Public payment page
│       └── src/lib/api.ts            # API client
├── packages/
│   ├── core/                # Shared types, state machine, helpers
│   │   └── src/
│   │       ├── types.ts
│   │       ├── state/escrowMachine.ts   # State machine with guards
│   │       └── helpers.ts
│   ├── payment/             # Payment provider abstraction
│   │   └── src/
│   │       ├── PaymentProvider.ts       # Abstract interface
│   │       └── providers/MockPromptPayProvider.ts
│   └── ui/                  # Shared UI components
│       └── src/lib/utils.ts
├── docker-compose.yml       # Postgres, Redis, API, Web
├── turbo.json              # TurboRepo config
├── package.json            # Root workspace config
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+**
- **pnpm 8+**
- **Docker & Docker Compose** (optional but recommended)

### Option 1: Local Development (Recommended)

```bash
# 1. Clone and install
git clone <repo-url>
cd thai-escrow-mvp
pnpm install

# 2. Set up environment
cp .env.example .env
# Edit .env if needed (defaults work for local dev)

# 3. Start Postgres + Redis via Docker
docker compose up -d postgres redis

# 4. Run migrations and seed
pnpm db:migrate
pnpm db:seed

# 5. Start dev servers (both API + Web in parallel)
pnpm dev
```

**Access:**
- 🌐 **Web**: http://localhost:3000
- 🔌 **API**: http://localhost:3001
- 📊 **Prisma Studio**: `pnpm db:studio`

### Option 2: Full Docker Stack

```bash
# 1. Clone and copy env
git clone <repo-url>
cd thai-escrow-mvp
cp .env.example .env

# 2. Build and run everything
docker compose up -d

# 3. Run migrations (one-time)
docker compose exec api sh -c "cd apps/api && npx prisma migrate deploy && npx tsx prisma/seed.ts"
```

**Access:** Same URLs as above

---

## 👥 Demo Accounts

After running `pnpm db:seed`, you'll have these test accounts:

| Role    | Email                 | Password/OTP          | Notes                     |
|---------|-----------------------|-----------------------|---------------------------|
| Admin   | admin@escrow.local    | Any 6-digit code      | Dispute resolution, stats |
| Seller  | seller@escrow.local   | Any 6-digit code      | Verified, PromptPay setup |
| Buyer   | buyer@escrow.local    | Any 6-digit code      | Has purchased deals       |

**Login Flow:**
1. Go to `/auth/login`
2. Enter email
3. Click "ส่งรหัส OTP"
4. Check console logs for OTP (or use any 6-digit code in dev)
5. Enter OTP → Redirected based on role

---

## 🎬 Demo User Journey (Step-by-Step)

### 1. Seller Creates Paylink

```bash
# Login as seller@escrow.local
1. Go to /seller/dashboard
2. Click "สร้าง Paylink"
3. Enter: "iPhone 14 Pro มือสอง", ฿25,000
4. Copy paylink (e.g., /pay/pl_01h...)
5. Share with buyer (simulate: open in incognito)
```

### 2. Buyer Pays via PromptPay

```bash
# Open paylink in new browser/incognito
1. See deal details + seller info (Verified badge)
2. Click "แสดง QR Code ชำระเงิน"
3. See mock PromptPay QR
4. Click "จำลองชำระเงิน (Mock)" button
5. Status changes to "ชำระเงินแล้ว (เงินพักไว้)"
```

### 3. Seller Adds Tracking

```bash
# Back to seller dashboard
1. Deal now shows status: "พักเงินแล้ว (HOLD)"
2. Click "เพิ่ม Tracking"
3. Enter tracking: TH1234567890, Kerry Express
4. Status → "จัดส่งแล้ว (SHIPPED)"
```

### 4. Buyer Confirms or Disputes

```bash
# Login as buyer@escrow.local
1. Go to /buyer/deals
2. See deal with status "จัดส่งแล้ว"
3. Option A: Click "ยืนยันรับสินค้า" → Funds released to seller
   Option B: Click "เปิดข้อพิพาท" → Fill form → Admin resolves
```

### 5. Admin Resolves Dispute (if opened)

```bash
# Login as admin@escrow.local
1. Go to /admin/disputes
2. See open disputes with SLA badges (< 24h, < 48h, overdue)
3. Click "คืนเงินผู้ซื้อ (Refund)" or "ปล่อยเงินให้ผู้ขาย (Release)"
4. Enter resolution note
5. Deal status updated, payment processed
```

---

## 🗄️ Database Schema

### Core Tables

**User**: id, role (buyer/seller/admin), email, line_sub, kyc_level  
**SellerProfile**: user_id, verified, promptpay_id, reputation_score, kyc_status  
**Deal**: id, title, amount_satang, status, paylink_token, tracking_number, auto_release_at  
**Payment**: deal_id, provider (mock_promptpay), provider_ref, status, paid_at  
**Dispute**: deal_id, opened_by, reason_text, status, resolution_note  
**Evidence**: dispute_id, kind (image/chatlog), url, note  
**ReputationEvent**: seller_id, type (positive/negative), weight  
**DealEvent**: deal_id, event_type (audit log), from_status, to_status  

### State Machine

```
PENDING → HOLD → SHIPPED → RELEASED
    ↓       ↓        ↓
CANCELLED  DISPUTE → (REFUND | RELEASED)
```

**Guards:**
- PENDING → HOLD: requires payment + buyer
- HOLD → SHIPPED: requires tracking
- SHIPPED → RELEASED: buyer confirms OR auto-release (48h + no dispute)
- * → DISPUTE: buyer only
- DISPUTE → REFUND/RELEASE: admin only

---

## 🔧 Development Scripts

```bash
# Development
pnpm dev                 # Start all apps in dev mode (turbo parallel)
pnpm build               # Build all packages + apps

# Database
pnpm db:migrate          # Run Prisma migrations
pnpm db:seed             # Seed demo data
pnpm db:studio           # Open Prisma Studio GUI
pnpm db:push             # Push schema changes (dev only)

# Testing
pnpm test                # Run Vitest unit tests
pnpm test:e2e            # Run Playwright e2e tests

# Docker
pnpm docker:up           # docker compose up -d
pnpm docker:down         # docker compose down
pnpm docker:logs         # docker compose logs -f

# Code quality
pnpm lint                # ESLint
pnpm format              # Prettier
```

---

## 🧪 Testing

### Unit Tests (Vitest)

```bash
# Run all unit tests
pnpm test

# State machine tests
cd packages/core
pnpm test
```

**Coverage:**
- ✅ Escrow state machine transitions
- ✅ State guards (payment required, admin only, etc.)
- ✅ Terminal state detection

### E2E Tests (Playwright)

```bash
# Run e2e tests (requires running servers)
pnpm test:e2e

# Interactive mode
cd apps/web
pnpm playwright test --ui
```

**Test Scenarios:**
- Landing page rendering
- Login flow (email OTP)
- Basic navigation

**TODO (extend in production):**
- Full deal creation → payment → confirmation flow
- Dispute opening → evidence upload → resolution
- Admin actions

---

## 🔐 Security & Compliance (MVP Level)

✅ **Implemented:**
- Role-based auth guards on all endpoints
- JWT token authentication
- Zod input validation
- State machine with exhaustive guards (prevents invalid transitions)
- Audit trail (DealEvent log)
- File upload URL sanitization (mock S3)

⚠️ **OUT OF SCOPE (MVP):**
- Real money handling (mock provider only)
- Real PSP licensing/compliance
- PCI DSS compliance
- Production-grade rate limiting
- CSRF tokens
- Webhook signature verification (basic only)

---

## 🚧 What's NOT Included (Next Steps)

### Immediate TODOs for Production

1. **Real Payment Providers**
   - Integrate Opn/Omise, Xendit, or GB PrimePay
   - Webhook signature verification
   - Refund API calls
   - Handle payment failures

2. **Real AUTH**
   - LINE Login OAuth (currently mocked)
   - SMS OTP via Twilio/AWS SNS
   - Session management

3. **File Uploads**
   - AWS S3 / Cloudflare R2 for evidence images
   - Image resizing/optimization
   - Virus scanning

4. **Notifications**
   - LINE Notify for status updates
   - Email notifications (SendGrid/Mailgun)
   - SMS alerts for disputes

5. **Advanced Features**
   - Partial refunds
   - Multi-item deals
   - Buyer reputation
   - Seller analytics dashboard
   - Automated fraud detection

6. **Production Ops**
   - Error tracking (Sentry)
   - Logging (Winston/Pino to CloudWatch)
   - Monitoring (Prometheus/Grafana)
   - Load balancing
   - Database backups
   - CI/CD pipeline

---

## 📊 Architecture Decisions

### Why Fastify over Express?
- **3x faster** than Express in benchmarks
- Built-in schema validation (Zod integration)
- Better TypeScript support

### Why Prisma over raw SQL?
- Type-safe queries prevent runtime errors
- Automatic migrations
- Easy schema changes
- Great DevEx with Prisma Studio

### Why BullMQ over cron jobs?
- Redis-backed, persistent queues
- Retry logic built-in
- Horizontal scaling ready
- Job monitoring

### Why Mock PromptPay?
- Real PSP integration requires Thai business license
- Mock allows full flow testing without compliance risk
- Payment abstraction makes swapping providers trivial

---

## 🌐 Thai UX Highlights

All copy is in Thai with clear messaging:

**Payment page:**
> "เงินยังไม่เข้าผู้ขาย จนกว่าคุณจะกดยืนยันรับของ"  
> *(Money hasn't reached the seller until you confirm receipt)*

**Dispute reasons:**
- ของยังไม่ถึง *(Item not received)*
- ของไม่ตรงปก *(Not as described)*
- อื่น ๆ *(Other)*

**Status labels:**
- รอชำระเงิน (PENDING)
- พักเงินแล้ว (HOLD)
- จัดส่งแล้ว (SHIPPED)
- โอนเงินให้ผู้ขายแล้ว (RELEASED)

---

## 🐛 Known Limitations

1. **Mock Authentication**: OTP accepts any 6-digit code in development
2. **Mock Payment**: QR code is generated but not real BOT QR standard
3. **Mock Delivery Tracking**: Auto-sets delivery date +3 days (no real courier API)
4. **No Email Sending**: OTP logged to console instead
5. **Basic Reputation**: Simple count-based score (not ML/advanced)
6. **No File Upload**: Evidence URLs are text input only (need S3 integration)

---

## 📝 Environment Variables

See `.env.example` for all options. Key variables:

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/escrow

# Redis (for BullMQ)
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=change_me_to_random_secret_in_production
NEXTAUTH_SECRET=change_me_to_random_secret_in_production

# LINE Login (mock in MVP)
LINE_CHANNEL_ID=demo
LINE_CHANNEL_SECRET=demo

# App URLs
APP_BASE_URL=http://localhost:3000
API_BASE_URL=http://localhost:3001

# Payment
PAYMENT_WEBHOOK_SECRET=mock_secret_change_in_production

# Escrow Config
AUTO_RELEASE_HOURS=48
```

---

## 🤝 Contributing

This is an MVP for demonstration. For production use:

1. Replace mock payment provider with real PSP
2. Implement real LINE Login OAuth
3. Add comprehensive error handling
4. Set up monitoring & alerting
5. Add rate limiting & DDoS protection
6. Conduct security audit

---

## 📄 License

MIT License - This is demo software for portfolio/evaluation purposes.

---

## 🙏 Acknowledgments

Built to solve real problems in Thai social commerce:
- Inspired by secondhand markets on FB/IG/LINE
- Addresses trust issues in C2C transactions
- Thai-first UX based on local user research

**Made with ❤️ for Thai buyers and sellers**

---

## 📞 Support

For questions about this MVP:
- Check the code comments (extensive inline docs)
- Review Prisma schema for data model
- See state machine tests for business logic

**Note:** This is a technical demonstration. Not production-ready without additional security, compliance, and payment provider integration.
